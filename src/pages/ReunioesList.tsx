import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useReunioes, useReuniaoMutation, useDeleteReuniao, useCatequizandos, useEncontros, useAtividades } from "@/hooks/useSupabaseData";
import { REUNIAO_TIPOS, type Reuniao, type ReuniaoTipo, ORACAO_TIPOS } from "@/lib/store";
import { ArrowLeft, Plus, ListChecks, Trash2, MapPin, Clock, Calendar, Car, Printer, Users, ChevronRight, CheckCircle2, Pencil, X, Play, FileSignature, CalendarDays, Book, Sparkles } from "lucide-react";
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
  encontrosPreparados?: string[];
  eventosPreparados?: string[];
  servicosLiturgia?: Record<string, string>;
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
  observacao: "",
  encontrosPreparados: [],
  eventosPreparados: [],
  servicosLiturgia: {
    'animador': '',
    '1_leitor': '',
    'salmista': '',
    '2_leitor': '',
    'preces': '',
    'cantores': '',
    'celebrante': ''
  }
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
  encontrosPreparados: item.encontrosPreparados || [],
  eventosPreparados: item.eventosPreparados || [],
  servicosLiturgia: item.servicosLiturgia || emptyForm.servicosLiturgia,
});

const tipoColors: Record<string, string> = {
  'Reunião de catequistas': 'bg-primary/10 text-primary', 
  'Reunião de pais': 'bg-accent/15 text-accent-foreground',
  'Reunião de preparação de sacramento': 'bg-liturgical/10 text-liturgical',
  'Reunião de preparação de encontro': 'bg-success/10 text-success',
  'Reunião de preparação de eventos': 'bg-indigo-100 text-indigo-700',
  'Reunião geral': 'bg-gold/15 text-gold',
};

const TIPO_ICONES: Record<string, string> = {
  'Reunião de catequistas': '🤝', 
  'Reunião de pais': '👨‍👩‍👧‍👦',
  'Reunião de preparação de sacramento': '⛪',
  'Reunião de preparação de encontro': '📝',
  'Reunião de preparação de eventos': '🎉',
  'Reunião geral': '📅',
};

export default function ReunioesList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: turmas = [], isLoading: tLoading } = useTurmas();
  const { data: list = [], isLoading } = useReunioes(id);
  const { data: catequizandos = [] } = useCatequizandos(id);
  const { data: encontros = [] } = useEncontros(id);
  const { data: atividades = [] } = useAtividades(id);
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
          encontrosPreparados: form.encontrosPreparados,
          eventosPreparados: form.eventosPreparados,
          servicosLiturgia: form.servicosLiturgia,
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
          encontrosPreparados: form.encontrosPreparados,
          eventosPreparados: form.eventosPreparados,
          servicosLiturgia: form.servicosLiturgia,
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
                  <label className="text-xs font-semibold text-zinc-900 mb-1 block">Tipo de Reunião *</label>
                  <select 
                    value={form.tipo} 
                    onChange={(e) => updateField("tipo", e.target.value as ReuniaoTipo)} 
                    className="form-input font-bold text-primary"
                  >
                    {REUNIAO_TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* --- SEÇÃO EXCLUSIVA: PREPARAÇÃO DE ENCONTRO --- */}
                {form.tipo === 'Reunião de preparação de encontro' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    {/* Lista Suspensa de Encontros */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Selecione os Encontros a Preparar</label>
                      
                      <div className="relative group">
                        <Dialog>
                          <DialogTrigger asChild>
                            <button 
                              type="button"
                              className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border-2 border-emerald-100 hover:border-emerald-300 transition-all shadow-sm group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                                  <ListChecks className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                  <p className="text-sm font-black text-foreground">
                                    {form.encontrosPreparados?.length ? `${form.encontrosPreparados.length} selecionado(s)` : "Lista de Encontros"}
                                  </p>
                                  <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest">Toque para selecionar</p>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-emerald-300 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[90vw] sm:max-w-[400px] rounded-3xl p-6">
                            <DialogHeader>
                              <DialogTitle className="text-lg font-black text-emerald-900 uppercase tracking-tight">Lista de Encontros</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-2 mt-4 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                              {encontros.map((enc) => {
                                const isSelected = form.encontrosPreparados?.includes(enc.id);
                                return (
                                  <button
                                    key={enc.id}
                                    type="button"
                                    onClick={() => {
                                      let next;
                                      if (isSelected) {
                                        next = form.encontrosPreparados?.filter(id => id !== enc.id);
                                      } else {
                                        next = [...(form.encontrosPreparados || []), enc.id];
                                      }
                                      updateField('encontrosPreparados', next as any);
                                      if (!isSelected && next?.length === 1 && !form.nome) {
                                        updateField('nome', `Preparação: ${enc.tema}`);
                                      }
                                    }}
                                    className={cn(
                                      "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group",
                                      isSelected 
                                        ? "bg-rose-50 border-rose-500 shadow-md scale-[1.01]" 
                                        : "bg-white border-black/5 hover:border-rose-200"
                                    )}
                                  >
                                    <div className={cn(
                                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                      isSelected ? "bg-rose-500 text-white shadow-lg" : "bg-rose-50 text-rose-500"
                                    )}>
                                      <CalendarDays className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={cn("text-sm font-bold truncate", isSelected ? "text-rose-900" : "text-foreground")}>
                                        {enc.tema}
                                      </p>
                                      <p className="text-[10px] font-black text-rose-600/60 uppercase tracking-tighter">
                                        {enc.data ? formatarDataVigente(enc.data).split(' - ')[0] : 'Data pendente'}
                                      </p>
                                    </div>
                                    <div className={cn(
                                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                      isSelected ? "bg-rose-500 border-rose-500" : "bg-white border-rose-100"
                                    )}>
                                      {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {/* Chips dos selecionados visíveis fora da lista */}
                      {form.encontrosPreparados && form.encontrosPreparados.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 animate-in fade-in duration-500">
                          {form.encontrosPreparados.map(eid => {
                            const enc = encontros.find(e => e.id === eid);
                            if (!enc) return null;
                            return (
                              <div key={eid} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black shadow-sm shadow-emerald-500/20 border border-emerald-400">
                                <span className="truncate max-w-[120px]">{enc.tema}</span>
                                <button type="button" onClick={() => updateField('encontrosPreparados', form.encontrosPreparados?.filter(id => id !== eid) as any)} className="hover:bg-white/20 p-0.5 rounded-full transition-colors">
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* --- SEÇÃO COMPARTILHADA: ROTEIRO (Para Encontros e Eventos) --- */}
                {(form.tipo === 'Reunião de preparação de encontro' || form.tipo === 'Reunião de preparação de eventos') && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 delay-150">
                    {/* Card Único: Roteiro do Encontro */}
                    <div className="p-5 rounded-2xl bg-amber-50/50 border-2 border-amber-200/50 shadow-sm space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
                          <Book className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-amber-900 uppercase tracking-tight leading-none">Roteiro da Reunião</h3>
                          <p className="text-[9px] font-bold text-amber-700/50 uppercase tracking-widest mt-1">Oração e Tópicos de Preparação</p>
                        </div>
                      </div>

                      <div className="h-px bg-amber-200/30" />

                      <div className="flex flex-col items-center gap-2 max-w-[200px] mx-auto">
                        <label className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Tipo de Oração</label>
                        <select 
                          value={form.oracaoTipo} 
                          onChange={(e) => updateField("oracaoTipo", e.target.value)} 
                          className="w-full bg-white border-amber-200 rounded-xl text-xs font-bold p-2.5 focus:ring-amber-500 focus:border-amber-500 text-center"
                        >
                          <option value="">Selecione...</option>
                          {ORACAO_TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <label className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Tópicos da Reunião</label>
                          <button 
                            type="button" 
                            onClick={() => {
                              const next = [...(form.pautas || []), { id: crypto.randomUUID(), titulo: "", descricao: "" }];
                              updateField("pautas", next);
                            }}
                            className="text-[9px] font-black text-amber-600 bg-amber-100/50 px-2 py-1.5 rounded-lg uppercase flex items-center gap-1 hover:bg-amber-100 transition-colors border border-amber-200/50"
                          >
                            <Plus className="h-3 w-3" /> Add Tópico
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          {(form.pautas || []).map((p, idx) => (
                            <div key={p.id} className="p-3 rounded-xl bg-white border border-amber-200 space-y-1.5 shadow-sm group animate-in zoom-in-95 duration-200">
                              <div className="flex items-center gap-2">
                                <input 
                                  placeholder="Título do Tópico..." 
                                  value={p.titulo} 
                                  onChange={(e) => {
                                    const next = [...(form.pautas || [])];
                                    next[idx] = { ...p, titulo: e.target.value };
                                    updateField("pautas", next);
                                  }}
                                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold p-0 text-amber-900 placeholder:text-amber-900/20"
                                />
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const next = (form.pautas || []).filter(x => x.id !== p.id);
                                    updateField("pautas", next);
                                  }}
                                  className="p-1 text-amber-300 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <textarea 
                                placeholder="Detalhes ou objetivos..." 
                                value={p.descricao}
                                onChange={(e) => {
                                  const next = [...(form.pautas || [])];
                                  next[idx] = { ...p, descricao: e.target.value };
                                  updateField("pautas", next);
                                }}
                                className="w-full bg-transparent border-none focus:ring-0 text-[11px] text-amber-800/60 p-0 resize-none min-h-[30px] placeholder:text-amber-900/10"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- SEÇÃO EXCLUSIVA: PREPARAÇÃO DE EVENTOS --- */}
                {form.tipo === 'Reunião de preparação de eventos' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Selecione os Eventos a Preparar</label>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <button 
                            type="button"
                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border-2 border-indigo-100 hover:border-indigo-300 transition-all shadow-sm group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                                <Sparkles className="h-5 w-5" />
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-black text-foreground">
                                  {form.eventosPreparados?.length ? `${form.eventosPreparados.length} selecionado(s)` : "Lista de Eventos"}
                                </p>
                                <p className="text-[10px] font-bold text-indigo-600/60 uppercase tracking-widest">Toque para selecionar</p>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-indigo-300 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[90vw] sm:max-w-[400px] rounded-3xl p-6">
                          <DialogHeader>
                            <DialogTitle className="text-lg font-black text-indigo-900 uppercase tracking-tight">Lista de Eventos</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-2 mt-4 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                            {atividades.map((act) => {
                              const isSelected = form.eventosPreparados?.includes(act.id);
                              return (
                                <button
                                  key={act.id}
                                  type="button"
                                  onClick={() => {
                                    let next;
                                    if (isSelected) {
                                      next = form.eventosPreparados?.filter(id => id !== act.id);
                                    } else {
                                      next = [...(form.eventosPreparados || []), act.id];
                                    }
                                    updateField('eventosPreparados', next as any);
                                    if (!isSelected && next?.length === 1 && !form.nome) {
                                      updateField('nome', `Preparação: ${act.nome}`);
                                    }
                                  }}
                                  className={cn(
                                    "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group",
                                    isSelected 
                                      ? "bg-rose-50 border-rose-500 shadow-md scale-[1.01]" 
                                      : "bg-white border-black/5 hover:border-indigo-200"
                                  )}
                                >
                                  <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                    isSelected ? "bg-rose-500 text-white shadow-lg" : "bg-indigo-50 text-indigo-500"
                                  )}>
                                    <Sparkles className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={cn("text-sm font-bold truncate", isSelected ? "text-rose-900" : "text-foreground")}>
                                      {act.nome}
                                    </p>
                                    <p className="text-[10px] font-black text-rose-600/60 uppercase tracking-tighter">
                                      {act.data ? formatarDataVigente(act.data).split(' - ')[0] : 'Data pendente'}
                                    </p>
                                  </div>
                                  <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                    isSelected ? "bg-rose-500 border-rose-500" : "bg-white border-indigo-100"
                                  )}>
                                    {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </DialogContent>
                      </Dialog>

                      {form.eventosPreparados && form.eventosPreparados.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3 animate-in fade-in duration-500">
                          {form.eventosPreparados.map(aid => {
                            const act = atividades.find(a => a.id === aid);
                            if (!act) return null;
                            return (
                              <div key={aid} className="flex items-center gap-1.5 px-3 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black shadow-sm shadow-rose-500/20 border border-rose-400">
                                <span className="truncate max-w-[120px]">{act.nome}</span>
                                <button type="button" onClick={() => updateField('eventosPreparados', form.eventosPreparados?.filter(id => id !== aid) as any)} className="hover:bg-white/20 p-0.5 rounded-full transition-colors">
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* --- CAMPOS GERAIS --- */}
                {form.tipo !== 'Reunião de preparação de encontro' && (
                  <div className="space-y-4">
                    <FieldInput label="Nome da Reunião *" value={form.nome} onChange={(v) => updateField("nome", v)} placeholder="Ex: Planejamento Mensal" />
                    
                    <div className="p-4 rounded-2xl bg-violet-50/50 border border-violet-100 space-y-3">
                      <p className="text-[10px] font-black uppercase text-violet-400 tracking-widest border-b border-violet-100 pb-1">Momento de Oração</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-500 ml-1">Oração Inicial</label>
                          <input value={form.oracaoInicial} onChange={(e) => updateField("oracaoInicial", e.target.value)} placeholder="Título..." className="form-input bg-white" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-500 ml-1">Tipo</label>
                          <select value={form.oracaoTipo} onChange={(e) => updateField("oracaoTipo", e.target.value)} className="form-input bg-white">
                            <option value="">Tipo...</option>
                            {ORACAO_TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-zinc-900 uppercase tracking-widest">Tópicos da Reunião</label>
                        <button type="button" onClick={() => updateField("pautas", [...(form.pautas || []), { id: crypto.randomUUID(), titulo: "", descricao: "" }])} className="text-[10px] font-black text-primary uppercase flex items-center gap-1 hover:underline">
                          <Plus className="h-3 w-3" /> Add Tópico
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        {(form.pautas || []).map((p, idx) => (
                          <div key={p.id} className="p-3 rounded-2xl bg-muted/30 border border-black/5 space-y-2 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2">
                              <input placeholder="Título do Tópico..." value={p.titulo} onChange={(e) => {
                                const next = [...(form.pautas || [])];
                                next[idx] = { ...p, titulo: e.target.value };
                                updateField("pautas", next);
                              }} className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold p-0" />
                              <button type="button" onClick={() => updateField("pautas", (form.pautas || []).filter(x => x.id !== p.id))} className="p-1.5 text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                            </div>
                            <textarea placeholder="Detalhes..." value={p.descricao} onChange={(e) => {
                              const next = [...(form.pautas || [])];
                              next[idx] = { ...p, descricao: e.target.value };
                              updateField("pautas", next);
                            }} className="w-full bg-transparent border-none focus:ring-0 text-xs text-muted-foreground p-0 resize-none min-h-[40px]" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <FieldInput label="Data *" type="date" value={form.data} onChange={(v) => updateField("data", v)} />
                  <FieldInput label="Horário *" type="time" value={form.horario} onChange={(v) => updateField("horario", v)} />
                </div>

                <FieldInput label="Local" value={form.local} onChange={(v) => updateField("local", v)} placeholder="Sala de Catequese" />
                
                <div>
                  <label className="text-xs font-semibold text-zinc-900 mb-1 block">Observações Finais</label>
                  <textarea value={form.observacao} onChange={(e) => updateField("observacao", e.target.value)} placeholder="Anotações gerais..." className="form-input min-h-[80px] resize-y" />
                </div>

                <button onClick={handleAdd} disabled={mutation.isPending} className="w-full action-btn">
                  {mutation.isPending ? "Salvando..." : editingId ? 'Salvar Alterações' : 'Criar Reunião'}
                </button>
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
