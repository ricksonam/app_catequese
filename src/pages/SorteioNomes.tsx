import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Shuffle, Trash2, Plus, Users, Save, X, Maximize, Minimize } from "lucide-react";
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

  useEffect(() => {
    loadHistorico();
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
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
    const parts = fullNome.split(" ").filter(p => p.length > 2 || p.toLowerCase() === "de" || p.toLowerCase() === "da");
    // Show first and second meaningful names
    const result = fullNome.split(" ").slice(0, 2).join(" ");
    return result;
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

    // Try to enter fullscreen automatically for suspense
    if (!document.fullscreenElement && window.innerWidth < 1024) {
      containerRef.current?.requestFullscreen().catch(() => {});
    }

    setSorteando(true);
    setMostrarResultado(false);
    
    let count = 0;
    const interval = setInterval(() => {
      const rand = disponiveis[Math.floor(Math.random() * disponiveis.length)];
      setSorteioAtual(formatNome(rand));
      count++;
      
      if (count > 25) {
        clearInterval(interval);
        const idx = Math.floor(Math.random() * disponiveis.length);
        const sorteado = disponiveis[idx];
        
        // Final reveals
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
    <div ref={containerRef} className={cn("space-y-5 flex flex-col min-h-full transition-all duration-500", isFullscreen ? "bg-background p-6" : "")}>
      <div className={cn("flex items-center gap-3 animate-fade-in", isFullscreen ? "hidden" : "flex")}>
        <button onClick={() => navigate("/jogos")} className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1">Sorteio de Nomes</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={toggleFullscreen}>
            <Maximize className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setShowHistorico(true); loadHistorico(); }}>
            Histórico
          </Button>
        </div>
      </div>

      {isFullscreen && (
        <div className="absolute top-6 right-6 z-50">
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="bg-background/50 backdrop-blur-sm rounded-full">
            <Minimize className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Config Sections - Hide in fullscreen unless it just started */}
      <div className={cn("space-y-5", isFullscreen && started ? "hidden" : "block")}>
        <div className="float-card p-4 space-y-4 animate-float-up">
          <div className="space-y-2">
            <Label>Título do Sorteio</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Sorteio da leitura" />
          </div>

          <div className="space-y-2">
            <Label>Importar de uma turma</Label>
            <div className="flex gap-2">
              <Select value={selectedTurma} onValueChange={setSelectedTurma}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecionar turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmas?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={importarCatequizandos} disabled={!selectedTurma}>
                <Users className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Adicionar nome manualmente</Label>
            <div className="flex gap-2">
              <Input
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Nome"
                onKeyDown={(e) => e.key === "Enter" && adicionarNome()}
              />
              <Button variant="outline" size="icon" onClick={adicionarNome}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {nomes.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">{nomes.length} nome(s) na lista</Label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {nomes.map((nome) => (
                  <span key={nome} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-xs font-medium text-foreground">
                    {nome}
                    <button onClick={() => removerNome(nome)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
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
          {/* Background suspense elements */}
          {sorteando && (
            <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
               <div className="absolute inset-0 animate-ping repeat-infinite bg-primary/20 rounded-full scale-150" />
            </div>
          )}

          <div className="relative z-10 space-y-8">
            <div className="min-h-[120px] flex items-center justify-center">
              {sorteando ? (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <p className="text-8xl font-black text-primary animate-bounce">?</p>
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] animate-pulse">Escolhendo...</p>
                </div>
              ) : sorteioAtual ? (
                <div className={cn(
                  "flex flex-col items-center justify-center space-y-4 transition-all duration-700",
                  mostrarResultado ? "scale-125 md:scale-[1.8] animate-in zoom-in-50 duration-500" : "scale-100"
                )}>
                  {mostrarResultado && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-px w-8 bg-primary/30" />
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Sorteado!</span>
                      <div className="h-px w-8 bg-primary/30" />
                    </div>
                  )}
                  <p className="text-4xl md:text-6xl font-black text-foreground drop-shadow-md">
                    {sorteioAtual}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground space-y-3">
                  <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
                    <Shuffle className="h-8 w-8 opacity-20" />
                  </div>
                  <p className="text-sm font-medium italic">O mistério aguarda...</p>
                </div>
              )}
            </div>

            <div className="pt-6">
              {!started ? (
                <Button onClick={iniciarSorteio} className="w-full h-14 rounded-2xl text-lg font-bold gap-3 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all" disabled={nomes.length === 0}>
                  <Shuffle className="h-5 w-5" /> Iniciar Sorteio
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button 
                    onClick={sortearProximo} 
                    className="flex-1 h-14 rounded-2xl text-lg font-bold gap-3 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all" 
                    disabled={sorteando || disponiveis.length === 0}
                  >
                    <Shuffle className="h-5 w-5" /> 
                    {disponiveis.length === 0 ? "Fim do Sorteio" : "Sortear Próximo"}
                  </Button>
                  <Button variant="outline" onClick={salvarSorteio} size="icon" className="h-14 w-14 rounded-2xl border-2">
                    <Save className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" onClick={iniciarSorteio} size="icon" className="h-14 w-14 rounded-2xl border-2">
                     <X className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>

            {disponiveis.length > 0 && (
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{disponiveis.length} Nomes no Saco</p>
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
