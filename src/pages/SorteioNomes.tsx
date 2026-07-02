import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Shuffle, Trash2, Plus, Users, Save, X as XIcon, Maximize, Minimize } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useTurmas, useCatequizandos } from "@/hooks/useSupabaseData";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { GameHeader } from "@/components/GameHeader";

interface Sorteio {
  id: string;
  titulo: string;
  nomes: string[];
  resultado: string[];
  criado_em: string;
}

export default function SorteioNomes() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { data: turmas } = useTurmas();
  const [selectedTurma, setSelectedTurma] = useState<string>("");
  const { data: catequizandos } = useCatequizandos(selectedTurma || undefined);

  const [titulo, setTitulo] = useState("");
  const [nomes, setNomes] = useState<string[]>([]);
  const [novoNome, setNovoNome] = useState("");
  const [resultado, setResultado] = useState<string[]>([]);
  const [disponiveis, setDisponiveis] = useState<string[]>([]);
  const [sorteando, setSorteando] = useState(false);
  const [sorteioAtual, setSorteioAtual] = useState<string | null>(null);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [historico, setHistorico] = useState<Sorteio[]>([]);
  const [showHistorico, setShowHistorico] = useState(false);

  // Auto-importar nomes quando turma é selecionada
  useEffect(() => {
    if (selectedTurma && catequizandos && catequizandos.length > 0) {
      const novosNomes = catequizandos.map((c) => c.nome);
      setNomes(novosNomes);
      setResultado([]);
      setDisponiveis([]);
      setSorteioAtual(null);
      setMostrarResultado(false);
    } else if (!selectedTurma) {
      setNomes([]);
    }
  }, [selectedTurma, catequizandos]);

  useEffect(() => {
    loadHistorico();
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    
    // Setup Audio
    const audio = new Audio("https://www.orangefreesounds.com/wp-content/uploads/2019/05/Drum-roll-suspense-award.mp3");
    audio.loop = false;
    audioRef.current = audio;

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        toast({ title: "Erro na Tela Cheia", description: err.message, variant: "destructive" });
      });
    } else {
      document.exitFullscreen();
    }
  };

  const loadHistorico = async () => {
    const { data } = await supabase
      .from("sorteios")
      .select("*")
      .order("criado_em", { ascending: false });
    if (data) {
      setHistorico(data.map((s: any) => ({
        id: s.id,
        titulo: s.titulo,
        nomes: s.nomes as string[],
        resultado: s.resultado as string[],
        criado_em: s.criado_em,
      })));
    }
  };

  const formatNome = (fullNome: string) => {
    if (!fullNome) return "";
    const parts = fullNome.split(" ").slice(0, 2);
    return parts.join(" ");
  };

  const adicionarNome = () => {
    const nome = novoNome.trim();
    if (nome && !nomes.includes(nome)) {
      setNomes([...nomes, nome]);
      setNovoNome("");
    }
  };

  const importarCatequizandos = () => {
    if (!catequizandos?.length) {
      toast({ title: "Nenhum catequizando", description: "Selecione uma turma com catequizandos cadastrados." });
      return;
    }
    const novos = catequizandos.map((c) => c.nome).filter((n) => !nomes.includes(n));
    setNomes([...nomes, ...novos]);
    toast({ title: "Importados!", description: `${novos.length} nomes adicionados.` });
  };

  const removerNome = (nome: string) => {
    setNomes(nomes.filter((n) => n !== nome));
  };

  const iniciarSorteio = () => {
    if (nomes.length === 0) {
      toast({ title: "Sem nomes", description: "Adicione nomes para sortear." });
      return;
    }
    setResultado([]);
    setDisponiveis([...nomes]);
    setSorteioAtual(null);
    setMostrarResultado(false);
  };

  const sortearProximo = () => {
    if (disponiveis.length === 0) {
      toast({ title: "Fim!", description: "Todos os nomes já foram sorteados." });
      return;
    }

    if (!document.fullscreenElement && window.innerWidth < 1024) {
      containerRef.current?.requestFullscreen().catch(() => {});
    }

    setSorteando(true);
    setMostrarResultado(false);

    // Play Sound
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    
    let count = 0;
    const interval = setInterval(() => {
      const rand = disponiveis[Math.floor(Math.random() * disponiveis.length)];
      setSorteioAtual(formatNome(rand));
      count++;
      
      if (count > 35) { // Increased for more suspense
        clearInterval(interval);
        const idx = Math.floor(Math.random() * disponiveis.length);
        const sorteado = disponiveis[idx];
        
        setTimeout(() => {
          setSorteioAtual(formatNome(sorteado));
          setResultado((prev) => [...prev, sorteado]);
          setDisponiveis((prev) => prev.filter((_, i) => i !== idx));
          setSorteando(false);
          setMostrarResultado(true);
        }, 500);
      }
    }, 80);
  };

  const salvarSorteio = async () => {
    if (resultado.length === 0) return;
    const { error } = await supabase.from("sorteios").insert({
      titulo: titulo || "Sorteio sem título",
      nomes: nomes as any,
      resultado: resultado as any,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Salvo!", description: "Sorteio gravado com sucesso." });
      loadHistorico();
    }
  };

  const excluirSorteio = async (id: string) => {
    await supabase.from("sorteios").delete().eq("id", id);
    loadHistorico();
    toast({ title: "Excluído" });
  };

  const carregarSorteio = (s: Sorteio) => {
    setTitulo(s.titulo);
    setNomes(s.nomes);
    setResultado(s.resultado);
    setDisponiveis([]);
    setShowHistorico(false);
  };

  const started = resultado.length > 0 || disponiveis.length > 0;

  return (
    <div ref={containerRef} className={cn("flex flex-col min-h-full transition-all duration-500", isFullscreen ? "bg-background overflow-y-auto h-screen" : "")}>
      <GameHeader 
        title="Sorteio de Nomes" 
        subtitle="Aleatório & Justo" 
        isFullscreen={isFullscreen} 
        onToggleFullscreen={toggleFullscreen} 
        showHistoryBtn={true} 
        onShowHistory={() => { setShowHistorico(true); loadHistorico(); }} 
      />

      {/* Config Sections */}
      <div className={cn("space-y-5 p-4 sm:p-6 pb-24 flex-1 max-w-3xl mx-auto w-full", isFullscreen && started ? "hidden" : "block")}>
        <div className="float-card p-4 space-y-4 animate-float-up">
          <div className="space-y-2">
            <Label>Título do Sorteio</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Sorteio da leitura" />
          </div>

          <div className="space-y-4">
            {/* Card premium de seleção de turma */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-300 via-orange-200 to-rose-300 p-0.5 shadow-xl shadow-rose-400/30">
              <div className="bg-gradient-to-br from-orange-50 to-rose-50 rounded-[22px] p-5 space-y-4">
                {/* Header do card */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center shadow-lg shadow-rose-500/40">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-rose-950 uppercase tracking-[0.2em]">Selecionar Turma</label>
                    <p className="text-[10px] text-rose-700/80 font-medium mt-0.5">Os nomes são carregados automaticamente</p>
                  </div>
                </div>

                {/* Grid de turmas */}
                <div className={cn(
                  "gap-2.5",
                  turmas && turmas.length === 1 ? "flex justify-center" : "grid grid-cols-2"
                )}>
                  {turmas?.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTurma(selectedTurma === t.id ? "" : t.id)}
                      className={cn(
                        "relative p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center group overflow-hidden",
                        selectedTurma === t.id
                          ? "border-rose-400 bg-rose-400/20 shadow-md shadow-rose-400/20"
                          : "border-rose-950/10 hover:border-rose-400/40 bg-rose-950/5 hover:bg-rose-950/10"
                      )}
                    >
                      {selectedTurma === t.id && (
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-400/10 to-orange-400/5 rounded-2xl" />
                      )}
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm relative z-10",
                        selectedTurma === t.id
                          ? "bg-gradient-to-br from-rose-400 to-orange-400 text-white shadow-rose-500/40"
                          : "bg-white/10 text-rose-700/80 group-hover:bg-violet-500/30 group-hover:text-rose-900"
                      )}>
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5 relative z-10">
                        <p className={cn(
                          "text-[11px] font-black leading-tight truncate px-1 max-w-[90px]",
                          selectedTurma === t.id ? "text-rose-900" : "text-rose-950/80"
                        )}>{t.nome}</p>
                        {t.ano && (
                          <p className="text-[9px] font-bold text-rose-950/50 uppercase tracking-tighter">{t.ano}</p>
                        )}
                      </div>
                      {selectedTurma === t.id && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-rose-400 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Status de nomes carregados */}
                {selectedTurma && nomes.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/30">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-black text-emerald-300 uppercase tracking-wider">
                      {nomes.length} nomes carregados ✓
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-card p-4 rounded-3xl border border-border shadow-sm space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Participante Manual</Label>
            <div className="flex gap-2">
              <Input
                value={novoNome}
                onChange={e => setNovoNome(e.target.value)}
                placeholder="Digite o nome..."
                onKeyDown={e => e.key === "Enter" && adicionarNome()}
                className="flex-1 h-12 rounded-xl border-2 font-medium bg-muted/30 focus-visible:bg-background"
              />
              <Button onClick={adicionarNome} size="icon" className="h-12 w-12 rounded-xl shrink-0 bg-rose-500 hover:bg-rose-600">
                <Plus className="h-5 w-5 text-white" />
              </Button>
            </div>
          </div>

          {nomes.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-zinc-900">{nomes.length} nome(s) na lista</Label>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2">
                {nomes.map((nome) => (
                  <div key={nome} className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/50 border border-muted hover:border-primary/20 transition-all">
                    <span className="text-sm font-medium text-foreground">{nome}</span>
                    <button onClick={() => removerNome(nome)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Suspense Era */}
      <div className={cn(
        "flex-1 flex flex-col items-center justify-center transition-all duration-700 relative",
        isFullscreen ? "min-h-[70vh]" : "min-h-[300px]",
        sorteando ? "overflow-hidden" : ""
      )}>
        <div className={cn(
          "float-card w-full max-w-xl p-10 text-center relative overflow-hidden transition-all duration-500",
          sorteando ? "border-primary shadow-[0_0_50px_-12px_rgba(var(--primary-rgb),0.5)] scale-105" : "scale-100",
          isFullscreen ? "bg-background/80 backdrop-blur-xl border-2 border-primary/20 p-20" : "p-10"
        )}>
          {sorteando && (
            <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
               <div className="absolute inset-0 animate-ping repeat-infinite bg-primary/20 rounded-full scale-150" />
            </div>
          )}

          <div className="relative z-10 space-y-16">
            <div className="min-h-[160px] flex items-center justify-center">
              {sorteando ? (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <p className="text-9xl font-black text-primary animate-bounce">?</p>
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.5em] animate-pulse">O mistério acontece...</p>
                </div>
              ) : sorteioAtual ? (
                <div className={cn(
                  "flex flex-col items-center justify-center space-y-4 transition-all duration-700",
                  mostrarResultado ? "scale-125 md:scale-[2] animate-in zoom-in-50 duration-500" : "scale-100"
                )}>
                  {mostrarResultado && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-px w-12 bg-primary/30" />
                      <span className="text-[12px] font-black text-primary uppercase tracking-[0.4em]">Parabéns!</span>
                      <div className="h-px w-12 bg-primary/30" />
                    </div>
                  )}
                  <p className="text-4xl md:text-7xl font-black text-foreground drop-shadow-2xl px-2 w-full text-center break-words overflow-wrap-anywhere">
                    {sorteioAtual}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground space-y-4">
                  <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center animate-pulse">
                    <Shuffle className="h-10 w-10 opacity-20" />
                  </div>
                  <p className="text-sm font-bold italic opacity-40 uppercase tracking-widest">Aguardando o toque...</p>
                </div>
              )}
            </div>

            <div className="relative pt-12">
              {!started ? (
                <Button onClick={iniciarSorteio} className="w-full h-16 rounded-3xl text-lg font-black gap-3 shadow-xl shadow-primary/30 active:scale-[0.98] transition-all bg-primary hover:bg-primary/90" disabled={nomes.length === 0}>
                  <Shuffle className="h-6 w-6" /> INICIAR JOGO
                </Button>
              ) : (
                <div className="flex flex-col items-center gap-8">
                  <button 
                    onClick={sortearProximo} 
                    disabled={sorteando || disponiveis.length === 0}
                    className={cn(
                      "w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 active:scale-90 shadow-2xl relative group",
                      sorteando || disponiveis.length === 0 
                        ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50" 
                        : "bg-primary text-primary-foreground hover:scale-110 shadow-primary/40 animate-pulse hover:animate-none"
                    )}
                  >
                    <Shuffle className="h-8 w-8 mb-1" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sorteio</span>
                    {/* Ring decoration */}
                    {!sorteando && disponiveis.length > 0 && (
                      <div className="absolute -inset-2 border-2 border-primary/20 rounded-full animate-ping opacity-30" />
                    )}
                  </button>

                  <div className="flex gap-4">
                    <Button variant="outline" onClick={salvarSorteio} size="icon" className="h-12 w-12 rounded-2xl border-2 hover:bg-primary/10 hover:text-primary transition-colors">
                      <Save className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" onClick={iniciarSorteio} size="icon" className="h-12 w-12 rounded-2xl border-2 hover:bg-destructive/10 hover:text-destructive transition-colors">
                       <XIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {disponiveis.length > 0 && (
              <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em]">{disponiveis.length} {disponiveis.length === 1 ? 'nome restante' : 'nomes restantes'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Resultado - Side or bottom list */}
      {resultado.length > 0 && !isFullscreen && (
        <div className="float-card p-4 space-y-3 animate-float-up" style={{ animationDelay: "200ms" }}>
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Ordem de Chamada</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {resultado.map((nome, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/50 border border-transparent hover:border-primary/20 transition-all">
                <span className="w-8 h-8 rounded-xl bg-primary text-primary-foreground text-xs font-black flex items-center justify-center shadow-lg shadow-primary/20">{i + 1}</span>
                <span className="text-sm font-bold text-foreground">{formatNome(nome)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico Dialog */}
      <Dialog open={showHistorico} onOpenChange={setShowHistorico}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-primary/5 p-6 border-b border-primary/10">
            <DialogTitle className="text-xl font-black text-foreground">Histórico de Sorteios</DialogTitle>
          </div>
          <div className="p-6 space-y-4">
            {historico.length === 0 && <p className="text-sm text-muted-foreground text-center py-4 italic">Nenhum sorteio salvo.</p>}
            {historico.map((s) => (
              <div key={s.id} className="float-card p-4 space-y-3 hover:translate-y-[-2px] transition-all">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-foreground uppercase tracking-wide">{s.titulo}</h4>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="rounded-xl font-bold h-8" onClick={() => carregarSorteio(s)}>Abrir</Button>
                    <Button variant="ghost" size="icon" onClick={() => excluirSorteio(s.id)} className="text-destructive w-8 h-8 rounded-xl">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(s.resultado as string[]).map((n, i) => (
                    <span key={i} className="text-[10px] px-3 py-1 rounded-full bg-primary/10 text-primary font-black uppercase tracking-wider">{formatNome(n)}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
