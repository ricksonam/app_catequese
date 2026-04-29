import { supabase } from "@/integrations/supabase/client";

// ===== CONFIGURAÇÃO =====
const MAX_ERRORS_PER_MINUTE = 5;
const DEDUP_WINDOW_MS = 30_000; // 30 segundos

// ===== ESTADO INTERNO =====
let errorCount = 0;
let lastReset = Date.now();
const recentErrors = new Set<string>();

function generateFingerprint(tipo: string, mensagem: string): string {
  return `${tipo}::${mensagem.slice(0, 100)}`;
}

function canLog(): boolean {
  const now = Date.now();
  // Reset do throttle a cada minuto
  if (now - lastReset > 60_000) {
    errorCount = 0;
    lastReset = now;
  }
  return errorCount < MAX_ERRORS_PER_MINUTE;
}

function isDuplicate(fingerprint: string): boolean {
  if (recentErrors.has(fingerprint)) return true;
  recentErrors.add(fingerprint);
  // Limpar o fingerprint após a janela de dedup
  setTimeout(() => recentErrors.delete(fingerprint), DEDUP_WINDOW_MS);
  return false;
}

function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return `iOS - ${/Safari/.test(ua) ? "Safari" : "Chrome"}`;
  if (/Android/.test(ua)) return `Android - ${/Chrome/.test(ua) ? "Chrome" : "Browser"}`;
  if (/Windows/.test(ua)) return `Windows - ${/Edge/.test(ua) ? "Edge" : /Chrome/.test(ua) ? "Chrome" : /Firefox/.test(ua) ? "Firefox" : "Browser"}`;
  if (/Mac/.test(ua)) return `macOS - ${/Safari/.test(ua) && !/Chrome/.test(ua) ? "Safari" : "Chrome"}`;
  return ua.slice(0, 100);
}

// ===== API PÚBLICA =====

export type ErrorType = "render_crash" | "api_error" | "js_error" | "auth_error";

/**
 * Registra um erro silenciosamente no banco de dados.
 * Inclui throttling e deduplicação para evitar flood.
 */
export async function logError(
  tipo: ErrorType,
  error: Error | string,
  contexto?: Record<string, unknown>
): Promise<void> {
  try {
    const mensagem = typeof error === "string" ? error : error.message;
    const stack = typeof error === "string" ? undefined : error.stack;
    const fingerprint = generateFingerprint(tipo, mensagem);

    // Guards
    if (!canLog()) return;
    if (isDuplicate(fingerprint)) return;

    errorCount++;

    // Capturar contexto do usuário
    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

    const payload = {
      tipo,
      mensagem: mensagem.slice(0, 500),
      stack: stack?.slice(0, 2000) || null,
      pagina: window.location.pathname,
      user_id: user?.id || null,
      user_email: user?.email || null,
      dispositivo: getDeviceInfo(),
      metadata: contexto ? JSON.stringify(contexto) : "{}",
    };

    // INSERT silencioso — nunca deve interromper o fluxo do app
    await (supabase.from as any)("error_logs").insert(payload);
  } catch {
    // Silencioso: NUNCA propagar erro do logger
  }
}

// ===== LISTENERS GLOBAIS =====

/**
 * Inicializa captura global de erros JavaScript não tratados.
 * Chamar UMA vez no setup da aplicação.
 */
export function initGlobalErrorCapture(): void {
  // Erros JavaScript não capturados
  window.addEventListener("error", (event) => {
    logError("js_error", event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Promessas rejeitadas sem handler
  window.addEventListener("unhandledrejection", (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));
    logError("js_error", error, { type: "unhandled_promise_rejection" });
  });
}
