import { useParams, useNavigate } from "react-router-dom";
import { getEncontros, getTurmas } from "@/lib/store";
import { X, ChevronLeft, ChevronRight, Play, Pause, RotateCcw } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";

export default function EncontroPresentation() {
  const { id, encontroId } = useParams();
  const navigate = useNavigate();
  const turma = getTurmas().find((t) => t.id === id);
  const encontro = getEncontros(id).find((e) => e.id === encontroId);
  const [currentStep, setCurrentStep] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const steps = encontro?.roteiro || [];
  const step = steps[currentStep];

  useEffect(() => {
    setTimerRunning(false);
    setTimeLeft((steps[currentStep]?.tempo || 0) * 60);
  }, [currentStep, steps]);

  useEffect(() => {
    if (!timerRunning || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { setTimerRunning(false); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const goNext = useCallback(() => {
    if (currentStep < steps.length - 1) setCurrentStep((p) => p + 1);
  }, [currentStep, steps.length]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) setCurrentStep((p) => p - 1);
  }, [currentStep]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") navigate(-1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, navigate]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.touches[0].clientX; };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) { diff > 0 ? goNext() : goPrev(); }
  };

  if (!encontro || !step) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Encontro não encontrado</p>
      </div>
    );
  }

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleTimerClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (timeLeft === 0) { setTimeLeft(step.tempo * 60); setTimerRunning(true); }
    else { setTimerRunning(!timerRunning); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {/* Top */}
      <div className="glass-card rounded-none border-x-0 border-t-0 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-foreground truncate">{step.label}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground truncate">{encontro.tema}</p>
              {step.catequista && <span className="text-xs text-primary font-semibold">• {step.catequista}</span>}
            </div>
          </div>
          <button onClick={() => navigate(-1)} className="back-btn ml-2">
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="h-1 bg-muted">
        <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      {/* Center */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 overflow-y-auto">
        <span className="text-xs font-bold text-primary uppercase tracking-widest mb-4">
          {currentStep + 1} / {steps.length}
        </span>
        {step.oracaoTipo && (
          <span className="pill-btn bg-liturgical/10 text-liturgical mb-4">{step.oracaoTipo}</span>
        )}
        {step.conteudo ? (
          <div className="float-card p-6 max-w-lg w-full animate-scale-in">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{step.conteudo}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Sem conteúdo cadastrado</p>
        )}
      </div>

      {/* Bottom */}
      <div className="glass-card rounded-none border-x-0 border-b-0 px-4 py-3">
        <div className="flex justify-center gap-1.5 mb-3">
          {steps.map((_, i) => (
            <button key={i} onClick={() => setCurrentStep(i)} className={`w-2 h-2 rounded-full transition-all ${i === currentStep ? "bg-primary w-6" : "bg-border"}`} />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button onClick={goPrev} disabled={currentStep === 0} className="flex items-center gap-1 text-sm font-semibold text-foreground disabled:text-muted-foreground disabled:opacity-50 px-3 py-2 rounded-xl hover:bg-muted active:scale-95 transition-all">
            <ChevronLeft className="h-4 w-4" /> Anterior
          </button>

          {step.tempo > 0 && (
            <button
              onClick={handleTimerClick}
              onTouchEnd={(e) => { e.stopPropagation(); handleTimerClick(e); }}
              className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2 transition-all active:scale-95 ${
                timerRunning ? "border-primary bg-primary/10 shadow-md shadow-primary/20"
                : timeLeft === 0 ? "border-destructive bg-destructive/10"
                : "border-border bg-muted/50"
              }`}
            >
              <span className={`text-sm font-bold ${timeLeft === 0 ? "text-destructive" : "text-foreground"}`}>
                {formatTime(timeLeft)}
              </span>
              <span className="text-[8px] text-muted-foreground">
                {timerRunning ? <Pause className="h-2.5 w-2.5" /> : timeLeft === 0 ? <RotateCcw className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5" />}
              </span>
            </button>
          )}

          <button onClick={goNext} disabled={currentStep === steps.length - 1} className="flex items-center gap-1 text-sm font-semibold text-foreground disabled:text-muted-foreground disabled:opacity-50 px-3 py-2 rounded-xl hover:bg-muted active:scale-95 transition-all">
            Seguinte <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
