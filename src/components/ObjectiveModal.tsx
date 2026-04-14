import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Sparkles, Heart, Church, GraduationCap, X } from "lucide-react";

interface ObjectiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ObjectiveModal({ open, onOpenChange }: ObjectiveModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[94vw] p-0 overflow-hidden border-none bg-background/95 backdrop-blur-xl shadow-2xl rounded-[32px] animate-in zoom-in-95 duration-300 ring-1 ring-black/5">
        {/* Close Button - More visible for mobile */}
        <button 
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-[60] w-10 h-10 rounded-full bg-black/10 backdrop-blur-md flex items-center justify-center text-white sm:text-foreground sm:bg-muted/60 hover:bg-muted transition-all active:scale-90"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="max-h-[85vh] overflow-y-auto overflow-x-hidden scrollbar-hide flex flex-col">
          {/* Header with Background Pattern */}
          <div className="relative h-44 sm:h-52 bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center overflow-hidden shrink-0">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
               <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/30 via-transparent to-transparent animate-pulse" />
            </div>
            
            <div className="relative group perspective-1000">
              <div className="absolute -inset-6 bg-white/20 rounded-full blur-2xl animate-pulse scale-125 opacity-50 transform-gpu" />
              <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-[44px] overflow-hidden bg-white/20 backdrop-blur-sm border-2 border-white/40 shadow-2xl animate-float-float transform-gpu will-change-transform">
                <img src="/app-logo.png" className="w-full h-full object-cover" alt="Logo iCatequese" />
              </div>
            </div>
          </div>

          <div className="px-6 sm:px-10 pt-8 pb-10 space-y-8 flex-1">
            <div className="text-center space-y-1">
              <h2 className="text-4xl sm:text-5xl font-black text-primary tracking-tighter drop-shadow-md bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">iCatequese</h2>
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground">Gestão Inteligente para Catequistas</p>
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              </div>
            </div>

            {/* Main Liturgical Text */}
            <div className="relative bg-primary/5 rounded-[32px] p-6 sm:p-8 border border-primary/10 shadow-sm overflow-hidden group">
              <div className="absolute -top-3 -left-3 bg-primary text-white rounded-xl p-2.5 shadow-lg group-hover:scale-110 transition-transform">
                <Church className="h-5 w-5" />
              </div>
              <p className="text-base sm:text-lg leading-relaxed text-foreground/90 italic font-medium text-center">
                "Semeando a Palavra, cultivando o Reino. O iCatequese é uma plataforma que vem para auxiliar os catequistas a organizar a missão de forma que a evangelização se torne o essencial."
              </p>
              <div className="mt-6 pt-6 border-t border-primary/10">
                <p className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground font-medium text-center">
                  Em cada encontro, buscamos preparar o terreno do coração para que a semente da fé encontre terra boa e frutifique em amor e serviço à comunidade.
                </p>
              </div>
            </div>

            {/* Features highlight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-border/40 hover:border-primary/30 transition-colors">
                 <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success">
                   <Heart className="h-6 w-6" />
                 </div>
                 <span className="text-[13px] font-black text-foreground uppercase tracking-tight">Foco no Cuidado</span>
               </div>
               <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-border/40 hover:border-primary/30 transition-colors">
                 <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                   <GraduationCap className="h-6 w-6" />
                 </div>
                 <span className="text-[13px] font-black text-foreground uppercase tracking-tight">Apoio Pastoral</span>
               </div>
            </div>

            {/* Contact Section */}
            <div className="pt-8 border-t border-border/60">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left bg-muted/30 p-5 rounded-[24px]">
                <Avatar className="h-16 w-16 border-4 border-white dark:border-zinc-800 shadow-xl shrink-0">
                  <AvatarImage src="/rickson-avatar.png" alt="Rickson Amazonas" />
                  <AvatarFallback className="bg-primary text-white font-black text-xl">RA</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-black text-foreground">Rickson Amazonas</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mb-2">Desenvolvedor & Catequista</p>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg">
                      <Mail className="h-4 w-4 text-white" />
                    </div>
                    <a 
                      href="mailto:ricksonam@hotmail.com" 
                      className="text-sm font-bold text-primary hover:underline truncate"
                    >
                      ricksonam@hotmail.com
                    </a>
                  </div>
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
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
