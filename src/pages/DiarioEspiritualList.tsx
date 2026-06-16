import { useParams, useNavigate } from "react-router-dom";
import { useDiarioEspiritual } from "@/hooks/useDiarioEspiritual";
import { ArrowLeft, Plus, Calendar, Pencil, Trash2, X, BookOpen, Sparkles, TrendingUp, ChevronDown, Crown } from "lucide-react";
import { formatarDataVigente } from "@/lib/utils";
import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { StarRating } from "@/components/StarRating";
import { cn } from "@/lib/utils";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { PremiumModal } from "@/components/PremiumModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type TipoKey = "encontro" | "evento" | "evolucao";

const TIPO_CONFIG: Record<TipoKey, {
  label: string;
  emoji: string;
  icon: React.ElementType;
  gradient: string;
  gradientLight: string;
  textColor: string;
  borderColor: string;
  accentColor: string;
  badgeBg: string;
  chipBg: string;
  shadowColor: string;
  ringColor: string;
}> = {
  encontro: {
    label: "Encontro",
    emoji: "📖",
    icon: BookOpen,
    gradient: "from-indigo-600 to-indigo-800",
    gradientLight: "from-indigo-50 to-indigo-100/60",
    textColor: "text-indigo-700",
    borderColor: "border-indigo-500/25",
    accentColor: "bg-indigo-600",
    badgeBg: "bg-indigo-600",
    chipBg: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20",
    shadowColor: "shadow-indigo-500/30",
    ringColor: "ring-indigo-500",
  },
  evento: {
    label: "Evento",
    emoji: "✨",
    icon: Sparkles,
    gradient: "from-amber-500 to-orange-600",
    gradientLight: "from-amber-50 to-orange-100/60",
    textColor: "text-amber-700",
    borderColor: "border-amber-500/25",
    accentColor: "bg-amber-500",
    badgeBg: "bg-amber-500",
    chipBg: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    shadowColor: "shadow-amber-500/30",
    ringColor: "ring-amber-500",
  },
  evolucao: {
    label: "Evolução",
    emoji: "🌱",
    icon: TrendingUp,
    gradient: "from-emerald-600 to-teal-700",
    gradientLight: "from-emerald-50 to-teal-100/60",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-500/25",
    accentColor: "bg-emerald-600",
    badgeBg: "bg-emerald-600",
    chipBg: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    shadowColor: "shadow-emerald-500/30",
    ringColor: "ring-emerald-500",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTipo(item: any): TipoKey {
  if (item.tipo_registro === "evento") return "evento";
  if (item.tipo_registro === "evolucao") return "evolucao";
  return "encontro";
}

function getTitulo(item: any): string {
  const tipo = getTipo(item);
  if (tipo === "encontro") return item.encontros ? item.encontros.tema : "Registro Avulso";
  if (tipo === "evento") return item.evento_nome ? item.evento_nome : "Registro de Evento";
  return "Evolução Espiritual";
}

function getMonthKey(dateStr: string): string {
  if (!dateStr) return "0000-00";
  return dateStr.slice(0, 7);
}

function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

// ─── RecordItem ───────────────────────────────────────────────────────────────

function RecordItem({ item, onView, delay }: { item: any; onView: (i: any) => void; delay: number }) {
  const tipo = getTipo(item);
  const cfg = TIPO_CONFIG[tipo];
  const Icon = cfg.icon;
  return (
    <button
      onClick={() => onView(item)}
      className="w-full text-left group animate-float-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cn(
        "relative flex items-center gap-3 bg-white rounded-2xl border p-3.5 shadow-sm transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]",
        cfg.borderColor
      )}>
        {/* Accent line */}
        <div className={cn("absolute left-0 top-3 bottom-3 w-[3px] rounded-full", cfg.accentColor)} />
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ml-2", `bg-gradient-to-br ${cfg.gradient}`)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-xs font-black uppercase tracking-widest mb-0.5", cfg.textColor)}>
            {cfg.label}
          </p>
          <p className="text-sm font-bold text-zinc-800 truncate">{getTitulo(item)}</p>
          <p className="text-[10px] text-zinc-400 font-medium mt-0.5 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {item.data_registro ? formatarDataVigente(item.data_registro) : "Sem data"}
          </p>
        </div>
        <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center shrink-0", `bg-gradient-to-br ${cfg.gradient}`)}>
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  );
}

// ─── MonthBlock ───────────────────────────────────────────────────────────────

function MonthBlock({ monthKey, items, onView }: { monthKey: string; items: any[]; onView: (i: any) => void }) {
  const [openTipo, setOpenTipo] = useState<TipoKey | null>(null);

  const byTipo = useMemo(() => ({
    encontro: items.filter((i) => getTipo(i) === "encontro"),
    evento:   items.filter((i) => getTipo(i) === "evento"),
    evolucao: items.filter((i) => getTipo(i) === "evolucao"),
  }), [items]);

  const toggle = (tipo: TipoKey) => setOpenTipo((prev) => (prev === tipo ? null : tipo));

  return (
    <div className="space-y-4 animate-float-up">
      {/* Month Label */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 capitalize px-1">
          {formatMonthLabel(monthKey)}
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />
      </div>

      {/* 3 summary cards */}
      <div className="grid grid-cols-3 gap-2.5">
        {(["encontro", "evento", "evolucao"] as TipoKey[]).map((tipo) => {
          const cfg = TIPO_CONFIG[tipo];
          const count = byTipo[tipo].length;
          const isOpen = openTipo === tipo;
          return (
            <button
              key={tipo}
              disabled={count === 0}
              onClick={() => count > 0 && toggle(tipo)}
              className={cn(
                "relative overflow-hidden rounded-2xl p-4 text-center transition-all duration-300 flex flex-col items-center gap-2",
                count === 0
                  ? "opacity-40 cursor-default border border-zinc-100 bg-zinc-50"
                  : isOpen
                  ? cn("border-transparent shadow-xl scale-[1.02] ring-2 ring-offset-2", cfg.shadowColor, cfg.ringColor, `bg-gradient-to-br ${cfg.gradient}`)
                  : cn("bg-white border-transparent ring-1 ring-inset ring-black/5 hover:ring-black/15 shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-95", cfg.shadowColor)
              )}
            >
              {/* Glow when open */}
              {isOpen && (
                <div className="absolute inset-0 opacity-20 bg-white rounded-2xl" />
              )}
              <span className="text-2xl leading-none relative z-10">{cfg.emoji}</span>
              <span className={cn(
                "text-2xl font-black leading-none relative z-10",
                isOpen ? "text-white" : cfg.textColor
              )}>
                {count}
              </span>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest leading-none relative z-10",
                isOpen ? "text-white/80" : "text-zinc-400"
              )}>
                {cfg.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Expanded records list */}
      {openTipo && byTipo[openTipo].length > 0 && (
        <div className="space-y-2 animate-float-up">
          {/* Header bar of open type */}
          <div className={cn(
            "flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r",
            TIPO_CONFIG[openTipo].gradient
          )}>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              {byTipo[openTipo].length} {TIPO_CONFIG[openTipo].label}{byTipo[openTipo].length > 1 ? "s" : ""}
            </span>
            <button
              onClick={() => setOpenTipo(null)}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <ChevronDown className="w-3 h-3 text-white" />
            </button>
          </div>
          {byTipo[openTipo].map((item, i) => (
            <RecordItem key={item.id} item={item} onView={onView} delay={i * 40} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DiarioEspiritualList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { diarios = [], isLoading, excluirDiario } = useDiarioEspiritual(id!);
  const { isPremium, isLoading: isLoadingPremium } = usePremiumStatus();

  const [viewItem, setViewItem] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const confirmDelete = async () => {
    if (!itemToDeleteId) return;
    await excluirDiario.mutateAsync(itemToDeleteId);
    setViewItem(null);
    setDeleteConfirmOpen(false);
    setItemToDeleteId(null);
  };

  const groupedByMonth = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const item of diarios) {
      const key = getMonthKey(item.data_registro || "");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [diarios]);

  if (isLoadingPremium) {
    return <div className="p-8 text-center animate-pulse text-muted-foreground">Verificando acesso...</div>;
  }

  const handleActionClick = (action: () => void) => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    action();
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="space-y-4 animate-fade-in flex flex-col pt-4">
        <div className="flex items-center justify-center min-h-[44px] relative">
          <button 
            onClick={() => navigate(`/turmas/${id}`)} 
            className="back-btn absolute left-0"
          >
            <ArrowLeft className="h-5 w-5 text-black" />
          </button>
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="flex items-center gap-2 justify-center">
              <h1 className="text-xl font-black text-foreground tracking-tight uppercase">Diário do Catequista</h1>
              {!isPremium && (
                <div className="flex items-center gap-0.5 bg-amber-400/90 dark:bg-amber-500/80 text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full shadow-sm">
                  <Crown className="w-2.5 h-2.5" />
                  <span>Premium</span>
                </div>
              )}
            </div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
              {diarios.length} {diarios.length === 1 ? "registro" : "registros"}
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => handleActionClick(() => navigate(`/turmas/${id}/diario/novo`))}
            className="action-btn-sm shrink-0 whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="h-4 w-4" /> Novo Registro
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-3 animate-pulse">
              <div className="h-3 w-28 bg-zinc-100 rounded-full mx-auto" />
              <div className="grid grid-cols-3 gap-2.5">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-24 bg-zinc-100 rounded-2xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : diarios.length === 0 ? (
        /* Empty */
        <div className="flex flex-col items-center py-20 gap-5 text-center animate-float-up">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-xl border-2 border-white ring-4 ring-indigo-500/10">
              <img src="/icone_diario.png" alt="Diário" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
              <Plus className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <p className="text-base font-black text-foreground">Nenhum registro ainda</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-[220px]">
              Comece documentando os encontros e a evolução da sua turma
            </p>
          </div>
          <button
            onClick={() => handleActionClick(() => navigate(`/turmas/${id}/diario/novo`))}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-black text-sm shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/40 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" /> Criar Primeiro Registro
          </button>
        </div>
      ) : (
        <div className="space-y-7">
          {groupedByMonth.map(([monthKey, items]) => (
            <MonthBlock key={monthKey} monthKey={monthKey} items={items} onView={(item) => handleActionClick(() => setViewItem(item))} />
          ))}
        </div>
      )}

      {/* ─── Detail Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent hideClose className="rounded-2xl border-border/30 p-0 overflow-hidden max-h-[90vh] overflow-y-auto max-w-2xl w-[95vw]">
          {viewItem && (() => {
            const tipo = getTipo(viewItem);
            const cfg = TIPO_CONFIG[tipo];
            const Icon = cfg.icon;
            return (
              <div className="flex flex-col bg-background rounded-2xl overflow-hidden">
                {/* Gradient header bar */}
                <div className={cn("h-1.5 w-full bg-gradient-to-r", cfg.gradient)} />

                <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3.5 border-b border-black/5 bg-background/95 backdrop-blur-md">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br", cfg.gradient)}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className={cn("text-sm font-black uppercase tracking-wider", cfg.textColor)}>{cfg.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => navigate(`/turmas/${id}/diario/${viewItem.id}/editar`)} className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => { setItemToDeleteId(viewItem.id); setDeleteConfirmOpen(true); }} className="p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="w-px h-4 bg-black/10 mx-1" />
                    <button onClick={() => setViewItem(null)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border-2 border-black/5 shadow-md text-foreground hover:bg-zinc-50 transition-all active:scale-90">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-5">
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border", cfg.chipBg)}>
                        <Icon className="w-3 h-3" /> {cfg.label}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-500">
                        <Calendar className="w-3 h-3" /> {viewItem.data_registro ? formatarDataVigente(viewItem.data_registro) : "Sem data"}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-foreground leading-tight tracking-tight">
                      {getTitulo(viewItem)}
                    </h2>
                  </div>

                  {/* Como foi */}
                  {viewItem.como_foi && tipo !== "evolucao" && (
                    <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100">
                      <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                        {tipo === "evento" ? "Como foi o evento" : "Como foi o encontro"}
                      </h4>
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{viewItem.como_foi}</p>
                    </div>
                  )}

                  {/* Positivos / Negativos */}
                  {tipo !== "evolucao" && (viewItem.pontos_positivos || viewItem.pontos_negativos) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {viewItem.pontos_positivos && (
                        <div className="bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/15">
                          <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2">Pontos Positivos</h4>
                          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{viewItem.pontos_positivos}</p>
                        </div>
                      )}
                      {viewItem.pontos_negativos && (
                        <div className="bg-red-500/5 rounded-2xl p-4 border border-red-500/15">
                          <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">Pontos a Melhorar</h4>
                          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{viewItem.pontos_negativos}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Avaliação participação */}
                  {tipo !== "evolucao" && Array.isArray(viewItem.avaliacoes_catequizandos) && viewItem.avaliacoes_catequizandos.length > 0 && (
                    <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm">
                      <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Avaliação de Participação</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {viewItem.avaliacoes_catequizandos.map((av: any) => (
                          <div key={av.catequizando_id} className="bg-zinc-50 rounded-xl p-3 border border-zinc-100 flex flex-col gap-3">
                            <div className="font-bold text-sm text-foreground truncate">{av.nome}</div>
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-bold text-zinc-400 uppercase">
                              <div className="flex flex-col gap-1"><span>Pontualidade</span><StarRating size="sm" readOnly value={av.pontualidade} /></div>
                              <div className="flex flex-col gap-1"><span>Participação</span><StarRating size="sm" readOnly value={av.participacao_grupo} /></div>
                              <div className="flex flex-col gap-1"><span>Engajamento</span><StarRating size="sm" readOnly value={av.engajamento} /></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evolução */}
                  {tipo === "evolucao" && Array.isArray(viewItem.evolucao_catequizandos) && viewItem.evolucao_catequizandos.length > 0 && (
                    <div className="bg-emerald-600/5 rounded-2xl p-5 border border-emerald-600/10">
                      <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-4">Evolução dos Catequizandos</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {viewItem.evolucao_catequizandos.map((ev: any) => (
                          <div key={ev.catequizando_id} className="bg-white/70 rounded-xl p-3 border border-emerald-600/10 flex flex-col gap-3">
                            <div className="font-bold text-sm text-emerald-800 truncate">{ev.nome}</div>
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-bold text-emerald-600/80 uppercase">
                              <div className="flex flex-col gap-1"><span>Espiritual</span><StarRating color="text-emerald-500" size="sm" readOnly value={ev.evolucao_espiritual} /></div>
                              <div className="flex flex-col gap-1"><span>Comportamental</span><StarRating color="text-emerald-500" size="sm" readOnly value={ev.evolucao_comportamental} /></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tipo === "evolucao" && viewItem.evolucao_espiritual && (
                    <div className="bg-emerald-600/5 rounded-2xl p-4 border border-emerald-600/10">
                      <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2">Notas sobre Evolução</h4>
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{viewItem.evolucao_espiritual}</p>
                    </div>
                  )}

                  {tipo !== "evolucao" && viewItem.observacoes_catequizandos && (
                    <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                      <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Observações Gerais</h4>
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{viewItem.observacoes_catequizandos}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDelete}
        itemName="este registro do diário"
        isLoading={excluirDiario.isPending}
      />

      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)}
        title="Diário Espiritual Bloqueado" 
        description="Acompanhe a evolução individual de cada catequizando, anote pontos fortes e áreas de melhoria de cada encontro ativando o Premium."
        icon={<BookOpen className="h-10 w-10 text-primary" />}
      />
    </div>
  );
}
