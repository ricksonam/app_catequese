import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Extrai o email do comprador de todos os campos possíveis do payload da InfinitePay */
function extractEmail(payload: Record<string, unknown>): string | null {
  const candidates = [
    (payload as any)?.transaction?.customer?.email,
    (payload as any)?.transaction?.email,
    (payload as any)?.charge?.customer?.email,
    (payload as any)?.customer?.email,
    (payload as any)?.payer?.email,
    (payload as any)?.buyer?.email,
    (payload as any)?.customer_email,
    (payload as any)?.payer_email,
    (payload as any)?.buyer_email,
    (payload as any)?.email,
    (payload as any)?.contact?.email,
    (payload as any)?.order?.customer?.email,
    (payload as any)?.payment?.customer?.email,
    (payload as any)?.data?.customer?.email,
    (payload as any)?.data?.email,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.includes("@")) {
      return candidate.trim().toLowerCase();
    }
  }
  return null;
}

/** Extrai o nome do comprador do payload */
function extractName(payload: Record<string, unknown>): string | null {
  const candidates = [
    (payload as any)?.transaction?.customer?.name,
    (payload as any)?.transaction?.customer?.full_name,
    (payload as any)?.charge?.customer?.name,
    (payload as any)?.customer?.name,
    (payload as any)?.customer?.full_name,
    (payload as any)?.payer?.name,
    (payload as any)?.buyer?.name,
    (payload as any)?.customer_name,
    (payload as any)?.buyer_name,
    (payload as any)?.name,
    (payload as any)?.data?.customer?.name,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return null;
}

/** Extrai o valor pago em reais */
function extractAmount(payload: Record<string, unknown>): number {
  const raw =
    (payload as any)?.transaction?.amount ??
    (payload as any)?.charge?.amount ??
    (payload as any)?.amount ??
    (payload as any)?.paid_amount ??
    (payload as any)?.total_amount ??
    (payload as any)?.data?.amount ??
    (payload as any)?.order?.amount ??
    0;
  const num = Number(raw);
  // Se for em centavos (>= 100 para R$14,90 = 1490), converte
  if (num >= 100) return num / 100;
  return num;
}

/** Extrai o método de pagamento */
function extractMethod(payload: Record<string, unknown>): string {
  const raw =
    (payload as any)?.transaction?.payment_method ??
    (payload as any)?.transaction?.capture_method ??
    (payload as any)?.charge?.payment_method ??
    (payload as any)?.capture_method ??
    (payload as any)?.payment_method ??
    (payload as any)?.method ??
    (payload as any)?.data?.capture_method ??
    "";
  return String(raw).toLowerCase() || "unknown";
}

/** Verifica se o pagamento está aprovado/confirmado */
function isApproved(payload: Record<string, unknown>): boolean {
  const status = (
    (payload as any)?.transaction?.status ??
    (payload as any)?.charge?.status ??
    (payload as any)?.status ??
    (payload as any)?.payment_status ??
    (payload as any)?.data?.status ??
    ""
  ).toString().toLowerCase();

  // Se não tiver status (InfinitePay não envia em alguns casos), considera aprovado
  if (!status) return true;

  const approvedStatuses = ["approved", "paid", "confirmed", "succeeded", "success", "complete", "completed"];
  return approvedStatuses.some(s => status.includes(s));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const log = async (msg: string, meta: Record<string, unknown> = {}) => {
    console.log(`[infinitepay-webhook] ${msg}`, JSON.stringify(meta));
    try {
      await serviceClient.from("error_logs").insert([{
        tipo: "infinitepay_webhook",
        mensagem: `[webhook] ${msg}`,
        metadata: meta,
        pagina: "edge-function",
      }]);
    } catch (_) { /* silencioso */ }
  };

  try {
    await log("Webhook recebido", { method: req.method, url: req.url });

    // Lê o body como texto primeiro para log
    const rawBody = await req.text();
    let payload: Record<string, unknown> = {};

    try {
      payload = JSON.parse(rawBody);
    } catch {
      // Pode ser form-data ou query string
      const params = new URLSearchParams(rawBody);
      for (const [k, v] of params.entries()) {
        payload[k] = v;
      }
    }

    await log("Payload recebido", { payload });

    // Verifica se o pagamento está aprovado
    if (!isApproved(payload)) {
      await log("Pagamento não aprovado, ignorando", { status: (payload as any)?.status });
      return new Response(JSON.stringify({ received: true, action: "ignored_status" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extrai dados do comprador
    const customerEmail = extractEmail(payload);
    const customerName = extractName(payload);
    const amount = extractAmount(payload);
    const paymentMethod = extractMethod(payload);
    const transactionNsu = String(
      (payload as any)?.transaction_nsu ??
      (payload as any)?.transaction_id ??
      (payload as any)?.nsu ??
      (payload as any)?.id ??
      ""
    );
    const orderNsu = String((payload as any)?.order_nsu ?? "");
    const invoiceSlug = String((payload as any)?.slug ?? (payload as any)?.invoice_slug ?? "");

    await log("Dados extraídos", { customerEmail, customerName, amount, paymentMethod, transactionNsu, invoiceSlug });

    // Calcula expiração: 1 ano a partir de agora
    const premiumExpiresAt = new Date();
    premiumExpiresAt.setFullYear(premiumExpiresAt.getFullYear() + 1);

    let userId: string | null = null;
    let resolvedEmail: string | null = customerEmail;
    let matchMethod = "none";

    // ── ESTRATÉGIA 1: busca por email no payload ──
    if (customerEmail) {
      const { data: profileData, error: profileError } = await serviceClient
        .from("profiles")
        .select("id, email, is_premium, premium_expires_at")
        .ilike("email", customerEmail)
        .maybeSingle();

      if (profileError) {
        await log("Erro ao buscar perfil por email", { error: profileError.message, customerEmail });
      }

      if (profileData?.id) {
        userId = profileData.id;
        matchMethod = "email";

        // Verifica se já tem premium ativo e renova
        const alreadyPremium =
          profileData.is_premium &&
          profileData.premium_expires_at &&
          new Date(profileData.premium_expires_at) > new Date();

        if (alreadyPremium) {
          await log("Usuário já é premium, renovando", { userId, email: customerEmail });
          const currentExpiry = new Date(profileData.premium_expires_at!);
          premiumExpiresAt.setTime(currentExpiry.getTime());
          premiumExpiresAt.setFullYear(premiumExpiresAt.getFullYear() + 1);
        }
      }
    }

    // ── ESTRATÉGIA 2: fallback por pending_premium_at ──
    // A InfinitePay frequentemente não envia email no payload de webhook.
    // Antes de abrir o checkout, o app grava pending_premium_at no perfil do usuário.
    // Aqui buscamos o usuário que iniciou o checkout nos últimos 2 horas.
    if (!userId) {
      await log("Email não encontrado no payload — tentando fallback por pending_premium_at");

      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

      const { data: pendingProfiles, error: pendingError } = await serviceClient
        .from("profiles")
        .select("id, email, is_premium, premium_expires_at, pending_premium_at")
        .eq("is_premium", false)
        .gte("pending_premium_at", twoHoursAgo)
        .order("pending_premium_at", { ascending: false })
        .limit(1);

      if (pendingError) {
        await log("Erro ao buscar por pending_premium_at", { error: pendingError.message });
      }

      if (pendingProfiles && pendingProfiles.length > 0) {
        const pendingProfile = pendingProfiles[0];
        userId = pendingProfile.id;
        resolvedEmail = pendingProfile.email || customerEmail;
        matchMethod = "pending_premium_at";
        await log("✅ Usuário identificado via pending_premium_at", {
          userId,
          email: resolvedEmail,
          pending_premium_at: pendingProfile.pending_premium_at,
        });
      } else {
        await log("Nenhum usuário com checkout pendente encontrado nas últimas 2h", { twoHoursAgo });
      }
    }

    // ── Ativa o premium ──
    if (userId) {
      const { error: updateError } = await serviceClient
        .from("profiles")
        .update({
          is_premium: true,
          premium_since: new Date().toISOString(),
          premium_expires_at: premiumExpiresAt.toISOString(),
          premium_transaction_nsu: transactionNsu || invoiceSlug || orderNsu,
          premium_email: resolvedEmail,
          pending_premium_at: null, // Limpa o marcador de checkout pendente
        })
        .eq("id", userId);

      if (updateError) {
        await log("Erro ao ativar premium no perfil", { error: updateError.message, userId });
      } else {
        await log("✅ Premium ativado com sucesso!", {
          userId,
          email: resolvedEmail,
          expiresAt: premiumExpiresAt.toISOString(),
          matchMethod,
        });
      }
    } else {
      await log("⚠️ Usuário não identificado — pagamento registrado sem vínculo", {
        customerEmail,
        invoiceSlug,
        transactionNsu,
      });
    }

    // ── Registra o pagamento na tabela subscription_payments ──
    const { error: paymentError } = await serviceClient
      .from("subscription_payments")
      .insert({
        user_id: userId,
        user_email: resolvedEmail || customerEmail || "desconhecido",
        user_name: customerName,
        amount: amount || 14.90,
        payment_method: paymentMethod,
        transaction_nsu: transactionNsu || null,
        order_nsu: orderNsu || null,
        invoice_slug: invoiceSlug || null,
        status: "confirmed",
        activated_at: new Date().toISOString(),
        premium_expires_at: userId ? premiumExpiresAt.toISOString() : null,
        raw_payload: payload,
      });

    if (paymentError) {
      await log("Erro ao registrar pagamento em subscription_payments", { error: paymentError.message });
    } else {
      await log("✅ Pagamento registrado em subscription_payments");
    }

    return new Response(
      JSON.stringify({
        received: true,
        action: userId ? "premium_activated" : "payment_registered_no_user",
        match_method: matchMethod,
        email: resolvedEmail,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("[infinitepay-webhook] Erro inesperado:", err);
    return new Response(
      JSON.stringify({ received: true, error: err.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
