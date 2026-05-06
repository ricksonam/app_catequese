import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useReunioes, useReuniaoMutation, useDeleteReuniao, useCatequizandos } from "@/hooks/useSupabaseData";
import { REUNIAO_TIPOS, type Reuniao, type ReuniaoTipo, ORACAO_TIPOS } from "@/lib/store";
import { ArrowLeft, Plus, ListChecks, Trash2, MapPin, Clock, Calendar, Car, Printer, Users, ChevronRight, CheckCircle2, Pencil, X, Play, FileSignature } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ReportModule from "@/components/reports/ReportModule";
import { toast } from "sonner";
import { formatarDataVigente, cn } from "@/lib/utils";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";


// --- Helpers ---
function FieldInput({ label, type = "text", value, onChange, placeholder }: { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const labelWithRedAsterisk = label.includes("*") ? (
    <>
      {label.replace("*", "")}
      <span className="text-red-500">*</span>
    </>
  ) : label;

  return (
    <div>
      <label className="text-xs font-semibold text-zinc-900 mb-1 block">{labelWithRedAsterisk}</label>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder} 
        className="form-input" 
      />
    </div>
  );
}

interface FormData { 
  nome: string; 
  descricao: string;
  pautas: { id: string; titulo: string; descricao: string; tempo?: number }[]; 
  oracaoInicial: string;
  oracaoTipo: string;
  tipo: ReuniaoTipo; 
  data: string; 
  local: string; 
  horario: string; 
  observacao: string; 
}

const emptyForm: FormData = { 
  nome: "", 
  descricao: "",
  pautas: [], 
  oracaoInicial: "",
  oracaoTipo: "Oração Simples",
  tipo: "Reunião de catequistas", 
  data: "", 
  local: "", 
  horario: "", 
  observacao: "" 
};

const fillFormFromItem = (item: Reuniao): FormData => ({
  nome: item.nome, 
  descricao: item.descricao || "",
  pautas: item.pautas || [],
  oracaoInicial: item.oracaoInicial || "",
  oracaoTipo: item.oracaoTipo || "Oração Simples",
  tipo: item.tipo,
  data: item.data || '', 
  local: item.local || '', 
  horario: item.horario || '', 
  observacao: item.observacao || '',
});

const tipoColors: Record<string, string> = {
  'Reunião de catequistas': 'bg-primary/10 text-primary', 
  'Reunião de pais': 'bg-accent/15 text-accent-foreground',
  'Reunião de preparação de sacramento': 'bg-liturgical/10 text-liturgical',
  'Reunião de preparação de encontro': 'bg-success/10 text-success',
  'Reunião geral': 'bg-gold/15 text-gold',
};

const TIPO_ICONES: Record<string, string> = {
  'Reunião de catequistas': '🤝', 
  'Reunião de pais': '👨‍👩‍👧‍👦',
  'Reunião de preparação de sacramento': '⛪',
  'Reunião de preparação de encontro': '📝',
  'Reunião geral': '📅',
};

export default function ReunioesList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: turmas = [], isLoading: tLoading } = useTurmas();
  const { data: list = [], isLoading } = useReunioes(id);
  const { data: catequizandos = [] } = useCatequizandos(id);
  const mutation = useReuniaoMutation();
  const deleteMut = useDeleteReuniao();
  const turma = turmas.find(t => t.id === id);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<Reuniao | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  const [newPauta, setNewPauta] = useState({ titulo: "", descricao: "", tempo: 0 });

  // Auto-view item from URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewId = params.get('view');
    if (viewId && list.length > 0) {
      const item = list.find(a => a.id === viewId);
      if (item) setViewItem(item);
    }
  }, [list]);

  const [presencaOpen, setPresencaOpen] = useState(false);
  const [presencaItem, setPresencaItem] = useState<Reuniao | null>(null);

  const updateField = useCallback((field: string, value: string) => { setForm((f) => ({ ...f, [field]: value })); }, []);

  const handleAdd = async () => {
    if (!form.nome) { toast.error("Nome é obrigatório"); return; }
    try {
      if (editingId) {
        const existing = list.find(a => a.id === editingId);
        await mutation.mutateAsync({ 
          ...existing!, 
          nome: form.nome, 
          descricao: form.descricao,
          pautas: form.pautas,
          oracaoInicial: form.oracaoInicial,
          oracaoTipo: form.oracaoTipo,
          tipo: form.tipo, 
          data: form.data, 
          local: form.local, 
          horario: form.horario, 
          observacao: form.observacao 
        });
        setEditingId(null); setViewItem(null); toast.success("Reunião atualizada!");
      } else {
        await mutation.mutateAsync({ 
          id: crypto.randomUUID(), 
          turmaId: id!, 
          nome: form.nome, 
          descricao: form.descricao,
          pautas: form.pautas,
          oracaoInicial: form.oracaoInicial,
          oracaoTipo: form.oracaoTipo,
          tipo: form.tipo, 
          data: form.data, 
          local: form.local, 
          horario: form.horario, 
          observacao: form.observacao, 
          presencas: [], 
          criadoEm: new Date().toISOString() 
        });
        toast.success("Reunião criada!");
      }
      setForm({ ...emptyForm }); setOpen(false);
      setNewPauta({ titulo: "", descricao: "", tempo: 0 });
    } catch (err: any) { toast.error("Erro: " + err.message); }
  };

  const handleEdit = (item: Reuniao) => { setForm(fillFormFromItem(item)); setEditingId(item.id); setViewItem(null); setOpen(true); };
  const confirmDelete = async () => {
    if (!itemToDeleteId) return;
    try { 
      await deleteMut.mutateAsync(itemToDeleteId); 
      setViewItem(null); 
      setDeleteConfirmOpen(false);
      setItemToDeleteId(null);
      toast.success("Removida!"); 
    } catch (err: any) { toast.error("Erro: " + err.message); }
  };

  const togglePresenca = (catId: string) => {
    if (!presencaItem) return;
    const p = presencaItem.presencas || [];
    const updated = p.includes(catId) ? p.filter(x => x !== catId) : [...p, catId];
    const newItem = { ...presencaItem, presencas: updated };
    mutation.mutate(newItem);
    setPresencaItem(newItem);
  };

  if (isLoading || tLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5 animate-bounce-subtle">
           <div className="w-6 h-6 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
        <p className="text-xs font-black text-primary/60 uppercase tracking-widest animate-pulse">Buscando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="space-y-4 animate-fade-in flex flex-col pt-4">
        {/* Row 1: Back Button + Título (Centralizado) */}
        <div className="flex items-center justify-center min-h-[44px] relative">
          <button onClick={() => navigate(`/turmas/${id}`)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border-2 border-black/5 shadow-sm active:scale-90 transition-all absolute left-0">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-xl font-black text-foreground tracking-tight uppercase">
              Reuniões
            </h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">{list.length} reuniões</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex-1 sm:flex-none">
             {id && <ReportModule context="reunioes" turmaId={id} />}
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setForm({ ...emptyForm }); } }}>
            <DialogTrigger asChild><button className="action-btn-sm shrink-0 whitespace-nowrap"><Plus className="h-4 w-4" /> Nova</button></DialogTrigger>
            <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto border-border/30">
              <DialogHeader><DialogTitle>{editingId ? 'Editar Reunião' : 'Nova Reunião'}</DialogTitle></DialogHeader>
               <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                  <label className="text-xs font-semibold text-zinc-900 mb-1 block">Tipo de Reunião</label>
                  <select value={form.tipo} onChange={(e) => updateField("tipo", e.target.value)} className="form-input">
                    {REUNIAO_TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-900 mb-1 block">Nome da Reunião *</label>
                  <input type="text" value={form.nome} onChange={(e) => updateField("nome", e.target.value)} placeholder="Ex: Planejamento Mensal" className="form-input" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FieldInput label="Data *" type="date" value={form.data} onChange={(v) => updateField("data", v)} />
                  <FieldInput label="Horário *" type="time" value={form.horario} onChange={(v) => updateField("horario", v)} />
                </div>

                <div className="p-4 rounded-2xl bg-violet-50/50 border border-violet-100 space-y-3">
                  <p className="text-[10px] font-black uppercase text-violet-400 tracking-widest border-b border-violet-100 pb-1">Momento de Oração</p>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-zinc-900 block">Tipo de Oração</label>
                    <select 
                      value={form.oracaoTipo} 
                      onChange={(e) => updateField("oracaoTipo", e.target.value)} 
                      className="form-input bg-white border-transparent focus:border-violet-200"
                    >
                      {ORACAO_TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-900 mb-1 block">Oração Inicial</label>
                    <textarea 
                      value={form.oracaoInicial} 
                      onChange={(e) => updateField("oracaoInicial", e.target.value)} 
                      placeholder="Oração para início da reunião..." 
                      className="form-input bg-white border-transparent focus:border-violet-200 min-h-[80px] resize-y" 
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-primary border-b border-primary/10 pb-1 block">Pautas e Tópicos</label>
                  
                  {/* Se for reunião de catequistas ou pais, usa o modelo estruturado */}
                  {(form.tipo === 'Reunião de catequistas' || form.tipo === 'Reunião de pais') ? (
                    <>
                      {/* Lista de Pautas Já Adicionadas */}
                      {form.pautas.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {form.pautas.map((p, idx) => (
                            <div key={p.id} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-black/5 group">
                              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center shrink-0">{idx + 1}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-foreground truncate">{p.titulo}</p>
                                  {p.tempo > 0 && <span className="text-[9px] font-black uppercase text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-md border border-sky-100">{p.tempo}min</span>}
                                </div>
                                <p className="text-[11px] text-muted-foreground line-clamp-2">{p.descricao}</p>
                              </div>
                              <button 
                                onClick={(e) => { e.preventDefault(); setForm(f => ({ ...f, pautas: f.pautas.filter(item => item.id !== p.id) })); }}
                                className="p-1.5 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Área para Adicionar Nova Pauta */}
                      <div className="p-4 rounded-2xl bg-primary/5 border-2 border-dashed border-primary/20 space-y-3">
                        <p className="text-[10px] font-black uppercase text-primary tracking-widest text-center">Novo Tópico da Pauta</p>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={newPauta.titulo} 
                            onChange={(e) => setNewPauta(p => ({ ...p, titulo: e.target.value }))}
                            placeholder="Título do tópico..."
                            className="form-input bg-white border-transparent focus:border-primary/20 flex-1"
                          />
                          <div className="w-20">
                            <input 
                              type="number" 
                              value={newPauta.tempo || ""} 
                              onChange={(e) => setNewPauta(p => ({ ...p, tempo: parseInt(e.target.value) || 0 }))}
                              placeholder="Min"
                              className="form-input bg-white border-transparent focus:border-primary/20"
                            />
                          </div>
                        </div>
                        <textarea 
                          value={newPauta.descricao} 
                          onChange={(e) => setNewPauta(p => ({ ...p, descricao: e.target.value }))}
                          placeholder="Descrição detalhada..."
                          className="form-input bg-white min-h-[60px] resize-y border-transparent focus:border-primary/20 text-xs"
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            if (!newPauta.titulo) { toast.error("Digite o título da pauta"); return; }
                            setForm(f => ({ 
                              ...f, 
                              pautas: [...f.pautas, { ...newPauta, id: crypto.randomUUID() }] 
                            }));
                            setNewPauta({ titulo: "", descricao: "", tempo: 0 });
                            toast.success("Pauta adicionada!");
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[10px] hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/20"
                        >
                          <Plus className="h-4 w-4" /> Adicionar à Lista
                        </button>
                      </div>
                    </>
                  ) : (
                    /* Caso contrário, usa o modelo simples de descrição */
                    <div>
                      <textarea 
                        value={form.descricao} 
                        onChange={(e) => updateField("descricao", e.target.value)} 
                        placeholder="Descreva os assuntos da reunião..." 
                        className="form-input min-h-[120px] resize-y" 
                      />
                    </div>
                  )}
                </div>

                <FieldInput label="Local" value={form.local} onChange={(v) => updateField("local", v)} placeholder="Sala de Catequese" />
                
                <div>
                  <label className="text-xs font-semibold text-zinc-900 mb-1 block">Observações Finais</label>
                  <textarea value={form.observacao} onChange={(e) => updateField("observacao", e.target.value)} placeholder="Anotações gerais..." className="form-input min-h-[80px] resize-y" />
                </div>
                <button onClick={handleAdd} disabled={mutation.isPending} className="w-full action-btn">{mutation.isPending ? "Salvando..." : editingId ? 'Salvar Alterações' : 'Criar Reunião'}</button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="empty-state animate-float-up"><div className="icon-box bg-liturgical/10 text-liturgical mx-auto mb-3"><ListChecks className="h-6 w-6" /></div><p className="text-sm font-medium text-muted-foreground">Nenhuma reunião cadastrada</p></div>
      ) : (
        <div className="space-y-6">
          {(() => {
            const sorted = [...list].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
            const groups: Record<string, typeof sorted> = {};
            const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
            const DIAS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sab"];

            sorted.forEach(item => {
              const d = new Date(item.data + 'T12:00:00');
              const key = `${d.getFullYear()}-${d.getMonth()}`;
              if (!groups[key]) groups[key] = [];
              groups[key].push(item);
            });

            return Object.entries(groups).map(([key, items]) => {
              const [y, m] = key.split('-').map(Number);
              const monthLabel = `${MESES[m]} ${y}`;
              return (
                <div key={key} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-liturgical/25 to-liturgical/40" />
                    <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-liturgical/10 to-liturgical/5 border border-liturgical/20 shadow-sm">
                      <h3 className="text-xs font-extrabold text-liturgical uppercase tracking-[0.18em]">{monthLabel}</h3>
                      <span className="text-[10px] font-bold text-liturgical/50 ml-1">({items.length})</span>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-liturgical/25 to-liturgical/40" />
                  </div>

                  {items.map((item, i) => {
                    const d = new Date(item.data + 'T12:00:00');
                    const cor = tipoColors[item.tipo] || 'bg-muted text-muted-foreground';
                    const icone = TIPO_ICONES[item.tipo] || '🤝';
                    return (
                      <button
                        key={item.id}
                        onClick={() => setViewItem(item)}
                        className="w-full text-left group animate-float-up"
                        style={{ animationDelay: `${i * 55}ms` }}
                      >
                        <div className="flex items-stretch bg-card rounded-2xl border border-black/5 shadow-sm group-hover:shadow-md group-hover:border-primary/20 transition-all active:scale-[0.98] overflow-hidden relative">
                          <div className={`absolute top-0 bottom-0 left-0 w-1 ${cor.split(' ')[0].replace('bg-','bg-')}`} />
                          
                          {/* Coluna da data */}
                          <div className="flex flex-col items-center justify-center px-4 py-4 border-r border-black/5 shrink-0 min-w-[75px] bg-muted/30 group-hover:bg-primary/5 transition-colors pl-5">
                            <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest leading-none mb-1">{DIAS[d.getDay()]}</span>
                            <span className="text-3xl font-black text-foreground leading-none">{String(d.getDate()).padStart(2,'0')}</span>
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">{MESES[d.getMonth()].substring(0,3)}</span>
                          </div>

                          {/* Conteúdo */}
                          <div className="flex-1 px-4 sm:px-5 py-3 sm:py-4 min-w-0 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-base leading-none bg-muted/50 p-1 rounded-md">{icone}</span>
                              <span className={`inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-current/10 ${cor}`}>
                                {item.tipo}
                              </span>
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-foreground leading-tight truncate group-hover:text-primary transition-colors">{item.nome}</h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2">
                              {item.horario && (
                                <p className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5 text-primary/70" /> {item.horario}
                                </p>
                              )}
                              {item.local && (
                                <p className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-muted-foreground max-w-full">
                                  <MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0" /> <span className="truncate">{item.local}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col justify-center px-4 transition-opacity pr-5 gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); navigate(`/turmas/${id}/reunioes/${item.id}/apresentacao`); }}
                              className="w-8 h-8 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center hover:bg-violet-100 transition-colors shadow-sm"
                              title="Apresentar"
                            >
                              <Play className="h-4 w-4" />
                            </button>
                            <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground transition-colors">
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            });
          })()}
        </div>
      )}

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="rounded-2xl border-border/30 p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          {viewItem && (
            <div className="flex flex-col h-full bg-background rounded-2xl overflow-hidden relative">
              {/* Header Bar Clean */}
              <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3.5 border-b border-black/5 bg-background/90 backdrop-blur-md">
                <span className="text-sm font-bold text-foreground truncate pr-4">Detalhes da Reunião</span>
                <div className="flex items-center gap-1.5 z-50">
                  <button onClick={() => navigate(`/turmas/${id}/reunioes/${viewItem.id}/apresentacao`)} className="p-2 rounded-xl bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors shadow-sm" title="Apresentar"><Play className="h-4 w-4" /></button>
                  <button onClick={() => handleEdit(viewItem)} className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors shadow-sm" title="Editar"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => { setItemToDeleteId(viewItem.id); setDeleteConfirmOpen(true); }} className="p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors shadow-sm" title="Excluir"><Trash2 className="h-4 w-4" /></button>

                  <div className="w-px h-4 bg-black/10 mx-1" />
                  <button onClick={() => setViewItem(null)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border-2 border-black/5 shadow-md text-foreground hover:bg-zinc-50 transition-all active:scale-90"><X className="h-5 w-5" /></button>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
                <div className="text-center sm:text-left">
                   <div className="flex justify-center sm:justify-start gap-2 mb-3">
                     <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-md border border-current/10 ${tipoColors[viewItem.tipo] || 'bg-muted text-muted-foreground'}`}>
                       <span>{TIPO_ICONES[viewItem.tipo] || '🤝'}</span> {viewItem.tipo}
                     </span>
                   </div>
                   <h2 className="text-2xl font-black text-foreground leading-tight tracking-tight mb-2">{viewItem.nome}</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tempo */}
                  <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm space-y-3.5">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary"><Calendar className="w-4 h-4" /></div>
                         <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-0.5">Data</p>
                            <p className="text-sm font-semibold text-foreground">{viewItem.data ? formatarDataVigente(viewItem.data) : 'A definir'}</p>
                         </div>
                      </div>
                      <div className="h-px bg-black/5" />
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary"><Clock className="w-4 h-4" /></div>
                         <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-0.5">Horário</p>
                            <p className="text-sm font-semibold text-foreground">{viewItem.horario || 'A definir'}</p>
                         </div>
                      </div>
                  </div>

                  {/* Espaço */}
                  <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm space-y-3.5">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-600"><MapPin className="w-4 h-4" /></div>
                         <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest leading-none mb-0.5">Local</p>
                            <p className="text-sm font-semibold text-foreground truncate">{viewItem.local || 'Não informado'}</p>
                         </div>
                      </div>
                  </div>
                </div>

                {viewItem.oracaoInicial && (
                  <div className="mt-4 p-4 rounded-2xl bg-violet-50 border border-violet-100">
                    <p className="text-[10px] font-black uppercase text-violet-400 tracking-widest mb-1.5">🙏 Oração Inicial</p>
                    <p className="text-sm font-medium text-violet-900 leading-relaxed italic">"{viewItem.oracaoInicial}"</p>
                  </div>
                )}

                <div className="mt-6 space-y-4">
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest border-b border-primary/10 pb-1">Pautas e Tópicos</p>
                  {(viewItem.pautas && viewItem.pautas.length > 0) ? (
                    <div className="space-y-4">
                      {viewItem.pautas.map((p, i) => (
                        <div key={p.id} className="relative pl-10">
                          <span className="absolute left-0 top-0 w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs">{i+1}</span>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-black text-foreground">{p.titulo}</p>
                            {p.tempo !== undefined && p.tempo > 0 && (
                              <span className="flex items-center gap-1 text-[9px] font-black uppercase text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-md border border-sky-100/50">
                                <Clock className="h-2.5 w-2.5" /> {p.tempo} min
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{p.descricao}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm bg-[repeating-linear-gradient(white,white_27px,#e5e7eb_27px,#e5e7eb_28px)]">
                      <div className="text-sm text-zinc-800 font-medium space-y-0 leading-[28px] whitespace-pre-wrap">
                        {viewItem.descricao?.split('\n').filter(line => line.trim()).map((line, idx) => (
                          <div key={idx} className="flex gap-2">
                            <span className="text-primary font-bold min-w-[20px]">{idx + 1}.</span>
                            <span>{line}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {viewItem.observacao && (
                  <div className="bg-accent/5 rounded-2xl p-5 border border-accent/10">
                    <h4 className="text-[10px] font-black text-accent-foreground uppercase tracking-widest mb-2">Observação</h4>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{viewItem.observacao}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button onClick={() => { setPresencaItem(viewItem); setPresencaOpen(true); }} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-success/10 text-success hover:bg-success/20 transition-all font-bold text-xs ring-1 ring-inset ring-success/20">
                    <Users className="h-4 w-4" /> 
                    <span>Lista de Presença <span className="bg-success text-white rounded-full px-1.5 py-0.5 ml-1 text-[10px]">{(viewItem.presencas||[]).length}</span></span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={presencaOpen} onOpenChange={setPresencaOpen}>
        <DialogContent className="rounded-2xl border-border/30 max-w-sm">
          <DialogHeader><DialogTitle className="px-2">Presença - {presencaItem?.nome}</DialogTitle></DialogHeader>
          {catequizandos.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Nenhum catequizando matriculado</p> : (
            <div className="space-y-1 mt-2 max-h-[50vh] overflow-y-auto px-1">
              {catequizandos.map(c => {
                const present = (presencaItem?.presencas || []).includes(c.id);
                return (
                  <button key={c.id} onClick={() => togglePresenca(c.id)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors border ${present ? 'bg-success/10 border-success/20' : 'bg-muted/30 border-transparent hover:bg-muted/50'}`}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${present ? 'bg-success border-success' : 'border-black/10'}`}>{present && <CheckCircle2 className="h-3 w-3 text-white" />}</div>
                    <div className="flex-1 text-left min-w-0">
                      <span className={`font-bold block truncate leading-tight ${present ? 'text-foreground' : 'text-muted-foreground'}`}>{c.nome}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-tight truncate block mt-0.5">Resp: {c.responsavel || 'Não informado'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <DeleteConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDelete}
        itemName={viewItem?.nome}
        isLoading={deleteMut.isPending}
      />
    </div>
  );
}
