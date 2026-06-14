import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INFINITEPAY_API_URL = "https://api.checkout.infinitepay.io/links";
const INFINITEPAY_HANDLE = "ricksonam";
const APP_URL = "https://icatequese.com.br";
const WEBHOOK_URL = `https://ylrpddmhtlujncglsptn.supabase.co/functions/v1/infinitepay-webhook`;
const PLAN_AMOUNT_CENTS = 990; // R$ 9,90 em centavos
const PLAN_DESCRIPTION = "iCatequese Premium - 1 Ano";

function generateOrderNsu(userId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const userPart = userId.replace(/-/g, "").substring(0, 8).toUpperCase();
  return `ORD-${userPart}-${timestamp}`;
}

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
    // Buscar perfil do usuário (nome, email)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, nome, is_premium")
      .eq("id", user.id)
      .single();

    if (profile?.is_premium) {
      return new Response(JSON.stringify({ error: "Usuário já é Premium." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userEmail = profile?.email || user.email || "";
    const userName = profile?.nome || userEmail.split("@")[0];

    // Verificar se há pedido pendente recente (últimas 2h) para evitar duplicatas
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: existingOrder } = await supabaseAdmin
      .from("payment_orders")
      .select("order_nsu, checkout_url")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .gte("created_at", twoHoursAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Se já tem pedido recente com URL, reutiliza
    if (existingOrder?.checkout_url) {
      console.log(`Reutilizando pedido existente: ${existingOrder.order_nsu}`);
      return new Response(JSON.stringify({
        success: true,
        checkout_url: existingOrder.checkout_url,
        order_nsu: existingOrder.order_nsu,
        reused: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gerar novo Order NSU
    const orderNsu = generateOrderNsu(user.id);

    // API Key da InfinitePay (configurada como secret no Supabase)
    const infinitePayApiKey = Deno.env.get("INFINITEPAY_API_KEY");
    if (!infinitePayApiKey) {
      console.error("INFINITEPAY_API_KEY não configurada!");
      // Fallback: retornar link estático sem pré-preenchimento
      const fallbackUrl = `https://checkout.infinitepay.io/${INFINITEPAY_HANDLE}/iq754vwJ1z?order_nsu=${encodeURIComponent(orderNsu)}`;

      await supabaseAdmin.from("payment_orders").insert({
        user_id: user.id,
        order_nsu: orderNsu,
        status: "pending",
        amount: 9.90,
        user_email: userEmail,
        checkout_url: fallbackUrl,
      });

      return new Response(JSON.stringify({
        success: true,
        checkout_url: fallbackUrl,
        order_nsu: orderNsu,
        mode: "fallback_static",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Chamar API da InfinitePay para criar link personalizado
    const infinitePayPayload = {
      handle: INFINITEPAY_HANDLE,
      order_nsu: orderNsu,
      redirect_url: `${APP_URL}/minha-assinatura`,
      webhook_url: WEBHOOK_URL,
      customer: {
        name: userName,
        email: userEmail,
      },
      items: [
        {
          quantity: 1,
          price: PLAN_AMOUNT_CENTS,
          description: PLAN_DESCRIPTION,
        },
      ],
    };

    console.log(`Criando link InfinitePay para ${userEmail} | NSU: ${orderNsu}`);

    const ipResponse = await fetch(INFINITEPAY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${infinitePayApiKey}`,
      },
      body: JSON.stringify(infinitePayPayload),
    });

    if (!ipResponse.ok) {
      const errText = await ipResponse.text();
      console.error(`InfinitePay API error ${ipResponse.status}:`, errText);

      // Fallback para link estático se a API falhar
      const fallbackUrl = `https://checkout.infinitepay.io/${INFINITEPAY_HANDLE}/iq754vwJ1z?order_nsu=${encodeURIComponent(orderNsu)}`;

      await supabaseAdmin.from("payment_orders").insert({
        user_id: user.id,
        order_nsu: orderNsu,
        status: "pending",
        amount: 9.90,
        user_email: userEmail,
        checkout_url: fallbackUrl,
        webhook_payload: { api_error: errText },
      });

      return new Response(JSON.stringify({
        success: true,
        checkout_url: fallbackUrl,
        order_nsu: orderNsu,
        mode: "fallback_api_error",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ipData = await ipResponse.json();
    const checkoutUrl = ipData.url || ipData.checkout_url || ipData.link;

    if (!checkoutUrl) {
      console.error("InfinitePay não retornou URL:", JSON.stringify(ipData));
      throw new Error("URL de checkout não retornada pela InfinitePay");
    }

    // Salvar pedido com URL personalizada no banco
    await supabaseAdmin.from("payment_orders").insert({
      user_id: user.id,
      order_nsu: orderNsu,
      status: "pending",
      amount: 9.90,
      user_email: userEmail,
      checkout_url: checkoutUrl,
    });

    console.log(`✅ Link criado com sucesso: ${checkoutUrl}`);

    return new Response(JSON.stringify({
      success: true,
      checkout_url: checkoutUrl,
      order_nsu: orderNsu,
      mode: "dynamic",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Erro fatal em create-payment-link:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
