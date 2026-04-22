import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useCatequizandos } from "@/hooks/useSupabaseData";
import { type EncontroStatus } from "@/lib/store";
import { ArrowLeft, Plus, CalendarDays, Eye, Play, Users, Search, X, ChevronRight, BookOpen, Clock, FileText, BellRing, Sparkles, AlertTriangle, Feather } from "lucide-react";
import { cn, formatarDataVigente } from "@/lib/utils";
import { useState, useMemo } from "react";
import ReportModule from "@/components/reports/ReportModule";

const STATUS_CONFIG: Record<EncontroStatus, { label: string; bg: string; text: string; dot: string; gradient: string }> = {
  pendente:    { label: "Pendente",    bg: "bg-slate-100/80",      text: "text-slate-600",          dot: "bg-slate-400",         gradient: "from-slate-200/50 to-slate-100/50" },
  realizado:   { label: "Realizado",   bg: "bg-emerald-500/15",   text: "text-emerald-700",       dot: "bg-emerald-500",      gradient: "from-emerald-500/20 to-teal-500/10" },
  transferido: { label: "Transferido", bg: "bg-amber-500/15",     text: "text-amber-700",         dot: "bg-amber-500",        gradient: "from-amber-500/20 to-orange-500/10" },
  cancelado:   { label: "Cancelado",   bg: "bg-destructive/15",   text: "text-destructive",       dot: "bg-destructive",      gradient: "from-destructive/20 to-red-500/10"  },
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
    <div className="space-y-5">
      {/* Header Compacto Reorganizado */}
      <div className="space-y-3 animate-fade-in flex flex-col pt-2">
        {/* Row 1: Back Button + Título (Centralizado) */}
        <div className="flex items-center justify-center min-h-[40px] relative">
          <button onClick={() => navigate(`/turmas/${id}`)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border-2 border-black/5 shadow-sm active:scale-90 transition-all absolute left-0">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          
          <div className="flex flex-col items-center">
            <h1 className="text-2xl font-black text-foreground tracking-tight">Encontros</h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{encontros.length} encontros</p>
          </div>
        </div>

        {/* Row 2: Relatórios (Esquerda) + Novo (Direita) */}
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-black/5">
          {id && (
            <ReportModule 
              context="encontros" 
              turmaId={id} 
              trigger={
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 shadow-sm hover:shadow-md active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest">
                  <FileText className="h-3.5 w-3.5" />
                  Relatórios
                </button>
              }
            />
          )}

          <button 
            onClick={() => navigate(`/turmas/${id}/encontros/novo`)} 
            className="action-btn-sm shrink-0 shadow-md hover:shadow-lg"
          >
            <Plus className="h-4 w-4" /> Novo
          </button>
        </div>
      </div>

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

          {/* Filtro de Meses */}
          {availableMonths.length > 0 && (
            <div className="flex items-center">
              <div className="relative inline-flex items-center bg-card border border-black/15 hover:border-black/30 rounded-full transition-all shadow-sm">
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
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-slate-300" />
                <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shadow-sm">
                  <Feather className="w-3 h-3 text-primary/70" />
                  <h3 className="text-xs font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-[0.18em]">{monthLabel}</h3>
                  <span className="text-[10px] font-bold text-slate-400 ml-1">({items.length})</span>
                </div>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-200 to-slate-300" />
              </div>

              {/* Cards Litúrgicos */}
              <div className="space-y-4">
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
                        "relative p-[2px] rounded-2xl animate-float-up transition-all duration-300 hover:-translate-y-0.5 group shadow-[0_6px_24px_rgb(0,0,0,0.08)] hover:shadow-[0_12px_35px_rgb(0,0,0,0.12)]",
                        "bg-black/10 shadow-black/5"
                      )}
                      style={{ animationDelay: `${(gi * 3 + i) * 55}ms` }}
                    >
                      {/* Moldura litúrgica interna */}
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
                            {/* Coluna da data */}
                            <div className="flex flex-col items-center justify-center px-4 py-5 border-r-2 border-black/10 shrink-0 min-w-[70px]">
                              <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest leading-none">{diaSemana}</span>
                              <span className="text-3xl font-black text-foreground leading-tight mt-0.5">{dia}</span>
                              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{mes}</span>
                            </div>

                            {/* Conteúdo principal */}
                            <div className="flex-1 px-4 py-4 min-w-0 flex flex-col items-center text-center justify-center">
                              {/* Status badge */}
                              <div className="flex justify-center items-center gap-2 mb-2">
                                <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ${status.text}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${status.dot}`} />
                                  {status.label}
                                </span>
                              </div>

                              {/* Tema */}
                              <p className={`text-base font-bold leading-snug mb-3 ${enc.status === "cancelado" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                {enc.tema}
                              </p>

                              {/* Meta-info linha */}
                              <div className="flex flex-wrap items-center justify-center gap-2 mt-auto mb-1">
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
                            </div>
                          </div>

                          {/* Chips Ações Separadas na Base do Card */}
                          <div className="px-3 pb-3">
                            <div className="flex flex-wrap items-center justify-center gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); navigate(`/turmas/${id}/encontros/${enc.id}?eval=true`); }}
                                  className={cn(
                                    "flex-1 min-w-[30%] py-2 px-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] hover:shadow-md",
                                    isAvaliado 
                                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200" 
                                      : "bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200"
                                  )}
                                >
                                  <FileText className="h-3.5 w-3.5 mb-px" />
                                  {isAvaliado ? 'Avaliado' : 'Avaliar'}
                                </button>

                                <button
                                  onClick={() => navigate(`/turmas/${id}/encontros/${enc.id}`)}
                                  className="flex-1 min-w-[30%] py-2 px-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-400 transition-all shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] hover:shadow-md flex items-center justify-center gap-1.5"
                                >
                                  <Eye className="h-3.5 w-3.5 mb-px" /> Abrir
                                </button>

                                <button
                                  onClick={() => navigate(`/turmas/${id}/encontros/${enc.id}/apresentacao`)}
                                  className="flex-1 min-w-[30%] py-2 px-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-violet-100 text-violet-700 hover:bg-violet-200 border border-violet-200 transition-all shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] hover:shadow-md flex items-center justify-center gap-1.5"
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
          ))}
        </div>
      )}
    </div>
  );
}
