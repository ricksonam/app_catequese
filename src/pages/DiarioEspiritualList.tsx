import { useParams, useNavigate } from "react-router-dom";
import { useDiarioEspiritual } from "@/hooks/useDiarioEspiritual";
import { ArrowLeft, Plus, BookHeart, Calendar, Pencil, Trash2, X, Star } from "lucide-react";
import { formatarDataVigente } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { StarRating } from "@/components/StarRating";

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg animate-bounce-subtle">
           <div className="w-6 h-6 border-[3px] border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
        <p className="text-xs font-black text-indigo-500/60 uppercase tracking-widest animate-pulse">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="space-y-4 animate-fade-in flex flex-col pt-4">
        <div className="flex items-center justify-center min-h-[44px] relative">
          <button onClick={() => navigate(`/turmas/${id}`)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border-2 border-black/5 shadow-sm active:scale-90 transition-all absolute left-0">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-xl font-black text-foreground tracking-tight uppercase">
              Diário Espiritual
            </h1>
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

      {diarios.length === 0 ? (
        <div className="empty-state animate-float-up">
          <div className="icon-box bg-indigo-500/10 text-indigo-500 mx-auto mb-3"><BookHeart className="h-6 w-6" /></div>
          <p className="text-sm font-medium text-muted-foreground">Nenhum registro no diário</p>
        </div>
      ) : (
        <div className="space-y-3">
          {diarios.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setViewItem(item)}
              className="w-full text-left group animate-float-up"
              style={{ animationDelay: `${i * 55}ms` }}
            >
              <div className="flex items-stretch bg-card rounded-2xl border border-black shadow-sm group-hover:shadow-md group-hover:border-indigo-500/30 transition-all active:scale-[0.98] overflow-hidden relative p-4 gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex flex-col items-center justify-center shrink-0">
                  <BookHeart className="w-5 h-5 mb-0.5" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-indigo-500/70 uppercase tracking-widest flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {item.data_registro ? formatarDataVigente(item.data_registro) : 'Sem data'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground truncate group-hover:text-indigo-600 transition-colors">
                    {item.encontros ? `Encontro: ${item.encontros.tema}` : "Registro Avulso"}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {item.como_foi || "Sem detalhes"}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent hideClose className="rounded-2xl border-border/30 p-0 overflow-hidden max-h-[90vh] overflow-y-auto max-w-2xl w-[95vw]">
          {viewItem && (
            <div className="flex flex-col h-full bg-background rounded-2xl overflow-hidden relative">
              <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3.5 border-b border-black/5 bg-background/90 backdrop-blur-md">
                <span className="text-sm font-bold text-foreground truncate pr-4">Registro do Diário</span>
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
                     <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600">
                       <Calendar className="w-3 h-3" /> {viewItem.data_registro ? formatarDataVigente(viewItem.data_registro) : 'Sem data'}
                     </span>
                   </div>
                   <h2 className="text-xl font-black text-foreground leading-tight tracking-tight mb-2">
                     {viewItem.encontros ? viewItem.encontros.tema : "Reflexão Geral"}
                   </h2>
                </div>

                <div className="space-y-4">
                  {viewItem.como_foi && (
                    <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Como foi o encontro</h4>
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{viewItem.como_foi}</p>
                    </div>
                  )}

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

                  {viewItem.avaliacoes_catequizandos && Array.isArray(viewItem.avaliacoes_catequizandos) && viewItem.avaliacoes_catequizandos.length > 0 && (
                    <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm overflow-hidden">
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Avaliação de Participação (Estrelas)</h4>
                      <div className="overflow-x-auto -mx-5 px-5">
                        <table className="w-full min-w-[500px] border-collapse text-sm">
                          <thead>
                            <tr className="bg-muted/30">
                              <th className="p-2 text-left text-[10px] font-bold text-muted-foreground uppercase rounded-tl-lg rounded-bl-lg">Catequizando</th>
                              <th className="p-2 text-center text-[10px] font-bold text-muted-foreground uppercase">Pontualidade</th>
                              <th className="p-2 text-center text-[10px] font-bold text-muted-foreground uppercase">Partic. Grupo</th>
                              <th className="p-2 text-center text-[10px] font-bold text-muted-foreground uppercase rounded-tr-lg rounded-br-lg">Engajamento</th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewItem.avaliacoes_catequizandos.map((av: any) => (
                              <tr key={av.catequizando_id} className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors">
                                <td className="p-2 font-semibold">{av.nome}</td>
                                <td className="p-2"><div className="flex justify-center"><StarRating size="sm" readOnly value={av.pontualidade} /></div></td>
                                <td className="p-2"><div className="flex justify-center"><StarRating size="sm" readOnly value={av.participacao_grupo} /></div></td>
                                <td className="p-2"><div className="flex justify-center"><StarRating size="sm" readOnly value={av.engajamento} /></div></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {viewItem.observacoes_catequizandos && (
                    <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Observações dos Catequizandos</h4>
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{viewItem.observacoes_catequizandos}</p>
                    </div>
                  )}

                  {viewItem.evolucao_catequizandos && Array.isArray(viewItem.evolucao_catequizandos) && viewItem.evolucao_catequizandos.length > 0 && (
                    <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10 overflow-hidden">
                      <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Evolução (Estrelas)</h4>
                      <div className="overflow-x-auto -mx-5 px-5">
                        <table className="w-full min-w-[400px] border-collapse text-sm">
                          <thead>
                            <tr className="bg-primary/10">
                              <th className="p-2 text-left text-[10px] font-bold text-primary uppercase rounded-tl-lg rounded-bl-lg">Catequizando</th>
                              <th className="p-2 text-center text-[10px] font-bold text-primary uppercase">Espiritual</th>
                              <th className="p-2 text-center text-[10px] font-bold text-primary uppercase rounded-tr-lg rounded-br-lg">Comportamental</th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewItem.evolucao_catequizandos.map((ev: any) => (
                              <tr key={ev.catequizando_id} className="border-b border-primary/10 last:border-0 hover:bg-primary/5 transition-colors">
                                <td className="p-2 font-semibold text-primary">{ev.nome}</td>
                                <td className="p-2"><div className="flex justify-center"><StarRating color="text-indigo-500" size="sm" readOnly value={ev.evolucao_espiritual} /></div></td>
                                <td className="p-2"><div className="flex justify-center"><StarRating color="text-indigo-500" size="sm" readOnly value={ev.evolucao_comportamental} /></div></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {viewItem.evolucao_espiritual && (
                    <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10">
                      <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Notas sobre Evolução</h4>
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{viewItem.evolucao_espiritual}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
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
