import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Requer autenticação do usuário
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Obter usuário autenticado
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { order_nsu } = await req.json();

    if (!order_nsu) {
      return new Response(JSON.stringify({ error: "order_nsu is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[Link Payment] Tentando vincular NSU: ${order_nsu} ao user_id: ${user.id}`);

    // Verificar se o pedido existe, e se ele está órfão (sem dono) ou se já é do próprio usuário
    const { data: order, error: orderError } = await supabaseAdmin
      .from("payment_orders")
      .select("*")
      .eq("order_nsu", order_nsu)
      .maybeSingle();

    if (orderError || !order) {
      // O pedido não foi encontrado. Isso pode acontecer se a InfinitePay ainda não disparou o webhook.
      // O front-end tentará novamente.
      return new Response(JSON.stringify({ success: false, reason: "not_found", message: "Aguardando confirmação do pagamento..." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // O pedido existe. Verificar segurança: ele pertence a outra pessoa?
    if (order.user_id && order.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Este pedido já está vinculado a outra conta." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Se o pedido não tem dono, e está "paid"
    if (order.status === 'paid') {
      console.log(`[Link Payment] Pedido ${order_nsu} confirmado como PAGO! Vinculando ao usuário e ativando Premium.`);

      // Atualiza o dono do pedido
      await supabaseAdmin
        .from("payment_orders")
        .update({ user_id: user.id, user_email: user.email })
        .eq("order_nsu", order_nsu);

      // Ativa o Premium no perfil do usuário
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await supabaseAdmin
        .from("profiles")
        .update({
          is_premium: true,
          premium_since: new Date().toISOString(),
          premium_expires_at: expiresAt.toISOString(),
          premium_email: user.email,
          premium_set_by: "webhook_late_binding",
          premium_transaction_nsu: order_nsu,
        })
        .eq("id", user.id);

      return new Response(JSON.stringify({ success: true, activated: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Pedido foi encontrado, mas não está pago ainda (improvável pois só criamos quando webhook chega, mas vale a checagem)
      return new Response(JSON.stringify({ success: false, reason: "not_paid", message: "Pagamento ainda não processado pela InfinitePay." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (error: any) {
    console.error("Erro fatal em link-payment:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
