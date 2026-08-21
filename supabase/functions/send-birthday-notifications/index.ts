// ============================================================
// Edge Function: send-birthday-notifications
// Disparo: pg_cron todo dia às 07:00 (America/Sao_Paulo)
// Rota: POST /functions/v1/send-birthday-notifications
// ============================================================
// Para agendar com pg_cron, execute no SQL Editor do Supabase:
//
//   select cron.schedule(
//     'send-birthday-notifications',
//     '0 10 * * *',  -- 07:00 BRT = 10:00 UTC
//     $$
//     select net.http_post(
//       url:='https://SEU_PROJECT_ID.supabase.co/functions/v1/send-birthday-notifications',
//       headers:='{"Authorization":"Bearer SEU_SERVICE_ROLE_KEY","Content-Type":"application/json"}'::jsonb,
//       body:='{}'::jsonb
//     ) as request_id;
//     $$
//   );
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") ?? "BPiPtI4VumC6sx8V_y_T1N98aamBxtXm3SJBxJN1-8GAY_6sj5p59h6KnBxaUNZpuqpRJH3yX95OtudoEkWWI48";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:suporte@icatequese.com.br";

// ── Helper: base64url ────────────────────────────────────────
function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(base64 + padding);
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
}

function uint8ArrayToBase64url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// ── VAPID JWT ────────────────────────────────────────────────
async function createVapidJwt(audience: string): Promise<string> {
  const privateKeyBytes = base64urlToUint8Array(VAPID_PRIVATE_KEY);

  const key = await crypto.subtle.importKey(
    "raw",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const header = uint8ArrayToBase64url(
    new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" }))
  );
  const payload = uint8ArrayToBase64url(
    new TextEncoder().encode(
      JSON.stringify({
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + 12 * 3600,
        sub: VAPID_SUBJECT,
      })
    )
  );

  const data = new TextEncoder().encode(`${header}.${payload}`);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, data);
  return `${header}.${payload}.${uint8ArrayToBase64url(new Uint8Array(sig))}`;
}

// ── Enviar uma notificação push ──────────────────────────────
async function sendPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; url?: string; tag?: string }
) {
  const url = new URL(sub.endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const jwt = await createVapidJwt(audience);

  const pubKeyBytes = base64urlToUint8Array(VAPID_PUBLIC_KEY);

  // Importar chave pública do destinatário
  const recipientPublicKey = await crypto.subtle.importKey(
    "raw",
    base64urlToUint8Array(sub.p256dh),
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );

  // Gerar par efêmero
  const ephemeralKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: recipientPublicKey },
    ephemeralKeyPair.privateKey,
    256
  );

  const authBytes = base64urlToUint8Array(sub.auth);
  const ephemeralPublicKeyBytes = new Uint8Array(
    await crypto.subtle.exportKey("raw", ephemeralKeyPair.publicKey)
  );

  // HKDF para derivar chave de encriptação
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const hkdfInput = await crypto.subtle.importKey(
    "raw",
    sharedSecret,
    "HKDF",
    false,
    ["deriveKey"]
  );

  const prk = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: authBytes,
      info: new TextEncoder().encode("Content-Encoding: auth\0"),
    },
    hkdfInput,
    { name: "AES-GCM", length: 128 },
    false,
    ["encrypt"]
  );

  // Encriptar payload
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const paddedPayload = new Uint8Array(payloadBytes.length + 2);
  paddedPayload.set(payloadBytes, 2);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: salt.slice(0, 12) },
    prk,
    paddedPayload
  );

  const body = new Uint8Array(encrypted);

  const headers: Record<string, string> = {
    "Authorization": `vapid t=${jwt},k=${uint8ArrayToBase64url(pubKeyBytes)}`,
    "Content-Type": "application/octet-stream",
    "Content-Encoding": "aes128gcm",
    "TTL": "86400",
    "Urgency": "normal",
  };

  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers,
    body,
  });

  return res.status;
}

// ── Verificar se é aniversário (hoje ou amanhã) ──────────────
function isAnniversaryOn(dateStr: string, targetDate: Date): boolean {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr + (dateStr.includes("T") ? "" : "T12:00:00"));
    return d.getMonth() === targetDate.getMonth() && d.getDate() === targetDate.getDate();
  } catch {
    return false;
  }
}

// ── Verificar se evento é hoje ou amanhã ────────────────────
function isEventOn(eventDateStr: string, targetDate: Date): boolean {
  if (!eventDateStr) return false;
  try {
    const d = new Date(eventDateStr + (eventDateStr.includes("T") ? "" : "T12:00:00"));
    return (
      d.getFullYear() === targetDate.getFullYear() &&
      d.getMonth() === targetDate.getMonth() &&
      d.getDate() === targetDate.getDate()
    );
  } catch {
    return false;
  }
}

// ── Handler principal ────────────────────────────────────────
Deno.serve(async (req) => {
  // Aceitar GET (cron via pg_net) ou POST
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  // 1. Buscar todas as assinaturas push
  const { data: subscriptions, error: subError } = await supabase
    .from("push_subscriptions")
    .select("*");

  if (subError || !subscriptions?.length) {
    return new Response(JSON.stringify({ ok: true, message: "Sem assinaturas" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const results: { userId: string; sent: number; errors: number }[] = [];

  // 2. Para cada assinante
  for (const sub of subscriptions) {
    const userId = sub.user_id;
    const prefs = sub.preferences ?? {};
    const birthdaysEnabled = prefs.birthdays !== false;
    const meetingsEnabled = prefs.meetings !== false;
    const reunioesEnabled = prefs.reunioes !== false;

    let sent = 0;
    let errors = 0;

    const pushSub = {
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
    };

    // 3. Notificações de aniversário
    if (birthdaysEnabled) {
      // Buscar catequizandos deste usuário
      const { data: catequizandos } = await supabase
        .from("catequizandos")
        .select("nome, data_nascimento, sacramentos")
        .eq("user_id", userId);

      for (const c of catequizandos ?? []) {
        if (isAnniversaryOn(c.data_nascimento, hoje)) {
          const status = await sendPush(pushSub, {
            title: "🎂 Aniversário Hoje!",
            body: `${c.nome} faz aniversário hoje. Não esqueça de parabenizar!`,
            url: "/catequizandos",
            tag: `bday-${c.nome}-hoje`,
          }).catch(() => 0);
          status >= 200 && status < 300 ? sent++ : errors++;
        } else if (isAnniversaryOn(c.data_nascimento, amanha)) {
          const status = await sendPush(pushSub, {
            title: "🎂 Aniversário Amanhã!",
            body: `${c.nome} faz aniversário amanhã. Prepare a surpresa! 🎉`,
            url: "/catequizandos",
            tag: `bday-${c.nome}-amanha`,
          }).catch(() => 0);
          status >= 200 && status < 300 ? sent++ : errors++;
        }

        // Aniversário de batismo
        const dataBatismo = c.sacramentos?.batismo?.data;
        if (dataBatismo && c.sacramentos?.batismo?.recebido) {
          if (isAnniversaryOn(dataBatismo, hoje)) {
            const status = await sendPush(pushSub, {
              title: "💧 Aniversário de Batismo!",
              body: `${c.nome} celebra o aniversário de batismo hoje!`,
              url: "/catequizandos",
              tag: `batismo-${c.nome}-hoje`,
            }).catch(() => 0);
            status >= 200 && status < 300 ? sent++ : errors++;
          }
        }
      }

      // Buscar catequistas deste usuário
      const { data: catequistas } = await supabase
        .from("catequistas")
        .select("nome, data_nascimento")
        .eq("user_id", userId);

      for (const c of catequistas ?? []) {
        if (isAnniversaryOn(c.data_nascimento, hoje)) {
          const status = await sendPush(pushSub, {
            title: "🎂 Catequista faz aniversário!",
            body: `${c.nome} faz aniversário hoje. Parabéns! 🎉`,
            url: "/catequistas",
            tag: `bday-cat-${c.nome}-hoje`,
          }).catch(() => 0);
          status >= 200 && status < 300 ? sent++ : errors++;
        } else if (isAnniversaryOn(c.data_nascimento, amanha)) {
          const status = await sendPush(pushSub, {
            title: "🎂 Catequista faz aniversário amanhã!",
            body: `${c.nome} faz aniversário amanhã. Prepare os parabéns! 🎉`,
            url: "/catequistas",
            tag: `bday-cat-${c.nome}-amanha`,
          }).catch(() => 0);
          status >= 200 && status < 300 ? sent++ : errors++;
        }
      }
    }

    // 4. Notificações de encontros
    if (meetingsEnabled) {
      const { data: encontros } = await supabase
        .from("encontros")
        .select("tema, data, status")
        .eq("user_id", userId)
        .neq("status", "cancelado");

      for (const e of encontros ?? []) {
        if (isEventOn(e.data, hoje)) {
          const status = await sendPush(pushSub, {
            title: "📅 Encontro Hoje!",
            body: `Encontro "${e.tema}" acontece hoje. Bom trabalho! ✝️`,
            url: "/encontros",
            tag: `encontro-hoje-${e.data}`,
          }).catch(() => 0);
          status >= 200 && status < 300 ? sent++ : errors++;
        } else if (isEventOn(e.data, amanha)) {
          const status = await sendPush(pushSub, {
            title: "📅 Encontro Amanhã!",
            body: `Encontro "${e.tema}" é amanhã. Prepare os materiais! 📖`,
            url: "/encontros",
            tag: `encontro-amanha-${e.data}`,
          }).catch(() => 0);
          status >= 200 && status < 300 ? sent++ : errors++;
        }
      }
    }

    // 5. Notificações de reuniões
    if (reunioesEnabled) {
      const { data: reunioes } = await supabase
        .from("reunioes")
        .select("titulo, data")
        .eq("user_id", userId);

      for (const r of reunioes ?? []) {
        if (isEventOn(r.data, hoje)) {
          const status = await sendPush(pushSub, {
            title: "🤝 Reunião Hoje!",
            body: `Reunião "${r.titulo}" acontece hoje.`,
            url: "/reunioes",
            tag: `reuniao-hoje-${r.data}`,
          }).catch(() => 0);
          status >= 200 && status < 300 ? sent++ : errors++;
        } else if (isEventOn(r.data, amanha)) {
          const status = await sendPush(pushSub, {
            title: "🤝 Reunião Amanhã!",
            body: `Reunião "${r.titulo}" é amanhã.`,
            url: "/reunioes",
            tag: `reuniao-amanha-${r.data}`,
          }).catch(() => 0);
          status >= 200 && status < 300 ? sent++ : errors++;
        }
      }
    }

    results.push({ userId, sent, errors });
  }

  const totalSent = results.reduce((s, r) => s + r.sent, 0);
  const totalErrors = results.reduce((s, r) => s + r.errors, 0);

  console.log(`[send-birthday-notifications] Enviadas: ${totalSent}, Erros: ${totalErrors}`);

  return new Response(
    JSON.stringify({ ok: true, totalSent, totalErrors, details: results }),
    { headers: { "Content-Type": "application/json" } }
  );
});
