import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função auxiliar para procurar um e-mail em qualquer lugar do Payload (como a InfinitePay muda o payload às vezes)
function extractEmailFromPayload(obj: any): string | null {
  if (!obj || typeof obj !== 'object') return null;
  if (obj.email && typeof obj.email === 'string' && obj.email.includes('@')) return obj.email;
  if (obj.customer_email && typeof obj.customer_email === 'string') return obj.customer_email;
  
  for (const key of Object.keys(obj)) {
    const found = extractEmailFromPayload(obj[key]);
    if (found) return found;
  }
  return null;
}

serve(async (req) => {
  // Trata requisições OPTIONS (CORS preflight)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const payloadText = await req.text();
    let payload;
    try {
      payload = JSON.parse(payloadText);
    } catch (e) {
      payload = { raw: payloadText };
    }

    console.log("[InfinitePay Webhook] Recebido:", JSON.stringify(payload));

    // Salvar o log bruto para auditoria (útil para debugar o formato exato depois)
    await supabaseAdmin.from("error_logs").insert({
      tipo: "WEBHOOK_INFINITEPAY",
      mensagem: "Recebido postback da InfinitePay",
      metadata: JSON.stringify(payload),
    });

    // Filtra se não for pagamento aprovado (a InfinitePay manda vários status)
    // Se não tiver status explícito, tentamos processar de qualquer forma pelo email
    const statusStr = JSON.stringify(payload).toLowerCase();
    const isApproved = statusStr.includes("approved") || statusStr.includes("paid") || statusStr.includes("pago");

    if (!isApproved) {
      return new Response(JSON.stringify({ received: true, ignored: "Not approved" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = extractEmailFromPayload(payload);

    if (!email) {
      console.warn("[InfinitePay Webhook] E-mail não encontrado no payload");
      return new Response(JSON.stringify({ error: "Email missing from payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[InfinitePay Webhook] Processando premium para o e-mail: ${email}`);

    // Adiciona 1 ano (Assinatura anual de R$ 9,90)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { data: profile, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        is_premium: true,
        premium_since: new Date().toISOString(),
        premium_expires_at: expiresAt.toISOString(),
        premium_email: email,
      })
      .eq("email", email.toLowerCase())
      .select()
      .single();

    if (updateError) {
      console.error("[InfinitePay Webhook] Erro ao atualizar perfil:", updateError);
      return new Response(JSON.stringify({ error: "Error updating profile" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[InfinitePay Webhook] Sucesso! Perfil ${profile?.id} atualizado para Premium.`);

    return new Response(JSON.stringify({ success: true, profile_id: profile?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[InfinitePay Webhook] Erro fatal:", error);
    await supabaseAdmin.from("error_logs").insert({
      tipo: "WEBHOOK_FATAL_ERROR",
      mensagem: error.message || "Erro desconhecido",
    });
    
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
