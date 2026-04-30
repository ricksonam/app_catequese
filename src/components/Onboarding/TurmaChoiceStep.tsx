import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Users, UserPlus, Sparkles, PlusCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TurmaChoiceStepProps {
  open: boolean;
  onSelectCreate: () => void;
  onSelectJoin: () => void;
  onExit: () => void;
}

export function TurmaChoiceStep({ open, onSelectCreate, onSelectJoin, onExit }: TurmaChoiceStepProps) {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent hideClose className="max-w-md mx-auto rounded-[32px] p-8 shadow-2xl border-none bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
        
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full scale-150" />
          <div className="relative w-20 h-20 rounded-[28px] bg-white shadow-xl flex items-center justify-center border-4 border-primary/5 overflow-hidden">
             <img src="/app-logo.png" alt="Logo" className="w-14 h-14 object-contain" />
          </div>
          <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center shadow-lg animate-bounce">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-black text-foreground tracking-tighter mb-2">Qual a forma que vai usar o aplicativo?</h2>
        <div className="space-y-3 mb-8">
          <p className="text-sm text-muted-foreground font-medium max-w-sm leading-relaxed">
            Bem-vindo ao iCatequese! Para começarmos, nos diga se você será o responsável principal por uma turma ou se vai auxiliar um catequista.
          </p>
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 text-left">
            <p className="text-[11px] text-primary/80 font-medium leading-snug">
              <strong className="text-primary font-black uppercase tracking-widest text-[9px] block mb-0.5">Participar de uma turma</strong>
              Para entrar na turma de outro catequista, você precisará pedir que ele forneça o <strong>código da turma</strong>. Após inserir o código, o catequista responsável precisará <strong>autorizar seu acesso</strong>.
            </p>
          </div>
        </div>

        <div className="w-full flex flex-col gap-4">
          <Button 
            onClick={onSelectCreate}
            className="w-full h-16 rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-[0.98] transition-all hover:brightness-110 flex items-center justify-start px-6 gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <PlusCircle className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col items-start text-left">
              <span>Criar uma Turma</span>
              <span className="text-[9px] font-medium text-white/80 normal-case tracking-normal">Sou o catequista responsável</span>
            </div>
          </Button>

          <Button 
            onClick={onSelectJoin}
            variant="outline"
            className="w-full h-16 rounded-2xl border-2 border-primary/20 text-primary font-black text-sm uppercase tracking-widest shadow-sm active:scale-[0.98] transition-all hover:bg-primary/5 hover:border-primary/40 flex items-center justify-start px-6 gap-4 bg-white dark:bg-zinc-900"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-base">Participar de Turma</span>
              <span className="text-[11px] font-medium text-primary/70 normal-case tracking-normal">Tenho um código de acesso</span>
            </div>
          </Button>

          <button
            onClick={onExit}
            className="w-full flex items-center justify-center gap-2 mt-1 py-2.5 text-xs font-bold text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
