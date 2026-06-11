import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, CreditCard, Sparkles, Star, Calendar, XCircle, ChevronRight, ShieldCheck } from "lucide-react";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function MinhaAssinatura() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium, premiumUntil, isLoading } = usePremiumStatus();

  // URL do InfinitePay Webhook final (Produção)
  const infinitePayUrl = "https://checkout.infinitepay.io/ricksonam/GuSd0TynkX";

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 dark:bg-zinc-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-black/5 dark:border-white/5 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800 text-foreground active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-black uppercase tracking-widest text-foreground">Minha Assinatura</h1>
        <div className="w-10 h-10" />
      </div>

      <div className="p-4 space-y-6">
        
        {/* Status Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-[24px] p-6 border-2 border-black/5 shadow-sm relative overflow-hidden">
          {/* Decoração bg */}
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
          
          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            <div className={`w-20 h-20 rounded-[20px] flex items-center justify-center shadow-lg ${isPremium ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/30' : 'bg-slate-100 dark:bg-zinc-800'}`}>
              {isPremium ? (
                <Sparkles className="w-10 h-10 text-white" />
              ) : (
                <ShieldCheck className="w-10 h-10 text-muted-foreground" />
              )}
            </div>

            <div>
              <h2 className="text-xl font-black text-foreground">
                {isPremium ? "Assinante Premium" : "Plano Gratuito"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {user?.email}
              </p>
            </div>

            {isPremium ? (
              <div className="bg-amber-500/10 text-amber-600 dark:text-amber-500 px-4 py-2 rounded-xl flex items-center gap-2 border border-amber-500/20">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Ativo até {premiumUntil ? new Date(premiumUntil).toLocaleDateString('pt-BR') : 'ilimitado'}</span>
              </div>
            ) : (
              <div className="bg-slate-100 dark:bg-zinc-800 text-muted-foreground px-4 py-2 rounded-xl flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Sem assinatura ativa</span>
              </div>
            )}
          </div>
        </div>

        {/* Call to Action ou Detalhes */}
        {!isPremium ? (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-[24px] p-6 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              
              <div className="relative z-10 space-y-4">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight mb-1">
                    Desbloqueie Tudo
                  </h3>
                  <p className="text-sm text-white/80">
                    Tenha acesso a recursos exclusivos que facilitam a sua catequese por apenas R$ 9,90 ao ano.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    "Criação de Múltiplas Turmas",
                    "Jogos Catequéticos Interativos",
                    "Fichas e Relatórios Completos",
                    "Acesso total ao Diário Espiritual",
                    "Material de Apoio para Encontros"
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-xs font-bold">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <a href={infinitePayUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                    <Button className="w-full h-14 rounded-2xl bg-white text-primary hover:bg-white/90 font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                      Assinar Premium — R$ 9,90/ano
                    </Button>
                  </a>
                  <p className="text-[10px] text-white/60 text-center mt-3 uppercase tracking-widest">
                    Pagamento 100% seguro via InfinitePay
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">Seus Benefícios</h3>
            <div className="bg-white dark:bg-zinc-900 rounded-[24px] p-2 border-2 border-black/5">
              {[
                { label: "Múltiplas Turmas", icon: Star, color: "text-blue-500", bg: "bg-blue-500/10" },
                { label: "Jogos Completos", icon: Star, color: "text-amber-500", bg: "bg-amber-500/10" },
                { label: "Relatórios de Turma", icon: Star, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                { label: "Diário Espiritual", icon: Star, color: "text-purple-500", bg: "bg-purple-500/10" },
                { label: "Materiais de Apoio", icon: Star, color: "text-rose-500", bg: "bg-rose-500/10" },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-4 p-3 border-b border-black/5 last:border-0">
                  <div className={`w-10 h-10 rounded-xl ${b.bg} ${b.color} flex items-center justify-center shrink-0`}>
                    <b.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-foreground">{b.label}</span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />
                </div>
              ))}
            </div>

            <div className="bg-sky-500/10 border-2 border-sky-500/20 rounded-[20px] p-5 flex items-start gap-4 mt-6">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-600 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-sky-900 dark:text-sky-300">Gerenciar Pagamento</p>
                <p className="text-xs text-sky-700/70 dark:text-sky-400/70 mt-1">
                  Sua assinatura é processada de forma segura através da InfinitePay.
                </p>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
