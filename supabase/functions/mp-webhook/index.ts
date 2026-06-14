import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { MercadoPagoConfig, Payment } from "npm:mercadopago";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Pegando body (pode ser Webhook ou IPN)
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    let payloadStr = await req.text();
    let payload: any = {};
    
    if (payloadStr) {
      try {
        payload = JSON.parse(payloadStr);
      } catch(e) {
        // ignora
      }
    }

    console.log("[MP Webhook] Notificação recebida:", payload, "Params:", Object.fromEntries(searchParams));

    // Salvar log para auditoria
    await supabaseAdmin.from("error_logs").insert({
      tipo: "WEBHOOK_MERCADOPAGO",
      mensagem: "Notificação recebida",
      metadata: JSON.stringify({ payload, query: Object.fromEntries(searchParams) }),
    });

    // Identificar o ID do pagamento
    // O MP pode enviar data.id no JSON (Webhook) ou ?data.id= ou ?id= na URL (IPN/Webhook)
    let paymentId = payload?.data?.id || searchParams.get("data.id") || searchParams.get("id");

    // Às vezes, para IPN, a URL vem como ?topic=payment&id=12345
    if (searchParams.get("topic") === "payment" && searchParams.get("id")) {
      paymentId = searchParams.get("id");
    }

    // Se a notificação não for sobre um pagamento, apenas ignora com 200 OK
    if ((payload?.type !== "payment" && payload?.action !== "payment.created" && payload?.action !== "payment.updated") && searchParams.get("topic") !== "payment") {
      return new Response("Not a payment notification", { status: 200 });
    }

    if (!paymentId) {
      console.warn("[MP Webhook] Nenhum Payment ID encontrado na notificação.");
      return new Response("Missing payment id", { status: 400 });
    }

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN is not set");
    }

    const client = new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } });
    const payment = new Payment(client);

    // CONSULTA O PAGAMENTO DIRETO NA API DO MERCADO PAGO (Super Seguro)
    const paymentData = await payment.get({ id: paymentId });
    console.log(`[MP Webhook] Pagamento consultado via API: status=${paymentData.status}, external_reference=${paymentData.external_reference}`);

    const userId = paymentData.external_reference; // É o id do usuário que enviamos no create-mp-preference!
    const status = paymentData.status;

    if (!userId) {
      console.warn(`[MP Webhook] Pagamento ${paymentId} não possui external_reference (não conseguimos identificar o usuário).`);
      return new Response("No external_reference", { status: 200 });
    }

    // Atualiza a tabela payment_orders ou cria caso o webhook chegue muito rápido
    const { data: existingOrder } = await supabaseAdmin
      .from("payment_orders")
      .select("id")
      .eq("order_nsu", paymentId) // Vamos usar order_nsu para armazenar o Payment ID do MP
      .maybeSingle();

    if (existingOrder) {
       await supabaseAdmin.from("payment_orders").update({
         status: status === "approved" ? "paid" : status,
         paid_at: status === "approved" ? new Date().toISOString() : null,
         webhook_payload: paymentData,
       }).eq("order_nsu", paymentId);
    } else {
       // Se o webhook chegar antes mesmo de termos uma "order" (por ex: geramos a preferência mas salvamos com o ID da preferência)
       // O ID da preferência é diferente do Payment ID. 
       await supabaseAdmin.from("payment_orders").insert({
         order_nsu: paymentId,
         user_id: userId,
         status: status === "approved" ? "paid" : status,
         amount: paymentData.transaction_amount,
         user_email: paymentData.payer?.email || null,
         paid_at: status === "approved" ? new Date().toISOString() : null,
         webhook_payload: paymentData,
       });
    }

    // Se estiver aprovado, ATIVA O USUÁRIO
    if (status === "approved") {
      console.log(`[MP Webhook] Pagamento aprovado para user_id: ${userId}. Ativando Premium!`);
      
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await supabaseAdmin
        .from("profiles")
        .update({
          is_premium: true,
          premium_since: new Date().toISOString(),
          premium_expires_at: expiresAt.toISOString(),
          premium_email: paymentData.payer?.email || null,
          premium_set_by: "webhook_mercadopago",
          premium_transaction_nsu: paymentId,
        })
        .eq("id", userId);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[MP Webhook Error] Falha:", error);
    await supabaseAdmin.from("error_logs").insert({
      tipo: "WEBHOOK_MP_ERROR",
      mensagem: error.message || "Erro desconhecido",
    });
    // O Mercado Pago pede que erros internos voltem 500 para ele tentar novamente
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
