import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useCatequizandos } from "@/hooks/useSupabaseData";
import { type EncontroStatus } from "@/lib/store";
import { ArrowLeft, Plus, CalendarDays, Eye, Play, Users, Search, X as XIcon, ChevronRight, BookOpen, Clock, FileText, BellRing, Sparkles, AlertTriangle, Feather, ChevronDown } from "lucide-react";
import { cn, formatarDataVigente } from "@/lib/utils";
import { useState, useMemo } from "react";

const STATUS_CONFIG: Record<EncontroStatus, { label: string; bg: string; text: string; dot: string; gradient: string; border: string }> = {
  pendente:    { label: "Pendente",    bg: "bg-slate-100/80",      text: "text-slate-600",          dot: "bg-slate-400",         gradient: "from-slate-200/50 to-slate-100/50", border: "border-slate-300" },
  realizado:   { label: "Realizado",   bg: "bg-emerald-500/15",   text: "text-emerald-700",       dot: "bg-emerald-500",      gradient: "from-emerald-500/20 to-teal-500/10", border: "border-emerald-500/40" },
  transferido: { label: "Transferido", bg: "bg-amber-500/15",     text: "text-amber-700",         dot: "bg-amber-500",        gradient: "from-amber-500/20 to-orange-500/10", border: "border-amber-500/40" },
  cancelado:   { label: "Cancelado",   bg: "bg-destructive/15",   text: "text-destructive",       dot: "bg-destructive",      gradient: "from-destructive/20 to-red-500/10",  border: "border-destructive/40"  },
};

const DIAS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
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

  const [alertConfig] = useState(() => {
    const saved = localStorage.getItem('ivc_alertas_config');
    return saved ? JSON.parse(saved) : { ativos: true, faltas: 3, presenca: true };
  });

  const totalAlunos = catequizandos.length || 1;

  const sorted = useMemo(
    () => [...encontros].sort((a, b) => parseLocalDate(a.data).getTime() - parseLocalDate(b.data).getTime()),
    [encontros]
  );

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

  const defaultExpandedKey = useMemo(() => {
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${now.getMonth()}`;
    const allGroupKeys = groups.map(([key]) => key);
    if (allGroupKeys.includes(currentKey)) return currentKey;
    return allGroupKeys[allGroupKeys.length - 1] ?? null;
  }, [groups]);

  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(() => new Set());

  const isExpanded = (key: string) => {
    if (search || filterMonth !== "todos") return true;
    if (key === defaultExpandedKey) {
      return !expandedMonths.has(`close:${key}`);
    }
    return expandedMonths.has(`open:${key}`);
  };

  const toggleMonth = (key: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (key === defaultExpandedKey) {
        if (next.has(`close:${key}`)) {
          next.delete(`close:${key}`);
        } else {
          next.add(`close:${key}`);
          next.delete(`open:${key}`);
        }
      } else {
        if (next.has(`open:${key}`)) {
          next.delete(`open:${key}`);
        } else {
          next.add(`open:${key}`);
          next.delete(`close:${key}`);
        }
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5 animate-bounce-subtle">
           <div className="w-6 h-6 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
        <p className="text-xs font-black text-primary/60 uppercase tracking-widest animate-pulse">Carregando Encontros...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="space-y-4 animate-fade-in flex flex-col pt-4">
        <div className="flex items-center justify-center min-h-[44px] relative">
          <button onClick={() => navigate(`/turmas/${id}`)} className="back-btn absolute left-0">
            <ArrowLeft className="h-5 w-5 text-black" />
          </button>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-xl font-black text-foreground tracking-tight uppercase">Encontros</h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">{encontros.length} encontros</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-4 pt-2 border-t border-black/5">
          <button onClick={() => navigate(`/turmas/${id}/encontros/novo`)} className="action-btn-sm shrink-0 shadow-md hover:shadow-lg">
            <Plus className="h-4 w-4" /> Novo
          </button>
        </div>
      </div>

      {encontros.length > 0 && (
        <div className="space-y-3 animate-float-up" style={{ animationDelay: "80ms" }}>
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
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          {availableMonths.length > 0 && (
            <div className="flex items-center">
              <div className="relative inline-flex items-center bg-white border border-slate-200 rounded-full transition-all shadow-sm">
                <span className="pl-4 pr-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground pointer-events-none">Filtro:</span>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="appearance-none bg-transparent font-bold text-xs text-primary pr-9 py-2 outline-none cursor-pointer"
                >
                  <option value="todos">Todos os Meses</option>
                  {availableMonths.map((m) => (
                    <option key={m.key} value={m.key} className="capitalize">{m.label}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 flex items-center text-muted-foreground">
                  <ChevronRight className="h-3.5 w-3.5 rotate-90" />
                </div>
              </div>
            </div>
          )}
          {(search || filterMonth !== "todos") && (
            <p className="text-[11px] text-muted-foreground px-1">
              {filtered.length === 0 ? "Nenhum encontro encontrado" : `${filtered.length} encontro${filtered.length !== 1 ? "s" : ""} encontrado${filtered.length !== 1 ? "s" : ""}`}
            </p>
          )}
        </div>
      )}

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
        <div className="space-y-6">
          {groups.map(([monthKey, { monthLabel, items }], gi) => {
            const expanded = isExpanded(monthKey);
            const isDefault = monthKey === defaultExpandedKey;
            return (
              <div key={monthKey} className="space-y-3">
                <button
                  onClick={() => toggleMonth(monthKey)}
                  className="w-full flex items-center gap-2 my-1 group"
                >
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-primary/30" />
                  <div className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-2xl shadow-lg border overflow-hidden transition-all duration-300",
                    isDefault && expanded
                      ? "bg-gradient-to-r from-primary/90 to-primary/70 border-primary/20"
                      : "bg-gradient-to-r from-primary/55 to-primary/40 border-primary/15 group-hover:from-primary/70 group-hover:to-primary/55"
                  )}>
                    <div className="absolute -left-2 -top-2 w-8 h-8 rounded-full bg-white/10 pointer-events-none" />
                    <div className="absolute -right-1 -bottom-2 w-6 h-6 rounded-full bg-white/10 pointer-events-none" />
                    <Feather className="w-3.5 h-3.5 text-white/80 relative z-10 shrink-0" />
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.15em] relative z-10">{monthLabel}</h3>
                    <span className="text-[10px] font-black bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/20 relative z-10 shrink-0">{items.length}</span>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-white/80 relative z-10 shrink-0 transition-transform duration-300 ml-0.5",
                        expanded ? "rotate-180" : "rotate-0"
                      )}
                    />
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent via-primary/20 to-primary/30" />
                </button>

                <div
                  className={cn(
                    "overflow-hidden transition-all duration-500 ease-in-out",
                    expanded ? "max-h-[9999px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                  )}
                >
                  <div className="space-y-4 pt-1">
                    {items.map((enc, i) => {
                      const status = STATUS_CONFIG[enc.status] || STATUS_CONFIG.pendente;
                      const presPct = Math.round(((enc.presencas || []).length / totalAlunos) * 100);
                      const d = parseLocalDate(enc.data);
                      const diaSemana = DIAS_PT[d.getDay()];
                      const dia = String(d.getDate()).padStart(2, "0");
                      const mes = MESES_PT[d.getMonth()].slice(0, 3).toUpperCase();
                      const tempoTotal = enc.roteiro?.reduce((s: number, r: any) => s + (r.tempo || 0), 0) || 0;
                      const hasEval = !!(enc.avaliacao && (enc.avaliacao.conclusao || enc.avaliacao.pontosPositivos || enc.avaliacao.pontosMelhorar));
                      const isAvaliado = hasEval;

                      const cfg = alertConfig.moduloEncontros || { ativo: true, presenca: true, avaliacao: true, status: true };
                      const nowTime = new Date().getTime();
                      const noPresence = (enc.presencas || []).length === 0;
                      
                      let hasNoPresenceAlert = false;
                      let hasNoEvaluationAlert = false;
                      let hasStatusAlert = false;
                      
                      if (cfg?.ativo) {
                        if (cfg.presenca && noPresence) {
                          if (enc.status === 'realizado') hasNoPresenceAlert = true;
                          else if (enc.status === 'pendente' && nowTime > d.getTime() + 86400000) hasNoPresenceAlert = true;
                        }
                        if (cfg.avaliacao && enc.status === 'realizado' && !isAvaliado) {
                           hasNoEvaluationAlert = true;
                        }
                        if (cfg.status && enc.status === 'pendente' && nowTime > d.getTime() + 86400000) {
                           hasStatusAlert = true;
                        }
                      }

                      return (
                          <div
                            key={enc.id}
                            className={cn(
                              "relative p-[1px] rounded-2xl animate-float-up transition-all duration-300 hover:-translate-y-0.5 group shadow-[0_6px_24px_rgb(0,0,0,0.08)] hover:shadow-[0_12px_35px_rgb(0,0,0,0.12)] border-2",
                              status.border,
                              "bg-card"
                            )}
                          style={{ animationDelay: `${(gi * 3 + i) * 55}ms` }}
                        >
                          <div className="absolute inset-[3px] rounded-xl border border-white/40 dark:border-white/5 z-20 pointer-events-none opacity-50 mix-blend-overlay" />

                          <div className="relative rounded-[14px] bg-card overflow-hidden">
                            <div className="flex flex-col">
                              {hasNoPresenceAlert && (
                                <div className="bg-destructive/10 border-b border-destructive/20 py-1.5 px-3 flex justify-center items-center gap-1.5 animate-pulse">
                                  <BellRing className="w-3 h-3 text-destructive" />
                                  <span className="text-[9px] font-black uppercase tracking-widest text-destructive">Chamada pendente</span>
                                </div>
                              )}
                              {hasNoEvaluationAlert && (
                                <div className="bg-amber-500/10 border-b border-amber-500/20 py-1.5 px-3 flex justify-center items-center gap-1.5 animate-pulse">
                                  <Sparkles className="w-3 h-3 text-amber-600" />
                                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-600">Avaliação pendente</span>
                                </div>
                              )}
                              {hasStatusAlert && (
                                <div className="bg-orange-500/10 border-b border-orange-500/20 py-1.5 px-3 flex justify-center items-center gap-1.5 animate-pulse">
                                  <AlertTriangle className="w-3 h-3 text-orange-600" />
                                  <span className="text-[9px] font-black uppercase tracking-widest text-orange-600">Encontro atrasado</span>
                                </div>
                              )}
                              <div className="flex items-stretch bg-white">
                                <div className="flex flex-col items-center justify-center px-4 py-5 border-r-2 border-black/10 shrink-0 min-w-[70px]">
                                  <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest leading-none">{diaSemana}</span>
                                  <span className="text-3xl font-black text-foreground leading-tight mt-0.5">{dia}</span>
                                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{mes}</span>
                                </div>

                                <div className="flex-1 px-4 py-4 min-w-0 flex flex-col items-center text-center justify-center">
                                  <div className="flex justify-center items-center gap-2 mb-2">
                                    <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${status.text}`}>
                                      <span className={`w-2 h-2 rounded-full inline-block shrink-0 ${status.dot}`} />
                                      {status.label}
                                    </span>
                                  </div>

                                  <p className={`text-[17px] font-black leading-snug mb-3 ${enc.status === "cancelado" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                    {enc.tema}
                                  </p>

                                  <div className="flex flex-wrap items-center justify-center gap-2 mt-auto mb-1">
                                    {enc.leituraBiblica && (
                                      <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                                        <BookOpen className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate max-w-[120px]">{enc.leituraBiblica}</span>
                                      </span>
                                    )}
                                    {tempoTotal > 0 && (
                                      <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                                        <Clock className="h-3.5 w-3.5 shrink-0" />{tempoTotal}min
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/10 whitespace-nowrap">
                                      <Users className="h-3.5 w-3.5 shrink-0" />{presPct}%
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="px-4 pb-4 mt-2">
                                <div className="flex items-center justify-end gap-3">
                                    <button
                                      onClick={() => navigate(`/turmas/${id}/encontros/${enc.id}`)}
                                      className="w-[100px] py-2 px-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white hover:bg-emerald-600 border border-emerald-600 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-1.5"
                                    >
                                      <Eye className="h-3.5 w-3.5 mb-px" /> Abrir
                                    </button>

                                    <button
                                      onClick={() => navigate(`/turmas/${id}/encontros/${enc.id}/apresentacao`)}
                                      className="w-[110px] py-2 px-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-violet-600 text-white hover:bg-violet-700 border border-violet-700 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-1.5"
                                    >
                                      <Play className="h-3.5 w-3.5 mb-px" /> Apresentar
                                    </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
