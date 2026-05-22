import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const respond = (data: object, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    // Autentica o usuário via token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return respond({ error: "Token de autenticação necessário" }, 401);
    }
    const token = authHeader.substring(7);

    const { data: { user }, error: authError } = await serviceClient.auth.getUser(token);
    if (authError || !user) {
      return respond({ error: "Token inválido ou expirado" }, 401);
    }

    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return respond({ error: "Código promocional não informado" }, 400);
    }

    const normalizedCode = code.trim().toUpperCase();

    // Busca o código
    const { data: promoCode, error: codeError } = await serviceClient
      .from("promo_codes")
      .select("*")
      .eq("code", normalizedCode)
      .maybeSingle();

    if (codeError) {
      return respond({ error: "Erro ao verificar código" }, 500);
    }

    if (!promoCode) {
      return respond({ error: "Código promocional inválido" }, 404);
    }

    // Verifica se está ativo
    if (!promoCode.is_active) {
      return respond({ error: "Este código promocional foi desativado" }, 400);
    }

    // Verifica validade
    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      return respond({ error: "Este código promocional já expirou" }, 400);
    }

    // Verifica limite de usos
    if (promoCode.max_uses !== null && promoCode.used_count >= promoCode.max_uses) {
      return respond({ error: "Este código promocional já atingiu o limite de usos" }, 400);
    }

    // Verifica se o usuário já usou este código
    const { data: existingUse } = await serviceClient
      .from("promo_code_uses")
      .select("id")
      .eq("code_id", promoCode.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingUse) {
      return respond({ error: "Você já utilizou este código promocional" }, 400);
    }

    // Verifica se o usuário já é premium
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("is_premium, premium_expires_at")
      .eq("id", user.id)
      .maybeSingle();

    const alreadyPremium =
      profile?.is_premium &&
      (!profile.premium_expires_at || new Date(profile.premium_expires_at) > new Date());

    if (alreadyPremium) {
      return respond({ error: "Você já possui uma assinatura premium ativa" }, 400);
    }

    // Calcula expiração: 1 ano
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Ativa premium
    const { error: updateError } = await serviceClient
      .from("profiles")
      .update({
        is_premium: true,
        premium_since: new Date().toISOString(),
        premium_expires_at: expiresAt.toISOString(),
        premium_transaction_nsu: `PROMO:${normalizedCode}`,
        premium_email: user.email,
      })
      .eq("id", user.id);

    if (updateError) {
      return respond({ error: "Erro ao ativar premium. Tente novamente." }, 500);
    }

    // Registra o uso do código
    await serviceClient.from("promo_code_uses").insert({
      code_id: promoCode.id,
      user_id: user.id,
    });

    // Incrementa o contador de usos
    await serviceClient
      .from("promo_codes")
      .update({ used_count: promoCode.used_count + 1 })
      .eq("id", promoCode.id);

    // Registra em subscription_payments como cortesia
    await serviceClient.from("subscription_payments").insert({
      user_id: user.id,
      user_email: user.email!,
      amount: 0,
      payment_method: "promo_code",
      transaction_nsu: `PROMO:${normalizedCode}`,
      status: "promo",
      activated_at: new Date().toISOString(),
      premium_expires_at: expiresAt.toISOString(),
      raw_payload: { promo_code: normalizedCode, code_id: promoCode.id, description: promoCode.description },
    });

    return respond({
      success: true,
      expires_at: expiresAt.toISOString(),
      message: "Premium ativado com sucesso! Aproveite todos os recursos.",
    });
  } catch (err: any) {
    console.error("[redeem-promo-code] Erro:", err);
    return respond({ error: "Erro interno. Tente novamente." }, 500);
  }
});
