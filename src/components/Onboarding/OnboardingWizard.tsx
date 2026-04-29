import { useState } from "react";
import { Church, Users, BookOpen, Check, LogOut, ChevronRight, Sparkles, Heart, Star, Layout, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ParoquiaStep } from "./ParoquiaStep";
import { CatequistaStep } from "./CatequistaStep";
import { TurmaStep } from "./TurmaStep";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface OnboardingWizardProps {
  currentStep: "paroquia" | "catequista" | "turma" | "none";
  onComplete: () => void;
  onStepChange: (step: "paroquia" | "catequista" | "turma" | "none") => void;
}

export function OnboardingWizard({ currentStep, onComplete, onStepChange }: OnboardingWizardProps) {
  const { signOut } = useAuth();
  const [showAbout, setShowAbout] = useState(false);

  // Mapeamento visual dos passos
  const steps = [
    { id: "paroquia", label: "Paróquia", icon: Church },
    { id: "catequista", label: "Catequista", icon: Users },
    { id: "turma", label: "Turma", icon: BookOpen },
  ];

  const activeIndex = steps.findIndex(s => s.id === currentStep);

  if (currentStep === "none" && !showAbout) return null;

  const handleTurmaSuccess = () => {
    setShowAbout(true);
  };

  const handleFinish = () => {
    setShowAbout(false);
    onComplete();
  };

  return (
    <Dialog open={currentStep !== "none" || showAbout} onOpenChange={() => {}}>
      <DialogContent hideClose className="max-w-2xl w-[95vw] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-zinc-50 dark:bg-zinc-950 flex flex-col h-[90vh] sm:h-auto sm:max-h-[85vh]">
        
        {/* Top Progress Bar */}
        {!showAbout && (
          <div className="bg-white dark:bg-zinc-900 px-6 py-4 border-b border-zinc-800 dark:border-zinc-800 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Layout className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <h2 className="font-black text-sm uppercase tracking-widest text-foreground">Configuração</h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Cadastros Básicos</p>
                </div>
              </div>
              <button 
                onClick={() => signOut()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95 shadow-sm"
              >
                <LogOut className="h-3.5 w-3.5" /> Sair
              </button>
            </div>

            <div className="flex items-center justify-between relative px-2">
              {/* Line background */}
              <div className="absolute top-5 left-0 w-full h-[3px] bg-zinc-200 dark:bg-zinc-800 z-0 rounded-full" />
              {/* Active line */}
              <div 
                className="absolute top-5 left-0 h-[3px] bg-primary z-0 transition-all duration-700 ease-in-out rounded-full shadow-[0_0_8px_rgba(var(--primary),0.4)]" 
                style={{ width: `${activeIndex === -1 ? 0 : (activeIndex / (steps.length - 1)) * 100}%` }}
              />

              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isCompleted = idx < activeIndex;
                const isActive = idx === activeIndex;

                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center gap-2.5">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all duration-500",
                      isCompleted ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : 
                      isActive ? "bg-white dark:bg-zinc-950 border-primary text-primary shadow-xl shadow-primary/30 scale-110" : 
                      "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-muted-foreground/60"
                    )}>
                      {isCompleted ? <Check className="h-5 w-5" strokeWidth={3} /> : <Icon className="h-5 w-5 opacity-80" />}
                    </div>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest transition-colors duration-300",
                      isActive ? "text-primary" : isCompleted ? "text-primary/70" : "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col relative bg-zinc-50 dark:bg-zinc-950 rounded-b-[32px] overflow-hidden min-h-0">
          {!showAbout ? (
            <>
              {currentStep === "paroquia" && (
                <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-right-4 duration-500">
                  <ParoquiaStep embedded onSuccess={() => onStepChange("catequista")} />
                </div>
              )}
              {currentStep === "catequista" && (
                <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-right-4 duration-500">
                   <div className="px-6 pt-6 pb-2 shrink-0 border-b border-black/5 dark:border-white/5">
                     <button 
                       onClick={() => onStepChange("paroquia")}
                       className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
                     >
                       <ArrowLeft className="h-3 w-3" /> Voltar para Paróquia
                     </button>
                   </div>
                   <CatequistaStep embedded onSuccess={handleTurmaSuccess} />
                </div>
              )}
              {currentStep === "turma" && (
                <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-right-4 duration-500">
                   <div className="px-6 pt-6 pb-2 shrink-0 border-b border-black/5 dark:border-white/5">
                     <button 
                       onClick={() => onStepChange("catequista")}
                       className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
                     >
                       <ArrowLeft className="h-3 w-3" /> Voltar para Catequista
                     </button>
                   </div>
                   <TurmaStep embedded onSuccess={handleTurmaSuccess} />
                </div>
              )}
            </>
          ) : (
            /* About iCatequese Screen */
            <div className="p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full scale-150" />
                <div className="relative w-24 h-24 rounded-[32px] bg-white shadow-2xl flex items-center justify-center border-4 border-primary/10 overflow-hidden">
                  <img src="/app-logo.png" alt="Logo" className="w-16 h-16 object-contain" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shadow-lg animate-bounce">
                  <Star className="h-4 w-4 text-white fill-white" />
                </div>
              </div>

              <h2 className="text-3xl font-black text-foreground tracking-tighter mb-2">Tudo Pronto!</h2>
              <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-6 flex items-center justify-center gap-2">
                <Sparkles className="h-3 w-3" /> Bem-vindo ao iCatequese <Sparkles className="h-3 w-3" />
              </p>

              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed max-w-sm mb-8">
                <p>
                  Sua estrutura inicial foi configurada com sucesso. Agora você tem um ambiente completo para gerenciar sua missão.
                </p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-left">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <Heart className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-foreground">Pastoral & Gestão</p>
                      <p className="text-[10px]">Acompanhe cada catequizando com amor e precisão.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-left">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                      <Layout className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-foreground">Relatórios Inteligentes</p>
                      <p className="text-[10px]">Gere documentos e PDFs com apenas um toque.</p>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleFinish}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white font-black text-base shadow-xl shadow-primary/20 active:scale-[0.98] transition-all hover:brightness-110 flex items-center justify-center gap-3"
              >
                Começar agora <ChevronRight className="h-5 w-5" />
              </Button>
              
              <p className="mt-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50">
                ✝ Ad maiorem Dei gloriam ✝
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
