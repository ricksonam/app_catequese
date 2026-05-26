import { useParams, useNavigate } from "react-router-dom";
import { useDiarioEspiritual } from "@/hooks/useDiarioEspiritual";
import { ArrowLeft, Plus, Calendar, Pencil, Trash2, X, BookOpen, Sparkles, TrendingUp } from "lucide-react";
import { formatarDataVigente } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { StarRating } from "@/components/StarRating";
import { cn } from "@/lib/utils";

const TIPO_CONFIG = {
  encontro: {
    label: "Encontro",
    icon: BookOpen,
    cor: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    headerCor: "text-indigo-600",
    cardBorder: "border-indigo-500/20 hover:border-indigo-500/40",
    iconBg: "bg-indigo-500/10",
  },
  evento: {
    label: "Evento",
    icon: Sparkles,
    cor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    headerCor: "text-amber-600",
    cardBorder: "border-amber-500/20 hover:border-amber-500/40",
    iconBg: "bg-amber-500/10",
  },
  evolucao: {
    label: "Evolução",
    icon: TrendingUp,
    cor: "bg-emerald-600/10 text-emerald-600 border-emerald-600/20",
    headerCor: "text-emerald-600",
    cardBorder: "border-emerald-600/20 hover:border-emerald-600/40",
    iconBg: "bg-emerald-600/10",
  },
};

function getTipo(item: any): keyof typeof TIPO_CONFIG {
  if (item.tipo_registro === "evento") return "evento";
  if (item.tipo_registro === "evolucao") return "evolucao";
  return "encontro";
}

function getTitulo(item: any): string {
  const tipo = getTipo(item);
  if (tipo === "encontro") return item.encontros ? `Encontro: ${item.encontros.tema}` : "Registro Avulso";
  if (tipo === "evento") return item.evento_nome ? `Evento: ${item.evento_nome}` : "Registro de Evento";
  return "Evolução Espiritual e Comportamental";
}

export default function DiarioEspiritualList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { diarios = [], isLoading, excluirDiario } = useDiarioEspiritual(id!);

  const [viewItem, setViewItem] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!itemToDeleteId) return;
    await excluirDiario.mutateAsync(itemToDeleteId);
    setViewItem(null);
    setDeleteConfirmOpen(false);
    setItemToDeleteId(null);
  };

  return (
    <div className="space-y-5 pb-10">
      <div className="space-y-4 animate-fade-in flex flex-col pt-4">
        <div className="flex items-center justify-center min-h-[44px] relative">
          <button onClick={() => navigate(`/turmas/${id}`)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border-2 border-black/5 shadow-sm active:scale-90 transition-all absolute left-0">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-xl font-black text-foreground tracking-tight uppercase">Diário Espiritual</h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">{diarios.length} registros</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex-1 sm:flex-none"></div>
          <button onClick={() => navigate(`/turmas/${id}/diario/novo`)} className="action-btn-sm shrink-0 whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="h-4 w-4" /> Novo Registro
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-stretch bg-card/50 rounded-2xl border border-black/5 p-4 gap-4 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-muted shrink-0" />
              <div className="flex-1 space-y-2 py-1 flex flex-col justify-center">
                <div className="h-2 w-20 bg-muted rounded" />
                <div className="h-4 w-40 bg-muted rounded" />
                <div className="h-3 w-32 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : diarios.length === 0 ? (
        <div className="empty-state animate-float-up">
          <div className="mx-auto mb-3 w-16 h-16 rounded-2xl overflow-hidden shadow-sm border border-black/5">
            <img src="/icone_diario.png" alt="Diário" className="w-full h-full object-cover" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Nenhum registro no diário</p>
        </div>
      ) : (
        <div className="space-y-3">
          {diarios.map((item, i) => {
            const tipo = getTipo(item);
            const config = TIPO_CONFIG[tipo];
            const Icon = config.icon;
            return (
              <button
                key={item.id}
                onClick={() => setViewItem(item)}
                className="w-full text-left group animate-float-up"
                style={{ animationDelay: `${i * 55}ms` }}
              >
                <div className={cn("flex items-stretch bg-card rounded-2xl border shadow-sm group-hover:shadow-md transition-all active:scale-[0.98] overflow-hidden relative p-4 gap-4", config.cardBorder)}>
                  <div className={cn("w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center", config.iconBg)}>
                    <Icon className={cn("w-6 h-6", config.headerCor)} />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border", config.cor)}>
                        {config.label}
                      </span>
                      <span className="text-[10px] font-black text-muted-foreground/70 uppercase tracking-widest flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {item.data_registro ? formatarDataVigente(item.data_registro) : 'Sem data'}
                      </span>
                    </div>
                    <h3 className={cn("text-sm font-bold text-foreground truncate transition-colors group-hover:", config.headerCor)}>
                      {getTitulo(item)}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {tipo === "evolucao"
                        ? (item.evolucao_espiritual || "Avaliação de evolução")
                        : (item.como_foi || "Sem detalhes")}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent hideClose className="rounded-2xl border-border/30 p-0 overflow-hidden max-h-[90vh] overflow-y-auto max-w-2xl w-[95vw]">
          {viewItem && (() => {
            const tipo = getTipo(viewItem);
            const config = TIPO_CONFIG[tipo];
            const Icon = config.icon;
            return (
              <div className="flex flex-col h-full bg-background rounded-2xl overflow-hidden relative">
                <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3.5 border-b border-black/5 bg-background/90 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-4 h-4", config.headerCor)} />
                    <span className={cn("text-sm font-bold truncate pr-4", config.headerCor)}>{config.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 z-50">
                    <button onClick={() => navigate(`/turmas/${id}/diario/${viewItem.id}/editar`)} className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 transition-colors shadow-sm"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => { setItemToDeleteId(viewItem.id); setDeleteConfirmOpen(true); }} className="p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors shadow-sm"><Trash2 className="h-4 w-4" /></button>
                    <div className="w-px h-4 bg-black/10 mx-1" />
                    <button onClick={() => setViewItem(null)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border-2 border-black/5 shadow-md text-foreground hover:bg-zinc-50 transition-all active:scale-90"><X className="h-5 w-5" /></button>
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
                  <div className="text-center sm:text-left">
                    <div className="flex justify-center sm:justify-start gap-2 mb-3">
                      <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border", config.cor)}>
                        <Icon className="w-3 h-3" /> {config.label}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-muted text-muted-foreground">
                        <Calendar className="w-3 h-3" /> {viewItem.data_registro ? formatarDataVigente(viewItem.data_registro) : 'Sem data'}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-foreground leading-tight tracking-tight mb-2">
                      {getTitulo(viewItem)}
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {/* Como foi - Encontro/Evento */}
                    {viewItem.como_foi && tipo !== "evolucao" && (
                      <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                          {tipo === "evento" ? "Como foi o evento" : "Como foi o encontro"}
                        </h4>
                        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{viewItem.como_foi}</p>
                      </div>
                    )}

                    {/* Positivos/Negativos */}
                    {tipo !== "evolucao" && (viewItem.pontos_positivos || viewItem.pontos_negativos) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {viewItem.pontos_positivos && (
                          <div className="bg-emerald-500/5 rounded-2xl p-5 border border-emerald-500/10">
                            <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2">Pontos Positivos</h4>
                            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{viewItem.pontos_positivos}</p>
                          </div>
                        )}
                        {viewItem.pontos_negativos && (
                          <div className="bg-destructive/5 rounded-2xl p-5 border border-destructive/10">
                            <h4 className="text-[10px] font-black text-destructive uppercase tracking-widest mb-2">Pontos a Melhorar</h4>
                            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{viewItem.pontos_negativos}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Avaliação de Participação */}
                    {tipo !== "evolucao" && viewItem.avaliacoes_catequizandos && Array.isArray(viewItem.avaliacoes_catequizandos) && viewItem.avaliacoes_catequizandos.length > 0 && (
                      <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm overflow-hidden">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Avaliação de Participação (Estrelas)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                          {viewItem.avaliacoes_catequizandos.map((av: any) => (
                            <div key={av.catequizando_id} className="bg-muted/30 hover:bg-muted/50 transition-colors rounded-xl p-3 border border-black/5 flex flex-col gap-3">
                              <div className="font-bold text-sm text-foreground truncate">{av.nome}</div>
                              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[10px] font-bold text-muted-foreground uppercase">
                                <div className="flex flex-col gap-1.5">
                                  <span>Pontualidade</span>
                                  <StarRating size="sm" readOnly value={av.pontualidade} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <span>Participação</span>
                                  <StarRating size="sm" readOnly value={av.participacao_grupo} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <span>Engajamento</span>
                                  <StarRating size="sm" readOnly value={av.engajamento} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Evolução Espiritual e Comportamental */}
                    {tipo === "evolucao" && viewItem.evolucao_catequizandos && Array.isArray(viewItem.evolucao_catequizandos) && viewItem.evolucao_catequizandos.length > 0 && (
                      <div className="bg-emerald-600/5 rounded-2xl p-5 border border-emerald-600/10 overflow-hidden">
                        <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-4">Evolução (Estrelas)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                          {viewItem.evolucao_catequizandos.map((ev: any) => (
                            <div key={ev.catequizando_id} className="bg-white/50 hover:bg-white transition-colors rounded-xl p-3 border border-emerald-600/10 flex flex-col gap-3">
                              <div className="font-bold text-sm text-emerald-800 truncate">{ev.nome}</div>
                              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[10px] font-bold text-emerald-600/80 uppercase">
                                <div className="flex flex-col gap-1.5">
                                  <span>Espiritual</span>
                                  <StarRating color="text-emerald-500" size="sm" readOnly value={ev.evolucao_espiritual} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <span>Comportamental</span>
                                  <StarRating color="text-emerald-500" size="sm" readOnly value={ev.evolucao_comportamental} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notas de texto de evolução */}
                    {tipo === "evolucao" && viewItem.evolucao_espiritual && (
                      <div className="bg-emerald-600/5 rounded-2xl p-5 border border-emerald-600/10">
                        <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2">Notas sobre Evolução</h4>
                        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{viewItem.evolucao_espiritual}</p>
                      </div>
                    )}

                    {/* Observações gerais */}
                    {tipo !== "evolucao" && viewItem.observacoes_catequizandos && (
                      <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Observações dos Catequizandos</h4>
                        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{viewItem.observacoes_catequizandos}</p>
                      </div>
                    )}
                  </div>
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
    </div>
  );
}
