import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Sparkles, Heart, Church, GraduationCap } from "lucide-react";

interface ObjectiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ObjectiveModal({ open, onOpenChange }: ObjectiveModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-none bg-background/95 backdrop-blur-xl shadow-2xl rounded-[32px] animate-in zoom-in-95 duration-300">
        {/* Header with Background Pattern */}
        <div className="relative h-48 bg-gradient-to-br from-primary/10 via-primary/5 to-background flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent animate-pulse" />
          </div>
          
          <div className="relative group perspective-1000">
            <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl animate-pulse scale-125 opacity-40 transform-gpu" />
            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-white border-4 border-white shadow-2xl animate-float-float transform-gpu will-change-transform">
              <img src="/app-icon.png" className="w-full h-full object-contain p-2" alt="Logo Catequese" />
            </div>
          </div>
        </div>

        <div className="px-8 pt-6 pb-10 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-foreground tracking-tight">Nossa Missão & Propósito</h2>
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">Iniciação à Vida Cristã</p>
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
          </div>

          {/* Main Liturgical Text */}
          <div className="relative bg-primary/5 rounded-3xl p-6 border border-primary/10">
            <div className="absolute -top-3 -left-3 bg-white dark:bg-zinc-900 border border-primary/20 rounded-xl p-1.5 shadow-sm text-primary">
              <Church className="h-4 w-4" />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground italic text-center">
              "Semeando a Palavra, cultivando o Reino. Este aplicativo é uma plataforma de gestão de turmas de catequese que vem para auxiliar os catequistas a organizar a catequese de forma que a evangelização se torne o essencial."
            </p>
            <div className="mt-4 pt-4 border-t border-primary/10">
              <p className="text-sm leading-relaxed text-foreground/80 font-medium text-center">
                Em cada aula, em cada encontro, buscamos preparar o terreno do coração para que a semente da fé encontre terra boa e frutifique em amor e serviço à comunidade. Digitalizando processos para maximizar o tempo de anúncio do Evangelho.
              </p>
            </div>
          </div>

          {/* Features highlight */}
          <div className="grid grid-cols-2 gap-3">
             <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-zinc-900/50 border border-border/50 shadow-sm">
               <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
                 <Heart className="h-4 w-4" />
               </div>
               <span className="text-[11px] font-bold text-foreground">Foco no Cuidado</span>
             </div>
             <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-zinc-900/50 border border-border/50 shadow-sm">
               <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                 <GraduationCap className="h-4 w-4" />
               </div>
               <span className="text-[11px] font-bold text-foreground">Apoio Pedagógico</span>
             </div>
          </div>

          {/* Contact Section */}
          <div className="pt-4 border-t border-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-md">
                  <AvatarImage src="/avatar-rickson.png" alt="Rickson Amazonas" />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">RA</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-black text-foreground">Rickson Amazonas</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Desenvolvedor & Catequista</p>
                </div>
              </div>
              <a 
                href="mailto:ricksonam@hotmail.com"
                className="group p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 transition-all"
                title="Enviar e-mail"
              >
                <Mail className="h-5 w-5 transition-transform group-hover:rotate-12" />
              </a>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes float-float {
            0%, 100% { transform: translateY(0) rotate(0); }
            50% { transform: translateY(-10px) rotate(2deg); }
          }
          .animate-float-float {
            animation: float-float 4s ease-in-out infinite;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
