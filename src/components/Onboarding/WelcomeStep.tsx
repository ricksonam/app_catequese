import { PartyPopper, ArrowRight, Sparkles } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface WelcomeStepProps {
  open: boolean;
  onFinish: () => void;
}

export function WelcomeStep({ open, onFinish }: WelcomeStepProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md w-[95vw] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-zinc-950">
        <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-violet-400 to-emerald-500" />
        
        <div className="p-10 flex flex-col items-center text-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shadow-lg shadow-emerald-500/20 border-2 border-emerald-500/20 animate-bounce">
            <PartyPopper className="h-12 w-12 text-emerald-600" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="text-3xl font-black text-foreground tracking-tighter">Tudo Pronto!</h2>
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-base font-bold text-emerald-600 uppercase tracking-widest">Seja bem-vindo, Catequista!</p>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            Você concluiu todos os cadastros obrigatórios. O <strong>iCatequese</strong> está totalmente liberado para você gerir sua fé e sua turma com excelência.
          </p>

          <button
            onClick={onFinish}
            className="w-full h-16 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-lg shadow-xl shadow-emerald-500/25 active:scale-[0.97] transition-all hover:brightness-110 flex items-center justify-center gap-3 group"
          >
            Começar minha jornada
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
