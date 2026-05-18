import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Sparkles, Star, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MessageCircle } from "lucide-react";

type Phase = "activating" | "success" | "pending" | "no_session";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [phase, setPhase] = useState<Phase>("activating");
  const [retrying, setRetrying] = useState(false);
  const attemptsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Extract transaction details from InfinitePay's checkout redirect URL query params
  const params = new URLSearchParams(window.location.search);
  const transactionId = params.get("transaction_id") || 
                        params.get("nsu") || 
                        params.get("invoice_slug") || 
                        params.get("slug") || 
                        params.get("id");

  const tryActivate = async () => {
    if (!session?.access_token) return;

    try {
      const res = await supabase.functions.invoke("activate-premium", {
        body: { 
          token: session.access_token,
          transactionId: transactionId || undefined
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const data = res.data as {
        success?: boolean;
        already_premium?: boolean;
        no_payment?: boolean;
      } | null;

      if (data?.success) {
        setPhase("success");
        return;
      }

      if (data?.no_payment) {
        attemptsRef.current++;
        // Retry up to 12 times = 24 seconds (webhook usually arrives within 5-15s)
        if (attemptsRef.current < 12) {
          timerRef.current = setTimeout(tryActivate, 2000);
        } else {
          setPhase("pending");
        }
        return;
      }

      // Error from function
      setPhase("pending");
    } catch {
      setPhase("pending");
    }
  };

  useEffect(() => {
    if (!session?.user?.id) {
      setPhase("no_session");
      return;
    }

    // Give the webhook 2s to arrive before first attempt
    timerRef.current = setTimeout(tryActivate, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [session?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = async () => {
    setRetrying(true);
    attemptsRef.current = 0;
    setPhase("activating");
    await tryActivate();
    setRetrying(false);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Olá! Acabei de assinar o iCatequese Premium.\n\nMeu email de acesso é: ${session?.user?.email}\n\n[Envie o comprovante de pagamento da InfinitePay nesta conversa para liberarmos seu acesso]`
    );
    window.open(`https://wa.me/5598984920624?text=${text}`, "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Glow effects */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-amber-300/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm text-center">
        {phase === "activating" ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-amber-100 border-2 border-amber-200 flex items-center justify-center shadow-inner">
              <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
            </div>
            <h2 className="text-xl font-black text-foreground">Ativando seu Premium...</h2>
            <p className="text-sm text-muted-foreground">
              Identificamos seu pagamento e estamos liberando o acesso. Aguarde!
            </p>
            <div className="flex gap-1.5 mt-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 animate-fade-in">
            {/* Icon */}
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-amber-100 border-2 border-amber-200 flex items-center justify-center shadow-inner">
                {phase === "success" ? (
                  <Sparkles className="h-12 w-12 text-amber-500" />
                ) : (
                  <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                )}
              </div>
              <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-amber-400" />
              <div className="absolute -bottom-1 -left-3 w-3 h-3 rounded-full bg-orange-400" />
              <div className="absolute top-0 -left-4 w-2 h-2 rounded-full bg-yellow-400" />
            </div>

            {phase === "success" && (
              <>
                <div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-amber-600">
                      Assinatura Ativada!
                    </span>
                  </div>
                  <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">
                    Bem-vindo ao Premium! 🎉
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Todos os recursos premium do iCatequese estão desbloqueados para você. Aproveite!
                  </p>
                </div>

                <div className="w-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-left space-y-2">
                  {[
                    "Múltiplas turmas de catequese",
                    "Central de Relatórios completa",
                    "Catequese em Família + Missões",
                    "Módulo de Jogos Interativos",
                    "Material de Apoio ao Catequista",
                    "Conecta Famílias e Formulários",
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-bold text-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {(phase === "pending" || phase === "no_session") && (
              <div>
                <h1 className="text-2xl font-black text-foreground mb-2">Pagamento Realizado!</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Seu pagamento foi recebido! A liberação automática pode levar alguns minutos para processar.
                </p>

                {/* Retry button */}
                <button
                  onClick={handleRetry}
                  disabled={retrying}
                  className="mt-4 w-full h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 border border-amber-300 text-amber-700 dark:text-amber-300 font-black text-sm flex items-center justify-center gap-2 hover:bg-amber-200 active:scale-95 transition-all disabled:opacity-60"
                >
                  {retrying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Verificar novamente
                </button>

                <div className="mt-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-left">
                  <p className="text-xs font-bold text-green-800 dark:text-green-300 mb-3">
                    Ou envie o comprovante para ativação imediata via WhatsApp:
                  </p>
                  <button
                    onClick={handleWhatsApp}
                    className="w-full h-12 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-sm uppercase flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Enviar Comprovante
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => navigate("/")}
              className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
              style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
            >
              Ir para o iCatequese
              <ArrowRight className="h-4 w-4" />
            </button>

            <p className="text-xs text-muted-foreground">
              Dúvidas? Entre em contato:{" "}
              <a href="mailto:ricksonam@hotmail.com" className="text-amber-600 font-bold hover:underline">
                ricksonam@hotmail.com
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
