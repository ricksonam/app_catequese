import { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, ChevronLeft, CreditCard, Shield, Clock, Award, Star } from "lucide-react";
import { usePremium } from "@/hooks/usePremium";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function AssinaturaPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium, premiumExpiresAt, redirectToPayment, loading } = usePremium();
  const [timeLeft, setTimeLeft] = useState<string>("");

  // Live timer for the premium expiration countdown
  useEffect(() => {
    if (!isPremium) {
      setTimeLeft("");
      return;
    }

    if (!premiumExpiresAt) {
      setTimeLeft("Acesso Vitalício ✨");
      return;
    }

    const updateTimer = () => {
      const difference = new Date(premiumExpiresAt).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setTimeLeft("Assinatura Expirada");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft(`Restam: ${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isPremium, premiumExpiresAt]);

  const premiumFeatures = [
    "Múltiplas turmas de catequese simultâneas",
    "Central de Relatórios completa de presença e avaliação",
    "Catequese em Família com missões dinâmicas",
    "Módulo completo de Jogos Bíblicos Interativos",
    "Material de Apoio do Catequista com modelos prontos",
    "Mural de Fotos da Turma para compartilhar momentos",
    "Painel 'Conecta Famílias' para recados e comunicados",
  ];

  return (
    <div className="min-h-[90vh] bg-slate-50 dark:bg-zinc-950 p-4 md:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border-2 border-black/10 dark:border-white/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-black text-foreground">Minha Assinatura</h1>
          <p className="text-xs text-muted-foreground">Gerencie seus benefícios do iCatequese</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto grid grid-cols-1 gap-6">
        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-900 rounded-[2rem] border-2 border-black/10 shadow-md">
            <Clock className="h-8 w-8 text-primary animate-spin mb-3" />
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Carregando plano...</p>
          </div>
        ) : isPremium ? (
          /* Premium Subscription Card */
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-600 text-white p-6 md:p-8 shadow-2xl shadow-amber-500/20 border-2 border-amber-300">
            {/* Glossy overlay background */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-white/25 px-2 py-0.5 rounded-full border border-white/20">
                      Plano Ativo
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-1">iCatequese Premium ✨</h2>
                </div>
              </div>

              {/* Countdown Chip */}
              <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-sm animate-pulse w-fit">
                <Clock className="h-4 w-4" />
                <span>{timeLeft}</span>
              </div>
            </div>

            <div className="h-px bg-white/20 my-4" />

            <div className="space-y-3">
              <p className="text-sm font-bold text-white/90">
                Você tem acesso ilimitado a todos os recursos da plataforma!
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white/95">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
                  <span>Múltiplas turmas ativas</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-white/95">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
                  <span>Central de Relatórios liberada</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-white/95">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
                  <span>Módulo completo de Jogos Bíblicos</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-white/95">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
                  <span>Painel Conecta Famílias ativo</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-wider text-white/80">
                <Shield className="h-4 w-4" />
                <span>Renovação automática anual</span>
              </div>
            </div>
          </div>
        ) : (
          /* Free Subscription Card */
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 md:p-8 border-2 border-black/15 dark:border-white/10 shadow-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center border border-black/5">
                <Award className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                  Plano Atual
                </span>
                <h2 className="text-xl font-black text-foreground">Versão Gratuita</h2>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Você está na versão limitada do iCatequese. Faça o upgrade para o Premium hoje mesmo e potencialize seus encontros de catequese!
            </p>

            <div className="h-px bg-black/5 dark:bg-white/5 my-6" />

            <h3 className="text-xs font-black uppercase tracking-widest text-foreground mb-4">
              Vantagens exclusivas do iCatequese Premium:
            </h3>

            <div className="space-y-3 mb-8">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Star className="w-3 h-3 fill-amber-500" />
                  </div>
                  <span className="text-xs font-bold text-foreground/80 leading-tight">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <button
                onClick={redirectToPayment}
                className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
                style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
              >
                <Sparkles className="h-4 w-4" />
                Assinar Premium – R$ 9,90/mês
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] uppercase font-black tracking-widest text-muted-foreground py-2 border-t border-black/5 dark:border-white/5 mt-4">
                <CreditCard className="h-4 w-4 text-emerald-500" />
                <span>Pagamento 100% seguro via InfinitePay</span>
              </div>
            </div>
          </div>
        )}

        {/* Informações Extras */}
        <div className="p-5 bg-white dark:bg-zinc-900 rounded-[2rem] border-2 border-black/10 dark:border-white/5 shadow-sm text-center">
          <h4 className="text-xs font-black uppercase text-foreground mb-1">Como funciona a liberação?</h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Após efetuar o pagamento via Pix ou Cartão no checkout da InfinitePay, o sistema identifica e libera seu acesso Premium em menos de 1 minuto automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
