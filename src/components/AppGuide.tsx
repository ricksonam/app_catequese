import { useState } from "react";
import { 
  Dialog, DialogContent 
} from "@/components/ui/dialog";
import { 
  ChevronRight, ChevronLeft, CheckCircle2, 
  Sparkles, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface AppGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  {
    title: "Bem-vindo ao iCatequese!",
    description: "Sua plataforma completa para modernizar a catequese. Vamos transformar sua missão com tecnologia e amor.",
    image: "/brain/f86b7291-39ef-4f3a-995e-2af3a47effef/guide_welcome_1776732265517.png",
    color: "text-primary",
    bgColor: "bg-primary/5",
    accent: "bg-primary"
  },
  {
    title: "Trabalho em Equipe",
    description: "Compartilhe sua turma com outros catequistas. Use o código de acesso para que todos gerenciem os mesmos dados em tempo real.",
    image: "/brain/f86b7291-39ef-4f3a-995e-2af3a47effef/guide_sharing_1776732278150.png",
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/5",
    accent: "bg-emerald-500"
  },
  {
    title: "Conheça os Módulos",
    description: "Acesse Jogos Bíblicos, Bíblia Online e Biblioteca de Modelos. Tudo o que você precisa disponível para todas as suas turmas.",
    image: "/brain/f86b7291-39ef-4f3a-995e-2af3a47effef/guide_modules_3d_1776732423504.png",
    color: "text-amber-600",
    bgColor: "bg-amber-500/5",
    accent: "bg-amber-500"
  },
  {
    title: "Conexão com a Família",
    description: "Envie o cronograma de encontros para os pais através de um link público. Sem necessidade de senha ou cadastro para eles.",
    image: "/brain/f86b7291-39ef-4f3a-995e-2af3a47effef/guide_family_1776732523929.png",
    color: "text-blue-600",
    bgColor: "bg-blue-500/5",
    accent: "bg-blue-500"
  },
  {
    title: "Feedback Interativo",
    description: "Crie pesquisas e avaliações para os pais. Visualize resultados automáticos e melhore continuamente a experiência das famílias.",
    image: "/brain/f86b7291-39ef-4f3a-995e-2af3a47effef/guide_feedback_3d_1776732542154.png",
    color: "text-purple-600",
    bgColor: "bg-purple-500/5",
    accent: "bg-purple-500"
  }
];

export default function AppGuide({ open, onOpenChange }: AppGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onOpenChange(false);
      setTimeout(() => setCurrentStep(0), 500);
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const current = steps[currentStep];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] w-[95vw] p-0 overflow-hidden border-none rounded-[40px] shadow-2xl bg-white dark:bg-zinc-950">
        <div className="relative h-[620px] flex flex-col items-center overflow-hidden">
          
          {/* Close button */}
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5 text-zinc-500" />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex-1 flex flex-col items-center w-full"
            >
              {/* Image Container */}
              <div className={`w-full h-[320px] ${current.bgColor} flex items-center justify-center relative`}>
                <div className="absolute inset-0 opacity-30 select-none pointer-events-none">
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl bg-white/50" />
                </div>
                <motion.img 
                  src={current.image} 
                  alt={current.title}
                  initial={{ scale: 0.8, rotate: -5, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
                  className="w-64 h-64 object-contain relative z-10 drop-shadow-2xl"
                />
              </div>

              {/* Text Content */}
              <div className="flex-1 flex flex-col items-center text-center p-8 pt-10">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-2 mb-3"
                >
                  <Sparkles className={`h-4 w-4 ${current.color}`} />
                  <span className={`text-[11px] font-black uppercase tracking-[0.3em] ${current.color} opacity-70`}>
                    Passo {currentStep + 1} de {steps.length}
                  </span>
                </motion.div>

                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl font-black text-foreground tracking-tight mb-4 leading-tight"
                >
                  {current.title}
                </motion.h2>

                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-[15px] font-medium text-muted-foreground leading-relaxed px-2"
                >
                  {current.description}
                </motion.p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Footer Controls */}
          <div className="w-full p-8 pt-0 flex flex-col gap-6">
            {/* Progress Bar */}
            <div className="flex gap-2 w-full">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className="flex-1 h-1.5 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden"
                >
                  <motion.div 
                    initial={false}
                    animate={{ 
                      width: i <= currentStep ? "100%" : "0%",
                      backgroundColor: i === currentStep ? "var(--primary)" : "rgba(0,0,0,0.1)"
                    }}
                    className={`h-full ${i === currentStep ? current.accent : 'bg-black/10'}`}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <Button 
                  variant="ghost" 
                  onClick={prev}
                  className="h-14 w-14 rounded-2xl border-none hover:bg-zinc-100 dark:hover:bg-zinc-900 group shrink-0"
                >
                  <ChevronLeft className="h-6 w-6 text-zinc-400 group-hover:text-zinc-600" />
                </Button>
              )}
              <Button 
                onClick={next}
                className={`flex-1 h-14 rounded-2xl font-black text-lg shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] gap-2 flex items-center justify-center ${current.accent} text-white shadow-${current.accent.split('-')[1]}/30`}
              >
                {currentStep === steps.length - 1 ? (
                  <>Começar Agora <CheckCircle2 className="h-5 w-5" /></>
                ) : (
                  <>Próximo Passo <ChevronRight className="h-5 w-5" /></>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
