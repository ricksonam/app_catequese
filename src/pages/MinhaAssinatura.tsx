import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, CreditCard, Sparkles, Star, XCircle, ShieldCheck, Hash, Clock, AlertCircle } from "lucide-react";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function MinhaAssinatura() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { isPremium, expiresAt, isLoading, refetch } = usePremiumStatus();
  
  const [isLinkingPayment, setIsLinkingPayment] = useState(false);

  // Link estático da InfinitePay
  const INFINITEPAY_CHECKOUT_URL = "https://checkout.infinitepay.io/ricksonam/iq754vwJ1z";

  // Efeito para "Late Binding" (quando a InfinitePay redireciona de volta com ?order_nsu=...)
  useEffect(() => {
    const orderNsu = searchParams.get("order_nsu");
    
    if (orderNsu && user && !isPremium) {
      const linkPayment = async () => {
        setIsLinkingPayment(true);
        try {
          // Chama repetidamente (polling) por 1 minuto se não encontrar, pois o webhook pode demorar alguns segundos
          let attempts = 0;
          let linked = false;
          
          while (attempts < 12 && !linked) {
            console.log(`Tentando vincular pagamento ${orderNsu} (Tentativa ${attempts + 1})`);
            const { data, error } = await supabase.functions.invoke("link-payment", {
              body: { order_nsu: orderNsu }
            });

            if (data?.activated) {
              toast.success("Pagamento confirmado! Bem-vindo(a) ao Premium 🎉");
              refetch();
              linked = true;
              // Limpa a URL
              searchParams.delete("order_nsu");
              setSearchParams(searchParams);
              break;
            } else if (data?.reason === "not_found" || data?.reason === "not_paid") {
              // Espera 5 segundos e tenta de novo
              await new Promise(r => setTimeout(r, 5000));
              attempts++;
            } else if (error || data?.error) {
              console.error("Erro no vínculo:", error || data?.error);
              toast.error(data?.error || "Erro ao verificar pagamento. Contate o suporte.");
              break;
            }
          }

          if (!linked && attempts >= 12) {
            toast.info("Aguardando confirmação...", {
              description: "O sistema da InfinitePay ainda está processando. Se o pagamento foi feito, sua conta será ativada automaticamente em breve."
            });
          }

        } catch (err) {
          console.error("Erro fatal no vínculo:", err);
        } finally {
          setIsLinkingPayment(false);
        }
      };

      linkPayment();
    }
  }, [searchParams, user, isPremium]);

  const handleSubscribe = () => {
    if (!user) {
      toast.error("Você precisa estar logado para assinar.");
      return;
    }
    // Abre a InfinitePay em uma nova aba para o usuário pagar.
    // O usuário DEVE voltar para a mesma aba após o pagamento para o vínculo tardio funcionar.
    window.location.href = INFINITEPAY_CHECKOUT_URL;
  };

  if (isLoading || isLinkingPayment) {
    return (
      <div className="min-h-[60vh] flex flex-col gap-4 items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        {isLinkingPayment && <p className="text-sm font-bold animate-pulse">Confirmando seu pagamento...</p>}
      </div>
    );
  }

  // Data de expiração formatada
  const premiumUntil = expiresAt ? new Date(expiresAt).toLocaleDateString('pt-BR') : null;

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
                <span className="text-xs font-bold uppercase tracking-widest">
                  Ativo até {premiumUntil || 'ilimitado'}
                </span>
              </div>
            ) : (
              <div className="bg-slate-100 dark:bg-zinc-800 text-muted-foreground px-4 py-2 rounded-xl flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Sem assinatura ativa</span>
              </div>
            )}
          </div>
        </div>

        {/* CTA ou Benefícios */}
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
                    Acesso a recursos exclusivos que facilitam a sua catequese por apenas R$ 9,90 ao ano.
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
                  <Button
                    onClick={handleSubscribe}
                    className="w-full h-14 rounded-2xl bg-white text-primary hover:bg-white/90 font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                  >
                    Assinar Premium — R$ 9,90/ano
                  </Button>
                  <p className="text-[10px] text-white/60 text-center mt-3 uppercase tracking-widest">
                    Pagamento 100% seguro via InfinitePay
                  </p>
                </div>
              </div>
            </div>

            {/* Info sobre o processo */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-[20px] p-5">
              <h4 className="text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Como funciona?
              </h4>
              <p className="text-xs text-blue-800 dark:text-blue-400 leading-relaxed mb-3">
                Ao clicar em "Assinar", você será redirecionado para a tela de pagamento segura da InfinitePay.
              </p>
              <div className="p-3 bg-white/60 dark:bg-black/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                <p className="text-xs font-bold text-blue-900 dark:text-blue-300">
                  ⚠️ Importante: Após concluir o pagamento na InfinitePay, não feche a janela!
                </p>
                <p className="text-[10px] text-blue-800/80 dark:text-blue-400/80 mt-1">
                  Aguarde ser redirecionado automaticamente de volta para esta página para que sua conta Premium seja ativada na hora.
                </p>
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
                  {premiumUntil && ` Válida até ${premiumUntil}.`}
                </p>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
