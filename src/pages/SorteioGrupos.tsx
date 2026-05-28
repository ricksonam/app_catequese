import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Users, Plus, X as XIcon, Shuffle, RefreshCw, Maximize, Minimize, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTurmas, useCatequizandos } from "@/hooks/useSupabaseData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Participante {
  nome: string;
  isLider?: boolean;
}

interface Grupo {
  id: number;
  nome: string;
  membros: Participante[];
}

interface HistoricoGrupo {
  id: string;
  titulo: string;
  resultado: string[];
  criado_em: string;
}

const CORES_GRUPOS = [
  "from-indigo-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
];

const CORES_BG = [
  "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900/50",
  "bg-violet-50 border-violet-200 dark:bg-violet-950/20 dark:border-violet-900/50",
  "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50",
  "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50",
  "bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50",
  "bg-cyan-50 border-cyan-200 dark:bg-cyan-950/20 dark:border-cyan-900/50",
];

export default function SorteioGrupos() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: turmas } = useTurmas();

  const [selectedTurma, setSelectedTurma] = useState<string>("");
  const { data: catequizandos = [] } = useCatequizandos(selectedTurma || undefined);

  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [novoNome, setNovoNome] = useState("");

  const [quantidadeGrupos, setQuantidadeGrupos] = useState<number>(3);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [sorteado, setSorteado] = useState(false);
  const [sortearLider, setSortearLider] = useState(false);
  const [umPorVez, setUmPorVez] = useState(true);
  const [currentGroupIdx, setCurrentGroupIdx] = useState(0);

  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [titulo, setTitulo] = useState("");
  const [historico, setHistorico] = useState<HistoricoGrupo[]>([]);
  const [showHistorico, setShowHistorico] = useState(false);

  useEffect(() => {
    loadHistorico();
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  // Auto-importar catequizandos quando uma turma é selecionada
  useEffect(() => {
    if (selectedTurma && catequizandos.length > 0) {
      const novos: Participante[] = catequizandos.map(c => ({
        nome: c.nome.split(" ").slice(0, 2).join(" "),
      }));
      setParticipantes(novos);
    } else if (selectedTurma === "") {
      setParticipantes([]);
    }
  }, [selectedTurma, catequizandos]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        toast.error("Erro na Tela Cheia: " + err.message);
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
      // Fit both type of sorteios, but we show those that look like groups or all.
      // Sorteio de Grupos typically has "Grupo X: ..." in result array
      const sHistorico = data.filter(s => s.resultado && s.resultado.some((r: string) => r.startsWith("Grupo ")));
      setHistorico(sHistorico.map((s: any) => ({
        id: s.id,
        titulo: s.titulo || "Sorteio Sem Título",
        resultado: s.resultado as string[],
        criado_em: s.criado_em,
      })));
    }
  };

  const salvarSorteio = async () => {
    if (grupos.length === 0) return;
    const tituloSorteio = titulo || `Divisão de Grupos - ${new Date().toLocaleDateString('pt-BR')}`;
    
    const resultadoFormatado = grupos.map(g => 
      `${g.nome}: ${g.membros.map(m => m.nome + (m.isLider ? ' (Líder)' : '')).join(', ')}`
    );

    const { data, error } = await supabase.from("sorteios").insert({
      titulo: tituloSorteio,
      nomes: participantes.map(p => p.nome),
      resultado: resultadoFormatado
    }).select().single();

    if (error) {
      toast.error("Erro ao salvar histórico");
    } else {
      toast.success("Grupos salvos no histórico!");
      setTitulo("");
      loadHistorico();
    }
  };

  const deletarSorteio = async (id: string) => {
    await supabase.from("sorteios").delete().eq("id", id);
    toast.success("Sorteio removido!");
    loadHistorico();
  };

  const adicionarManual = () => {
    const nome = novoNome.trim();
    if (!nome) return;
    if (participantes.some(p => p.nome === nome)) {
      toast.error("Nome já está na lista!");
      return;
    }
    setParticipantes(prev => [...prev, { nome }]);
    setNovoNome("");
  };

  const removerParticipante = (nome: string) => {
    setParticipantes(prev => prev.filter(p => p.nome !== nome));
  };

  const realizarSorteio = () => {
    const pool = [...participantes];

    if (pool.length === 0) {
      toast.error("Nenhum participante na lista.");
      return;
    }

    const embaralhados = [...pool].sort(() => Math.random() - 0.5);
    const qtde = Math.min(quantidadeGrupos, embaralhados.length);
    
    const gruposGerados: Grupo[] = Array.from({ length: qtde }, (_, i) => ({
      id: i + 1,
      nome: `Grupo ${i + 1}`,
      membros: [],
    }));

    embaralhados.forEach((pessoa, index) => {
      gruposGerados[index % qtde].membros.push({ ...pessoa });
    });

    if (sortearLider) {
      gruposGerados.forEach(g => {
        if (g.membros.length > 0) {
          const liderIdx = Math.floor(Math.random() * g.membros.length);
          g.membros[liderIdx].isLider = true;
        }
      });
    }

    setGrupos(gruposGerados);
    setCurrentGroupIdx(0);
    setSorteado(true);
    
    if (!document.fullscreenElement && window.innerWidth < 1024) {
      containerRef.current?.requestFullscreen().catch(() => {});
    }
  };

  const reiniciar = () => {
    setGrupos([]);
    setSorteado(false);
  };

  const quantidadeOpcoes = [2, 3, 4, 5, 10];

  return (
    <div ref={containerRef} className="min-h-full flex flex-col transition-all duration-500 bg-background">
      {/* Header Fixo */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md p-4 sm:p-6 border-b border-border flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {!isFullscreen && (
            <button onClick={() => navigate("/jogos")} className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-black text-foreground uppercase tracking-tight">Sorteio de Grupos</h1>
            {!isFullscreen && <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Divisão de Equipas</p>}
          </div>
        </div>
        
        <div className="flex gap-2">
          {!sorteado && (
            <Button onClick={() => setShowHistorico(true)} variant="outline" className="hidden sm:flex rounded-xl font-bold gap-2">
              <Save className="h-4 w-4" /> Histórico
            </Button>
          )}
          <Button onClick={toggleFullscreen} variant="outline" size="icon" className="rounded-xl shrink-0">
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className={cn("flex-1 p-4 sm:p-6 pb-24", isFullscreen ? "max-w-4xl mx-auto w-full pt-8" : "max-w-3xl mx-auto w-full")}>
        {!sorteado ? (
          <div className="space-y-6">
            {/* Bloco Escuro Premium para Seleção */}
            <div className="bg-indigo-950 rounded-3xl p-5 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity" />
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-400 to-blue-400 flex items-center justify-center shadow-lg shadow-indigo-500/40">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-indigo-100 uppercase tracking-[0.2em]">Selecionar Turma</label>
                    <p className="text-[10px] text-indigo-300 font-medium mt-0.5">Participantes carregados automaticamente</p>
                  </div>
                </div>

                {/* Grid de Turmas Premium */}
                <div className={cn("gap-2.5", turmas && turmas.length === 1 ? "flex justify-center" : "grid grid-cols-2")}>
                  {turmas?.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTurma(selectedTurma === t.id ? "" : t.id)}
                      className={cn(
                        "relative p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center overflow-hidden",
                        selectedTurma === t.id
                          ? "border-indigo-400 bg-indigo-400/20 shadow-md shadow-indigo-400/20"
                          : "border-indigo-950/10 border-white/5 bg-white/5 hover:bg-white/10"
                      )}
                    >
                      {selectedTurma === t.id && (
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/10 to-blue-400/5 rounded-2xl" />
                      )}
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm relative z-10",
                        selectedTurma === t.id
                          ? "bg-gradient-to-br from-indigo-400 to-blue-400 text-white shadow-indigo-500/40"
                          : "bg-white/10 text-indigo-200"
                      )}>
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5 relative z-10">
                        <p className={cn("text-[11px] font-black leading-tight truncate px-1 max-w-[100px]", selectedTurma === t.id ? "text-indigo-100" : "text-indigo-200/80")}>{t.nome}</p>
                        {t.ano && <p className="text-[9px] font-bold text-indigo-300/50 uppercase tracking-tighter">{t.ano}</p>}
                      </div>
                      {selectedTurma === t.id && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-400 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {selectedTurma && participantes.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/30">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-black text-emerald-300 uppercase tracking-wider">
                      {participantes.length} participantes carregados ✓
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Adicionar Manual */}
              <div className="bg-card p-4 rounded-3xl border border-border shadow-sm space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Participante Manual</Label>
                <div className="flex gap-2">
                  <Input
                    value={novoNome}
                    onChange={e => setNovoNome(e.target.value)}
                    placeholder="Digite o nome..."
                    onKeyDown={e => e.key === "Enter" && adicionarManual()}
                    className="flex-1 h-12 rounded-xl border-2 font-medium bg-muted/30 focus-visible:bg-background"
                  />
                  <Button onClick={adicionarManual} size="icon" className="h-12 w-12 rounded-xl shrink-0 bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Toggles (Líder / 1 por vez) */}
              <div className="bg-card p-4 rounded-3xl border border-border shadow-sm space-y-3">
                 <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Configurações Base</Label>
                 <div className="flex gap-3">
                    <button 
                      onClick={() => setSortearLider(!sortearLider)}
                      className={cn("flex-1 p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1", sortearLider ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-border bg-muted/30 text-muted-foreground")}
                    >
                      <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center", sortearLider ? "bg-indigo-500 border-indigo-500 text-white" : "border-zinc-300")} >
                        {sortearLider && <Plus className="h-3 w-3 stroke-[4]" />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider">Líder do Grupo</span>
                    </button>
                    <button 
                      onClick={() => setUmPorVez(!umPorVez)}
                      className={cn("flex-1 p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1", umPorVez ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-border bg-muted/30 text-muted-foreground")}
                    >
                      <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center", umPorVez ? "bg-indigo-500 border-indigo-500 text-white" : "border-zinc-300")} >
                        {umPorVez && <Plus className="h-3 w-3 stroke-[4]" />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider">Modo Suspense</span>
                    </button>
                 </div>
              </div>
            </div>

            {/* Quantidade de Grupos - Glass Cards */}
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Quantidade de Grupos</Label>
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {quantidadeOpcoes.map(n => (
                  <button
                    key={n}
                    onClick={() => setQuantidadeGrupos(n)}
                    className={cn(
                      "w-16 h-16 rounded-2xl border-2 font-black text-xl transition-all shrink-0 flex flex-col items-center justify-center relative overflow-hidden",
                      quantidadeGrupos === n 
                        ? "border-indigo-500 text-indigo-700 shadow-md shadow-indigo-500/20 bg-indigo-50" 
                        : "bg-card border-border hover:border-indigo-500/40 text-foreground"
                    )}
                  >
                    {quantidadeGrupos === n && <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-blue-500/10" />}
                    <span className="relative z-10">{n}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Participantes Lista de Chips */}
            {participantes.length > 0 && (
              <div className="bg-card p-4 rounded-3xl border border-border shadow-sm space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                  Participantes na Lista ({participantes.length})
                </Label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 custom-scrollbar">
                  {participantes.map(p => (
                    <span key={p.nome} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border bg-muted border-border text-foreground shadow-sm hover:shadow-md transition-all group">
                      {p.nome}
                      <button onClick={() => removerParticipante(p.nome)} className="text-muted-foreground group-hover:text-destructive transition-colors p-0.5 rounded-full hover:bg-black/5">
                        <XIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={realizarSorteio}
              disabled={participantes.length === 0}
              className="w-full h-16 rounded-2xl font-black text-lg gap-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all text-white"
            >
              <Shuffle className="h-6 w-6" /> SORTEAR {quantidadeGrupos} GRUPOS
            </Button>
            
            {/* Botão de Histórico Visível no Mobile */}
            <div className="sm:hidden flex justify-center pt-2">
              <Button onClick={() => setShowHistorico(true)} variant="ghost" className="font-bold gap-2 text-indigo-600">
                <Save className="h-4 w-4" /> Ver Histórico de Grupos
              </Button>
            </div>
          </div>
        ) : (
          /* ================= RESULTADO ================= */
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between bg-card p-4 rounded-2xl shadow-sm border border-border">
              <h2 className="text-xl font-black text-foreground">
                {umPorVez ? (
                  <span className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm">{currentGroupIdx + 1}/{grupos.length}</span>
                    Revelando Grupos
                  </span>
                ) : `🎉 ${grupos.length} Grupos Formados`}
              </h2>
              <div className="flex items-center gap-2">
                <Button onClick={reiniciar} variant="outline" size="icon" className="rounded-xl h-10 w-10">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {umPorVez ? (
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="grid grid-cols-1 gap-5 w-full max-w-sm">
                  {grupos.slice(0, currentGroupIdx + 1).map((grupo, i) => (
                    <div key={grupo.id} className={cn("rounded-3xl border-2 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500", CORES_BG[i % CORES_BG.length])}>
                      <div className={cn("p-5 bg-gradient-to-r text-white font-black text-lg uppercase tracking-wider flex items-center gap-3", CORES_GRUPOS[i % CORES_GRUPOS.length])}>
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-base font-black shadow-inner">{grupo.id}</div>
                        {grupo.nome}
                        <span className="ml-auto text-xs font-bold bg-black/20 px-3 py-1 rounded-full">{grupo.membros.length} membros</span>
                      </div>
                      <div className="p-5 space-y-3 bg-white/50 dark:bg-black/10 backdrop-blur-sm">
                        {grupo.membros.map((m, j) => (
                          <div key={j} className="flex items-center gap-3 bg-white dark:bg-black/20 p-3 rounded-2xl shadow-sm">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0 shadow-sm border-2",
                              m.isLider ? "bg-amber-100 border-amber-400 text-amber-700" : "bg-zinc-50 border-zinc-100 text-zinc-500"
                            )}>
                              {m.isLider ? "👑" : j + 1}
                            </div>
                            <div className="flex flex-col">
                              <span className={cn("text-lg font-bold truncate leading-tight", m.isLider ? "text-amber-700 dark:text-amber-500" : "text-foreground")}>{m.nome}</span>
                              {m.isLider && <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 leading-none mt-1">Líder</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {currentGroupIdx < grupos.length - 1 ? (
                  <Button 
                    onClick={() => setCurrentGroupIdx(prev => prev + 1)}
                    className="h-16 px-10 rounded-2xl font-black text-xl gap-3 shadow-xl shadow-indigo-500/30 animate-bounce-subtle mt-4 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Shuffle className="h-6 w-6" /> PRÓXIMO GRUPO
                  </Button>
                ) : (
                  <div className="flex flex-col w-full max-w-sm gap-3 mt-4">
                    <Input
                      placeholder="Título para salvar (ex: Grupos do Retiro)"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      className="h-14 rounded-2xl border-2 text-center font-bold"
                    />
                    <Button onClick={salvarSorteio} className="h-14 rounded-2xl font-black gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Save className="h-5 w-5" /> Salvar Grupos Formados
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {grupos.map((grupo, i) => (
                    <div key={grupo.id} className={cn("rounded-3xl border-2 overflow-hidden shadow-md hover:shadow-xl transition-all", CORES_BG[i % CORES_BG.length])}>
                      <div className={cn("p-4 bg-gradient-to-r text-white font-black text-base uppercase tracking-wider flex items-center gap-3", CORES_GRUPOS[i % CORES_GRUPOS.length])}>
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-black">{grupo.id}</div>
                        {grupo.nome}
                        <span className="ml-auto text-[10px] font-bold bg-black/20 px-2.5 py-1 rounded-full">{grupo.membros.length}</span>
                      </div>
                      <div className="p-4 space-y-2.5 bg-white/50 dark:bg-black/10 backdrop-blur-sm h-full">
                        {grupo.membros.map((m, j) => (
                          <div key={j} className="flex items-center gap-3 bg-white dark:bg-black/20 p-2.5 rounded-xl shadow-sm">
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border",
                              m.isLider ? "bg-amber-100 border-amber-300 text-amber-700" : "bg-zinc-50 border-zinc-100 text-zinc-500"
                            )}>
                              {m.isLider ? "👑" : j + 1}
                            </div>
                            <div className="flex flex-col">
                              <span className={cn("text-sm font-bold truncate leading-tight", m.isLider ? "text-amber-700 dark:text-amber-500" : "text-foreground")}>{m.nome}</span>
                              {m.isLider && <span className="text-[9px] font-black uppercase text-amber-500 leading-none mt-0.5 tracking-wider">Líder</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-border">
                  <Input
                    placeholder="Título para salvar..."
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="h-12 w-full sm:max-w-[250px] rounded-xl border-2 font-bold"
                  />
                  <Button onClick={salvarSorteio} className="h-12 w-full sm:w-auto px-6 rounded-xl font-black gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Save className="h-4 w-4" /> Salvar Grupos
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Histórico Dialog */}
      <Dialog open={showHistorico} onOpenChange={setShowHistorico}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-3xl p-0 gap-0">
          <DialogHeader className="p-6 pb-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-md z-10">
            <DialogTitle className="font-black flex items-center gap-2 text-xl">
              <Save className="h-5 w-5 text-indigo-600" />
              Histórico de Grupos
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            {historico.length === 0 ? (
              <div className="text-center py-10 opacity-60">
                <p className="font-bold text-lg">Nenhum histórico</p>
                <p className="text-sm">Os grupos salvos aparecerão aqui.</p>
              </div>
            ) : (
              historico.map((h) => (
                <div key={h.id} className="bg-card border-2 border-border rounded-2xl p-4 shadow-sm relative group hover:border-indigo-500/50 transition-colors">
                  <div className="pr-8 mb-3">
                    <h3 className="font-black text-foreground text-lg leading-tight">{h.titulo}</h3>
                    <p className="text-xs text-muted-foreground font-medium mt-1">
                      {new Date(h.criado_em).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => deletarSorteio(h.id)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2 mt-2 border-t border-border pt-3">
                    {h.resultado.map((r, i) => {
                      const [nomeGrupo, membros] = r.split(": ");
                      return (
                        <div key={i} className="bg-muted/50 rounded-xl p-3 border border-border">
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">{nomeGrupo}</p>
                          <p className="text-sm font-medium text-foreground leading-snug">{membros}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
