import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Sparkles, Church, X, Users, Dices, Share2, MessageSquare, CheckCircle2, CalendarDays, Gift, Image, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ObjectiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTour?: () => void;
}

const steps = [
  {
    title: "Apresentar o Encontro",
    description: "Planeje seus encontros com antecedência e registre a presença de todos facilmente.",
    icon: CalendarDays,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "Aniversariantes Inteligente",
    description: "Receba alertas lindos no painel sobre aniversários de nascimento e de batismo dos seus catequizandos.",
    icon: Gift,
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-500/10",
  },
  {
    title: "Atividades e Eventos",
    description: "Cadastre celebrações, retiros e atividades extras em um calendário exclusivo da turma.",
    icon: ListChecks,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  {
    title: "Módulo de Jogos",
    description: "Acesse uma biblioteca interativa de jogos educativos para deixar a catequese muito mais lúdica.",
    icon: Dices,
    color: "text-fuchsia-600 dark:text-fuchsia-400",
    bgColor: "bg-fuchsia-500/10",
  },
  {
    title: "Mural de Fotos",
    description: "Eternize as memórias da sua turma com um mural de lembranças, guardando as fotos dos momentos.",
    icon: Image,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  {
    title: "Trabalho em Equipe",
    description: "Compartilhe a sua turma usando um código. Outros catequistas podem gerir com você.",
    icon: Users,
    color: "text-sky-600 dark:text-sky-400",
    bgColor: "bg-sky-500/10",
  },
  {
    title: "Catequese em Família",
    description: "Crie enquetes e missões familiares incríveis para manter as famílias engajadas na fé.",
    icon: MessageSquare,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
  }
];

export function ObjectiveModal({ open, onOpenChange }: ObjectiveModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] h-[90vh] p-0 overflow-y-auto overflow-x-hidden border-2 border-black/5 dark:border-white/5 rounded-[32px] sm:rounded-[40px] shadow-2xl bg-[#FFF5F0] dark:bg-zinc-950 premium-scrollbar">
        {/* Close Button */}
        <button 
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-[60] w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 backdrop-blur-md flex items-center justify-center text-foreground hover:bg-black/10 dark:hover:bg-white/20 transition-all active:scale-90"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col min-h-full pb-10">
          
          {/* Header Area */}
          <div className="w-full pt-12 pb-6 px-6 flex flex-col items-center text-center relative">
             <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[32px] overflow-hidden bg-white shadow-xl mb-5 border border-black/5 animate-float-float relative z-10 shrink-0 p-2">
               <img src="/app-logo.png" className="w-full h-full object-contain" alt="Logo iCatequese" />
             </div>

             <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tighter mb-2 z-10">iCatequese</h2>
             <div className="flex items-center justify-center gap-2 mb-6 z-10">
               <Sparkles className="h-3.5 w-3.5 text-amber-500" />
               <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Gestão Inteligente</p>
               <Sparkles className="h-3.5 w-3.5 text-amber-500" />
             </div>

             <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-[28px] p-6 border border-black/5 dark:border-white/5 shadow-sm relative text-left w-full mt-2">
               <div className="absolute -top-4 -left-2 bg-primary text-white rounded-xl p-2.5 shadow-lg rotate-[-10deg]">
                 <Church className="h-5 w-5" />
               </div>
               <p className="text-sm leading-relaxed text-foreground/80 italic font-medium pt-2">
                 "Semear a Palavra e cultivar o Reino. Uma plataforma desenhada para auxiliar catequistas a organizar seus encontros e inovar o processo educativo da fé."
               </p>
             </div>
          </div>

          {/* Destaques (Módulos / Apresentação em Cards Brancos) */}
          <div className="w-full px-6 mb-8 flex-1">
             <div className="flex items-center gap-3 mb-5 opacity-60">
                <div className="h-px bg-foreground/20 flex-1" />
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground text-center">Tudo em um só lugar</span>
                <div className="h-px bg-foreground/20 flex-1" />
             </div>

             <div className="grid gap-3">
                {steps.map((step, i) => (
                  <div key={i} className="bg-white dark:bg-zinc-900 rounded-[28px] p-4 border border-black/5 dark:border-white/5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all group">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform", step.bgColor, step.color)}>
                      <step.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-black text-foreground">{step.title}</h3>
                      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{step.description}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {/* Start / Close Button */}
          <div className="w-full px-6 mb-6">
            <Button 
              onClick={() => {
                onOpenChange(false);
                if (onStartTour) onStartTour();
              }} 
              className="w-full h-14 rounded-2xl font-black text-base shadow-xl shadow-primary/20 text-white bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2"
            >
              Começar Agora <CheckCircle2 className="w-5 h-5" />
            </Button>
          </div>

          {/* Contact Section */}
          <div className="w-full px-6 mb-2">
            <div className="flex items-center gap-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm p-4 rounded-[20px] border border-black/5 dark:border-white/5">
              <Avatar className="h-10 w-10 border border-black/10 dark:border-white/10 shrink-0">
                <AvatarImage src="/rickson-avatar.png" alt="Rickson Amazonas" />
                <AvatarFallback className="bg-primary text-white font-black text-xs">RA</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-foreground">Rickson Amazonas</p>
                <div className="flex items-center gap-1.5 opacity-70">
                  <Mail className="h-3 w-3" />
                  <a href="mailto:ricksonam@hotmail.com" className="text-[10px] font-bold truncate hover:underline">ricksonam@hotmail.com</a>
                </div>
              </div>
            </div>
          </div>

        </div>

        <style>{`
          @keyframes float-float {
            0%, 100% { transform: translateY(0) rotate(-2deg); }
            50% { transform: translateY(-8px) rotate(2deg); }
          }
          .animate-float-float {
            animation: float-float 5s ease-in-out infinite;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
