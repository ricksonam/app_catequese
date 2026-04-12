import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useCatequizandos } from "@/hooks/useSupabaseData";
import { type EncontroStatus } from "@/lib/store";
import { ArrowLeft, Plus, CalendarDays, Eye, Play, Users, Search, X, ChevronRight, BookOpen, Clock, FileText } from "lucide-react";
import { cn, formatarDataVigente } from "@/lib/utils";
import { useState, useMemo } from "react";

const STATUS_CONFIG: Record<EncontroStatus, { label: string; bg: string; text: string; dot: string; gradient: string }> = {
  pendente:    { label: "Pendente",    bg: "bg-muted/60",         text: "text-muted-foreground",  dot: "bg-muted-foreground", gradient: "from-slate-400/20 to-slate-500/10" },
  realizado:   { label: "Realizado",   bg: "bg-emerald-500/15",   text: "text-emerald-700",       dot: "bg-emerald-500",      gradient: "from-emerald-500/20 to-teal-500/10" },
  transferido: { label: "Transferido", bg: "bg-amber-500/15",     text: "text-amber-700",         dot: "bg-amber-500",        gradient: "from-amber-500/20 to-orange-500/10" },
  cancelado:   { label: "Cancelado",   bg: "bg-destructive/15",   text: "text-destructive",       dot: "bg-destructive",      gradient: "from-destructive/20 to-red-500/10"  },
};

const DIAS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function parseLocalDate(dateStr: string) {
  const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function EncontrosList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: turmas = [] } = useTurmas();
  const { data: encontros = [], isLoading } = useEncontros(id);
  const { data: catequizandos = [] } = useCatequizandos(id);
  const turma = turmas.find((t) => t.id === id);

  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("todos");

  const totalAlunos = catequizandos.length || 1;

  const sorted = useMemo(
    () => [...encontros].sort((a, b) => parseLocalDate(a.data).getTime() - parseLocalDate(b.data).getTime()),
    [encontros]
  );

  // Meses disponíveis
  const availableMonths = useMemo(() => {
    const seen = new Set<string>();
    sorted.forEach((enc) => {
      const d = parseLocalDate(enc.data);
      seen.add(`${d.getFullYear()}-${d.getMonth()}`);
    });
    return Array.from(seen).map((key) => {
      const [y, m] = key.split("-").map(Number);
      return { key, label: `${MESES_PT[m]} ${y}`, year: y, month: m };
    });
  }, [sorted]);

  const filtered = useMemo(() => {
    return sorted.filter((enc) => {
      const d = parseLocalDate(enc.data);
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      const matchMonth = filterMonth === "todos" || monthKey === filterMonth;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        enc.tema?.toLowerCase().includes(q) ||
        formatarDataVigente(enc.data).toLowerCase().includes(q) ||
        enc.leituraBiblica?.toLowerCase().includes(q);
      return matchMonth && matchSearch;
    });
  }, [sorted, filterMonth, search]);

  // Agrupa por mês/ano (após filtro)
  const groups = useMemo(() => {
    const g: Record<string, { monthLabel: string; items: typeof filtered }> = {};
    filtered.forEach((enc) => {
      const d = parseLocalDate(enc.data);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!g[key]) g[key] = { monthLabel: `${MESES_PT[d.getMonth()]} ${d.getFullYear()}`, items: [] };
      g[key].items.push(enc);
    });
    return Object.entries(g);
  }, [filtered]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 rounded-lg bg-primary/20 animate-pulse" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/turmas/${id}`)} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Encontros</h1>
            <p className="text-xs text-muted-foreground">{turma?.nome} • {encontros.length} encontros</p>
          </div>
        </div>
      </div>

      <button onClick={() => navigate(`/turmas/${id}/encontros/novo`)} className="w-full action-btn animate-float-up">
        <Plus className="h-4 w-4" /> Novo Encontro
      </button>

      {/* Busca e Filtros */}
      {encontros.length > 0 && (
        <div className="space-y-3 animate-float-up" style={{ animationDelay: "80ms" }}>
          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por tema, data ou leitura bíblica..."
              className="w-full h-11 pl-10 pr-10 rounded-2xl border border-black/15 bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Chips de mês */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            <button
              onClick={() => setFilterMonth("todos")}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                filterMonth === "todos"
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card border-black/15 text-muted-foreground hover:border-black/30"
              }`}
            >
              Todos os Meses
            </button>
            {availableMonths.map((m) => (
              <button
                key={m.key}
                onClick={() => setFilterMonth(m.key)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border-2 transition-all capitalize ${
                  filterMonth === m.key
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card border-black/15 text-muted-foreground hover:border-black/30"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Resumo dos resultados */}
          {(search || filterMonth !== "todos") && (
            <p className="text-[11px] text-muted-foreground px-1">
              {filtered.length === 0 ? "Nenhum encontro encontrado" : `${filtered.length} encontro${filtered.length !== 1 ? "s" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`}
            </p>
          )}
        </div>
      )}

      {/* Lista vazia */}
      {encontros.length === 0 ? (
        <div className="empty-state animate-float-up" style={{ animationDelay: "100ms" }}>
          <div className="icon-box bg-primary/10 text-primary mx-auto mb-3"><CalendarDays className="h-6 w-6" /></div>
          <p className="text-sm font-medium text-muted-foreground">Nenhum encontro cadastrado</p>
          <p className="text-xs text-muted-foreground mt-1">Crie seu primeiro encontro ou use um modelo da biblioteca</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="float-card p-8 text-center animate-float-up">
          <div className="icon-box bg-muted/50 mx-auto mb-3"><Search className="h-5 w-5 text-muted-foreground" /></div>
          <p className="text-sm font-semibold text-muted-foreground">Nenhum resultado para os filtros aplicados</p>
          <button onClick={() => { setSearch(""); setFilterMonth("todos"); }} className="text-xs text-primary font-bold mt-2">
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(([monthKey, { monthLabel, items }], gi) => (
            <div key={monthKey} className="space-y-3">
              {/* Separador de mês estilo litúrgico */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/25 to-primary/40" />
                <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 shadow-sm">
                  <span className="text-[9px] text-primary/70">✝</span>
                  <h3 className="text-xs font-extrabold text-primary uppercase tracking-[0.18em]">{monthLabel}</h3>
                  <span className="text-[10px] font-bold text-primary/50 ml-1">({items.length})</span>
                </div>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent via-primary/25 to-primary/40" />
              </div>

              {/* Cards Litúrgicos */}
              <div className="space-y-3">
                {items.map((enc, i) => {
                  const status = STATUS_CONFIG[enc.status] || STATUS_CONFIG.pendente;
                  const presPct = Math.round(((enc.presencas || []).length / totalAlunos) * 100);
                  const d = parseLocalDate(enc.data);
                  const diaSemana = DIAS_PT[d.getDay()];
                  const dia = String(d.getDate()).padStart(2, "0");
                  const mes = MESES_PT[d.getMonth()].slice(0, 3).toUpperCase();
                  const tempoTotal = enc.roteiro?.reduce((s: number, r: any) => s + (r.tempo || 0), 0) || 0;
                  const isAvaliado = !!enc.avaliacao?.conclusao;

                  return (
                    <div
                      key={enc.id}
                      className={cn(
                        "relative p-[1.5px] rounded-2xl animate-float-up transition-all duration-300 hover:-translate-y-0.5 group shadow-[0_6px_24px_rgb(0,0,0,0.06)] hover:shadow-[0_12px_35px_rgb(0,0,0,0.10)]",
                        isAvaliado 
                          ? "bg-gradient-to-br from-gold/70 via-gold/30 to-primary/20 shadow-[0_10px_40px_rgba(212,175,55,0.25)] border-gold/40" 
                          : "bg-gradient-to-br from-[hsl(var(--gold))]/40 via-primary/20 to-primary/10"
                      )}
                      style={{ animationDelay: `${(gi * 3 + i) * 55}ms` }}
                    >
                      {/* Moldura litúrgica interna */}
                      <div className="absolute inset-[3px] rounded-xl border border-white/40 dark:border-white/5 z-20 pointer-events-none opacity-50 mix-blend-overlay" />

                      <div className="relative rounded-[14px] bg-card overflow-hidden">
                        {/* Faixa de status no topo */}
                        <div className={`h-1 w-full bg-gradient-to-r ${status.gradient}`} />

                        <div className="flex items-stretch gap-0">
                          {/* Coluna da data */}
                          <div className="flex flex-col items-center justify-center px-4 py-4 bg-gradient-to-b from-primary/5 to-primary/10 border-r border-black/5 shrink-0 min-w-[64px]">
                            <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest leading-none">{diaSemana}</span>
                            <span className="text-3xl font-black text-foreground leading-tight mt-0.5">{dia}</span>
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{mes}</span>
                          </div>

                          {/* Conteúdo principal */}
                          <div className="flex-1 px-4 py-3.5 min-w-0">
                            {/* Status badge */}
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ${status.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full inline-block ${status.dot}`} />
                                {status.label}
                              </span>
                              {isAvaliado && (
                                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                  Avaliado ✓
                                </span>
                              )}
                            </div>

                            {/* Tema */}
                            <p className={`text-sm font-bold leading-snug mb-2 ${enc.status === "cancelado" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                              {enc.tema}
                            </p>

                            {/* Meta-info linha */}
                            <div className="flex flex-wrap items-center gap-2">
                              {enc.leituraBiblica && (
                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <BookOpen className="h-3 w-3 shrink-0" />
                                  <span className="truncate max-w-[120px]">{enc.leituraBiblica}</span>
                                </span>
                              )}
                              {tempoTotal > 0 && (
                                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                  <Clock className="h-3 w-3" />{tempoTotal}min
                                </span>
                              )}
                              <span className="flex items-center gap-0.5 text-[10px] font-bold text-primary bg-primary/8 px-1.5 py-0.5 rounded-md border border-primary/10">
                                <Users className="h-3 w-3" />{presPct}%
                              </span>
                            </div>

                            {/* Botão de Avaliação Rápida */}
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/turmas/${id}/encontros/${enc.id}?eval=true`); }}
                              className={cn(
                                "mt-3 w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 border-2 transition-all active:scale-95",
                                isAvaliado 
                                  ? "bg-gold/10 border-gold/30 text-gold-700 hover:bg-gold/20" 
                                  : "bg-emerald-50 border-emerald-500/20 text-emerald-700 hover:bg-emerald-100"
                              )}
                            >
                              <FileText className="h-3.5 w-3.5" />
                              {isAvaliado ? 'Encontro já avaliado ✓' : 'Avaliar Agora'}
                            </button>
                          </div>

                          <div className="flex flex-col gap-px border-l border-black/5 shrink-0">
                            <button
                              onClick={() => navigate(`/turmas/${id}/encontros/${enc.id}`)}
                              className="flex-1 flex flex-col items-center justify-center gap-0.5 px-3.5 text-primary hover:bg-primary/8 transition-colors group/btn"
                            >
                              <Eye className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                              <span className="text-[8px] font-black uppercase tracking-wide">Abrir</span>
                            </button>
                            <div className="h-px bg-black/5" />
                            <button
                              onClick={() => navigate(`/turmas/${id}/encontros/${enc.id}/apresentacao`)}
                              className="flex-1 flex flex-col items-center justify-center gap-0.5 px-3.5 text-liturgical hover:bg-liturgical/8 transition-colors group/btn"
                            >
                              <Play className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                              <span className="text-[8px] font-black uppercase tracking-wide">Apresentar</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
