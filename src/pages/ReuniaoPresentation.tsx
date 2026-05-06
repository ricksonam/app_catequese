import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useReunioes, useEncontros, useAtividades } from "@/hooks/useSupabaseData";
import { X as XIcon, ChevronLeft, ChevronRight, Play, Pause, RotateCcw, BookOpen, Users, Sparkles, MessageSquare } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";

const STEP_COLORS = {
  oracao: "from-purple-600 to-indigo-600",
  pauta: "from-blue-600 to-cyan-600",
  final: "from-emerald-600 to-teal-600"
};

export default function ReuniaoPresentation() {
  const { id, reuniaoId } = useParams();
  const navigate = useNavigate();
  const { data: turmas = [], isLoading: tLoading } = useTurmas();
  const { data: reunioes = [], isLoading: rLoading } = useReunioes(id);
  const { data: encontros = [] } = useEncontros(id);
  const { data: atividades = [] } = useAtividades(id);
  const turma = turmas.find((t) => t.id === id);
  const reuniao = reunioes.find((r) => r.id === reuniaoId);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");
  const [animKey, setAnimKey] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Garantir que a apresentação comece no início quando o ID mudar
  useEffect(() => {
    setCurrentStep(0);
  }, [reuniaoId]);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [initialTime, setInitialTime] = useState(0);

  // Construir os passos da apresentação
  const steps = [];
  if (reuniao?.oracaoInicial) {
    steps.push({ 
      tipo: "oracao", 
      label: reuniao.oracaoTipo ? `Oração: ${reuniao.oracaoTipo}` : "Oração Inicial", 
      conteudo: reuniao.oracaoInicial, 
      icone: "🙏" 
    });
  }
  
  if (reuniao?.pautas && reuniao.pautas.length > 0) {
    reuniao.pautas.forEach((p, i) => {
      steps.push({ tipo: "pauta", label: p.titulo || `Pauta ${i+1}`, conteudo: p.descricao, tempo: p.tempo, icone: "📋" });
    });
  } else if (reuniao?.servicosLiturgia && Object.values(reuniao.servicosLiturgia).some(v => v)) {
    const labels: Record<string, string> = {
      'celebrante': 'Celebrante (Presidente)',
      'animador': 'Animador / Comentarista',
      '1_leitor': '1º Leitor',
      'salmista': 'Salmista',
      '2_leitor': '2º Leitor',
      'preces': 'Preces',
      'cantores': 'Cantores'
    };
    const content = Object.entries(reuniao.servicosLiturgia)
      .filter(([_, name]) => name)
      .map(([key, name]) => `**${labels[key] || key}:** ${name}`)
      .join('\n\n');
    steps.push({ tipo: "pauta", label: "Equipe de Liturgia", conteudo: content, icone: "⛪" });
  } else if (reuniao?.descricao) {
    steps.push({ tipo: "pauta", label: "Pautas / Descrição", conteudo: reuniao.descricao, icone: "📋" });
  }

  // Adicionar detalhes de preparação se houver
  if (reuniao?.encontrosPreparados && reuniao.encontrosPreparados.length > 0) {
    const titles = reuniao.encontrosPreparados.map(eid => encontros.find(e => e.id === eid)?.titulo).filter(Boolean);
    if (titles.length > 0) {
      steps.push({ tipo: "pauta", label: "Encontros a Preparar", conteudo: titles.join(', '), icone: "📝" });
    }
  }

  if (reuniao?.eventosPreparados && reuniao.eventosPreparados.length > 0) {
    const titles = reuniao.eventosPreparados.map(aid => atividades.find(a => a.id === aid)?.titulo).filter(Boolean);
    if (titles.length > 0) {
      steps.push({ tipo: "pauta", label: "Eventos a Preparar", conteudo: titles.join(', '), icone: "🎉" });
    }
  }

  steps.push({ tipo: "final", label: "Encerramento", conteudo: reuniao?.observacao || "Reunião finalizada. Obrigado pela presença!", icone: "✨" });

  const step = (steps[currentStep] as any);

  // Timer logic
  useEffect(() => {
    if (step?.tempo && step.tempo > 0) {
      const seconds = step.tempo * 60;
      setTimeLeft(seconds);
      setInitialTime(seconds);
      setIsActive(false);
    } else {
      setTimeLeft(0);
      setIsActive(false);
    }
  }, [currentStep, steps.length]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timerProgress = initialTime > 0 ? (timeLeft / initialTime) * 100 : 0;

  // Fullscreen API
  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    return () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); };
  }, []);

  const goNext = useCallback(() => { 
    if (currentStep < steps.length - 1) { 
      setSlideDirection("right"); 
      setAnimKey((k) => k + 1); 
      setCurrentStep((p) => p + 1); 
    } 
  }, [currentStep, steps.length]);

  const goPrev = useCallback(() => { 
    if (currentStep > 0) { 
      setSlideDirection("left"); 
      setAnimKey((k) => k + 1); 
      setCurrentStep((p) => p - 1); 
    } 
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

  if (rLoading || tLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black uppercase tracking-widest text-muted-foreground text-xs animate-pulse">Iniciando apresentação...</p>
      </div>
    );
  }

  if (!reuniao || !step) return <div className="fixed inset-0 z-50 bg-background flex items-center justify-center"><p className="text-muted-foreground">Reunião não encontrada</p></div>;

  const progress = ((currentStep + 1) / steps.length) * 100;
  const gradientClass = STEP_COLORS[step.tipo as keyof typeof STEP_COLORS] || STEP_COLORS.pauta;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {/* Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-[0.07] transition-all duration-700`} />
      <div className="absolute inset-0 bg-background/95" />
      
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
               <div className="w-10 h-10 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center p-1">
                 <MessageSquare className="h-5 w-5 text-primary" />
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase text-primary tracking-widest leading-none">Apresentação de Reunião</p>
                 <h1 className="text-lg font-black text-foreground leading-tight">{reuniao.nome}</h1>
               </div>
            </div>
            <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center transition-all active:scale-90 shrink-0"><XIcon className="h-4 w-4 text-muted-foreground" /></button>
          </div>
          <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden"><div className={`h-full bg-gradient-to-r ${gradientClass} rounded-full transition-all duration-700 ease-out`} style={{ width: `${progress}%` }} /></div>
          <div className="flex items-center justify-between mt-1.5 px-0.5">
            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Passo {currentStep + 1} de {steps.length}</span>
            <span className="text-[10px] text-primary font-black uppercase tracking-widest">{reuniao.tipo}</span>
          </div>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1 px-5 mb-4">{steps.map((s, i) => <button key={i} onClick={() => { setSlideDirection(i > currentStep ? "right" : "left"); setAnimKey((k) => k + 1); setCurrentStep(i); }} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? `bg-gradient-to-r ${gradientClass} w-8` : i < currentStep ? "bg-primary/30 w-1.5" : "bg-border w-1.5"}`} />)}</div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 overflow-y-auto">
          <div key={animKey} className="w-full max-w-2xl" style={{ animation: `${slideDirection === "right" ? "slideInRight" : "slideInLeft"} 0.4s cubic-bezier(0.16, 1, 0.3, 1)` }}>
            <div className="flex flex-col items-center mb-8">
              <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${gradientClass} flex items-center justify-center mb-4 shadow-xl border-4 border-white dark:border-zinc-900`}><span className="text-3xl">{step.icone}</span></div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground text-center tracking-tight uppercase">{step.label}</h2>
            </div>

            {step.conteudo ? (
              <div className="bg-card/80 backdrop-blur-xl rounded-[2rem] p-8 sm:p-10 shadow-2xl border border-border/50 relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${gradientClass} opacity-50`} />
                
                {step.tempo > 0 && (
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted/10" />
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-primary transition-all duration-1000" strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * timerProgress) / 100} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-foreground">{formatTime(timeLeft)}</span>
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">restantes</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <button onClick={() => setIsActive(!isActive)} className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all active:scale-90 shadow-sm">{isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}</button>
                      <button onClick={() => { setTimeLeft(initialTime); setIsActive(false); }} className="w-10 h-10 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center hover:bg-muted transition-all active:scale-90 shadow-sm"><RotateCcw className="h-4 w-4" /></button>
                    </div>
                  </div>
                )}

                <p className="text-lg sm:text-xl text-foreground/90 leading-relaxed font-medium whitespace-pre-wrap text-center">
                  {step.conteudo}
                </p>
              </div>
            ) : (
              <div className="bg-card/40 backdrop-blur-xl rounded-[2rem] p-12 border border-dashed border-border/50 text-center">
                <Sparkles className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-lg text-muted-foreground italic">Sem detalhes adicionais</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="px-6 pb-12 pt-4">
          <div className="flex items-center justify-between gap-4">
            <button onClick={goPrev} disabled={currentStep === 0} className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-card border border-border/50 text-foreground font-black uppercase tracking-widest text-xs disabled:opacity-30 transition-all active:scale-95 shadow-sm"><ChevronLeft className="h-4 w-4" /> Anterior</button>
            <button onClick={goNext} disabled={currentStep === steps.length - 1} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r ${gradientClass} text-white font-black uppercase tracking-widest text-xs disabled:opacity-30 transition-all active:scale-95 shadow-lg shadow-primary/20`}>Seguinte <ChevronRight className="h-4 w-4" /></button>
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
