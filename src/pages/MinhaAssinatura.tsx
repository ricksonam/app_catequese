import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, CreditCard, Sparkles, Star, XCircle, ShieldCheck, AlertCircle } from "lucide-react";
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
  
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  // Verifica o retorno do Mercado Pago
  useEffect(() => {
    const mpStatus = searchParams.get("mp_status");
    
    if (mpStatus === "success") {
      toast.success("Pagamento aprovado! Seu Premium será ativado em instantes.", {
        description: "Se não for ativado imediatamente, recarregue a página em alguns segundos."
      });
      // Limpa a URL
      searchParams.delete("mp_status");
      setSearchParams(searchParams);
      refetch(); // Força recarregar o status caso o webhook já tenha atualizado
    } else if (mpStatus === "pending") {
      toast.info("Pagamento em análise", {
        description: "Seu pagamento via Mercado Pago está sendo processado."
      });
      searchParams.delete("mp_status");
      setSearchParams(searchParams);
    } else if (mpStatus === "failure") {
      toast.error("Pagamento recusado", {
        description: "Houve um problema com seu pagamento no Mercado Pago."
      });
      searchParams.delete("mp_status");
      setSearchParams(searchParams);
    }
  }, [searchParams, refetch, setSearchParams]);

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para assinar.");
      return;
    }

    setIsCreatingCheckout(true);
    try {
      // Pega o token da sessão ativa
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      // Usa fetch direto para evitar problemas do SDK do Supabase com headers customizados
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/create-mp-preference`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "apikey": supabaseAnonKey,
        },
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody?.error || `Erro ${response.status} ao gerar o checkout.`);
      }

      const data = await response.json();

      if (!data?.init_point) {
        throw new Error("Link de pagamento não retornado pelo servidor.");
      }

      // Redireciona para o checkout do Mercado Pago na mesma aba
      window.location.href = data.init_point;
    } catch (err: any) {
      console.error("Erro ao gerar checkout MP:", err);
      toast.error("Falha ao iniciar pagamento", {
        description: err.message || "Tente novamente mais tarde."
      });
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col gap-4 items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight mb-1">
                      Desbloqueie Tudo
                    </h3>
                    <p className="text-sm text-white/80">
                      Acesso a recursos exclusivos que facilitam a sua catequese.
                    </p>
                  </div>
                  {/* Chip de Preço em destaque */}
                  <div className="shrink-0 bg-amber-400 text-amber-900 rounded-2xl px-3 py-2 text-center shadow-lg border-2 border-amber-300">
                    <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-0.5">apenas</p>
                    <p className="text-lg font-black leading-none">R$9,90</p>
                    <p className="text-[9px] font-bold leading-none mt-0.5">/ano</p>
                  </div>
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
                    disabled={isCreatingCheckout}
                    className="w-full h-14 rounded-2xl bg-white text-primary hover:bg-white/90 font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                  >
                    {isCreatingCheckout ? "Preparando checkout..." : "Assinar Premium"}
                  </Button>
                  <p className="text-[10px] text-white/60 text-center mt-3 uppercase tracking-widest">
                    Pagamento 100% seguro via Mercado Pago
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
                Ao clicar em "Assinar", você será redirecionado para a tela de pagamento super segura do Mercado Pago.
              </p>
              <div className="p-3 bg-white/60 dark:bg-black/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                <p className="text-xs font-bold text-blue-900 dark:text-blue-300">
                  ⚠️ Ativação Automática
                </p>
                <p className="text-[10px] text-blue-800/80 dark:text-blue-400/80 mt-1">
                  Logo após a aprovação do seu pagamento, o Mercado Pago nos avisa e sua conta é ativada em segundos, sem complicações.
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
                  Sua assinatura é processada de forma segura através do Mercado Pago.
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
