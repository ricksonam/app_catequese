import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Users, Plus, X, Maximize, Minimize, Shuffle, RefreshCw, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTurmas, useCatequizandos } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Participante {
  nome: string;
  genero: "M" | "F" | "N";
}

interface Grupo {
  id: number;
  nome: string;
  membros: Participante[];
}

const CORES_GRUPOS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-green-600",
  "from-orange-500 to-amber-600",
  "from-rose-500 to-pink-600",
  "from-indigo-500 to-blue-600",
  "from-teal-500 to-emerald-600",
  "from-red-500 to-rose-600",
];

const CORES_BG = [
  "bg-violet-50 border-violet-200",
  "bg-blue-50 border-blue-200",
  "bg-emerald-50 border-emerald-200",
  "bg-orange-50 border-orange-200",
  "bg-rose-50 border-rose-200",
  "bg-indigo-50 border-indigo-200",
  "bg-teal-50 border-teal-200",
  "bg-red-50 border-red-200",
];

export default function SorteioGrupos() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: turmas } = useTurmas();

  const [selectedTurma, setSelectedTurma] = useState<string>("");
  const { data: catequizandos = [] } = useCatequizandos(selectedTurma || undefined);

  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [novoNome, setNovoNome] = useState("");
  const [novoGenero, setNovoGenero] = useState<"M" | "F" | "N">("N");

  const [tamanhoGrupo, setTamanhoGrupo] = useState<number>(3);
  const [modoGenero, setModoGenero] = useState<"misto" | "meninos" | "meninas">("misto");

  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sorteado, setSorteado] = useState(false);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  const importarDaTurma = () => {
    if (!catequizandos.length) {
      toast.error("Nenhum catequizando encontrado nesta turma.");
      return;
    }
    const novos: Participante[] = catequizandos.map(c => ({
      nome: c.nome.split(" ").slice(0, 2).join(" "),
      genero: "N" as const,
    }));
    // Merge sem duplicar
    const nomeExistentes = participantes.map(p => p.nome);
    const filtrados = novos.filter(n => !nomeExistentes.includes(n.nome));
    setParticipantes(prev => [...prev, ...filtrados]);
    toast.success(`${filtrados.length} participantes importados!`);
  };

  const adicionarManual = () => {
    const nome = novoNome.trim();
    if (!nome) return;
    if (participantes.some(p => p.nome === nome)) {
      toast.error("Nome já está na lista!");
      return;
    }
    setParticipantes(prev => [...prev, { nome, genero: novoGenero }]);
    setNovoNome("");
  };

  const removerParticipante = (nome: string) => {
    setParticipantes(prev => prev.filter(p => p.nome !== nome));
  };

  const realizarSorteio = () => {
    let pool = [...participantes];

    if (modoGenero === "meninos") {
      pool = pool.filter(p => p.genero === "M");
    } else if (modoGenero === "meninas") {
      pool = pool.filter(p => p.genero === "F");
    }

    if (pool.length === 0) {
      toast.error(
        modoGenero !== "misto"
          ? "Nenhum participante do gênero selecionado. Defina o gênero ao adicionar nomes."
          : "Nenhum participante na lista."
      );
      return;
    }

    // Embaralhar
    const embaralhados = [...pool].sort(() => Math.random() - 0.5);
    const gruposGerados: Grupo[] = [];
    let i = 0;
    let grupoIdx = 1;

    while (i < embaralhados.length) {
      const membros = embaralhados.slice(i, i + tamanhoGrupo);
      gruposGerados.push({
        id: grupoIdx,
        nome: `Grupo ${grupoIdx}`,
        membros,
      });
      i += tamanhoGrupo;
      grupoIdx++;
    }

    setGrupos(gruposGerados);
    setSorteado(true);

    if (!document.fullscreenElement && window.innerWidth < 1024) {
      containerRef.current?.requestFullscreen().catch(() => {});
    }
  };

  const reiniciar = () => {
    setGrupos([]);
    setSorteado(false);
  };

  const tamanhoOpcoes = [2, 3, 4, 5, 10];

  return (
    <div ref={containerRef} className={cn(
      "min-h-full flex flex-col transition-all duration-500",
      isFullscreen ? "bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-6 lg:p-10 min-h-screen" : "space-y-5"
    )}>
      {/* Header */}
      <div className={cn("flex items-center gap-3 animate-fade-in", isFullscreen ? "hidden" : "flex")}>
        <button onClick={() => navigate("/jogos")} className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-foreground">Sorteio de Grupos</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Divisão de equipes</p>
        </div>
        <Button variant="outline" size="icon" onClick={toggleFullscreen} className="rounded-xl border-2">
          <Maximize className="h-4 w-4" />
        </Button>
      </div>

      {isFullscreen && (
        <div className="absolute top-6 right-6 z-50">
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="bg-white/10 backdrop-blur-sm rounded-full text-white border border-white/20">
            <Minimize className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* RESULTADO FULLSCREEN */}
      {sorteado && isFullscreen ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <div className="text-center mb-4">
            <p className="text-white/50 uppercase tracking-[0.3em] text-xs font-black mb-2">Grupos Formados</p>
            <h2 className="text-4xl font-black text-white drop-shadow-lg">🎉 Sorteio Concluído!</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-5xl">
            {grupos.map((grupo, i) => (
              <div key={grupo.id} className="rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <div className={cn("p-3 bg-gradient-to-br text-white text-center font-black text-sm uppercase tracking-wider", CORES_GRUPOS[i % CORES_GRUPOS.length])}>
                  {grupo.nome}
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-3 space-y-1.5">
                  {grupo.membros.map((m, j) => (
                    <div key={j} className="flex items-center gap-2 text-white/90">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black shrink-0">
                        {j + 1}
                      </div>
                      <span className="text-sm font-bold truncate">{m.nome}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Button onClick={reiniciar} variant="outline" className="h-12 px-8 rounded-full text-white border-white/30 bg-white/10 hover:bg-white/20 font-black gap-2 mt-4">
            <RefreshCw className="h-4 w-4" /> Novo Sorteio
          </Button>
        </div>
      ) : (
        <>
          {/* CONFIG PANEL */}
          {!sorteado && (
            <div className="float-card p-6 space-y-6 animate-float-up border-t-4 border-t-primary">
              {/* Importar Turma */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                  Importar de uma Turma
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {turmas?.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTurma(selectedTurma === t.id ? "" : t.id)}
                      className={cn(
                        "p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 text-center group",
                        selectedTurma === t.id
                          ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                          : "border-border hover:border-primary/30 bg-card"
                      )}
                    >
                      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center transition-colors", selectedTurma === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        <Users className="h-4 w-4" />
                      </div>
                      <p className={cn("text-[11px] font-black leading-tight", selectedTurma === t.id ? "text-primary" : "text-foreground")}>{t.nome}</p>
                    </button>
                  ))}
                </div>
                {selectedTurma && (
                  <Button onClick={importarDaTurma} className="w-full h-10 rounded-xl font-black gap-2 text-xs animate-in zoom-in-95">
                    <Users className="h-4 w-4" /> IMPORTAR CATEQUIZANDOS
                  </Button>
                )}
              </div>

              <div className="h-px bg-border" />

              {/* Adicionar Manual */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                  Adicionar Manualmente
                </label>
                <div className="flex gap-2">
                  <Input
                    value={novoNome}
                    onChange={e => setNovoNome(e.target.value)}
                    placeholder="Nome do participante"
                    onKeyDown={e => e.key === "Enter" && adicionarManual()}
                    className="flex-1 h-11 rounded-xl border-2 font-medium"
                  />
                  <div className="flex gap-1">
                    {(["M", "F", "N"] as const).map(g => (
                      <button
                        key={g}
                        onClick={() => setNovoGenero(g)}
                        className={cn(
                          "w-11 h-11 rounded-xl border-2 font-black text-xs transition-all",
                          novoGenero === g ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40"
                        )}
                      >
                        {g === "M" ? "♂" : g === "F" ? "♀" : "·"}
                      </button>
                    ))}
                  </div>
                  <Button onClick={adicionarManual} size="icon" className="h-11 w-11 rounded-xl shrink-0">
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground ml-1 font-medium">♂ Menino · ♀ Menina · · Neutro</p>
              </div>

              {/* Lista de participantes */}
              {participantes.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                    {participantes.length} participante(s)
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-1">
                    {participantes.map(p => (
                      <span key={p.nome} className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border",
                        p.genero === "M" ? "bg-blue-50 border-blue-200 text-blue-700" :
                        p.genero === "F" ? "bg-pink-50 border-pink-200 text-pink-700" :
                        "bg-muted border-border text-muted-foreground"
                      )}>
                        {p.genero === "M" ? "♂" : p.genero === "F" ? "♀" : "·"} {p.nome}
                        <button onClick={() => removerParticipante(p.nome)} className="hover:text-destructive rounded-full transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="h-px bg-border" />

              {/* Configurações do Grupo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                    Pessoas por grupo
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tamanhoOpcoes.map(n => (
                      <button
                        key={n}
                        onClick={() => setTamanhoGrupo(n)}
                        className={cn(
                          "w-12 h-12 rounded-xl border-2 font-black text-sm transition-all",
                          tamanhoGrupo === n ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20" : "bg-card border-border hover:border-primary/40"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                    Tipo de grupo
                  </label>
                  <div className="flex flex-col gap-2">
                    {[
                      { id: "misto", label: "Misto", icon: "👫" },
                      { id: "meninos", label: "Só Meninos", icon: "♂" },
                      { id: "meninas", label: "Só Meninas", icon: "♀" },
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => setModoGenero(m.id as any)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all text-left",
                          modoGenero === m.id ? "bg-primary/10 border-primary text-primary" : "bg-card border-border hover:border-primary/30"
                        )}
                      >
                        <span className="text-base">{m.icon}</span> {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={realizarSorteio}
                disabled={participantes.length === 0}
                className="w-full h-14 rounded-2xl font-black text-lg gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-all"
              >
                <Shuffle className="h-6 w-6" /> SORTEAR GRUPOS
              </Button>
            </div>
          )}

          {/* RESULTADO (modo normal) */}
          {sorteado && !isFullscreen && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-foreground">🎉 {grupos.length} Grupos Formados</h2>
                <div className="flex gap-2">
                  <Button onClick={toggleFullscreen} variant="outline" size="sm" className="rounded-xl font-bold gap-2 border-2">
                    <Maximize className="h-4 w-4" /> Tela Cheia
                  </Button>
                  <Button onClick={reiniciar} variant="outline" size="sm" className="rounded-xl font-bold gap-2 border-2">
                    <RefreshCw className="h-4 w-4" /> Refazer
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {grupos.map((grupo, i) => (
                  <div key={grupo.id} className={cn("rounded-3xl border-2 overflow-hidden shadow-sm hover:shadow-md transition-all", CORES_BG[i % CORES_BG.length])}>
                    <div className={cn("p-3 bg-gradient-to-r text-white font-black text-sm uppercase tracking-wider flex items-center gap-2", CORES_GRUPOS[i % CORES_GRUPOS.length])}>
                      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">{grupo.id}</div>
                      {grupo.nome}
                      <span className="ml-auto text-[10px] font-bold opacity-80">{grupo.membros.length} membros</span>
                    </div>
                    <div className="p-3 space-y-1.5">
                      {grupo.membros.map((m, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-white border border-current/10 flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm">
                            {j + 1}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3 opacity-40" />
                            <span className="text-sm font-bold text-foreground">{m.nome}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
