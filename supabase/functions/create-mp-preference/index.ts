import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { MercadoPagoConfig, Preference } from "npm:mercadopago";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Verificar Autenticação
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

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN is not set in environment variables");
    }

    // Configura o SDK do Mercado Pago
    const client = new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } });
    const preference = new Preference(client);

    const APP_URL = req.headers.get("origin") || "https://icatequese.com.br"; // Fallback URL

    const body = {
      items: [
        {
          id: "premium_1y",
          title: "iCatequese Premium - 1 Ano",
          quantity: 1,
          unit_price: 9.90,
          currency_id: "BRL",
        }
      ],
      payer: {
        email: user.email,
      },
      back_urls: {
        success: `${APP_URL}/minha-assinatura?mp_status=success`,
        failure: `${APP_URL}/minha-assinatura?mp_status=failure`,
        pending: `${APP_URL}/minha-assinatura?mp_status=pending`
      },
      auto_return: "approved",
      external_reference: user.id, // VÍNCULO SEGURO DO USUÁRIO
      notification_url: "https://ylrpddmhtlujncglsptn.supabase.co/functions/v1/mp-webhook", // O webhook que receberá a notificação
      statement_descriptor: "ICATEQUESE",
    };

    console.log(`[MP] Criando preferência para usuário: ${user.id} (${user.email})`);

    const result = await preference.create({ body });

    // Registra a tentativa de pagamento (status pendente)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    await supabaseAdmin.from("payment_orders").insert({
      user_id: user.id,
      user_email: user.email,
      order_nsu: result.id, // O ID da Preference no Mercado Pago
      status: "pending",
      amount: 9.90,
      checkout_url: result.init_point
    });

    return new Response(JSON.stringify({ init_point: result.init_point, preference_id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[MP Error] Falha ao criar preferência:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
