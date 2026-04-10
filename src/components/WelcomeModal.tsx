import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
  X,
  MapPin,
  Users,
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  Layers,
  CheckCircle2,
  Sparkles,
  PartyPopper,
} from "lucide-react";

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

const TOUR_STEPS = [
  {
    icon: LayoutDashboard,
    color: "from-violet-500 to-indigo-600",
    title: "Painel Principal",
    desc: "No painel você vê um resumo de tudo: turmas, catequizandos, próximos encontros e aniversários do mês.",
  },
  {
    icon: BookOpen,
    color: "from-amber-500 to-orange-600",
    title: "Turmas",
    desc: "Crie e gerencie suas turmas. Em cada turma você organiza encontros, catequizandos e atividades.",
  },
  {
    icon: CalendarDays,
    color: "from-emerald-500 to-teal-600",
    title: "Encontros",
    desc: "Planeje seus encontros com roteiro, leitura bíblica, chamada e avaliação ao final. Tudo em um só lugar.",
  },
  {
    icon: Users,
    color: "from-sky-500 to-blue-600",
    title: "Catequizandos",
    desc: "Cadastre os catequizandos com foto e dados pessoais. Acompanhe presenças e sacramentos.",
  },
  {
    icon: Layers,
    color: "from-pink-500 to-rose-600",
    title: "Módulos Globais",
    desc: "Acesse a Bíblia, jogos pedagógicos, material de apoio, biblioteca de modelos e o calendário litúrgico.",
  },
];

const REQUIRED_STEPS = [
  {
    icon: MapPin,
    color: "bg-amber-500/15 text-amber-600",
    border: "border-amber-500/30",
    title: "Paróquia / Comunidade",
    desc: "Informe os dados da sua paróquia. Essas informações aparecerão nos relatórios.",
    path: "/cadastros/paroquia-comunidade",
    key: "paroquia",
  },
  {
    icon: Users,
    color: "bg-sky-500/15 text-sky-600",
    border: "border-sky-500/30",
    title: "Catequistas",
    desc: "Cadastre os catequistas que atuam na catequese para associá-los aos encontros.",
    path: "/cadastros/catequistas",
    key: "catequistas",
  },
  {
    icon: BookOpen,
    color: "bg-violet-500/15 text-violet-600",
    border: "border-violet-500/30",
    title: "Criar sua primeira Turma",
    desc: "Com os cadastros feitos, crie sua turma e comece a organizar os encontros.",
    path: "/turmas/nova",
    key: "turma",
  },
];

export default function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<"welcome" | "checklist" | "tour">("welcome");
  const [tourIndex, setTourIndex] = useState(0);
  const [done, setDone] = useState<Record<string, boolean>>({});

  // Persist completed steps in localStorage
  useEffect(() => {
    const saved = localStorage.getItem("ivc_onboarding_done");
    if (saved) setDone(JSON.parse(saved));
  }, []);

  function markDone(key: string) {
    const next = { ...done, [key]: true };
    setDone(next);
    localStorage.setItem("ivc_onboarding_done", JSON.stringify(next));
  }

  function handleClose() {
    localStorage.setItem("ivc_welcome_seen", "true");
    onClose();
  }

  function handleGoTo(path: string, key: string) {
    markDone(key);
    handleClose();
    navigate(path);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-sm bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-float-up border border-black/10">
        
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* === WELCOME STEP === */}
        {step === "welcome" && (
          <div className="flex flex-col items-center text-center px-7 pt-10 pb-8 overflow-y-auto">
            {/* Logo/icon */}
            <div className="relative mb-5">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xl shadow-primary/30">
                <span className="text-3xl font-black text-primary-foreground">✝</span>
              </div>
              <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center shadow-lg">
                <PartyPopper className="h-3.5 w-3.5 text-white" />
              </div>
            </div>

            <h1 className="text-2xl font-black text-foreground mb-2 leading-tight">
              Bem-vindo ao<br />
              <span className="text-primary">IVC Catequese!</span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Seu sistema completo de gestão de catequese. Antes de começar, precisamos configurar alguns dados importantes.
            </p>

            {/* Call-to-action cards */}
            <div className="w-full space-y-2.5 mb-7">
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                  <span className="text-base">📋</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Cadastros obrigatórios</p>
                  <p className="text-[11px] text-muted-foreground">Paróquia, catequistas e turma</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary/10 border border-primary/20 text-left">
                <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-base">🗺️</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Tour guiado disponível</p>
                  <p className="text-[11px] text-muted-foreground">Conheça todas as funcionalidades</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => setStep("checklist")}
                className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Começar Setup
              </button>
              <button
                onClick={() => setStep("tour")}
                className="w-full py-3 rounded-2xl bg-muted/60 text-foreground font-semibold text-sm active:scale-[0.98] transition-all"
              >
                Ver o Tour Primeiro
              </button>
              <button
                onClick={handleClose}
                className="text-xs text-muted-foreground py-1.5"
              >
                Pular por agora
              </button>
            </div>
          </div>
        )}

        {/* === CHECKLIST STEP === */}
        {step === "checklist" && (
          <div className="flex flex-col px-6 pt-8 pb-7 overflow-y-auto">
            <div className="mb-6">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Configuração Inicial</p>
              <h2 className="text-xl font-black text-foreground leading-tight">Cadastros necessários</h2>
              <p className="text-xs text-muted-foreground mt-1">Complete estes 3 passos para começar a usar o sistema.</p>
            </div>

            <div className="space-y-3 mb-7">
              {REQUIRED_STEPS.map((item) => {
                const Icon = item.icon;
                const isDone = done[item.key];
                return (
                  <button
                    key={item.key}
                    onClick={() => handleGoTo(item.path, item.key)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                      isDone
                        ? "bg-emerald-500/10 border-emerald-500/20"
                        : `${item.color.split(" ")[0].replace("text-", "bg-")}/0 border-black/10 bg-card hover:border-black/30`
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isDone ? "bg-emerald-500/15" : item.color}`}>
                      {isDone ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${isDone ? "text-emerald-600" : "text-foreground"}`}>
                        {item.title}
                        {isDone && <span className="ml-1.5 text-[10px] font-black uppercase tracking-wide">✓ Feito</span>}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{item.desc}</p>
                    </div>
                    {!isDone && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep("welcome")}
                className="flex-1 py-3 rounded-2xl bg-muted/60 font-semibold text-sm text-foreground flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
              >
                <ChevronLeft className="h-4 w-4" /> Voltar
              </button>
              <button
                onClick={() => setStep("tour")}
                className="flex-1 py-3 rounded-2xl bg-primary/10 text-primary font-bold text-sm active:scale-[0.98] transition-all"
              >
                Ver Tour
              </button>
            </div>
            <button onClick={handleClose} className="text-xs text-muted-foreground py-2 mt-1 text-center">
              Fechar e continuar depois
            </button>
          </div>
        )}

        {/* === TOUR STEP === */}
        {step === "tour" && (
          <div className="flex flex-col px-6 pt-8 pb-7 overflow-y-auto">
            {/* Progress dots */}
            <div className="flex gap-1.5 justify-center mb-6">
              {TOUR_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTourIndex(i)}
                  className={`rounded-full transition-all ${
                    i === tourIndex ? "w-6 h-2 bg-primary" : "w-2 h-2 bg-muted"
                  }`}
                />
              ))}
            </div>

            {/* Tour card */}
            {(() => {
              const current = TOUR_STEPS[tourIndex];
              const Icon = current.icon;
              return (
                <div className="flex flex-col items-center text-center mb-8 animate-float-up">
                  <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${current.color} flex items-center justify-center shadow-xl mb-5`}>
                    <Icon className="h-12 w-12 text-white" />
                  </div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                    {tourIndex + 1} de {TOUR_STEPS.length}
                  </p>
                  <h3 className="text-xl font-black text-foreground mb-3">{current.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{current.desc}</p>
                </div>
              );
            })()}

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setTourIndex((p) => Math.max(0, p - 1))}
                disabled={tourIndex === 0}
                className="flex-1 py-3 rounded-2xl bg-muted/60 font-semibold text-sm text-foreground flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-[0.98] transition-all"
              >
                <ChevronLeft className="h-4 w-4" /> Anterior
              </button>
              {tourIndex < TOUR_STEPS.length - 1 ? (
                <button
                  onClick={() => setTourIndex((p) => p + 1)}
                  className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
                >
                  Próximo <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => setStep("checklist")}
                  className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
                >
                  Fazer Setup <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={handleClose}
              className="text-xs text-muted-foreground py-1.5 text-center"
            >
              Fechar e continuar depois
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
