import { useState } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { 
  Users, Sparkles, BookOpen, MessageSquare, 
  ChevronRight, ChevronLeft, CheckCircle2, 
  Share2, Heart, GraduationCap, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  {
    title: "Bem-vindo ao iCatequese!",
    description: "Sua plataforma completa para modernizar a catequese. Vamos te mostrar as funcionalidades mais poderosas para transformar sua missão.",
    icon: GraduationCap,
    color: "bg-primary/10 text-primary",
    bgColor: "from-primary/20",
  },
  {
    title: "Trabalho em Equipe",
    description: "Cada turma tem um código de compartilhamento único. Compartilhe-o com outros catequistas para que todos possam gerenciar os mesmos alunos e encontros em tempo real.",
    icon: Users,
    color: "bg-emerald-500/10 text-emerald-600",
    bgColor: "from-emerald-500/10",
  },
  {
    title: "Módulos Globais",
    description: "Acesse Jogos Bíblicos, Calendário Litúrgico, Bíblia Online e Biblioteca de Modelos. Tudo o que você precisa em um só lugar, disponível para todas as suas turmas.",
    icon: Globe,
    color: "bg-gold/15 text-gold-700",
    bgColor: "from-gold/20",
  },
  {
    title: "Conexão com as Famílias",
    description: "Envie o 'Plano da Turma' para os pais através de um link público. Eles verão o cronograma de encontros e atividades sem precisar de senha ou cadastro.",
    icon: Share2,
    color: "bg-blue-500/10 text-blue-600",
    bgColor: "from-blue-500/20",
  },
  {
    title: "Feedback Interativo",
    description: "Crie pesquisas de opinião, avaliações de encontros e questionários para os pais. Colete respostas de forma organizada e visualize os resultados em gráficos automáticos.",
    icon: MessageSquare,
    color: "bg-purple-500/10 text-purple-600",
    bgColor: "from-purple-500/20",
  }
];

export default function AppGuide({ open, onOpenChange }: AppGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onOpenChange(false);
      setTimeout(() => setCurrentStep(0), 300);
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const current = steps[currentStep];
  const StepIcon = current.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] p-0 overflow-hidden border-none rounded-[40px] shadow-2xl">
        <div className={`relative p-8 h-[450px] flex flex-col items-center text-center bg-gradient-to-b ${current.bgColor} to-white dark:to-zinc-950 transition-colors duration-500`}>
          
          {/* Progress Dots */}
          <div className="flex gap-1.5 mb-8">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6 bg-primary' : 'w-1.5 bg-black/10'}`} 
              />
            ))}
          </div>

          <div className={`w-20 h-20 rounded-3xl ${current.color} flex items-center justify-center mb-6 shadow-lg border-b-4 border-black/5 animate-float`}>
            <StepIcon className="h-10 w-10" />
          </div>

          <h2 className="text-2xl font-black text-foreground tracking-tight mb-4 animate-fade-in">
            {current.title}
          </h2>

          <p className="text-sm font-medium text-muted-foreground leading-relaxed px-4 animate-fade-in delay-100">
            {current.description}
          </p>

          <div className="mt-auto w-full flex items-center gap-3 pt-6">
            {currentStep > 0 && (
              <Button 
                variant="outline" 
                onClick={prev}
                className="h-14 w-14 rounded-2xl border-2 flex items-center justify-center shrink-0"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}
            <Button 
              onClick={next}
              className="flex-1 h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 gap-2 flex items-center justify-center"
            >
              {currentStep === steps.length - 1 ? (
                <>Começar Agora <CheckCircle2 className="h-5 w-5" /></>
              ) : (
                <>Próximo <ChevronRight className="h-5 w-5" /></>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
