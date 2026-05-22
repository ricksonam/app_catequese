import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Star, Loader2, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Phase = "checking" | "success" | "pending" | "no_session";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [phase, setPhase] = useState<Phase>("checking");
  const [countdown, setCountdown] = useState(6);
  const attemptsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Polling do perfil: verifica se o webhook já ativou o premium
  const checkPremiumStatus = async () => {
    if (!session?.user?.id) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium, premium_expires_at")
      .eq("id", session.user.id)
      .maybeSingle();

    const activated =
      profile?.is_premium &&
      (!profile.premium_expires_at || new Date(profile.premium_expires_at) > new Date());

    if (activated) {
      setPhase("success");
      return;
    }

    attemptsRef.current += 1;

    // Tenta por até 40 segundos (20 tentativas × 2s)
    if (attemptsRef.current < 20) {
      timerRef.current = setTimeout(checkPremiumStatus, 2000);
    } else {
      // Webhook pode demorar; mostra mensagem de processando
      setPhase("pending");
    }
  };

  useEffect(() => {
    if (loading) return;

    if (!session?.user?.id) {
      setPhase("no_session");
      return;
    }

    // Aguarda 1.5s para o webhook chegar antes de verificar
    timerRef.current = setTimeout(checkPremiumStatus, 1500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [session?.user?.id, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-redirect após sucesso ou pending
  useEffect(() => {
    if (phase !== "success" && phase !== "pending") return;

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
      {/* Glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-amber-300/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md text-center">

        {/* Verificando pagamento */}
        {phase === "checking" && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-24 h-24 rounded-3xl bg-amber-100 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-900 flex items-center justify-center shadow-inner">
              <Loader2 className="h-12 w-12 text-amber-500 animate-spin" />
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                  Verificando pagamento...
                </span>
              </div>
              <h1 className="text-2xl font-black text-foreground tracking-tight mb-3">
                Confirmando seu Premium
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Estamos aguardando a confirmação do pagamento. Isso geralmente leva apenas alguns segundos!
              </p>
            </div>

            {/* Barra de progresso animada */}
            <div className="w-full max-w-xs bg-amber-100 dark:bg-amber-950/30 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full animate-pulse" style={{ width: `${Math.min((attemptsRef.current / 20) * 100, 95)}%`, transition: "width 2s ease" }} />
            </div>
          </div>
        )}

        {/* Sem sessão */}
        {phase === "no_session" && (
          <div className="flex flex-col items-center gap-6 animate-fade-in">
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
                  Pagamento Confirmado!
                </span>
              </div>
              <h1 className="text-3xl font-black text-foreground tracking-tight mb-3">
                Bem-vindo ao iCatequese Premium!
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Seu pagamento foi processado! Para ativar seu acesso Premium, faça login com o email que usou no checkout.
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
        )}

        {/* Premium ativado com sucesso */}
        {phase === "success" && (
          <div className="flex flex-col items-center gap-6 animate-fade-in">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/20">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center">
                <span className="text-white text-[8px] font-black">✓</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                  Premium Ativado! ✨
                </span>
              </div>
              <h1 className="text-3xl font-black text-foreground tracking-tight mb-3">
                Seja bem-vindo ao Premium!
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Todos os recursos exclusivos do iCatequese estão agora desbloqueados para você. Que Deus abençoe seu trabalho de catequista!
              </p>
            </div>

            <div className="mt-2 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 rounded-2xl w-full">
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Redirecionando em <span className="text-sm font-black text-orange-500">{countdown}s</span>...
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              Dúvidas?{" "}
              <a href="mailto:ricksonam@hotmail.com" className="text-amber-600 font-bold hover:underline">
                ricksonam@hotmail.com
              </a>
            </p>
          </div>
        )}

        {/* Pendente — webhook ainda processando */}
        {phase === "pending" && (
          <div className="flex flex-col items-center gap-6 animate-fade-in">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/20">
                <Sparkles className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-yellow-400 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                  Pagamento Recebido!
                </span>
              </div>
              <h1 className="text-3xl font-black text-foreground tracking-tight mb-3">
                Quase lá! Seu acesso está sendo ativado
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Seu pagamento foi confirmado! A ativação pode levar até 2 minutos. Ao abrir o app, seu Premium estará ativo. 🙏
              </p>
            </div>

            <div className="mt-2 p-4 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl w-full">
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                Voltando ao app em <span className="text-sm font-black text-orange-500">{countdown}s</span>...
              </p>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Dúvidas?{" "}
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
