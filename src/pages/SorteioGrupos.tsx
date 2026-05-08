import { useState, useEffect } from "react";
import { ArrowLeft, Users, Plus, X as XIcon, Shuffle, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTurmas, useCatequizandos } from "@/hooks/useSupabaseData";
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
  "bg-violet-50 border-violet-200 dark:bg-violet-950/20 dark:border-violet-900/50",
  "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50",
  "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50",
  "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/50",
  "bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50",
  "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900/50",
  "bg-teal-50 border-teal-200 dark:bg-teal-950/20 dark:border-teal-900/50",
  "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50",
];

export default function SorteioGrupos() {
  const navigate = useNavigate();
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

    // Embaralhar a lista de participantes
    const embaralhados = [...pool].sort(() => Math.random() - 0.5);
    
    // Determinar quantidade real de grupos (não pode ser maior que o número de participantes)
    const qtde = Math.min(quantidadeGrupos, embaralhados.length);
    
    // Criar os grupos vazios
    const gruposGerados: Grupo[] = Array.from({ length: qtde }, (_, i) => ({
      id: i + 1,
      nome: `Grupo ${i + 1}`,
      membros: [],
    }));

    // Distribuir os participantes um por um em cada grupo (Round-Robin)
    embaralhados.forEach((pessoa, index) => {
      gruposGerados[index % qtde].membros.push(pessoa);
    });

    // Sortear líder se solicitado
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
  };

  const reiniciar = () => {
    setGrupos([]);
    setSorteado(false);
  };

  const quantidadeOpcoes = [2, 3, 4, 5, 10];

  return (
    <div className="min-h-full flex flex-col transition-all duration-500 space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 animate-fade-in">
        <button onClick={() => navigate("/jogos")} className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-foreground">Sorteio de Grupos</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Divisão de equipes</p>
        </div>
      </div>

      {!sorteado ? (
        <div className="float-card p-6 space-y-6 animate-float-up border-t-4 border-t-primary">
          {/* Selecionar Turma (Auto-Import) */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100 ml-1">
              Selecionar Turma
            </label>
            <div className={cn(
              "gap-2",
              turmas && turmas.length === 1
                ? "flex justify-center"
                : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
            )}>
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
          </div>

          <div className="h-px bg-border" />

          {/* Adicionar Manual */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100 ml-1">
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
              <Button onClick={adicionarManual} size="icon" className="h-11 w-11 rounded-xl shrink-0">
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Lista de participantes */}
          {participantes.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100 ml-1">
                {participantes.length} participante(s) selecionados
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 custom-scrollbar">
                {participantes.map(p => (
                  <span key={p.nome} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border bg-muted border-border text-foreground shadow-sm">
                    {p.nome}
                    <button onClick={() => removerParticipante(p.nome)} className="hover:text-destructive rounded-full transition-colors bg-white/50 dark:bg-black/20 p-0.5">
                      <XIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="h-px bg-border" />

          {/* Configurações do Grupo */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">
                Quantidade de Grupos
              </label>
              <div className="flex gap-4">
                <button 
                  onClick={() => setSortearLider(!sortearLider)}
                  className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors", sortearLider ? "text-primary" : "text-muted-foreground")}
                >
                  <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center transition-all", sortearLider ? "bg-primary border-primary text-white" : "border-border")} >
                    {sortearLider && <Plus className="h-3 w-3 stroke-[4]" />}
                  </div>
                  Líder
                </button>
                <button 
                  onClick={() => setUmPorVez(!umPorVez)}
                  className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors", umPorVez ? "text-primary" : "text-muted-foreground")}
                >
                  <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center transition-all", umPorVez ? "bg-primary border-primary text-white" : "border-border")} >
                    {umPorVez && <Plus className="h-3 w-3 stroke-[4]" />}
                  </div>
                  1 por Vez
                </button>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {quantidadeOpcoes.map(n => (
                <button
                  key={n}
                  onClick={() => setQuantidadeGrupos(n)}
                  className={cn(
                    "w-14 h-14 rounded-xl border-2 font-black text-sm transition-all shrink-0",
                    quantidadeGrupos === n ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20" : "bg-card border-border hover:border-primary/40 text-foreground"
                  )}
                >
                  {n}
                </button>
              ))}
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
      ) : (
        /* RESULTADO */
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 pt-2">
          <div className="flex items-center justify-between bg-card p-4 rounded-2xl shadow-sm border border-border">
            <h2 className="text-lg font-black text-foreground">
              {umPorVez ? `Revelando: ${currentGroupIdx + 1}/${grupos.length}` : `🎉 ${grupos.length} Grupos Formados`}
            </h2>
            <Button onClick={reiniciar} variant="outline" size="sm" className="rounded-xl font-bold gap-2 border-2 text-xs h-9">
              <RefreshCw className="h-4 w-4" /> Refazer
            </Button>
          </div>

          {umPorVez ? (
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
                {grupos.slice(0, currentGroupIdx + 1).map((grupo, i) => (
                  <div key={grupo.id} className={cn("rounded-3xl border-2 overflow-hidden shadow-lg animate-in zoom-in-95 duration-500", CORES_BG[i % CORES_BG.length])}>
                    <div className={cn("p-4 bg-gradient-to-r text-white font-black text-base uppercase tracking-wider flex items-center gap-3", CORES_GRUPOS[i % CORES_GRUPOS.length])}>
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-black">{grupo.id}</div>
                      {grupo.nome}
                      <span className="ml-auto text-[10px] font-bold opacity-80 bg-black/20 px-2 py-0.5 rounded-full">{grupo.membros.length} membros</span>
                    </div>
                    <div className="p-4 space-y-2.5">
                      {grupo.membros.map((m, j) => (
                        <div key={j} className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 shadow-sm border",
                            m.isLider ? "bg-amber-400 border-amber-600 text-amber-950" : "bg-white border-black/5 text-foreground"
                          )}>
                            {m.isLider ? "★" : j + 1}
                          </div>
                          <div className="flex flex-col">
                            <span className={cn("text-base font-bold truncate leading-tight", m.isLider ? "text-amber-600 dark:text-amber-500" : "text-foreground")}>{m.nome}</span>
                            {m.isLider && <span className="text-[9px] font-black uppercase text-amber-500 leading-none mt-0.5">Líder do Grupo</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {currentGroupIdx < grupos.length - 1 && (
                <Button 
                  onClick={() => setCurrentGroupIdx(prev => prev + 1)}
                  className="h-14 px-8 rounded-2xl font-black text-lg gap-3 shadow-xl shadow-primary/30 animate-bounce-subtle mt-2"
                >
                  <Shuffle className="h-5 w-5" /> PRÓXIMO GRUPO
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {grupos.map((grupo, i) => (
                <div key={grupo.id} className={cn("rounded-3xl border-2 overflow-hidden shadow-sm hover:shadow-md transition-all", CORES_BG[i % CORES_BG.length])}>
                  <div className={cn("p-3 bg-gradient-to-r text-white font-black text-sm uppercase tracking-wider flex items-center gap-2", CORES_GRUPOS[i % CORES_GRUPOS.length])}>
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">{grupo.id}</div>
                    {grupo.nome}
                    <span className="ml-auto text-[10px] font-bold opacity-80 bg-black/20 px-2 py-0.5 rounded-full">{grupo.membros.length}</span>
                  </div>
                  <div className="p-3 space-y-2">
                    {grupo.membros.map((m, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm border",
                          m.isLider ? "bg-amber-400 border-amber-600 text-amber-950" : "bg-white border-black/5 text-foreground"
                        )}>
                          {m.isLider ? "★" : j + 1}
                        </div>
                        <div className="flex flex-col">
                          <span className={cn("text-sm font-bold truncate leading-tight", m.isLider ? "text-amber-600 dark:text-amber-500" : "text-foreground")}>{m.nome}</span>
                          {m.isLider && <span className="text-[7px] font-black uppercase text-amber-500 leading-none mt-0.5">Líder</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
