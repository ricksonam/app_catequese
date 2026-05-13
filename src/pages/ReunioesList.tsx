import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useReunioes, useReuniaoMutation, useDeleteReuniao, useCatequizandos, useEncontros, useAtividades, useCatequistas } from "@/hooks/useSupabaseData";
import { REUNIAO_TIPOS, type Reuniao, type ReuniaoTipo, ORACAO_TIPOS } from "@/lib/store";
import { ArrowLeft, Plus, ListChecks, Trash2, MapPin, Clock, Calendar, Car, Users, ChevronRight, CheckCircle2, Pencil, X, Play, CalendarDays, Book, Sparkles, FileSignature, Printer, ClipboardCheck, Info, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  ataDecisoes?: string;
  outrosParticipantes?: string[];
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
  },
  ataDecisoes: "",
  outrosParticipantes: []
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
  ataDecisoes: item.ataDecisoes || "",
  outrosParticipantes: item.outrosParticipantes || [],
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
  const { data: catequistas = [] } = useCatequistas();
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

  const [activePautaId, setActivePautaId] = useState<string | null>(null);
  const [ataCompletaOpen, setAtaCompletaOpen] = useState(false);

  const handleSavePautaDecisao = (pautaId: string, decisao: string) => {
    if (!viewItem) return;
    const updatedPautas = viewItem.pautas?.map(p => p.id === pautaId ? { ...p, decisao } : p) || [];
    const updatedReuniao = { ...viewItem, pautas: updatedPautas };
    setViewItem(updatedReuniao);
    mutation.mutate(updatedReuniao);
    toast.success("Decisão da pauta salva com sucesso!", { icon: "📝" });
  };

  const gerarAtaTexto = () => {
     if (!viewItem) return "";
     let ata = `ATA DE REUNIÃO - ${viewItem.nome}\n`;
     ata += `Data: ${viewItem.data ? formatarDataVigente(viewItem.data) : 'A definir'} às ${viewItem.horario || 'A definir'}\n`;
     ata += `Local: ${viewItem.local || 'Não informado'}\n`;
     ata += `Tipo: ${viewItem.tipo}\n\n`;
     ata += `DECISÕES E ENCAMINHAMENTOS:\n`;
     ata += `----------------------------------------\n\n`;
  
     if (viewItem.pautas && viewItem.pautas.length > 0) {
        viewItem.pautas.forEach((p, i) => {
           ata += `${i + 1}. ${p.titulo}\n`;
           ata += `Decisão: ${p.decisao || "Nenhuma decisão registrada."}\n\n`;
        });
     } else {
        ata += `Nenhuma pauta detalhada.\n\n`;
     }
  
     ata += `----------------------------------------\n`;
     ata += `Anotações Gerais:\n${viewItem.ataDecisoes || "Nenhuma anotação adicional."}\n`;
  
     return ata;
  };

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
          observacao: form.observacao,
          ataDecisoes: form.ataDecisoes,
          outrosParticipantes: form.outrosParticipantes
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
    setViewItem(newItem);
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
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null); setForm({ ...emptyForm }); } }}>
            <DialogTrigger asChild><button className="action-btn-sm shrink-0 whitespace-nowrap"><Plus className="h-4 w-4" /> Nova</button></DialogTrigger>
            <DialogContent className="w-full sm:max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] p-0 sm:p-6 rounded-none sm:rounded-3xl border-none sm:border border-border/30 overflow-hidden flex flex-col">
               <div className="flex flex-col h-full">
                  <div className="p-6 pb-2 sm:p-0">
                     <DialogHeader><DialogTitle>{editingId ? 'Editar Reunião' : 'Nova Reunião'}</DialogTitle></DialogHeader>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 pt-2 sm:p-0 sm:mt-4 space-y-4 pr-2 custom-scrollbar">
                <div>
                  <label className="text-xs font-semibold text-zinc-900 mb-1 block">Tipo de Reunião *</label>
                  <select 
                    value={form.tipo} 
                    onChange={(e) => {
                      const newTipo = e.target.value as ReuniaoTipo;
                      updateField("tipo", newTipo);
                    }} 
                    className="form-input font-bold text-primary"
                  >
                    {REUNIAO_TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                  <FieldInput 
                    label={form.tipo === 'Reunião de preparação de sacramento' ? "Sacramento/Rito/Etapa *" : "Nome da Reunião *"} 
                    value={form.nome} 
                    onChange={(v) => updateField("nome", v)} 
                    placeholder={
                      form.tipo === 'Reunião de preparação de sacramento' ? "Ex: Crisma - Rito de Eleição" : 
                      form.tipo === 'Reunião de catequistas' ? "Ex: Planejamento Mensal" :
                      form.tipo === 'Reunião de pais' ? "Ex: Primeira Reunião de Pais" :
                      "Ex: Preparação do Encontro X"
                    } 
                  />

                  <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <FieldInput label="Data *" type="date" value={form.data} onChange={(v) => updateField("data", v)} />
                    <FieldInput label="Horário *" type="time" value={form.horario} onChange={(v) => updateField("horario", v)} />
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

                {/* --- SEÇÃO UNIFICADA: ROTEIRO (Para TODOS os tipos) --- */}
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 delay-150">
                  {/* Card Único: Roteiro da Reunião */}
                  <div className="p-5 rounded-2xl bg-white border-2 border-zinc-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-lg">
                        <Book className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tight leading-none">Roteiro da Reunião</h3>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Oração e Tópicos de Pauta</p>
                      </div>
                    </div>

                    <div className="h-px bg-zinc-100" />

                    {/* Momento de Oração Unificado (Lado a Lado) */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Tipo de Oração</label>
                        <select 
                          value={form.oracaoTipo || ""} 
                          onChange={(e) => updateField("oracaoTipo", e.target.value as any)}
                          className="w-full h-10 px-3 rounded-xl border border-black/10 bg-white text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                        >
                          <option value="">Escolher...</option>
                          {ORACAO_TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Leitura Bíblica</label>
                        <input 
                          type="text" 
                          value={form.oracaoInicial || ""} 
                          onChange={(e) => updateField("oracaoInicial", e.target.value)}
                          placeholder="Ex: Mt 5, 1-12"
                          className="w-full h-10 px-3 rounded-xl border border-black/10 bg-white text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex flex-col">
                          <label className="text-[10px] font-black text-zinc-700 uppercase tracking-widest leading-none">Tópicos da Reunião</label>
                          <p className="text-[9px] text-zinc-400 font-bold uppercase mt-1">Pautas e horários previstos</p>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => {
                            const next = [...(form.pautas || []), { id: crypto.randomUUID(), titulo: "", descricao: "", tempo: 0 }];
                            updateField("pautas", next);
                          }}
                          className="text-[9px] font-black text-white bg-zinc-900 px-3 py-2 rounded-xl uppercase flex items-center gap-1.5 hover:bg-zinc-800 transition-all border-2 border-zinc-900 shadow-sm active:scale-95"
                        >
                          <Plus className="h-3.5 w-3.5" /> Adicionar Pauta
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {(form.pautas || []).length === 0 ? (
                          <div className="py-8 px-4 border-2 border-dashed border-zinc-100 rounded-2xl flex flex-col items-center justify-center gap-2">
                            <ListChecks className="h-8 w-8 text-zinc-200" />
                            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Nenhuma pauta adicionada</p>
                          </div>
                        ) : (
                          (form.pautas || []).map((p, idx) => (
                            <div key={p.id} className="relative group animate-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                              <div className="absolute -left-1 top-0 bottom-0 w-1 bg-zinc-900 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
                              <div className="bg-white rounded-[1.5rem] p-4 sm:p-5 border-2 border-zinc-900 shadow-sm group-hover:shadow-md transition-all space-y-3.5">
                                <div className="flex items-start gap-3">
                                  <div className="w-6 h-6 rounded-lg bg-zinc-900 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm">
                                    {idx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <input 
                                      placeholder="Título da pauta..." 
                                      value={p.titulo} 
                                      onChange={(e) => {
                                        const next = [...(form.pautas || [])];
                                        next[idx] = { ...p, titulo: e.target.value };
                                        updateField("pautas", next);
                                      }}
                                      className="w-full bg-transparent border-none focus:ring-0 text-base font-black p-0 text-zinc-900 placeholder:text-zinc-200"
                                    />
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const next = (form.pautas || []).filter(x => x.id !== p.id);
                                      updateField("pautas", next);
                                    }}
                                    className="p-1.5 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>

                                <textarea 
                                  placeholder="O que será discutido neste tópico?" 
                                  value={p.descricao}
                                  onChange={(e) => {
                                    const next = [...(form.pautas || [])];
                                    next[idx] = { ...p, descricao: e.target.value };
                                    updateField("pautas", next);
                                  }}
                                  className="w-full bg-zinc-50 border-none focus:ring-2 focus:ring-zinc-900 rounded-xl text-sm font-medium text-zinc-700 p-3 min-h-[80px] resize-none placeholder:text-zinc-300 leading-relaxed transition-all shadow-inner"
                                />

                                <div className="flex items-center gap-2 pt-1">
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-lg border border-zinc-200">
                                    <Clock className="h-3 w-3 text-zinc-900" />
                                    <span className="text-[10px] font-black text-zinc-900 uppercase">Tempo:</span>
                                    <input 
                                      type="number"
                                      value={p.tempo || 0}
                                      onChange={(e) => {
                                        const next = [...(form.pautas || [])];
                                        next[idx] = { ...p, tempo: parseInt(e.target.value) || 0 };
                                        updateField("pautas", next);
                                      }}
                                      className="w-12 bg-transparent border-none focus:ring-0 text-xs font-black p-0 text-zinc-900"
                                      min="0"
                                    />
                                    <span className="text-[9px] font-bold text-zinc-500">min</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- SEÇÃO EXCLUSIVA: PREPARAÇÃO DE SACRAMENTO / LITURGIA --- */}
                {form.tipo === 'Reunião de preparação de sacramento' && (
                  <div className="p-4 rounded-2xl bg-liturgical/5 border border-liturgical/20 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-liturgical/10 text-liturgical flex items-center justify-center">
                        <Users className="h-4 w-4" />
                      </div>
                      <p className="text-[10px] font-black uppercase text-liturgical tracking-widest">Equipe de Liturgia / Trabalho</p>
                    </div>
                    
                    <div className="space-y-3">
                       <div className="space-y-1">
                         <label className="text-[10px] font-bold text-liturgical/60 ml-1 uppercase">Celebrante (Presidente)</label>
                         <input value={form.servicosLiturgia?.celebrante} onChange={(e) => updateField("servicosLiturgia", { ...form.servicosLiturgia, celebrante: e.target.value })} placeholder="Padre ou Diácono..." className="w-full bg-white border-liturgical/20 rounded-xl text-xs font-bold p-2.5 focus:ring-liturgical focus:border-liturgical" />
                       </div>
                       
                       <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1">
                           <label className="text-[10px] font-bold text-liturgical/60 ml-1 uppercase">Animador</label>
                           <input value={form.servicosLiturgia?.animador} onChange={(e) => updateField("servicosLiturgia", { ...form.servicosLiturgia, animador: e.target.value })} className="w-full bg-white border-liturgical/20 rounded-xl text-xs font-bold p-2.5" />
                         </div>
                         <div className="space-y-1">
                           <label className="text-[10px] font-bold text-liturgical/60 ml-1 uppercase">Salmista</label>
                           <input value={form.servicosLiturgia?.salmista} onChange={(e) => updateField("servicosLiturgia", { ...form.servicosLiturgia, salmista: e.target.value })} className="w-full bg-white border-liturgical/20 rounded-xl text-xs font-bold p-2.5" />
                         </div>
                       </div>

                       <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1">
                           <label className="text-[10px] font-bold text-liturgical/60 ml-1 uppercase">1º Leitor</label>
                           <input value={form.servicosLiturgia?.['1_leitor']} onChange={(e) => updateField("servicosLiturgia", { ...form.servicosLiturgia, '1_leitor': e.target.value })} className="w-full bg-white border-liturgical/20 rounded-xl text-xs font-bold p-2.5" />
                         </div>
                         <div className="space-y-1">
                           <label className="text-[10px] font-bold text-liturgical/60 ml-1 uppercase">2º Leitor</label>
                           <input value={form.servicosLiturgia?.['2_leitor']} onChange={(e) => updateField("servicosLiturgia", { ...form.servicosLiturgia, '2_leitor': e.target.value })} className="w-full bg-white border-liturgical/20 rounded-xl text-xs font-bold p-2.5" />
                         </div>
                       </div>

                       <div className="space-y-1">
                         <label className="text-[10px] font-bold text-liturgical/60 ml-1 uppercase">Preces / Outros</label>
                         <input value={form.servicosLiturgia?.preces} onChange={(e) => updateField("servicosLiturgia", { ...form.servicosLiturgia, preces: e.target.value })} className="w-full bg-white border-liturgical/20 rounded-xl text-xs font-bold p-2.5" />
                       </div>
                       
                       <div className="space-y-1">
                         <label className="text-[10px] font-bold text-liturgical/60 ml-1 uppercase">Ministério de Canto</label>
                         <input value={form.servicosLiturgia?.cantores} onChange={(e) => updateField("servicosLiturgia", { ...form.servicosLiturgia, cantores: e.target.value })} placeholder="Grupo ou coral..." className="w-full bg-white border-liturgical/20 rounded-xl text-xs font-bold p-2.5" />
                       </div>
                    </div>
                  </div>
                )}

                {/* --- CAMPOS GERAIS (RESTANTES) --- */}
                <div className="space-y-4">
                  <FieldInput label="Local" value={form.local} onChange={(v) => updateField("local", v)} placeholder="Sala de Catequese" />
                  
                  <div>
                    <label className="text-xs font-semibold text-zinc-900 mb-1 block">Observações Finais</label>
                    <textarea value={form.observacao} onChange={(e) => updateField("observacao", e.target.value)} placeholder="Anotações gerais..." className="form-input min-h-[80px] resize-y" />
                  </div>

                  <button onClick={handleAdd} disabled={mutation.isPending} className="w-full action-btn">
                    {mutation.isPending ? "Salvando..." : editingId ? 'Salvar Alterações' : 'Criar Reunião'}
                  </button>
                </div>
              </div>
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
                        <div className="flex flex-col bg-card rounded-2xl border border-black shadow-sm group-hover:shadow-md group-hover:border-primary/20 transition-all active:scale-[0.98] overflow-hidden relative">
                          <div className={`absolute top-0 bottom-0 left-0 w-1 ${cor.split(' ')[0].replace('bg-','bg-')}`} />
                          
                          <div className="flex items-stretch flex-1">
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
                          </div>

                          {/* Chips na parte de baixo */}
                          <div className="flex items-center gap-2 px-4 pb-3 sm:px-5 sm:pb-4 ml-[75px]">
                            <button 
                              onClick={(e) => { e.stopPropagation(); navigate(`/turmas/${id}/reunioes/${item.id}/apresentacao`); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200 transition-all shadow-sm active:scale-95 group/btn"
                            >
                              <Play className="h-3 w-3 fill-current" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Apresentar</span>
                            </button>
                            <div 
                              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-600 group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-sm"
                            >
                              <span className="text-[10px] font-black uppercase tracking-widest">Abrir</span>
                              <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
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
        <DialogContent className="w-full sm:max-w-2xl rounded-none sm:rounded-[2rem] border-0 p-0 overflow-hidden h-[100dvh] sm:max-h-[90vh] bg-transparent shadow-2xl flex flex-col">
          {viewItem && (
            <div className="flex flex-col flex-1 min-h-0 bg-white/95 backdrop-blur-xl rounded-none sm:rounded-[2rem] overflow-hidden relative">
              {/* Dynamic Header Gradient Background */}
              <div className={`absolute top-0 left-0 right-0 h-48 bg-gradient-to-br opacity-10 ${
                  viewItem.tipo === 'Reunião de preparação de encontro' ? 'from-emerald-400 to-teal-600' :
                  viewItem.tipo === 'Reunião de preparação de eventos' ? 'from-indigo-400 to-purple-600' :
                  viewItem.tipo === 'Reunião de preparação de sacramento' ? 'from-amber-400 to-orange-600' :
                  'from-primary to-primary/60'
              }`} />

              {/* Header Bar */}
              <div className="sticky top-0 z-20 shrink-0 flex items-center justify-between px-6 py-4 border-b border-black/5 bg-white/80 backdrop-blur-md">
                 <div className="flex items-center gap-3">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md bg-gradient-to-br ${
                      viewItem.tipo === 'Reunião de preparação de encontro' ? 'from-emerald-400 to-emerald-600' :
                      viewItem.tipo === 'Reunião de preparação de eventos' ? 'from-indigo-400 to-indigo-600' :
                      viewItem.tipo === 'Reunião de preparação de sacramento' ? 'from-amber-400 to-amber-600' :
                      'from-primary to-primary/80'
                   }`}>
                     <ListChecks className="w-4 h-4" />
                   </div>
                   <span className="text-sm font-bold text-foreground truncate">Ficha da Reunião</span>
                 </div>
                 {/* Actions */}
                 <div className="flex items-center gap-2 z-50">
                   <button onClick={() => { setForm(fillFormFromItem(viewItem)); setEditingId(viewItem.id); setOpen(true); }} className="w-9 h-9 flex items-center justify-center rounded-xl text-primary bg-primary/10 hover:bg-primary/20 transition-all active:scale-95 border border-primary/20" title="Editar"><Pencil className="h-4 w-4" /></button>
                   <button onClick={() => { setItemToDeleteId(viewItem.id); setDeleteConfirmOpen(true); }} className="w-9 h-9 flex items-center justify-center rounded-xl text-destructive bg-destructive/10 hover:bg-destructive/20 transition-all active:scale-95 border border-destructive/20" title="Excluir"><Trash2 className="h-4 w-4" /></button>
                   <div className="w-px h-5 bg-black/10 mx-1" />
                   <button onClick={() => setViewItem(null)} className="w-9 h-9 flex items-center justify-center rounded-xl text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-all active:scale-95 border border-zinc-200" title="Fechar"><X className="h-5 w-5" /></button>
                 </div>
              </div>

              <div className="flex-1 px-4 py-6 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto custom-scrollbar relative z-10">
                {/* Main Title Area */}
                <div className="text-center space-y-5">
                  <div className="flex justify-center gap-2 flex-wrap">
                     <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm ${
                       viewItem.tipo === 'Reunião de preparação de encontro' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                       viewItem.tipo === 'Reunião de preparação de eventos' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                       viewItem.tipo === 'Reunião de preparação de sacramento' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                       'bg-zinc-50 text-zinc-700 border-zinc-200'
                     }`}>
                       {viewItem.tipo}
                     </span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black text-foreground leading-tight tracking-tighter max-w-2xl mx-auto">{viewItem.nome}</h2>
                  
                  <div className="flex flex-row gap-3 pt-2 w-full">
                     <button 
                      onClick={() => { setPresencaItem(viewItem); setPresencaOpen(true); }}
                      className="flex-1 flex justify-center items-center gap-2 px-3 py-3 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-900/25 hover:shadow-emerald-900/40 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <ClipboardCheck className="h-4 w-4 shrink-0" />
                      <span className="flex flex-col items-start leading-tight">
                        <span>Registrar</span>
                        <span>Presença</span>
                      </span>
                      <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px] shrink-0">
                        {(viewItem.presencas||[]).length + (viewItem.outrosParticipantes||[]).length}
                      </span>
                    </button>

                    <button 
                      onClick={() => setAtaCompletaOpen(true)}
                      className="flex-1 flex justify-center items-center gap-2 px-3 py-3 rounded-full bg-sky-600 text-white hover:bg-sky-700 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-sky-900/25 hover:shadow-sky-900/40 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="flex flex-col items-center leading-tight">
                        <span>Ata</span>
                        <span>Completa</span>
                      </span>
                    </button>
                  </div>
                </div>

                {/* Card: Logística — Data, Hora e Local */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:divide-x divide-black/10 gap-4 sm:gap-0 p-4 rounded-2xl border border-black bg-white/60 shadow-sm">
                  <div className="flex items-center gap-4 flex-1 sm:pr-5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-black flex items-center justify-center shrink-0 text-blue-600 shadow-sm"><Calendar className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[10px] font-black text-blue-600/70 uppercase tracking-widest leading-none mb-1">Data e Horário</p>
                      <p className="text-base font-bold text-foreground">
                        {viewItem.data ? formatarDataVigente(viewItem.data) : 'A definir'} <span className="text-muted-foreground font-medium mx-1">•</span> {viewItem.horario || 'A definir'}
                      </p>
                    </div>
                  </div>
                  <div className="h-px sm:h-10 sm:w-px bg-black/10" />
                  <div className="flex items-center gap-4 flex-1 sm:pl-5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-black flex items-center justify-center shrink-0 text-emerald-600 shadow-sm"><MapPin className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[10px] font-black text-emerald-600/70 uppercase tracking-widest leading-none mb-1">Local</p>
                      <p className="text-base font-bold text-foreground truncate">{viewItem.local || 'Não informado'}</p>
                    </div>
                  </div>
                </div>

                {/* Card: Roteiro de Pautas e Decisões */}
                <div className="border border-black rounded-2xl p-4 bg-white/60 shadow-sm">
                  <h4 className="text-xs font-black text-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-primary" /> Roteiro de Pautas e Decisões
                  </h4>
                  <div className="space-y-3">
                    {(viewItem.pautas && viewItem.pautas.length > 0) ? (
                      viewItem.pautas.map((p, i) => (
                        <div key={p.id} className="flex flex-col gap-3 group/pauta border border-black rounded-2xl p-4 hover:border-primary/40 transition-all cursor-pointer bg-white" onClick={() => setActivePautaId(activePautaId === p.id ? null : p.id)}>
                          <div className="flex gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[12px] font-black shrink-0 transition-colors shadow-sm ${activePautaId === p.id || p.decisao ? 'bg-primary text-white' : 'bg-primary/10 text-primary group-hover/pauta:bg-primary/20'}`}>
                              {i + 1}
                            </div>
                            <div className="flex-1 pb-1">
                              <h5 className="text-sm font-bold text-foreground uppercase tracking-tight mb-1 flex items-center justify-between">
                                {p.titulo}
                                <div className="flex items-center gap-2">
                                  {p.decisao && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                                  {activePautaId === p.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                </div>
                              </h5>
                              <p className="text-sm text-muted-foreground leading-relaxed">{p.descricao}</p>
                              {p.decisao && activePautaId !== p.id && (
                                <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-sm font-medium leading-relaxed">
                                  <span className="font-bold text-emerald-700 uppercase tracking-wider text-[10px] block mb-1">Decisão:</span>
                                  {p.decisao}
                                </div>
                              )}
                            </div>
                          </div>
                          {activePautaId === p.id && (
                            <div className="w-full" onClick={e => e.stopPropagation()}>
                              <textarea
                                defaultValue={p.decisao || ""}
                                placeholder="Registre a decisão ou encaminhamento sobre esta pauta..."
                                className="w-full min-h-[160px] p-4 text-sm font-medium text-slate-700 focus:outline-none resize-none bg-white rounded-xl border border-black focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all leading-relaxed block"
                                onBlur={(e) => handleSavePautaDecisao(p.id, e.target.value)}
                              />
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Salva ao sair do campo</p>
                                <button onClick={() => setActivePautaId(null)} className="px-4 py-1.5 rounded-lg bg-sky-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-sky-700 active:scale-95 transition-all">Fechar</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center p-6 bg-muted/30 rounded-2xl border border-dashed border-black/20">
                        <p className="text-sm font-medium text-muted-foreground italic">Nenhuma pauta detalhada para este encontro.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card: Anotações Gerais Extras */}
                <div className="border border-black rounded-2xl p-4 bg-white/60 shadow-sm">
                  <h4 className="text-xs font-black text-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FileSignature className="h-4 w-4 text-sky-600" /> Anotações Gerais Extras
                  </h4>
                  <textarea
                    id="ata-textarea"
                    defaultValue={viewItem.ataDecisoes || ""}
                    placeholder="Registre anotações extras que não se encaixam em nenhuma pauta específica..."
                    className="w-full min-h-[160px] p-4 text-sm font-medium text-slate-700 focus:outline-none resize-none bg-white rounded-xl border border-black focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all placeholder:text-slate-400 leading-relaxed"
                    onBlur={(e) => {
                      mutation.mutate({ ...viewItem, ataDecisoes: e.target.value });
                      toast.success("Anotações gerais salvas com sucesso!");
                    }}
                  />
                </div>

                {viewItem.observacao && (
                  <div className="bg-amber-50/50 rounded-3xl p-6 border border-amber-200/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Info className="w-24 h-24 text-amber-500" /></div>
                    <div className="relative z-10">
                      <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-2"><Info className="w-3.5 h-3.5" /> Observações Adicionais</h4>
                      <p className="text-sm font-medium text-amber-900/80 leading-relaxed whitespace-pre-wrap">{viewItem.observacao}</p>
                    </div>
                  </div>
                )}
              </div>
          </div>
          )}
        </DialogContent>
    </Dialog>

      <Dialog open={presencaOpen} onOpenChange={setPresencaOpen}>
        <DialogContent className="rounded-3xl border-border/30 max-w-sm p-0 overflow-hidden shadow-2xl">
          <div className="p-6 bg-emerald-600 text-white text-center">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm mb-3">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <DialogHeader><DialogTitle className="text-white text-xl font-black uppercase tracking-tight text-center">Presença na Reunião</DialogTitle></DialogHeader>
            <p className="text-[10px] font-black uppercase text-emerald-100 tracking-widest mt-1">Catequistas e Participantes</p>
          </div>
          
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {/* Lista de Catequistas */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Catequistas</label>
              {catequistas.length === 0 ? <p className="text-xs text-muted-foreground text-center py-2">Nenhum catequista encontrado</p> : (
                <div className="space-y-1">
                  {catequistas.map(c => {
                    const present = (presencaItem?.presencas || []).includes(c.id);
                    return (
                      <button key={c.id} onClick={() => togglePresenca(c.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors border ${present ? 'bg-success/10 border-success/20' : 'bg-muted/30 border-transparent hover:bg-muted/50'}`}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${present ? 'bg-success border-success' : 'border-black/10'}`}>{present && <CheckCircle2 className="h-3 w-3 text-white" />}</div>
                        <div className="flex-1 text-left min-w-0">
                          <span className={`font-bold block truncate leading-tight ${present ? 'text-foreground' : 'text-muted-foreground'}`}>{c.nome}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="h-px bg-zinc-100" />

            {/* Outros Participantes */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Outros Participantes</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  id="add-other-name"
                  placeholder="Nome do participante..." 
                  className="flex-1 text-xs p-2.5 rounded-xl border border-zinc-200 focus:ring-zinc-900" 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget;
                      const name = input.value.trim();
                      if (name && presencaItem) {
                        const next = [...(presencaItem.outrosParticipantes || []), name];
                        const newItem = { ...presencaItem, outrosParticipantes: next };
                        mutation.mutate(newItem);
                        setPresencaItem(newItem);
                        setViewItem(newItem);
                        input.value = "";
                      }
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    const input = document.getElementById('add-other-name') as HTMLInputElement;
                    const name = input.value.trim();
                    if (name && presencaItem) {
                      const next = [...(presencaItem.outrosParticipantes || []), name];
                      const newItem = { ...presencaItem, outrosParticipantes: next };
                      mutation.mutate(newItem);
                      setPresencaItem(newItem);
                      setViewItem(newItem);
                      input.value = "";
                    }
                  }}
                  className="w-10 h-10 bg-zinc-900 text-white rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-all"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {presencaItem?.outrosParticipantes && presencaItem.outrosParticipantes.length > 0 && (
                <div className="space-y-1 mt-2">
                  {presencaItem.outrosParticipantes.map((name, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
                      <span className="text-xs font-bold text-zinc-700">{name}</span>
                      <button 
                        onClick={() => {
                          const next = presencaItem.outrosParticipantes?.filter((_, idx) => idx !== i);
                          const newItem = { ...presencaItem, outrosParticipantes: next };
                          mutation.mutate(newItem);
                          setPresencaItem(newItem);
                          setViewItem(newItem);
                        }}
                        className="p-1 text-zinc-300 hover:text-red-500 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={ataCompletaOpen} onOpenChange={setAtaCompletaOpen}>
        <DialogContent className="w-full sm:max-w-3xl rounded-[2rem] p-6 sm:p-8 bg-white border-black/5 shadow-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600">
                <FileSignature className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-black text-foreground">Ata Completa</h2>
            </div>
            <button onClick={() => setAtaCompletaOpen(false)} className="p-2 rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors"><X className="h-5 w-5" /></button>
          </div>
          
          <div className="flex-1 bg-slate-50 rounded-2xl p-6 border border-slate-200 overflow-y-auto custom-scrollbar">
             <pre className="whitespace-pre-wrap font-mono text-sm text-slate-700 leading-relaxed max-w-full">
               {gerarAtaTexto()}
             </pre>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(gerarAtaTexto());
                toast.success("Ata copiada para a área de transferência!");
              }} 
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 text-white font-black text-[11px] uppercase tracking-widest hover:bg-sky-700 transition-all shadow-lg shadow-sky-600/20 active:scale-95 hover:-translate-y-0.5"
            >
              <ClipboardCheck className="h-4 w-4" /> Copiar Ata para a Área de Transferência
            </button>
          </div>
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
