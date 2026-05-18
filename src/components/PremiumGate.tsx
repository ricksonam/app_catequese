import { Sparkles, Lock, Star, Zap, X } from "lucide-react";
import { usePremium } from "@/hooks/usePremium";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface PremiumGateProps {
  feature: string;
  description?: string;
  children: React.ReactNode;
}

const PREMIUM_BENEFITS = [
  "Criar 2 ou mais turmas de catequese",
  "Central de Relatórios completa",
  "Módulo Catequese em Família",
  "Módulo de Jogos Interativos",
  "Material de Apoio ao Catequista",
  "Conecta Famílias",
  "Compartilhamento de Plano da Turma",
  "Transferência de Dados entre turmas",
];

export function PremiumGate({ feature, description, children }: PremiumGateProps) {
  const { isPremium, loading, redirectToPayment } = usePremium();
  const [modalOpen, setModalOpen] = useState(false);

  if (loading) return null;
  if (isPremium) return <>{children}</>;

  return (
    <>
      {/* Inline locked banner – replaces the content */}
      <div
        onClick={() => setModalOpen(true)}
        className="group relative overflow-hidden rounded-3xl cursor-pointer border-2 border-dashed border-amber-300/60 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-zinc-900 dark:to-zinc-800 p-8 flex flex-col items-center text-center gap-4 hover:border-amber-400 transition-all active:scale-[0.98] shadow-sm"
      >
        {/* Glow blob */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-amber-300/20 blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-200 dark:border-amber-700 flex items-center justify-center shadow-inner">
          <Lock className="h-7 w-7 text-amber-600" />
        </div>

        <div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
              Recurso Premium
            </span>
          </div>
          <h3 className="text-xl font-black text-foreground tracking-tight">{feature}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-500/30 transition-all group-hover:scale-105">
          <Star className="h-3.5 w-3.5" />
          Assinar Plano Anual
        </div>
      </div>

      {/* Modal de upgrade */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm w-[95vw] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
          {/* Header */}
          <div className="h-2 w-full bg-gradient-to-r from-amber-400 to-orange-500" />

          <div className="p-8 text-center">
            {/* Ícone */}
            <div className="w-20 h-20 rounded-3xl bg-amber-100 flex items-center justify-center mx-auto mb-5 border-2 border-amber-200 shadow-inner">
              <Sparkles className="h-10 w-10 text-amber-500" />
            </div>

            <h2 className="text-2xl font-black text-foreground tracking-tight mb-1">
              iCatequese Premium
            </h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Desbloqueie todos os recursos e organize sua catequese como nunca!
            </p>

            {/* Lista de benefícios */}
            <div className="text-left space-y-2.5 mb-6 bg-muted/30 rounded-2xl p-4 border border-border/50">
              {PREMIUM_BENEFITS.map((b, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                    <Zap className="w-3 h-3 text-amber-600" />
                  </div>
                  <span className="text-xs font-bold text-foreground">{b}</span>
                </div>
              ))}
            </div>

            {/* Preço e CTA */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setModalOpen(false);
                  redirectToPayment();
                }}
                className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
                style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
              >
                <Star className="h-4 w-4" />
                Assinar Premium – Plano Anual
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="w-full text-xs text-muted-foreground font-bold hover:text-foreground transition-colors py-2"
              >
                Continuar com o plano básico
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Lighter version - just an inline button gate for actions (not full page replacement)
interface PremiumActionGateProps {
  onContinue: () => void;
  feature: string;
}

export function PremiumActionGate({ onContinue, feature }: PremiumActionGateProps) {
  const { isPremium, loading, redirectToPayment } = usePremium();
  const [modalOpen, setModalOpen] = useState(false);

  if (loading) return null;

  const handleClick = () => {
    if (isPremium) {
      onContinue();
    } else {
      setModalOpen(true);
    }
  };

  return (
    <>
      <span onClick={handleClick} className="contents">
        {/* Pass-through trigger - children handle the click via onContinue */}
      </span>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm w-[95vw] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-amber-400 to-orange-500" />
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 flex items-center justify-center mx-auto mb-5 border-2 border-amber-200">
              <Lock className="h-8 w-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-black text-foreground mb-2">{feature}</h2>
            <p className="text-sm text-muted-foreground mb-6">Este recurso está disponível apenas no plano Premium do iCatequese.</p>
            <button
              onClick={() => { setModalOpen(false); redirectToPayment(); }}
              className="w-full h-12 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
              style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
            >
              <Star className="h-4 w-4" />
              Assinar Premium – Plano Anual
            </button>
            <button onClick={() => setModalOpen(false)} className="mt-3 text-xs text-muted-foreground font-bold hover:text-foreground transition-colors">
              Fechar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
