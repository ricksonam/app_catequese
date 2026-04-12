import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Book, Shuffle, Trash2, Users, Save, X, Maximize, Minimize, Scroll, Cross, LayoutGrid, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTurmas, useCatequizandos, useCitacoes, useSaveHistoricoCitacao, useHistoricoCitacoes } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CitacaoBiblica, Catequizando } from "@/lib/store";

export default function CitacaoSorteio() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { data: turmas } = useTurmas();
  const { data: citacoesBase = [] } = useCitacoes();
  const saveHistorico = useSaveHistoricoCitacao();
  
  const [selectedTurma, setSelectedTurma] = useState<string>("");
  const { data: catequizandos = [] } = useCatequizandos(selectedTurma || undefined);
  
  const [modo, setModo] = useState<"individual" | "coletivo" | "geral">("coletivo");
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
    if ((modo === "individual" || modo === "geral") && !selectedTurma) {
      toast.error("Selecione uma turma para este modo de sorteio.");
      return;
    }
    setResultados({});
    setFilaAlunos(catequizandos.map(c => c.id));
    setCitacaoAtual(null);
    setMostrarResultado(false);
    toast.success("Sorteio preparado!");
  };

  const sortearGeral = async () => {
    setSorteando(true);
    setMostrarResultado(false);
    
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    let pool = [...citacoesBase];
    const evangelho = await getEvangelhoDia();
    if (evangelho) pool = [evangelho, ...pool];

    // Simular suspense longo
    setTimeout(() => {
      const novosResultados: Record<string, string> = {};
      catequizandos.forEach(c => {
        const rand = pool[Math.floor(Math.random() * pool.length)];
        novosResultados[c.id] = `${rand.referencia}: ${rand.texto}`;
      });
      setResultados(novosResultados);
      setSorteando(false);
      setMostrarResultado(true);
    }, 3000);
  };

  const sortear = async () => {
    if (modo === "geral") {
      sortearGeral();
      return;
    }

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

    let pool = [...citacoesBase];
    const evangelho = await getEvangelhoDia();
    if (evangelho) pool = [evangelho, ...pool];

    let count = 0;
    const interval = setInterval(() => {
      // No modo suspense solicitado, não mostramos o texto, apenas o pergaminho pulsando
      // Mas para manter o visual dinâmico, mostramos apenas o ícone ou uma interrogação
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
        tipo: modo === 'geral' ? 'individual' : modo,
        resultados
      });
      toast.success("Resultados salvos no histórico!");
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
      <div className={cn("space-y-4", isFullscreen && (sorteando || (mostrarResultado && modo !== 'geral')) ? "hidden" : "block")}>
        <div className="float-card p-5 space-y-4 border-t-4 border-t-amber-500/50">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2 lg:col-span-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Modo de Sorteio</label>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={modo === "coletivo" ? "default" : "outline"} 
                  className="flex-1 min-w-[140px] rounded-xl h-12 font-bold"
                  onClick={() => setModo("coletivo")}
                >
                  <Book className="h-4 w-4 mr-2" /> Coletivo
                </Button>
                <Button 
                  variant={modo === "individual" ? "default" : "outline"} 
                  className="flex-1 min-w-[140px] rounded-xl h-12 font-bold"
                  onClick={() => setModo("individual")}
                >
                  <Users className="h-4 w-4 mr-2" /> Um a Um
                </Button>
                <Button 
                  variant={modo === "geral" ? "default" : "outline"} 
                  className="flex-1 min-w-[140px] rounded-xl h-12 font-bold"
                  onClick={() => setModo("geral")}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" /> Turma Geral
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-900/60 ml-1">Selecione a Turma</label>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {turmas?.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTurma(t.id)}
                    className={cn(
                      "p-4 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center group relative overflow-hidden",
                      selectedTurma === t.id 
                        ? "border-amber-600 bg-amber-50 shadow-xl shadow-amber-900/10 ring-2 ring-amber-600/20" 
                        : "border-amber-900/10 hover:border-amber-500/30 bg-white"
                    )}
                  >
                    {selectedTurma === t.id && (
                      <div className="absolute -top-1 -right-1 bg-amber-600 text-white p-1 rounded-bl-xl shadow-md">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                      selectedTurma === t.id ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-800 group-hover:bg-amber-600 group-hover:text-white"
                    )}>
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <p className={cn("text-xs font-black leading-tight truncate px-1", selectedTurma === t.id ? "text-amber-900" : "text-amber-950")}>{t.nome}</p>
                      <p className="text-[9px] font-bold text-amber-900/40 uppercase tracking-widest">{t.ano}</p>
                    </div>
                  </button>
                ))}
              </div>
              {!turmas?.length && <p className="text-xs italic text-amber-900/30 text-center py-4">Nenhuma turma encontrada.</p>}
            </div>
          </div>

          {!mostrarResultado && !sorteando && (
            <Button onClick={iniciarSorteio} className="w-full h-14 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-lg gap-2 shadow-lg shadow-amber-900/20">
              <Scroll className="h-6 w-6" /> PREPARAR CATEQUESE
            </Button>
          )}
        </div>
      </div>

      {/* Draw Stage */}
      <div className={cn(
        "flex-1 flex flex-col items-center justify-center relative py-6",
        isFullscreen ? "min-h-[80vh]" : "min-h-[400px]"
      )}>
        
        {/* GERADO GERAL RESULT DISPLAY */}
        {modo === 'geral' && mostrarResultado ? (
          <div className="w-full max-w-6xl animate-reveal">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif font-black text-amber-900">Mural de Bênçãos da Turma</h2>
              <Button onClick={salvarNoHistorico} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl gap-2">
                <Save className="h-4 w-4" /> Salvar Histórico
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(resultados).map(([aid, txt]) => {
                const catequizando = catequizandos.find(c => c.id === aid);
                const [ref, ...body] = txt.split(": ");
                return (
                  <div key={aid} className="bg-[#fff9f0] border-2 border-amber-200/50 p-6 rounded-3xl shadow-sm space-y-3 relative overflow-hidden group hover:border-amber-400 transition-all">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                      <Cross className="h-8 w-8 text-amber-900" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-900 font-black text-xs">
                        {catequizando?.nome.substring(0, 1)}
                      </div>
                      <p className="font-bold text-amber-950">{catequizando?.nome}</p>
                    </div>
                    <p className="text-sm font-serif italic text-amber-900/80 leading-relaxed">"{body.join(": ")}"</p>
                    <p className="text-xs font-black text-amber-700 uppercase tracking-tighter">— {ref}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center mt-12">
               <Button variant="outline" onClick={() => setMostrarResultado(false)} className="rounded-full h-12 font-bold border-amber-200 text-amber-900">
                  Realizar Novo Sorteio
               </Button>
            </div>
          </div>
        ) : (
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
                    <div className="w-24 h-24 border-8 border-amber-900/20 border-t-amber-900 rounded-full animate-spin mx-auto shadow-inner" />
                    <p className="text-amber-900 font-serif italic text-xl animate-pulse">Sondando as Escrituras...</p>
                    <div className="flex justify-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-amber-900/20 animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 rounded-full bg-amber-900/20 animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 rounded-full bg-amber-900/20 animate-bounce" />
                    </div>
                  </div>
                ) : citacaoAtual && mostrarResultado ? (
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
                    <p className={cn(
                      "font-serif italic text-amber-950 leading-relaxed font-bold",
                      citacaoAtual.texto.length > 200 ? "text-xl md:text-2xl" : "text-2xl md:text-4xl"
                    )}>
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
                  <div className="space-y-4 opacity-30 group">
                    <Scroll className="h-24 w-24 text-amber-900 mx-auto group-hover:scale-110 transition-transform" />
                    <p className="font-serif italic text-amber-900 text-xl">"A Tua Palavra é lâmpada para os meus pés..."</p>
                  </div>
                )}
              </div>

              {/* Main Action Button */}
              {!sorteando && (mostrarResultado && modo === 'geral' ? null : (
                <div className="pt-8">
                  <button 
                    onClick={sortear}
                    disabled={modo === "individual" && filaAlunos.length === 0}
                    className={cn(
                      "w-32 h-32 rounded-full border-8 border-[#f0e4d0] bg-amber-800 text-white shadow-2xl flex flex-col items-center justify-center transition-all active:scale-90 hover:scale-105 mx-auto relative group",
                      filaAlunos.length === 0 && modo === "individual" ? "grayscale opacity-50 cursor-not-allowed" : "animate-pulse hover:animate-none"
                    )}
                  >
                    <Shuffle className="h-8 w-8 mb-1" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {modo === "individual" ? "Próximo" : modo === 'geral' ? "Sortear Geral" : "Sortear"}
                    </span>
                    <div className="absolute -inset-4 border-2 border-amber-800/20 rounded-full animate-ping opacity-30 group-hover:hidden" />
                  </button>
                  {modo === 'individual' && (
                    <p className="text-xs font-black text-amber-900/40 uppercase tracking-widest mt-6">
                      Catequizandos Restantes: {filaAlunos.length}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Save Button for Individual Mode (only if not Geral which has its own) */}
      {modo === "individual" && Object.keys(resultados).length > 0 && !sorteando && (
        <div className="flex justify-center pb-8">
          <Button onClick={salvarNoHistorico} className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-900/20 gap-2 scale-110">
            <Save className="h-5 w-5" /> CONCLUIR CATEQUIZANDOS
          </Button>
        </div>
      )}

      {/* Historico Dialog */}
      <Dialog open={showHistorico} onOpenChange={setShowHistorico}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl bg-[#fdf8f0]">
          <div className="bg-amber-900 p-6 text-white sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-serif font-black">Histórico de Mensagens</DialogTitle>
              <button onClick={() => setShowHistorico(false)} className="p-2 hover:bg-white/10 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {historico.length === 0 && <p className="text-center italic text-amber-900/40 py-8">Nenhum sorteio registrado.</p>}
            {historico.map((h) => (
              <div key={h.id} className="p-4 rounded-2xl bg-white/60 border border-amber-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-amber-900 uppercase">
                    {new Date(h.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} - {h.tipo === 'individual' ? 'Catequizandos' : 'Coletivo'}
                  </p>
                </div>
                <div className="space-y-2">
                  {Object.entries(h.resultados).map(([aid, txt]) => {
                    const catequizando = catequizandos.find(c => c.id === aid)?.nome || "Catequizando";
                    return (
                      <div key={aid} className="text-sm border-l-2 border-amber-500 pl-3 py-1 bg-amber-50/30 rounded-r-lg">
                        <span className="font-bold text-amber-950">{catequizando}:</span> {txt}
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
