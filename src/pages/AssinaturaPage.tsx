import { useState, useEffect } from "react";
import {
  Sparkles, CheckCircle2, ChevronLeft, CreditCard, Shield,
  Clock, Award, Star, Tag, Loader2, X, Gift
} from "lucide-react";
import { usePremium } from "@/hooks/usePremium";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function AssinaturaPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium, premiumExpiresAt, redirectToPayment, loading, redeemPromoCode } = usePremium();
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [showPromoField, setShowPromoField] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (!isPremium) { setTimeLeft(""); return; }
    if (!premiumExpiresAt) { setTimeLeft("Acesso Vitalício ✨"); return; }

    const update = () => {
      const diff = new Date(premiumExpiresAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Assinatura Expirada"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`Restam: ${d}d ${h}h ${m}m ${s}s`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [isPremium, premiumExpiresAt]);

  const handleRedeemPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError("Digite um código promocional.");
      return;
    }
    setPromoError(null);
    setPromoLoading(true);
    try {
      const result = await redeemPromoCode(promoCode.trim());
      if (result.success) {
        toast.success("🎉 Premium ativado gratuitamente!", {
          description: "Aproveite todos os recursos exclusivos do iCatequese!",
          duration: 6000,
        });
        setPromoCode("");
        setShowPromoField(false);
      } else {
        setPromoError(result.error || "Código inválido.");
      }
    } finally {
      setPromoLoading(false);
    }
  };

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
        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-900 rounded-[2rem] border-2 border-black/10 shadow-md">
            <Clock className="h-8 w-8 text-primary animate-spin mb-3" />
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Carregando plano...</p>
          </div>
        ) : isPremium ? (
          /* ── Premium Card ── */
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-600 text-white p-6 md:p-8 shadow-2xl shadow-amber-500/20 border-2 border-amber-300">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white/25 px-2 py-0.5 rounded-full border border-white/20">
                    Plano Ativo
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-1">iCatequese Premium ✨</h2>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-sm animate-pulse w-fit">
                <Clock className="h-4 w-4" />
                <span>{timeLeft}</span>
              </div>
            </div>

            <div className="h-px bg-white/20 my-4" />

            <div className="space-y-3">
              <p className="text-sm font-bold text-white/90">Você tem acesso ilimitado a todos os recursos da plataforma!</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                {["Múltiplas turmas ativas", "Central de Relatórios liberada", "Módulo completo de Jogos Bíblicos", "Painel Conecta Famílias ativo"].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs font-bold text-white/95">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex items-center gap-2 text-[10px] uppercase font-black tracking-wider text-white/80">
              <Shield className="h-4 w-4" />
              <span>Renovação automática anual</span>
            </div>
          </div>
        ) : (
          /* ── Free Card ── */
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 md:p-8 border-2 border-black/15 dark:border-white/10 shadow-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center border border-black/5">
                <Award className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Plano Atual</span>
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
              {premiumFeatures.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Star className="w-3 h-3 fill-amber-500" />
                  </div>
                  <span className="text-xs font-bold text-foreground/80 leading-tight">{feature}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {/* Botão principal de pagamento */}
              <button
                onClick={redirectToPayment}
                className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
                style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
              >
                <Sparkles className="h-4 w-4" />
                Assinar Premium – R$ 14,90/ano
              </button>

              {/* Seção de código promocional */}
              {!showPromoField ? (
                <button
                  onClick={() => setShowPromoField(true)}
                  className="w-full h-11 rounded-2xl font-bold text-sm text-muted-foreground border-2 border-dashed border-black/10 dark:border-white/10 flex items-center justify-center gap-2 hover:border-amber-400 hover:text-amber-600 transition-all"
                >
                  <Gift className="h-4 w-4" />
                  Tenho um código promocional
                </button>
              ) : (
                <div className="rounded-2xl border-2 border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        Código Promocional
                      </span>
                    </div>
                    <button
                      onClick={() => { setShowPromoField(false); setPromoCode(""); setPromoError(null); }}
                      className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition"
                    >
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(null); }}
                      onKeyDown={(e) => e.key === "Enter" && handleRedeemPromo()}
                      placeholder="EX: CATEQUESE2026"
                      className="flex-1 h-11 px-4 rounded-xl border-2 border-amber-200 dark:border-amber-900 bg-white dark:bg-zinc-900 text-sm font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-amber-500 uppercase tracking-widest"
                      disabled={promoLoading}
                    />
                    <button
                      onClick={handleRedeemPromo}
                      disabled={promoLoading || !promoCode.trim()}
                      className="h-11 px-5 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                    </button>
                  </div>

                  {promoError && (
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                      <X className="h-3 w-3" />
                      {promoError}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-[10px] uppercase font-black tracking-widest text-muted-foreground py-2 border-t border-black/5 dark:border-white/5 mt-4">
                <CreditCard className="h-4 w-4 text-emerald-500" />
                <span>Pagamento 100% seguro via InfinitePay</span>
              </div>
            </div>
          </div>
        )}

        {/* Informações extras */}
        <div className="p-5 bg-white dark:bg-zinc-900 rounded-[2rem] border-2 border-black/10 dark:border-white/5 shadow-sm text-center">
          <h4 className="text-xs font-black uppercase text-foreground mb-1">Como funciona a liberação?</h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Após efetuar o pagamento via Pix ou Cartão no checkout da InfinitePay, o sistema libera seu acesso Premium automaticamente em segundos via webhook. Nenhuma ação adicional é necessária!
          </p>
        </div>
      </div>
    </div>
  );
}
