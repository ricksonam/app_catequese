import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useEncontros } from "@/hooks/useSupabaseData";
import { X as XIcon, ChevronLeft, ChevronRight, Play, Pause, RotateCcw, BookOpen, Users, Sparkles } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";

const STEP_ICONS: Record<string, string> = { oracao_inicial: "🙏", acolhida: "👋", desenvolvimento: "📖", atividade: "🎯", oracao_final: "✨", envio: "🕊️" };
const STEP_COLORS: Record<string, string> = { oracao_inicial: "from-[hsl(270,45%,50%)] to-[hsl(290,50%,55%)]", acolhida: "from-[hsl(38,92%,50%)] to-[hsl(25,95%,53%)]", desenvolvimento: "from-[hsl(225,70%,45%)] to-[hsl(220,80%,55%)]", atividade: "from-[hsl(152,60%,42%)] to-[hsl(170,55%,45%)]", oracao_final: "from-[hsl(270,45%,50%)] to-[hsl(300,50%,55%)]", envio: "from-[hsl(200,70%,50%)] to-[hsl(220,80%,60%)]" };

export default function EncontroPresentation() {
  const { id, encontroId } = useParams();
  const navigate = useNavigate();
  const { data: turmas = [], isLoading: tLoading } = useTurmas();
  const { data: encontros = [], isLoading: eLoading } = useEncontros(id);
  const turma = turmas.find((t) => t.id === id);
  const encontro = encontros.find((e) => e.id === encontroId);
  const [currentStep, setCurrentStep] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");
  const [animKey, setAnimKey] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const steps = encontro?.roteiro || [];
  const step = steps[currentStep];

  useEffect(() => { setTimerRunning(false); setTimeLeft((steps[currentStep]?.tempo || 0) * 60); }, [currentStep, steps]);
  useEffect(() => { if (!timerRunning || timeLeft <= 0) return; const interval = setInterval(() => { setTimeLeft((prev) => { if (prev <= 1) { setTimerRunning(false); return 0; } return prev - 1; }); }, 1000); return () => clearInterval(interval); }, [timerRunning, timeLeft]);

  // Fullscreen API
  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    return () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); };
  }, []);

  const formatTime = (seconds: number) => { const m = Math.floor(seconds / 60); const s = seconds % 60; return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`; };
  const goNext = useCallback(() => { if (currentStep < steps.length - 1) { setSlideDirection("right"); setAnimKey((k) => k + 1); setCurrentStep((p) => p + 1); } }, [currentStep, steps.length]);
  const goPrev = useCallback(() => { if (currentStep > 0) { setSlideDirection("left"); setAnimKey((k) => k + 1); setCurrentStep((p) => p - 1); } }, [currentStep]);

  useEffect(() => { const handler = (e: KeyboardEvent) => { if (e.key === "ArrowRight" || e.key === " ") goNext(); if (e.key === "ArrowLeft") goPrev(); if (e.key === "Escape") navigate(-1); }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, [goNext, goPrev, navigate]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.touches[0].clientX; };
  const handleTouchEnd = () => { const diff = touchStartX.current - touchEndX.current; if (Math.abs(diff) > 50) { diff > 0 ? goNext() : goPrev(); } };

  if (eLoading || tLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black uppercase tracking-widest text-muted-foreground text-xs animate-pulse">Iniciando apresentação...</p>
      </div>
    );
  }

  if (!encontro || !step) return <div className="fixed inset-0 z-50 bg-background flex items-center justify-center"><p className="text-muted-foreground">Encontro não encontrado</p></div>;

  const progress = ((currentStep + 1) / steps.length) * 100;
  const stepIcon = STEP_ICONS[step.tipo] || "📌";
  const gradientClass = STEP_COLORS[step.tipo] || STEP_COLORS.desenvolvimento;
  const handleTimerClick = (e: React.MouseEvent | React.TouchEvent) => { e.stopPropagation(); e.preventDefault(); if (timeLeft === 0) { setTimeLeft(step.tempo * 60); setTimerRunning(true); } else { setTimerRunning(!timerRunning); } };
  const timerProgress = step.tempo > 0 ? ((step.tempo * 60 - timeLeft) / (step.tempo * 60)) * 100 : 0;
  const timerIsLow = timeLeft > 0 && timeLeft <= 60;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {/* Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-[0.07] transition-all duration-700`} />
      <div className="absolute inset-0 bg-background/95" />
      <div className="absolute top-20 -right-10 w-40 h-40 rounded-full bg-primary/5 blur-3xl animate-pulse" />
      <div className="absolute bottom-32 -left-10 w-32 h-32 rounded-full bg-accent/5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center p-1">
              <img src="/app-logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground text-center flex-1 px-2 leading-tight">{encontro.tema}</h1>
            <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center transition-all active:scale-90 shrink-0"><XIcon className="h-4 w-4 text-muted-foreground" /></button>
          </div>
          {step.catequista && <div className="flex items-center justify-center gap-1.5 mb-2"><Users className="h-3 w-3 text-muted-foreground" /><span className="text-xs text-muted-foreground font-medium">{step.catequista}</span></div>}
          <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden"><div className={`h-full bg-gradient-to-r ${gradientClass} rounded-full transition-all duration-700 ease-out`} style={{ width: `${progress}%` }} /></div>
          <div className="flex items-center justify-between mt-1.5 px-0.5"><span className="text-[10px] text-muted-foreground font-medium">Etapa {currentStep + 1} de {steps.length}</span>{step.tempo > 0 && <span className="text-[10px] text-muted-foreground font-medium">{step.tempo}min</span>}</div>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1 px-5 mb-2">{steps.map((s, i) => <button key={i} onClick={() => { setSlideDirection(i > currentStep ? "right" : "left"); setAnimKey((k) => k + 1); setCurrentStep(i); }} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? `bg-gradient-to-r ${gradientClass} w-8` : i < currentStep ? "bg-primary/30 w-1.5" : "bg-border w-1.5"}`} />)}</div>

        {/* Timer — vermelho suave com animação */}
        {step.tempo > 0 && (
          <div className="flex justify-center py-3">
            <button onClick={handleTimerClick} onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); handleTimerClick(e); }} className={`relative group ${timerIsLow ? 'animate-pulse' : ''}`}>
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" strokeWidth="3" className="stroke-[hsl(0,60%,90%)]" />
                <circle cx="40" cy="40" r="36" fill="none" strokeWidth="4" strokeLinecap="round"
                  className={timerRunning ? "stroke-[hsl(0,70%,55%)]" : timeLeft === 0 ? "stroke-destructive" : "stroke-[hsl(0,50%,70%)]"}
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - timerProgress / 100)}`}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-base font-black tabular-nums ${timerRunning ? "text-[hsl(0,70%,50%)]" : timeLeft === 0 ? "text-destructive" : "text-[hsl(0,50%,60%)]"}`}>{formatTime(timeLeft)}</span>
                <span className="mt-0.5">
                  {timerRunning ? <Pause className="h-3.5 w-3.5 text-[hsl(0,70%,50%)]" /> : timeLeft === 0 ? <RotateCcw className="h-3.5 w-3.5 text-destructive" /> : <Play className="h-3.5 w-3.5 text-[hsl(0,50%,60%)]" />}
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-2 overflow-y-auto">
          <div key={animKey} className="w-full max-w-lg" style={{ animation: `${slideDirection === "right" ? "slideInRight" : "slideInLeft"} 0.4s cubic-bezier(0.16, 1, 0.3, 1)` }}>
            <div className="flex flex-col items-center mb-5">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center mb-3 shadow-lg`}><span className="text-2xl">{stepIcon}</span></div>
              <h2 className="text-xl font-bold text-foreground text-center">{step.label}</h2>
              {step.oracaoTipo && <span className="mt-2 inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">{step.oracaoTipo}</span>}
            </div>
            {step.conteudo ? (
              <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-5 shadow-lg shadow-foreground/[0.04] border border-border/30">
                <div className="flex items-center gap-2 mb-3"><BookOpen className="h-4 w-4 text-primary" /><span className="text-xs font-semibold text-primary uppercase tracking-wider">Conteúdo</span></div>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{step.conteudo}</p>
              </div>
            ) : (
              <div className="bg-card/40 backdrop-blur-xl rounded-2xl p-8 border border-dashed border-border/50 text-center"><Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" /><p className="text-sm text-muted-foreground italic">Sem conteúdo cadastrado</p></div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="px-5 pb-10 pt-3">
          <div className="flex items-center justify-between">
            <button onClick={goPrev} disabled={currentStep === 0} className="flex items-center gap-1.5 text-sm font-semibold text-foreground disabled:text-muted-foreground/40 px-4 py-3 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/30 shadow-sm hover:shadow-md active:scale-95 transition-all disabled:shadow-none"><ChevronLeft className="h-4 w-4" /><span className="hidden sm:inline">Anterior</span></button>
            {!step.tempo && <div className="w-20" />}
            <button onClick={goNext} disabled={currentStep === steps.length - 1} className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-3 rounded-2xl shadow-sm hover:shadow-md active:scale-95 transition-all disabled:shadow-none ${currentStep < steps.length - 1 ? `bg-gradient-to-r ${gradientClass} text-white shadow-md` : "bg-card/80 backdrop-blur-sm border border-border/30 text-muted-foreground/40"}`}><span className="hidden sm:inline">Seguinte</span><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}
