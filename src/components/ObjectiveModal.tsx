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
            <div className="relative w-36 h-36 rounded-[40px] overflow-hidden bg-primary/10 border-2 border-primary/20 shadow-2xl animate-float-float transform-gpu will-change-transform">
              <img src="/app-icon.png" className="w-full h-full object-cover" alt="Logo iCatequese" />
            </div>
          </div>
        </div>

        <div className="px-8 pt-6 pb-10 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-4xl font-black text-primary tracking-tighter">iCatequese</h2>
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">Gestão Inteligente para Catequistas</p>
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            </div>
          </div>

          {/* Main Liturgical Text */}
          <div className="relative bg-primary/5 rounded-[32px] p-7 border border-primary/10 shadow-sm">
            <div className="absolute -top-3 -left-3 bg-primary text-white rounded-xl p-2 shadow-lg">
              <Church className="h-5 w-5" />
            </div>
            <p className="text-[15px] leading-relaxed text-foreground/90 italic font-medium text-center">
              "Semeando a Palavra, cultivando o Reino. O iCatequese é uma plataforma que vem para auxiliar os catequistas a organizar a missão de forma que a evangelização se torne o essencial."
            </p>
            <div className="mt-5 pt-5 border-t border-primary/10">
              <p className="text-[13px] leading-relaxed text-muted-foreground font-medium text-center">
                Em cada aula, em cada encontro, buscamos preparar o terreno do coração para que a semente da fé encontre terra boa e frutifique em amor e serviço à comunidade.
              </p>
            </div>
          </div>

          {/* Features highlight */}
          <div className="grid grid-cols-2 gap-4">
             <div className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-border/40">
               <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
                 <Heart className="h-5 w-5" />
               </div>
               <span className="text-[12px] font-black text-foreground uppercase tracking-tight">Foco no Cuidado</span>
             </div>
             <div className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-border/40">
               <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                 <GraduationCap className="h-5 w-5" />
               </div>
               <span className="text-[12px] font-black text-foreground uppercase tracking-tight">Apoio Pastoral</span>
             </div>
          </div>

          {/* Contact Section */}
          <div className="pt-6 border-t border-border/60">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-primary/30 shadow-xl">
                <AvatarImage src="/avatar-rickson.png" alt="Rickson Amazonas" />
                <AvatarFallback className="bg-primary text-white font-black text-xl">RA</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-base font-black text-foreground truncate">Rickson Amazonas</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Mail className="h-3 w-3 text-primary" />
                  <a 
                    href="mailto:ricksonam@hotmail.com" 
                    className="text-xs font-bold text-primary hover:underline truncate"
                  >
                    ricksonam@hotmail.com
                  </a>
                </div>
              </div>
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
