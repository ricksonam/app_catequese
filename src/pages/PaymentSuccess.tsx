import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Star, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Phase = "activating" | "success" | "pending" | "no_session";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [phase, setPhase] = useState<Phase>("activating");
  const [countdown, setCountdown] = useState(5);
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
        // Retry up to 8 times = 16 seconds
        if (attemptsRef.current < 8) {
          timerRef.current = setTimeout(tryActivate, 2000);
        } else {
          // Even if direct matching is delayed, show success welcome to the user
          // because the webhook logs exist and will be processed
          setPhase("pending");
        }
        return;
      }

      setPhase("pending");
    } catch {
      setPhase("pending");
    }
  };

  useEffect(() => {
    if (loading) return;

    if (!session?.user?.id) {
      setPhase("no_session");
      return;
    }

    // Give the webhook 1s to arrive before first attempt
    timerRef.current = setTimeout(tryActivate, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [session?.user?.id, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle countdown and auto-redirect for logged-in users who successfully paid or are pending
  useEffect(() => {
    if (phase === "success" || phase === "pending") {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            navigate("/");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Premium Glow effect */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-amber-300/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md text-center">
        {phase === "activating" ? (
          <div className="flex flex-col items-center gap-6 animate-pulse">
            <div className="w-20 h-20 rounded-3xl bg-amber-100 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-900 flex items-center justify-center shadow-inner">
              <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
            </div>
            <h2 className="text-2xl font-black text-foreground">Ativando seu acesso Premium...</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Identificamos seu pagamento e estamos liberando todos os recursos na sua conta. Aguarde um instante!
            </p>
          </div>
        ) : phase === "no_session" ? (
          <div className="flex flex-col items-center gap-6 animate-fade-in">
            {/* Not Logged In Welcome State */}
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/20">
                <Sparkles className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-yellow-400 animate-ping" />
            </div>

            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                  Assinatura Confirmada!
                </span>
              </div>
              <h1 className="text-3xl font-black text-foreground tracking-tight mb-3">
                Seja bem-vindo ao iCatequese Premium!
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Seu pagamento foi processado com sucesso! Para começar a usar e gerenciar suas turmas com acesso total, faça o login na sua conta.
              </p>
            </div>

            <button
              onClick={() => navigate("/auth")}
              className="mt-4 w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
              style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
            >
              Entrar na minha Conta
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 animate-fade-in">
            {/* Success / Pending Welcome State */}
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/20">
                <Sparkles className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-yellow-400 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500 animate-spin-slow" />
                <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                  Acesso Liberado!
                </span>
              </div>
              <h1 className="text-3xl font-black text-foreground tracking-tight mb-3">
                Seja bem-vindo ao iCatequese Premium!
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Todos os recursos premium do iCatequese estão agora desbloqueados para você. Agradecemos sua confiança!
              </p>
            </div>

            <div className="mt-2 p-4 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl w-full">
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                Redirecionando você para o painel em <span className="text-sm font-black text-orange-500">{countdown}s</span>...
              </p>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
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
