import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Book, Shuffle, Trash2, Users, Save, X, Maximize, Minimize, Scroll, Cross } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTurmas, useCatequizandos, useCitacoes, useSaveHistoricoCitacao, useHistoricoCitacoes } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CitacaoBiblica } from "@/lib/store";

export default function CitacaoSorteio() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { data: turmas } = useTurmas();
  const { data: citacoesBase = [] } = useCitacoes();
  const saveHistorico = useSaveHistoricoCitacao();
  
  const [selectedTurma, setSelectedTurma] = useState<string>("");
  const { data: catequizandos = [] } = useCatequizandos(selectedTurma || undefined);
  
  const [modo, setModo] = useState<"individual" | "coletivo">("coletivo");
  const [sorteando, setSorteando] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [citacaoAtual, setCitacaoAtual] = useState<CitacaoBiblica | null>(null);
  const [catequizandoAtual, setCatequizandoAtual] = useState<string | null>(null);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  
  const [resultados, setResultados] = useState<Record<string, string>>({});
  const [filaAlunos, setFilaAlunos] = useState<string[]>([]);
  const [showHistorico, setShowHistorico] = useState(false);
  const { data: historico = [] } = useHistoricoCitacoes(selectedTurma || undefined);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    
    const audio = new Audio("https://www.orangefreesounds.com/wp-content/uploads/2019/05/Drum-roll-suspense-award.mp3");
    audioRef.current = audio;

    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  const getEvangelhoDia = async () => {
    try {
      const res = await fetch("https://api-liturgia-diaria.vercel.app/");
      const data = await res.json();
      if (data.evangelho) {
        return {
          id: "evangelho-dia",
          referencia: data.evangelho.referencia,
          texto: data.evangelho.texto,
          categoria: "Evangelho do Dia"
        } as CitacaoBiblica;
      }
    } catch (e) {
      console.error("Erro ao buscar evangelho", e);
    }
    return null;
  };

  const iniciarSorteio = () => {
    if (modo === "individual" && !selectedTurma) {
      toast.error("Selecione uma turma para o sorteio individual.");
      return;
    }
    setResultados({});
    setFilaAlunos(catequizandos.map(c => c.id));
    setCitacaoAtual(null);
    setMostrarResultado(false);
    toast.success("Sorteio iniciado!");
  };

  const sortear = async () => {
    if (modo === "individual" && filaAlunos.length === 0) {
      toast.info("Todos os catequizandos já receberam sua citação!");
      return;
    }

    setSorteando(true);
    setMostrarResultado(false);
    
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    // Tentar buscar evangelho do dia se for sorteio coletivo ocasionalmente ou como opção
    let pool = [...citacoesBase];
    const evangelho = await getEvangelhoDia();
    if (evangelho) pool = [evangelho, ...pool];

    let count = 0;
    const interval = setInterval(() => {
      const rand = pool[Math.floor(Math.random() * pool.length)];
      setCitacaoAtual(rand);
      count++;
      
      if (count > 40) {
        clearInterval(interval);
        const finalCitacao = pool[Math.floor(Math.random() * pool.length)];
        
        setTimeout(() => {
          setCitacaoAtual(finalCitacao);
          if (modo === "individual") {
            const alunoId = filaAlunos[0];
            const alunoNome = catequizandos.find(c => c.id === alunoId)?.nome || "Catequizando";
            setCatequizandoAtual(alunoNome);
            setResultados(prev => ({ ...prev, [alunoId]: `${finalCitacao.referencia}: ${finalCitacao.texto}` }));
            setFilaAlunos(prev => prev.slice(1));
          }
          setSorteando(false);
          setMostrarResultado(true);
        }, 500);
      }
    }, 80);
  };

  const salvarNoHistorico = async () => {
    if (Object.keys(resultados).length === 0) return;
    try {
      await saveHistorico.mutateAsync({
        turmaId: selectedTurma || undefined,
        data: new Date().toISOString(),
        tipo: modo,
        resultados
      });
      toast.success("Resultados salvos!");
    } catch (e) {
      toast.error("Erro ao salvar histórico");
    }
  };

  return (
    <div ref={containerRef} className={cn(
      "min-h-full flex flex-col transition-all duration-500",
      isFullscreen ? "bg-[#fdf8f0] p-6 lg:p-12" : "space-y-5"
    )}>
      {/* Header */}
      <div className={cn("flex items-center gap-3", isFullscreen ? "hidden" : "flex")}>
        <button onClick={() => navigate("/jogos")} className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Sorteio de Citação Bíblica</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Palavra de Vida</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={toggleFullscreen} className="rounded-xl">
            <Maximize className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowHistorico(true)} className="rounded-xl font-bold">
            Histórico
          </Button>
        </div>
      </div>

      {isFullscreen && (
        <div className="absolute top-6 right-6 z-50">
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="bg-white/50 backdrop-blur-sm rounded-full">
            <Minimize className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Config Panel */}
      <div className={cn("space-y-4", isFullscreen && (sorteando || mostrarResultado) ? "hidden" : "block")}>
        <div className="float-card p-5 space-y-4 border-t-4 border-t-amber-500/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Modo de Sorteio</label>
              <div className="flex gap-2">
                <Button 
                  variant={modo === "coletivo" ? "default" : "outline"} 
                  className="flex-1 rounded-xl h-12 font-bold"
                  onClick={() => setModo("coletivo")}
                >
                  <Book className="h-4 w-4 mr-2" /> Coletivo
                </Button>
                <Button 
                  variant={modo === "individual" ? "default" : "outline"} 
                  className="flex-1 rounded-xl h-12 font-bold"
                  onClick={() => setModo("individual")}
                >
                  <Users className="h-4 w-4 mr-2" /> Por Aluno
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Turma (Opcional)</label>
              <Select value={selectedTurma} onValueChange={setSelectedTurma}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmas?.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!mostrarResultado && !sorteando && (
            <Button onClick={iniciarSorteio} className="w-full h-14 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-lg gap-2 shadow-lg shadow-amber-900/20">
              <Scroll className="h-6 w-6" /> PREPARAR PERGAMINHOS
            </Button>
          )}
        </div>
      </div>

      {/* Draw Stage */}
      <div className={cn(
        "flex-1 flex flex-col items-center justify-center relative",
        isFullscreen ? "min-h-[80vh]" : "min-h-[400px]"
      )}>
        <div className={cn(
          "relative w-full max-w-4xl transition-all duration-700",
          sorteando ? "scale-105" : "scale-100"
        )}>
          {/* Parchment UI */}
          <div className={cn(
            "bg-[#fff9f0] border-[6px] border-[#e6d0a8] shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[40px] p-8 md:p-16 text-center space-y-8 relative overflow-hidden",
            isFullscreen ? "py-24" : ""
          )}>
            {/* Design Elements */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-20">
              <Cross className="h-12 w-12 text-amber-900" />
            </div>
            
            <div className="min-h-[220px] flex flex-col items-center justify-center space-y-6">
              {sorteando ? (
                <div className="space-y-4">
                  <div className="w-24 h-24 border-8 border-amber-900/20 border-t-amber-900 rounded-full animate-spin mx-auto" />
                  <p className="text-amber-900/40 font-black uppercase tracking-[0.6em] text-sm animate-pulse">Sondando as Escrituras...</p>
                </div>
              ) : citacaoAtual ? (
                <div className={cn(
                  "space-y-6 transition-all duration-1000",
                  mostrarResultado ? "animate-in fade-in zoom-in-95" : "opacity-0"
                )}>
                  {modo === "individual" && catequizandoAtual && (
                    <div className="inline-block px-6 py-2 bg-amber-900 text-white rounded-full text-xs font-black uppercase tracking-[0.3em] mb-4">
                      Para: {catequizandoAtual}
                    </div>
                  )}
                  <div className="h-px w-32 bg-amber-900/20 mx-auto" />
                  <p className="text-2xl md:text-4xl font-serif italic text-amber-950 leading-relaxed font-bold">
                    "{citacaoAtual.texto}"
                  </p>
                  <p className="text-lg md:text-xl font-black text-amber-800 uppercase tracking-widest">
                    — {citacaoAtual.referencia}
                  </p>
                  {citacaoAtual.categoria === "Evangelho do Dia" && (
                    <span className="text-[10px] font-black text-emerald-700 uppercase bg-emerald-100 px-3 py-1 rounded-full">LITURGIA DE HOJE</span>
                  )}
                  <div className="h-px w-32 bg-amber-900/20 mx-auto" />
                </div>
              ) : (
                <div className="space-y-4 opacity-30">
                  <Scroll className="h-20 w-20 text-amber-900 mx-auto" />
                  <p className="font-serif italic text-amber-900 text-xl">"A Tua Palavra é lâmpada para os meus pés..."</p>
                </div>
              )}
            </div>

            {/* Main Action Button */}
            {!sorteando && (
              <div className="pt-8">
                <button 
                  onClick={sortear}
                  disabled={modo === "individual" && filaAlunos.length === 0}
                  className={cn(
                    "w-32 h-32 rounded-full border-8 border-[#f0e4d0] bg-amber-800 text-white shadow-2xl flex flex-col items-center justify-center transition-all active:scale-90 hover:scale-105 mx-auto relative group",
                    filaAlunos.length === 0 && modo === "individual" ? "grayscale opacity-50" : "animate-pulse hover:animate-none"
                  )}
                >
                  <Shuffle className="h-8 w-8 mb-1" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{modo === "individual" ? "Próximo" : "Sortear"}</span>
                  <div className="absolute -inset-4 border-2 border-amber-800/20 rounded-full animate-ping opacity-30 group-hover:hidden" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Indicators */}
        {modo === "individual" && filaAlunos.length > 0 && (
          <div className="mt-8 flex gap-4 overflow-x-auto max-w-full p-4">
            {filaAlunos.map(id => (
              <div key={id} className="shrink-0 w-2 h-2 rounded-full bg-amber-900/20" />
            ))}
          </div>
        )}
      </div>

      {/* Save Button for Individual Mode */}
      {modo === "individual" && Object.keys(resultados).length > 0 && !sorteando && (
        <div className="flex justify-center pb-8">
          <Button onClick={salvarNoHistorico} className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-900/20 gap-2 scale-110">
            <Save className="h-5 w-5" /> SALVAR RESULTADOS DA TURMA
          </Button>
        </div>
      )}

      {/* Historico Dialog */}
      <Dialog open={showHistorico} onOpenChange={setShowHistorico}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl bg-[#fdf8f0]">
          <div className="bg-amber-900 p-6 text-white">
            <DialogTitle className="text-xl font-serif font-black">Histórico de Mensagens</DialogTitle>
          </div>
          <div className="p-6 space-y-4">
            {historico.length === 0 && <p className="text-center italic text-amber-900/40 py-8">Nenhum sorteio registrado.</p>}
            {historico.map((h) => (
              <div key={h.id} className="p-4 rounded-2xl bg-white/60 border border-amber-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-amber-900 uppercase">{new Date(h.data).toLocaleDateString()} - {h.tipo === 'individual' ? 'Por Aluno' : 'Coletivo'}</p>
                </div>
                <div className="space-y-2">
                  {Object.entries(h.resultados).map(([aid, txt]) => {
                    const aluno = catequizandos.find(c => c.id === aid)?.nome || "Catequizando";
                    return (
                      <div key={aid} className="text-sm border-l-2 border-amber-500 pl-3 py-1">
                        <span className="font-bold text-amber-950">{aluno}:</span> {txt}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
