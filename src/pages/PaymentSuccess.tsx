import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Sparkles, Star, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [checking, setChecking] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) {
      setChecking(false);
      return;
    }

    // Check premium status – may take a few seconds after webhook
    let attempts = 0;
    const maxAttempts = 10;

    const check = async () => {
      attempts++;
      const { data } = await supabase
        .from("profiles")
        .select("is_premium, premium_expires_at")
        .eq("id", session.user.id)
        .maybeSingle();

      const currentlyPremium = data?.is_premium && 
        (!data.premium_expires_at || new Date(data.premium_expires_at) > new Date());

      if (currentlyPremium) {
        setIsPremium(true);
        setChecking(false);
      } else if (attempts < maxAttempts) {
        setTimeout(check, 2000); // retry every 2s
      } else {
        setChecking(false); // gave up, show generic success
      }
    };

    check();
  }, [session?.user?.id]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Glow effects */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-amber-300/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm text-center">
        {checking ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-3xl bg-amber-100 border-2 border-amber-200 flex items-center justify-center shadow-inner">
              <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
            </div>
            <h2 className="text-xl font-black text-foreground">Confirmando pagamento...</h2>
            <p className="text-sm text-muted-foreground">Aguarde enquanto verificamos seu pagamento.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 animate-fade-in">
            {/* Success icon */}
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-amber-100 border-2 border-amber-200 flex items-center justify-center shadow-inner">
                {isPremium ? (
                  <Sparkles className="h-12 w-12 text-amber-500" />
                ) : (
                  <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                )}
              </div>
              {/* Confetti dots */}
              <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-amber-400" />
              <div className="absolute -bottom-1 -left-3 w-3 h-3 rounded-full bg-orange-400" />
              <div className="absolute top-0 -left-4 w-2 h-2 rounded-full bg-yellow-400" />
            </div>

            {isPremium ? (
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

                {/* Features unlocked */}
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
            ) : (
              <>
                <div>
                  <h1 className="text-2xl font-black text-foreground mb-2">Pagamento Recebido!</h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Recebemos seu pagamento! Seu acesso Premium será ativado em instantes. Se demorar mais de 5 minutos, entre em contato com o suporte.
                  </p>
                </div>
              </>
            )}

            <button
              onClick={() => navigate("/dashboard")}
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
