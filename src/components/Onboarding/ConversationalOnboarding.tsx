import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Church, Users, User, Check, ChevronRight, LogOut, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useParoquiaMutation, useComunidadeMutation, useCatequistaMutation, useParoquias, useComunidades, useCatequistas } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  sender: "assistant" | "user";
  type?: "text" | "input" | "loading" | "success";
}

interface ConversationalOnboardingProps {
  open: boolean;
  onComplete: () => void;
}

export function ConversationalOnboarding({ open, onComplete }: ConversationalOnboardingProps) {
  const { signOut, user } = useAuth();
  const pMutation = useParoquiaMutation();
  const cMutation = useComunidadeMutation();
  const catMutation = useCatequistaMutation();
  
  const { data: paroquias = [] } = useParoquias();
  const { data: comunidades = [] } = useComunidades();
  const { data: catequistas = [] } = useCatequistas();

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [formData, setFormData] = useState({
    paroquia: "",
    comunidade: "",
    catequista: ""
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  const steps = [
    {
      id: "intro",
      message: "Olá! Sou o seu assistente do iCatequese. 👋 Estou aqui para te ajudar nos primeiros passos!",
      type: "text"
    },
    {
      id: "paroquia",
      message: "Para começar, qual o nome da sua **paróquia**, Área Missionária ou Escola?",
      type: "input",
      field: "paroquia",
      placeholder: "Ex: Paróquia São José"
    },
    {
      id: "comunidade",
      message: "Ótimo! E qual o nome da sua **comunidade** ou núcleo principal?",
      type: "input",
      field: "comunidade",
      placeholder: "Ex: Comunidade Nossa Senhora"
    },
    {
      id: "catequista",
      message: "Quase lá! Pra gente finalizar, qual o seu **nome completo**?",
      type: "input",
      field: "catequista",
      placeholder: "Seu nome aqui"
    },
    {
      id: "finish",
      message: "Maravilha! Já guardei esses dados básicos para você. ✝️\n\nVocê poderá completar o restante dos dados nos **Cadastros Básicos** no menu a qualquer momento.\n\nSeja muito bem-vindo ao iCatequese! Vamos preparar o seu ambiente?",
      type: "success"
    }
  ];

  useEffect(() => {
    if (open && messages.length === 0) {
      addAssistantMessage(steps[0].message);
      setTimeout(() => {
        setCurrentStep(1);
        addAssistantMessage(steps[1].message);
      }, 2000);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const addAssistantMessage = (text: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        text,
        sender: "assistant"
      }]);
    }, 1000);
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const currentStepData = steps[currentStep];
    const newMessages = [...messages, {
      id: crypto.randomUUID(),
      text: inputValue,
      sender: "user" as const
    }];
    setMessages(newMessages);
    
    const field = currentStepData.field as keyof typeof formData;
    const updatedFormData = { ...formData, [field]: inputValue };
    setFormData(updatedFormData);
    setInputValue("");

    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      addAssistantMessage(steps[nextStep].message);
    }

    if (currentStep === 3) {
      // Save data
      handleSave(updatedFormData);
    }
  };

  const handleSave = async (data: typeof formData) => {
    setIsTyping(true);
    try {
      const pId = paroquias[0]?.id || crypto.randomUUID();
      const cId = comunidades[0]?.id || crypto.randomUUID();
      const catId = catequistas[0]?.id || crypto.randomUUID();

      await pMutation.mutateAsync({
        id: pId,
        nome: data.paroquia,
      });

      await cMutation.mutateAsync({
        id: cId,
        nome: data.comunidade,
        paroquiaId: pId,
      });

      await catMutation.mutateAsync({
        id: catId,
        nome: data.catequista,
        comunidadeId: cId,
      });

      setIsTyping(false);
    } catch (error) {
      setIsTyping(false);
      toast.error("Ops! Tive um probleminha ao salvar. Pode tentar de novo?");
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent hideClose className="max-w-2xl w-[95vw] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-zinc-50 dark:bg-zinc-950 flex flex-col h-[85vh] sm:h-[70vh]">
        
        {/* Header */}
        <div className="bg-white dark:bg-zinc-900 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-black text-sm uppercase tracking-widest text-foreground">Assistente</h2>
              <p className="text-[10px] text-primary font-bold uppercase tracking-tighter">Configuração Inicial</p>
            </div>
          </div>
          <button 
            onClick={() => signOut()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95 shadow-sm"
          >
            <LogOut className="h-3.5 w-3.5" /> Sair
          </button>
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth premium-scrollbar"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "flex items-end gap-3",
                  msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                {msg.sender === "assistant" && (
                  <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-black/5 flex items-center justify-center shrink-0 mb-1 overflow-hidden">
                    <img src="/app-logo.png" alt="Avatar" className="w-6 h-6 object-contain" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[80%] p-4 rounded-2xl shadow-sm text-sm font-medium leading-relaxed",
                  msg.sender === "assistant" 
                    ? "bg-white dark:bg-zinc-900 text-foreground rounded-bl-none border border-black/5" 
                    : "bg-primary text-white rounded-br-none"
                )}>
                  {msg.text.split("**").map((part, i) => (
                    i % 2 === 1 ? <strong key={i} className={msg.sender === "user" ? "text-white" : "text-primary"}>{part}</strong> : part
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-black/5 flex items-center justify-center shrink-0 overflow-hidden">
                <img src="/app-logo.png" alt="Avatar" className="w-6 h-6 object-contain opacity-50" />
              </div>
              <div className="bg-white dark:bg-zinc-900 px-4 py-3 rounded-2xl rounded-bl-none border border-black/5 shadow-sm flex gap-1">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-primary/40" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
          {currentStep > 0 && currentStep < steps.length - 1 ? (
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={steps[currentStep].placeholder}
                className="w-full h-14 pl-5 pr-14 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-none ring-1 ring-black/5 focus:ring-primary/30 transition-all font-medium text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className={cn(
                  "absolute right-2 top-2 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                  inputValue.trim() 
                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-100" 
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 scale-95 opacity-50"
                )}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          ) : currentStep === steps.length - 1 ? (
            <Button 
              onClick={onComplete}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white font-black text-base shadow-xl shadow-primary/20 active:scale-[0.98] transition-all hover:brightness-110 flex items-center justify-center gap-3"
            >
              Começar Agora <ChevronRight className="h-5 w-5" />
            </Button>
          ) : (
            <div className="flex items-center justify-center py-4">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] animate-pulse">Aguarde o assistente...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
