import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useCatequizandos, useCatequizandoMutation, useDeleteCatequizando, useEncontros } from "@/hooks/useSupabaseData";
import { type Catequizando, type CatequizandoStatus } from "@/lib/store";
import { ArrowLeft, Plus, UserPlus, ChevronDown, ChevronUp, ChevronRight, Camera, Pencil, Trash2, X, Printer, Cake, BellRing, CalendarDays, CheckCircle2, AlertCircle, FileSignature, Users } from "lucide-react";
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ReportModule from "@/components/reports/ReportModule";
import { toast } from "sonner";
import { ImagePicker } from "@/components/ImagePicker";
import { mascaraTelefone, cn } from "@/lib/utils";
import { CustomDatePicker } from "@/components/CustomDatePicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

// --- Helpers ---
function InfoRow({ label, value }: { label: string; value?: string }) { 
  if (!value) return null; 
  return <p><span className="text-muted-foreground">{label}:</span> <span className="font-semibold text-foreground">{value}</span></p>; 
}

function FieldInput({ label, type = "text", value, onChange, placeholder }: { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label>
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

function calcularIdade(dataNascimento: string): string {
  if (!dataNascimento) return "";
  const hoje = new Date(); const nasc = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return `${idade} anos`;
}

function isAniversarianteMes(dataNascimento: string): boolean {
  if (!dataNascimento) return false;
  const hoje = new Date();
  const nasc = new Date(dataNascimento + (dataNascimento.includes('T') ? '' : 'T12:00:00'));
  return nasc.getMonth() === hoje.getMonth();
}

function isAniversarianteMesBatismo(dataBatismo?: string): boolean {
  if (!dataBatismo) return false;
  const hoje = new Date();
  const nasc = new Date(dataBatismo + (dataBatismo.includes('T') ? '' : 'T12:00:00'));
  return nasc.getMonth() === hoje.getMonth();
}

interface SacramentoInfo { recebido: boolean; paroquia: string; data: string; }
interface ResponsavelForm { id: string; nome: string; telefone: string; vinculo: 'pais' | 'avós' | 'tios' | 'outros'; }
interface CatequizandoForm {
  nome: string; dataNascimento: string; email: string; telefone: string;
  endereco: string; numero: string; bairro: string; complemento: string;
  necessidadeEspecial: string; observacao: string; foto: string;
  batismo: SacramentoInfo; eucaristia: SacramentoInfo; crisma: SacramentoInfo;
  participacaoPastoral: string;
  responsaveis: ResponsavelForm[];
}

const NECESSIDADES_ESPECIAIS = [
  { id: "nenhuma", label: "Nenhuma", lanyard: null, color: "" },
  { id: "tea", label: "Autismo (TEA)", lanyard: "quebra-cabeça", color: "bg-blue-500", pattern: "🧩" },
  { id: "tdah", label: "TDAH", lanyard: "girassol", color: "bg-green-500", pattern: "🌻" },
  { id: "visual", label: "Deficiência Visual", lanyard: "branco/azul", color: "bg-white border-blue-500", pattern: "🦯" },
  { id: "auditiva", label: "Deficiência Auditiva", lanyard: "azul", color: "bg-blue-700", pattern: "👂" },
  { id: "fisica", label: "Deficiência Física", lanyard: "azul/branco", color: "bg-blue-600", pattern: "♿" },
  { id: "oculta", label: "Deficiências Ocultas", lanyard: "girassol", color: "bg-green-100 border-green-500", pattern: "🌻" },
  { id: "outro", label: "Outro", lanyard: "cinza", color: "bg-gray-400", pattern: "⭕" },
];

function LanyardDrawing({ type }: { type: string }) {
  const need = NECESSIDADES_ESPECIAIS.find(n => n.id === type);
  if (!need || !need.lanyard) return null;

  return (
    <div className="flex flex-col items-center gap-2 p-3 bg-white/50 rounded-2xl border-2 border-dashed border-black/10 animate-in zoom-in-95">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Cordão de Identificação</p>
      <div className="relative w-full max-w-[200px] h-12 flex items-center justify-center">
        {/* Simulação do Cordão (Strap) */}
        <div className={`absolute inset-x-0 h-6 rounded-full border-2 border-black/10 ${need.color} shadow-sm overflow-hidden flex items-center justify-around px-2`}>
          {[...Array(6)].map((_, i) => (
            <span key={i} className="text-xs filter saturate-150 drop-shadow-sm">{need.pattern}</span>
          ))}
        </div>
        {/* O Crachá (Badge) */}
        <div className="absolute left-1/2 -translate-x-1/2 top-4 w-10 h-14 bg-white rounded-md border-2 border-black/10 shadow-lg flex flex-col items-center p-1 z-10">
          <div className="w-6 h-1 bg-black/10 rounded-full mb-1" />
          <div className="w-full h-8 bg-muted/20 rounded flex items-center justify-center text-lg">{need.pattern}</div>
          <div className="w-full h-1 bg-black/5 rounded-full mt-1.5" />
          <div className="w-3/4 h-1 bg-black/5 rounded-full mt-1" />
        </div>
      </div>
      <p className="text-xs font-bold text-foreground mt-4 uppercase">{need.lanyard}</p>
    </div>
  );
}

const emptyForm: CatequizandoForm = {
  nome: "", dataNascimento: "", email: "", telefone: "",
  endereco: "", numero: "", bairro: "", complemento: "",
  necessidadeEspecial: "nenhuma", observacao: "", foto: "",
  batismo: { recebido: false, paroquia: "", data: "" }, eucaristia: { recebido: false, paroquia: "", data: "" }, crisma: { recebido: false, paroquia: "", data: "" },
  participacaoPastoral: "",
  responsaveis: [{ id: crypto.randomUUID(), nome: "", telefone: "", vinculo: 'pais' }],
};

const statusConfig: Record<CatequizandoStatus, { label: string; color: string }> = {
  ativo: { label: "Ativo", color: "bg-success/10 text-success" },
  desistente: { label: "Desistente", color: "bg-destructive/10 text-destructive" },
  afastado: { label: "Afastado", color: "bg-warning/10 text-warning" },
};

export default function CatequizandosList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: turmas = [] } = useTurmas();
  const { data: list = [], isLoading } = useCatequizandos(id);
  const mutation = useCatequizandoMutation();
  const deleteMut = useDeleteCatequizando();
  const turma = turmas.find((t) => t.id === id);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CatequizandoForm>({ ...emptyForm });
  const [showSacramentos, setShowSacramentos] = useState(false);
  const [viewItem, setViewItem] = useState<Catequizando | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<CatequizandoForm>({ ...emptyForm });
  const [showEditSacramentos, setShowEditSacramentos] = useState(false);
  const [filterAniversarios, setFilterAniversarios] = useState(false);
  const [filterBatismos, setFilterBatismos] = useState(false);
  
  // --- Frequência Modal States ---
  const [showFrequencia, setShowFrequencia] = useState(false);
  const [freqTab, setFreqTab] = useState<'encontro' | 'resumo'>('encontro');
  const [freqEncontroId, setFreqEncontroId] = useState<string>('');
  const [freqMes, setFreqMes] = useState<string>('');
  
  // --- Celebrações Modal States ---
  const [showCelebracoes, setShowCelebracoes] = useState(false);
  const [celebracoesTab, setCelebracoesTab] = useState<'nascimento' | 'batismo'>('nascimento');
  
  const [alertConfig] = useState(() => {
    const saved = localStorage.getItem('ivc_alertas_config');
    const defaultState = {
      moduloEncontros: { ativo: true, presenca: true, avaliacao: true, status: true },
      moduloCatequizandos: { ativo: true, faltas: 3 }
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.ativos !== undefined) return defaultState;
        return {
          moduloEncontros: { ...defaultState.moduloEncontros, ...(parsed.moduloEncontros || {}) },
          moduloCatequizandos: { ...defaultState.moduloCatequizandos, ...(parsed.moduloCatequizandos || {}) }
        };
      } catch (e) {
        return defaultState;
      }
    }
    return defaultState;
  });

  const { data: encontros = [] } = useEncontros(id);

  const pastEncontros = useMemo(() => {
    const limit = alertConfig.moduloCatequizandos?.faltas ?? 3;
    return encontros
      .filter(e => e.status === 'realizado')
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, limit);
  }, [encontros, alertConfig.moduloCatequizandos?.faltas]);

  const catequizandosEmAlerta = useMemo(() => {
    const alertas = new Set<string>();
    const cfg = alertConfig.moduloCatequizandos;
    if (!cfg?.ativo) return alertas;

    const limit = cfg.faltas ?? 3;
    list.forEach(c => {
      if (pastEncontros.length >= limit && limit > 0) {
        const wasPresentOrJustifiedInAny = pastEncontros.some(e => 
            e.presencas.includes(c.id) || (e.justificativas && e.justificativas[c.id])
        );
        if (!wasPresentOrJustifiedInAny) alertas.add(c.id);
      }
    });
    return alertas;
  }, [list, pastEncontros, alertConfig.moduloCatequizandos]);

  // --- Lógica de Frequência ---
  const encontrosRealizados = useMemo(() => 
    encontros.filter(e => e.status === 'realizado').sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
  [encontros]);
  
  const mesesDisponiveis = useMemo(() => {
    const meses = new Set<string>();
    encontrosRealizados.forEach(e => {
      const d = new Date(e.data + 'T12:00:00');
      const mesAno = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      meses.add(mesAno);
    });
    return Array.from(meses).sort((a,b) => b.localeCompare(a));
  }, [encontrosRealizados]);

  useEffect(() => {
    if (showFrequencia && !freqMes && mesesDisponiveis.length > 0) {
      setFreqMes(mesesDisponiveis[0]);
    }
  }, [showFrequencia, freqMes, mesesDisponiveis]);

  useEffect(() => {
    if (showFrequencia && !freqEncontroId && encontrosRealizados.length > 0) {
      setFreqEncontroId(encontrosRealizados[0].id);
    }
  }, [showFrequencia, freqEncontroId, encontrosRealizados]);

  const selectedEncontroObj = useMemo(() => encontrosRealizados.find(e => e.id === freqEncontroId), [encontrosRealizados, freqEncontroId]);
  
  const resumoMes = useMemo(() => {
    if (!freqMes) return [];
    const encontrosNoMes = encontrosRealizados.filter(e => {
      const d = new Date(e.data + 'T12:00:00');
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === freqMes;
    });
    
    return list.map(c => {
      let presencas = 0;
      let justificadas = 0;
      let faltas = 0;
      
      encontrosNoMes.forEach(e => {
        if (e.presencas?.includes(c.id)) {
          presencas++;
        } else if (e.justificativas && e.justificativas[c.id]) {
          justificadas++;
        } else {
          faltas++;
        }
      });
      
      const total = encontrosNoMes.length;
      const perc = total > 0 ? Math.round((presencas / total) * 100) : 0;
      
      return { catequizando: c, presencas, justificadas, faltas, total, perc };
    }).sort((a, b) => a.catequizando.nome.localeCompare(b.catequizando.nome));
  }, [freqMes, encontrosRealizados, list]);

  const updateField = useCallback((field: string, value: string) => { setForm((f) => ({ ...f, [field]: value })); }, []);
  const updateSacramento = useCallback((sac: 'batismo' | 'eucaristia' | 'crisma', field: string, value: string | boolean) => { setForm((f) => ({ ...f, [sac]: { ...f[sac], [field]: value } })); }, []);

  const handleAdd = async () => {
    if (!form.nome) { toast.error("Nome é obrigatório"); return; }
    const novo: Catequizando = {
      id: crypto.randomUUID(), turmaId: id!, nome: form.nome, dataNascimento: form.dataNascimento,
      responsavel: form.responsaveis[0]?.nome || "", telefone: form.telefone, email: form.email, 
      endereco: form.endereco, numero: form.numero, bairro: form.bairro, complemento: form.complemento,
      necessidadeEspecial: form.necessidadeEspecial, observacao: form.observacao, status: 'ativo',
      foto: form.foto || undefined,
      sacramentos: { batismo: form.batismo, eucaristia: form.eucaristia, crisma: form.crisma } as any,
      responsaveis: form.responsaveis as any[],
      dadosPastorais: {
        sacramentos: { batismo: form.batismo, eucaristia: form.eucaristia, crisma: form.crisma },
        participacaoPastoral: form.participacaoPastoral
      } as any
    };
    try { await mutation.mutateAsync(novo); setForm({ ...emptyForm }); setShowSacramentos(false); setOpen(false); toast.success("Catequizando adicionado!"); }
    catch (err: any) { toast.error("Erro: " + err.message); }
  };

  const addResponsavel = (isEdit: boolean) => {
    const newItem = { id: crypto.randomUUID(), nome: "", telefone: "", vinculo: 'pais' as const };
    if (isEdit) setEditForm(f => ({ ...f, responsaveis: [...f.responsaveis, newItem] }));
    else setForm(f => ({ ...f, responsaveis: [...f.responsaveis, newItem] }));
  };

  const removeResponsavel = (id: string, isEdit: boolean) => {
    if (isEdit) setEditForm(f => ({ ...f, responsaveis: f.responsaveis.filter(r => r.id !== id) }));
    else setForm(f => ({ ...f, responsaveis: f.responsaveis.filter(r => r.id !== id) }));
  };

  const updateResponsavel = (id: string, field: string, value: string, isEdit: boolean) => {
    const update = (r: ResponsavelForm) => r.id === id ? { ...r, [field]: value } : r;
    if (isEdit) setEditForm(f => ({ ...f, responsaveis: f.responsaveis.map(update) }));
    else setForm(f => ({ ...f, responsaveis: f.responsaveis.map(update) }));
  };

  const handleStatusChange = (catequizando: Catequizando, newStatus: CatequizandoStatus) => {
    mutation.mutate({ ...catequizando, status: newStatus });
    setViewItem({ ...catequizando, status: newStatus });
    toast.success(`Status alterado para ${statusConfig[newStatus].label}`);
  };

  const handleEdit = () => {
    if (!viewItem) return;
    setEditForm({
      nome: viewItem.nome, dataNascimento: viewItem.dataNascimento,
      telefone: viewItem.telefone, email: viewItem.email, 
      endereco: viewItem.endereco || "", numero: viewItem.numero || "", bairro: viewItem.bairro || "", complemento: viewItem.complemento || "",
      necessidadeEspecial: viewItem.necessidadeEspecial || "", observacao: viewItem.observacao || "", foto: viewItem.foto || "",
      batismo: (viewItem.dadosPastorais?.sacramentos?.batismo || viewItem.sacramentos?.batismo || { recebido: false, paroquia: "", data: "" }) as SacramentoInfo,
      eucaristia: (viewItem.dadosPastorais?.sacramentos?.eucaristia || viewItem.sacramentos?.eucaristia || { recebido: false, paroquia: "", data: "" }) as SacramentoInfo,
      crisma: (viewItem.dadosPastorais?.sacramentos?.crisma || viewItem.sacramentos?.crisma || { recebido: false, paroquia: "", data: "" }) as SacramentoInfo,
      participacaoPastoral: viewItem.dadosPastorais?.participacaoPastoral || "",
      responsaveis: (viewItem.responsaveis?.length ? viewItem.responsaveis : [{ id: crypto.randomUUID(), nome: viewItem.responsavel || "", telefone: viewItem.telefone || "", vinculo: 'pais' }]) as ResponsavelForm[],
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!viewItem || !editForm.nome) { toast.error("Nome é obrigatório"); return; }
    const updated: Catequizando = {
      ...viewItem, nome: editForm.nome, dataNascimento: editForm.dataNascimento,
      responsavel: editForm.responsaveis[0]?.nome || "",
      telefone: editForm.telefone, email: editForm.email, 
      endereco: editForm.endereco, numero: editForm.numero, bairro: editForm.bairro, complemento: editForm.complemento,
      necessidadeEspecial: editForm.necessidadeEspecial,
      observacao: editForm.observacao, foto: editForm.foto || undefined,
      responsaveis: editForm.responsaveis as any[],
      dadosPastorais: {
        sacramentos: { batismo: editForm.batismo as any, eucaristia: editForm.eucaristia as any, crisma: editForm.crisma as any },
        participacaoPastoral: editForm.participacaoPastoral
      } as any,
      sacramentos: { batismo: editForm.batismo as any, eucaristia: editForm.eucaristia as any, crisma: editForm.crisma as any },
    };
    try { await mutation.mutateAsync(updated); setViewItem(updated); setEditMode(false); toast.success("Atualizado!"); }
    catch (err: any) { toast.error("Erro: " + err.message); }
  };

  const handleDelete = async () => {
    if (!viewItem) return;
    if (!confirm(`Excluir ${viewItem.nome}?`)) return;
    try { await deleteMut.mutateAsync(viewItem.id); setViewItem(null); toast.success("ExcluÃ­do!"); }
    catch (err: any) { toast.error("Erro: " + err.message); }
  };

  const aniversariantesDoMes = useMemo(() => {
    const hoje = new Date();
    const diaAtual = hoje.getDate();
    
    return list
      .filter(c => isAniversarianteMes(c.dataNascimento))
      .sort((a, b) => {
        const diaA = new Date(a.dataNascimento + 'T12:00:00').getDate();
        const diaB = new Date(b.dataNascimento + 'T12:00:00').getDate();
        
        const aNoFuturo = diaA >= diaAtual;
        const bNoFuturo = diaB >= diaAtual;
        
        if (aNoFuturo && !bNoFuturo) return -1;
        if (!aNoFuturo && bNoFuturo) return 1;
        return diaA - diaB;
      });
  }, [list]);

  const batismosDoMes = useMemo(() => {
    const hoje = new Date();
    const diaAtual = hoje.getDate();
    
    return list
      .filter(c => isAniversarianteMesBatismo(c.sacramentos?.batismo?.data))
      .sort((a, b) => {
        const diaA = new Date((a.sacramentos?.batismo?.data || "") + 'T12:00:00').getDate();
        const diaB = new Date((b.sacramentos?.batismo?.data || "") + 'T12:00:00').getDate();
        
        const aNoFuturo = diaA >= diaAtual;
        const bNoFuturo = diaB >= diaAtual;
        
        if (aNoFuturo && !bNoFuturo) return -1;
        if (!aNoFuturo && bNoFuturo) return 1;
        return diaA - diaB;
      });
  }, [list]);

  const hasQualquerCelebracao = aniversariantesDoMes.length > 0 || batismosDoMes.length > 0;
  
  const filteredList = useMemo(() => {
    if (filterAniversarios) return aniversariantesDoMes;
    if (filterBatismos) return batismosDoMes;
    return list;
  }, [filterAniversarios, filterBatismos, aniversariantesDoMes, batismosDoMes, list]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5 animate-bounce-subtle">
           <div className="w-6 h-6 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
        <p className="text-xs font-black text-primary/60 uppercase tracking-widest animate-pulse">Carregando Catequizandos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 animate-fade-in">
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden pt-1">
          <button onClick={() => navigate(`/turmas/${id}`)} className="back-btn shrink-0"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div className="min-w-0 flex flex-1 items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-foreground truncate">Catequizandos</h1>
              <p className="text-xs text-muted-foreground truncate">{list.length} cadastrados</p>
            </div>
            
            <button 
              onClick={() => setShowCelebracoes(true)}
              className={cn(
                "px-3 py-1.5 rounded-full border flex items-center gap-2 transition-all active:scale-95 shadow-sm",
                filterAniversarios || filterBatismos 
                  ? "bg-amber-500 border-amber-600 text-white shadow-amber-500/20" 
                  : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
              )}
            >
              <Cake className={cn("w-3.5 h-3.5", (filterAniversarios || filterBatismos) ? "text-white" : "text-amber-600")} />
              <span className="text-[10px] font-black uppercase tracking-tight">Aniversariantes</span>
              {hasQualquerCelebracao && !filterAniversarios && !filterBatismos && (
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
          </div>
        </div>
        <div className="flex flex-col w-full sm:w-auto gap-3 shrink-0">
          <div className="flex items-center justify-end gap-2 w-full overflow-x-auto pb-1 sm:pb-0">
            <div className="flex-1 sm:flex-none">
              {id && <ReportModule context="catequizandos" turmaId={id} />}
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><button className="action-btn-sm shrink-0 whitespace-nowrap"><Plus className="h-4 w-4" /> Novo</button></DialogTrigger>
            <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto border-border/30 w-full max-w-2xl">
              <DialogHeader><DialogTitle className="text-2xl font-black">Ficha de Inscrição</DialogTitle></DialogHeader>
              <div className="space-y-8 mt-4 pb-6">
                {/* SEÇÃO 1: DADOS PESSOAIS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-primary font-black">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm"><UserPlus className="w-5 h-5" /></div>
                    <span className="text-lg tracking-tight">DADOS PESSOAIS</span>
                  </div>
                  <Separator className="bg-primary/20 h-0.5" />
                  
                  <div className="flex justify-center mb-4">
                    <ImagePicker 
                      onImageUpload={(url) => setForm(f => ({ ...f, foto: url }))} 
                      folder="catequizandos" 
                      currentImageUrl={form.foto} 
                      shape="circle" 
                      label="Foto de Perfil"
                    />
                  </div>

                  <div className="space-y-4">
                    <FieldInput label="Nome completo *" value={form.nome} onChange={(v) => updateField("nome", v)} />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <CustomDatePicker 
                        label="Data de Nascimento" 
                        value={form.dataNascimento} 
                        onChange={(v) => updateField("dataNascimento", v)} 
                      />
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Idade</label>
                        <div className="h-10 flex items-center px-3 bg-muted/30 rounded-md border border-input font-bold text-primary">
                          {calcularIdade(form.dataNascimento) || "—"}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FieldInput label="Telefone" type="tel" value={form.telefone} onChange={(v) => updateField("telefone", mascaraTelefone(v))} />
                      <FieldInput label="E-mail" type="email" value={form.email} onChange={(v) => updateField("email", v)} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FieldInput label="Endereço / Rua" value={form.endereco} onChange={(v) => updateField("endereco", v)} />
                      <div className="grid grid-cols-2 gap-4">
                         <FieldInput label="Número" value={form.numero} onChange={(v) => updateField("numero", v)} />
                         <FieldInput label="Bairro" value={form.bairro} onChange={(v) => updateField("bairro", v)} />
                      </div>
                    </div>
                    <FieldInput label="Complemento" value={form.complemento} onChange={(v) => updateField("complemento", v)} />
                  </div>
                </div>

                {/* SEÇÃO 2: DADOS PASTORAIS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-orange-600 font-black">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shadow-sm">✝️</div>
                    <span className="text-lg tracking-tight">DADOS PASTORAIS</span>
                  </div>
                  <Separator className="bg-orange-500/20 h-0.5" />

                  <div className="space-y-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sacramentos Recebidos</p>
                    <div className="grid grid-cols-1 gap-4">
                      {(["batismo", "eucaristia", "crisma"] as const).map((sac) => (
                        <div key={sac} className="space-y-2">
                          <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 transition-colors cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={form[sac].recebido} 
                              onChange={(e) => updateSacramento(sac, "recebido", e.target.checked)} 
                              className="w-5 h-5 rounded-md border-border text-primary focus:ring-primary" 
                            />
                            <span className="text-sm font-bold text-foreground capitalize">{sac}</span>
                          </label>
                          {form[sac].recebido && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-7 animate-in slide-in-from-left-2">
                              <FieldInput label="Paróquia" value={form[sac].paroquia} onChange={(v) => updateSacramento(sac, "paroquia", v)} placeholder="Local do sacramento" />
                              <CustomDatePicker label="Data" value={form[sac].data || ""} onChange={(v) => updateSacramento(sac, "data", v)} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Participa de alguma Pastoral ou Grupo?</label>
                    <textarea 
                      value={form.participacaoPastoral} 
                      onChange={(e) => setForm(f => ({ ...f, participacaoPastoral: e.target.value }))} 
                      className="form-input min-h-[60px] resize-none" 
                      placeholder="Ex: Coroinhas, Infância Missionária, etc..." 
                    />
                  </div>
                </div>

                {/* SEÇÃO 3: DADOS DO RESPONSÁVEL */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-500 font-bold">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mt-[-4px]">👥</div>
                      <span>DADOS DO RESPONSÁVEL</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => addResponsavel(false)}
                      className="text-[10px] font-black uppercase text-blue-600 bg-blue-50/50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Adicionar Outro
                    </button>
                  </div>
                  <Separator className="bg-blue-500/20 h-0.5" />

                  <div className="space-y-4">
                    {form.responsaveis.map((resp, idx) => (
                      <div key={resp.id} className="p-4 bg-white/40 border border-blue-200 rounded-xl space-y-4 relative group animate-in zoom-in-95 shadow-sm">
                        {form.responsaveis.length > 1 && (
                          <button 
                            onClick={() => removeResponsavel(resp.id, false)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FieldInput label="Nome do Responsável" value={resp.nome} onChange={(v) => updateResponsavel(resp.id, "nome", v, false)} />
                          <FieldInput label="Telefone Contato" type="tel" value={resp.telefone} onChange={(v) => updateResponsavel(resp.id, "telefone", mascaraTelefone(v), false)} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Vínculo / Parentesco</label>
                          <Select 
                            value={resp.vinculo} 
                            onValueChange={(v) => updateResponsavel(resp.id, "vinculo", v, false)}
                          >
                            <SelectTrigger className="h-10 bg-background">
                              <SelectValue placeholder="Selecione o vínculo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pais">Pais</SelectItem>
                              <SelectItem value="avós">Avós</SelectItem>
                              <SelectItem value="tios">Tios</SelectItem>
                              <SelectItem value="outros">Outros</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* OBSERVAÇÕES E NECESSIDADES */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-muted-foreground font-bold">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">📝</div>
                    <span>OUTRAS INFORMAÇÕES</span>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">Necessidade Especial</label>
                      <Select 
                        value={form.necessidadeEspecial} 
                        onValueChange={(v) => updateField("necessidadeEspecial", v)}
                      >
                        <SelectTrigger className="h-10 bg-background border-2 border-black/10">
                          <SelectValue placeholder="Selecione se houver" />
                        </SelectTrigger>
                        <SelectContent>
                          {NECESSIDADES_ESPECIAIS.map(n => (
                            <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.necessidadeEspecial !== "nenhuma" && (
                        <div className="mt-4">
                          <LanyardDrawing type={form.necessidadeEspecial} />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">Observação Geral</label>
                      <textarea 
                        value={form.observacao} 
                        onChange={(e) => updateField("observacao", e.target.value)} 
                        className="form-input min-h-[80px] resize-none border-2 border-black/10" 
                        placeholder="Anotações extras sobre o catequizando..." 
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleAdd} 
                  disabled={mutation.isPending} 
                  className="w-full action-btn h-12 text-lg font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {mutation.isPending ? "Salvando..." : "CONCLUIR INSCRIÇÃO"}
                </button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
          <button onClick={() => setShowFrequencia(true)} className="action-btn-sm w-full justify-center whitespace-nowrap bg-indigo-500 hover:bg-indigo-600 text-white border-transparent shadow-md shadow-indigo-500/10"><CalendarDays className="h-4 w-4" /> Painel da frequência</button>
        </div>
      </div>

      {filteredList.length === 0 ? (
        <div className="empty-state animate-float-up"><div className="icon-box bg-accent/15 text-accent-foreground mx-auto mb-3"><UserPlus className="h-6 w-6" /></div><p className="text-sm font-medium text-muted-foreground">{filterAniversarios ? "Nenhum aniversariante encontrado" : "Nenhum catequizando cadastrado"}</p></div>
      ) : (
        <div className="space-y-2">{filteredList.map((c, i) => {
          const st = statusConfig[c.status || 'ativo'];
          const emAlerta = catequizandosEmAlerta.has(c.id);
          return (
            <button key={c.id} onClick={() => { setViewItem(c); setEditMode(false); }} className="relative w-full group animate-float-up text-left" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className={cn("relative flex flex-col bg-card rounded-2xl border-2 shadow-sm transition-all active:scale-[0.98] overflow-hidden", emAlerta ? "border-destructive group-hover:shadow-md" : "border-black group-hover:shadow-md group-hover:border-primary")}>
                {emAlerta && (
                  <div className="bg-destructive/10 border-b border-destructive/20 py-1.5 px-3 flex justify-center items-center gap-1.5 animate-pulse w-full">
                    <BellRing className="w-3 h-3 text-destructive" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-destructive">Catequizando com mais de {alertConfig.moduloCatequizandos?.faltas} faltas</span>
                  </div>
                )}
                <div className="relative flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 w-full">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden shadow-inner ring-2 ring-background">
                    {c.foto ? <img src={c.foto} className="w-full h-full object-cover" alt="" /> : <span className="text-lg font-black text-primary/70">{c.nome.charAt(0).toUpperCase()}</span>}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${st.color.split(' ')[0]}`} title={`Status: ${st.label}`} />
                  {isAniversarianteMes(c.dataNascimento) && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-bounce z-20">
                      <Cake className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  {!isAniversarianteMes(c.dataNascimento) && isAniversarianteMesBatismo(c.sacramentos?.batismo?.data) && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-bounce z-20">
                      <Cross className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-foreground truncate leading-tight group-hover:text-primary transition-colors">{c.nome}</h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {c.dataNascimento ? (
                      <span className="inline-flex items-center text-[10px] sm:text-xs font-semibold text-muted-foreground max-w-full truncate">
                         Nasc: <span className="text-foreground ml-1">{new Date(c.dataNascimento + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] sm:text-xs font-semibold text-muted-foreground italic truncate">
                        Nasc. não informado
                      </span>
                    )}
                    {c.dataNascimento && (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/20 hidden sm:block" />
                        <span className="text-xs sm:text-sm font-black text-primary bg-primary/10 px-2.5 py-1 rounded-lg border-2 border-primary/20 shadow-sm">
                          {calcularIdade(c.dataNascimento)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="shrink-0 pl-2 relative">
                  <div className="w-10 h-10 rounded-full bg-muted/50 flex flex-col items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all text-muted-foreground shadow-inner">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </div>
                </div>
              </div>
            </button>
          );
        })}</div>
      )}

      {/* Modal Frequencia */}
      <Dialog open={showFrequencia} onOpenChange={setShowFrequencia}>
        <DialogContent className="rounded-3xl border-indigo-500/20 max-w-3xl w-[95vw] max-h-[90vh] p-0 overflow-hidden shadow-2xl flex flex-col bg-background">
          <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-600/5 to-transparent p-5 border-b border-indigo-500/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-600 flex items-center justify-center shadow-inner">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-foreground leading-tight">Frequência da Turma</DialogTitle>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">Acompanhamento de participações e faltas</p>
              </div>
            </div>
            
            {/* Tabs Control */}
            <div className="flex items-center gap-2 mt-5 bg-black/5 p-1 rounded-xl">
              <button 
                onClick={() => setFreqTab('encontro')}
                className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-all", freqTab === 'encontro' ? "bg-white text-indigo-600 shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                Por Encontro
              </button>
              <button 
                onClick={() => setFreqTab('resumo')}
                className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-all", freqTab === 'resumo' ? "bg-white text-indigo-600 shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                Resumo Mensal
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 bg-black/[0.02]">
            {freqTab === 'encontro' ? (
              <div className="space-y-4">
                {encontrosRealizados.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground text-sm font-medium">Nenhum encontro realizado encontrado.</div>
                ) : (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Selecionar Encontro</label>
                      <Select value={freqEncontroId} onValueChange={setFreqEncontroId}>
                        <SelectTrigger className="w-full h-12 bg-white rounded-xl shadow-sm border-2">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {encontrosRealizados.map(e => (
                            <SelectItem key={e.id} value={e.id}>
                              {new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR')} - {e.tema}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="bg-white rounded-2xl border-2 border-black/5 overflow-hidden shadow-sm mt-4">
                      {list.map((c, i) => {
                        const isPresent = selectedEncontroObj?.presencas?.includes(c.id);
                        const justificativa = selectedEncontroObj?.justificativas?.[c.id];
                        const isFalta = !isPresent && !justificativa;
                        
                        return (
                          <div key={c.id} className={cn("flex items-center justify-between p-3.5", i !== list.length - 1 && "border-b border-black/5")}>
                            <p className="text-sm font-bold text-foreground truncate mr-4">{c.nome}</p>
                            <div className="shrink-0 flex items-center justify-end w-28">
                              {isPresent && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                                  <CheckCircle2 className="w-4 h-4" /><span className="text-xs font-black uppercase tracking-wider">Presente</span>
                                </div>
                              )}
                              {justificativa && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700" title={justificativa}>
                                  <FileSignature className="w-4 h-4" /><span className="text-xs font-black uppercase tracking-wider">Justif.</span>
                                </div>
                              )}
                              {isFalta && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                                  <X className="w-4 h-4" /><span className="text-xs font-black uppercase tracking-wider">Falta</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                 {mesesDisponiveis.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground text-sm font-medium">Nenhum dado de encontro disponível.</div>
                ) : (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Filtrar por Mês</label>
                      <Select value={freqMes} onValueChange={setFreqMes}>
                        <SelectTrigger className="w-full h-12 bg-white rounded-xl shadow-sm border-2">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {mesesDisponiveis.map(m => {
                            const [year, month] = m.split('-');
                            const nomeMes = new Date(Number(year), Number(month)-1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                            return (
                              <SelectItem key={m} value={m} className="capitalize">
                                {nomeMes}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="bg-white rounded-2xl border-2 border-black/5 overflow-hidden shadow-sm mt-4">
                      {resumoMes.map((row, i) => (
                        <div key={row.catequizando.id} className={cn("flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3", i !== resumoMes.length - 1 && "border-b border-black/5")}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{row.catequizando.nome}</p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">
                              {row.total} encontro{row.total !== 1 ? 's' : ''} no mês
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0 flex-wrap">
                            <div className="flex flex-col items-center justify-center bg-emerald-50 w-12 py-1.5 rounded-lg border border-emerald-100">
                              <span className="text-xs font-black text-emerald-600">{row.presencas}</span>
                              <span className="text-[8px] font-bold text-emerald-600/70 uppercase">Pres</span>
                            </div>
                            <div className="flex flex-col items-center justify-center bg-red-50 w-12 py-1.5 rounded-lg border border-red-100">
                              <span className="text-xs font-black text-red-600">{row.faltas}</span>
                              <span className="text-[8px] font-bold text-red-600/70 uppercase">Falta</span>
                            </div>
                            <div className="flex flex-col items-center justify-center bg-amber-50 w-12 py-1.5 rounded-lg border border-amber-100">
                              <span className="text-xs font-black text-amber-600">{row.justificadas}</span>
                              <span className="text-[8px] font-bold text-amber-600/70 uppercase">Just</span>
                            </div>
                            
                            <div className="h-8 w-px bg-black/5 mx-1 hidden sm:block" />
                            
                            <div className="flex items-center justify-center bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 min-w-[70px]">
                              <span className={cn("text-sm font-black", row.perc < 75 ? "text-red-500" : "text-indigo-600")}>
                                {row.perc}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="p-4 bg-white border-t border-black/5 shrink-0 flex justify-end">
            <button onClick={() => setShowFrequencia(false)} className="action-btn-sm bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto">
              Fechar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Celebrações */}
      <Dialog open={showCelebracoes} onOpenChange={setShowCelebracoes}>
        <DialogContent className="rounded-3xl border-amber-500/20 max-w-2xl w-[95vw] max-h-[90vh] p-0 overflow-hidden shadow-2xl flex flex-col bg-background">
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent p-5 border-b border-amber-500/10 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center shadow-inner">
                  <Cake className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black text-foreground leading-tight">Painel de Celebrações</DialogTitle>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">Aniversários e Datas Especiais</p>
                </div>
              </div>
              
              <div className="hidden sm:block">
                {id && (
                  <ReportModule 
                    context="catequizandos" 
                    turmaId={id} 
                    instantReport="cal_anual" 
                    initialDocId="anual"
                    trigger={
                      <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 transition-all text-[10px] font-black uppercase tracking-wider">
                        <Printer className="h-4 w-4" /> Calendário Anual
                      </button>
                    }
                  />
                )}
              </div>
            </div>
            
            {/* Tabs Control */}
            <div className="flex items-center gap-2 mt-5 bg-black/5 p-1 rounded-xl">
              <button 
                onClick={() => setCelebracoesTab('nascimento')}
                className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-all", celebracoesTab === 'nascimento' ? "bg-white text-amber-600 shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                Nascimento ({aniversariantesDoMes.length})
              </button>
              <button 
                onClick={() => setCelebracoesTab('batismo')}
                className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-all", celebracoesTab === 'batismo' ? "bg-white text-amber-600 shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                Batismo ({batismosDoMes.length})
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 bg-black/[0.02]">
            <div className="space-y-3">
              {(celebracoesTab === 'nascimento' ? aniversariantesDoMes : batismosDoMes).length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm font-medium">Nenhuma celebração encontrada para este mês.</div>
              ) : (
                (celebracoesTab === 'nascimento' ? aniversariantesDoMes : batismosDoMes).map((c) => {
                  const dataRaw = celebracoesTab === 'nascimento' ? c.dataNascimento : c.sacramentos?.batismo?.data;
                  const data = new Date(dataRaw + 'T12:00:00');
                  const hoje = new Date();
                  const eHoje = data.getDate() === hoje.getDate();
                  const jaPassou = data.getDate() < hoje.getDate();

                  return (
                    <div key={c.id} className={cn("flex items-center justify-between p-4 rounded-2xl bg-white border border-black/5 shadow-sm", eHoje && "ring-2 ring-amber-500 bg-amber-50/30")}>
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                           {c.foto ? <img src={c.foto} className="w-full h-full object-cover" /> : <span className="text-xs font-bold">{c.nome.charAt(0)}</span>}
                         </div>
                         <div>
                            <p className="text-sm font-bold text-foreground truncate max-w-[150px]">{c.nome}</p>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                              {jaPassou ? 'Celebrou dia ' : 'Dia '} {data.getDate()}
                            </p>
                         </div>
                      </div>
                      
                      <div className="text-right">
                        {celebracoesTab === 'nascimento' ? (
                          <span className="text-xs font-black text-amber-600 bg-amber-100 px-2.5 py-1 rounded-lg">
                            {calcularIdade(c.dataNascimento)}
                          </span>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-black text-blue-600 bg-blue-100 px-2.5 py-1 rounded-lg">
                               Batismo
                            </span>
                            <span className="text-[9px] font-bold text-muted-foreground mt-1 italic">
                              {data.getFullYear()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          <div className="p-4 bg-white border-t border-black/5 shrink-0 flex flex-col sm:flex-row gap-3">
             <div className="flex-1 flex gap-2">
                <button 
                  onClick={() => {
                    if (celebracoesTab === 'nascimento') {
                      setFilterAniversarios(!filterAniversarios);
                      setFilterBatismos(false);
                    } else {
                      setFilterBatismos(!filterBatismos);
                      setFilterAniversarios(false);
                    }
                    setShowCelebracoes(false);
                  }}
                  className={cn("flex-1 action-btn-sm justify-center border-2", 
                    (celebracoesTab === 'nascimento' && filterAniversarios) || (celebracoesTab === 'batismo' && filterBatismos)
                    ? "bg-amber-600 text-white border-transparent"
                    : "bg-white text-amber-600 border-amber-200"
                  )}
                >
                  {((celebracoesTab === 'nascimento' && filterAniversarios) || (celebracoesTab === 'batismo' && filterBatismos)) ? "Limpar Filtro" : "Filtrar na Lista"}
                </button>
             </div>
             
             <div className="sm:hidden">
               {id && (
                  <ReportModule 
                    context="catequizandos" 
                    turmaId={id} 
                    instantReport="cal_anual" 
                    initialDocId="anual"
                    trigger={
                      <button className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 transition-all text-xs font-black uppercase tracking-wider">
                        <Printer className="h-4 w-4" /> Calendário Anual
                      </button>
                    }
                  />
                )}
             </div>

             <button onClick={() => setShowCelebracoes(false)} className="action-btn-sm bg-black/5 text-muted-foreground hover:bg-black/10 border-transparent justify-center">
              Fechar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewItem} onOpenChange={(o) => { if (!o) { setViewItem(null); setEditMode(false); } }}>
        <DialogContent hideClose className="rounded-2xl max-h-[85vh] overflow-y-auto border-border/30 p-0 sm:p-0">
          {viewItem && !editMode && (
            <div className="flex flex-col h-full bg-background rounded-2xl overflow-hidden relative">
              {/* Header Bar Clean */}
              <div className="sticky top-0 z-50 flex items-center justify-between px-5 py-3.5 border-b border-black/5 bg-background/90 backdrop-blur-md">
                <span className="text-sm font-bold text-foreground truncate pr-4">{viewItem.nome}</span>
                <div className="flex items-center gap-4 z-50">
                  <button onClick={handleEdit} className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all shadow-sm hover:scale-110 active:scale-95"><Pencil className="h-5 w-5" /></button>
                  <button onClick={handleDelete} className="p-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all shadow-sm hover:scale-110 active:scale-95"><Trash2 className="h-5 w-5" /></button>
                  <div className="w-px h-6 bg-black/10 mx-1" />
                  <button onClick={() => { setViewItem(null); setEditMode(false); }} className="p-2.5 rounded-xl bg-muted text-foreground hover:bg-black/10 transition-all shadow-sm hover:scale-110 active:scale-95"><X className="h-5 w-5" /></button>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
                {/* Perfil Minimalista */}
                <div className="flex flex-col sm:flex-row items-center gap-5 pb-2">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden shrink-0 border border-black/5">
                    {viewItem.foto ? <img src={viewItem.foto} className="w-full h-full object-cover" alt="" /> : <span className="text-3xl font-bold text-accent-foreground">{viewItem.nome.charAt(0).toUpperCase()}</span>}
                  </div>
                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <h2 className="text-2xl font-black text-foreground leading-tight tracking-tight mb-2">{viewItem.nome}</h2>
                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusConfig[viewItem.status || 'ativo'].color}`}>
                        {statusConfig[viewItem.status || 'ativo'].label}
                      </span>
                      {viewItem.dataNascimento && (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground">
                          {calcularIdade(viewItem.dataNascimento)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Identificação Especial (Cordão) */}
                {viewItem.necessidadeEspecial && viewItem.necessidadeEspecial !== "nenhuma" && (
                   <LanyardDrawing type={viewItem.necessidadeEspecial} />
                )}

                {/* Blocos de Informação em Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Dados Pessoais */}
                  <div className="bg-white rounded-2xl p-6 border-2 border-black/10 shadow-sm">
                    <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                       <span className="w-5 h-5 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shadow-sm"><UserPlus className="w-4 h-4" /></span> Dados Pessoais
                    </h4>
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center">
                         <span className="text-xs font-bold text-muted-foreground">Nascimento</span>
                         <span className="text-base font-black text-foreground text-right">{viewItem.dataNascimento ? new Date(viewItem.dataNascimento + 'T00:00').toLocaleDateString("pt-BR") : "Não informado"}</span>
                      </div>
                      <div className="h-px bg-black/5" />
                      <div className="flex justify-between items-center">
                         <span className="text-xs font-bold text-muted-foreground">Telefone</span>
                         <span className="text-base font-black text-foreground text-right">{viewItem.telefone || "—"}</span>
                      </div>
                      <div className="h-px bg-black/5" />
                      <div className="flex justify-between items-center">
                         <span className="text-xs font-bold text-muted-foreground">E-mail</span>
                         <span className="text-base font-black text-foreground text-right truncate max-w-[150px]">{viewItem.email || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Endereço */}
                  <div className="bg-white rounded-2xl p-6 border-2 border-black/10 shadow-sm">
                    <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shadow-sm">📍</span> Endereço
                    </h4>
                    <p className="text-base font-black text-foreground leading-snug">
                      {viewItem.endereco || viewItem.bairro || viewItem.numero ? (
                        <>
                          {viewItem.endereco}{viewItem.numero ? `, ${viewItem.numero}` : ""}
                          <span className="block text-muted-foreground font-bold text-xs mt-1">
                            {viewItem.bairro ? `Bairro: ${viewItem.bairro} ` : ""}
                            {viewItem.complemento ? `(${viewItem.complemento})` : ""}
                          </span>
                        </>
                      ) : <span className="text-muted-foreground italic text-sm">Nenhum cadastrado</span>}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border-2 border-blue-100 shadow-sm">
                  <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-blue-500 shadow-sm">👥</span> Responsáveis
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {viewItem.responsaveis?.length ? (
                      viewItem.responsaveis.map(resp => (
                        <div key={resp.id} className="p-3 bg-white border border-blue-100 rounded-xl">
                          <p className="text-sm font-bold text-foreground truncate">{resp.nome}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] font-bold text-blue-500 uppercase">{resp.vinculo}</span>
                            <span className="text-[11px] font-medium text-muted-foreground">{resp.telefone}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 p-3 bg-white border border-blue-100 rounded-xl">
                        <p className="text-sm font-bold text-foreground">{viewItem.responsavel || "Não informado"}</p>
                        <p className="text-[11px] text-muted-foreground">{viewItem.telefone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* DADOS PASTORAIS E SACRAMENTOS */}
                <div className="bg-white rounded-2xl p-6 border-2 border-orange-100 shadow-sm">
                  <h4 className="text-xs font-black text-orange-600 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center text-orange-500 shadow-sm">✝️</span> Dados Pastorais
                  </h4>
                  
                  {viewItem.dadosPastorais?.participacaoPastoral && (
                    <div className="mb-4 p-4 bg-white border-2 border-orange-100 rounded-2xl">
                      <p className="text-[10px] font-black text-orange-400 uppercase tracking-wider mb-1">Participação em Pastorais/Grupos</p>
                      <p className="text-base font-black">{viewItem.dadosPastorais.participacaoPastoral}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    {(["batismo", "eucaristia", "crisma"] as const).map(sac => { 
                      const s = viewItem.dadosPastorais?.sacramentos?.[sac] || viewItem.sacramentos?.[sac]; 
                      const isOk = s?.recebido;
                      return (
                        <div key={sac} className="flex-1 flex flex-col items-start p-4 bg-white border-2 border-orange-100 rounded-2xl">
                          <div className="flex items-center gap-2 mb-2 w-full">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isOk ? 'bg-success text-white' : 'bg-muted-foreground/30 text-white'}`}>
                              <span className="text-[12px] font-black">{isOk ? '✓' : ''}</span>
                            </div>
                            <span className={`text-sm font-black capitalize ${isOk ? 'text-foreground' : 'text-muted-foreground'}`}>{sac}</span>
                          </div>
                          {isOk ? (
                            <div className="text-xs font-bold text-muted-foreground w-full">
                              {s.paroquia && <p className="truncate"><span className="opacity-70 font-black">Local:</span> {s.paroquia}</p>}
                              {s.data && <p><span className="opacity-70 font-black">Data:</span> {new Date(s.data + 'T00:00').toLocaleDateString("pt-BR")}</p>}
                              {!s.paroquia && !s.data && <p className="italic">Sem detalhes</p>}
                            </div>
                          ) : (
                            <p className="text-xs font-bold text-muted-foreground/50 italic">Pendente</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Observações */}
                {viewItem.observacao && (
                  <div className="bg-accent/5 rounded-2xl p-5 border border-accent/10">
                    <h4 className="text-[10px] font-black text-accent-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                       <span className="w-4 h-4 rounded bg-accent/10 flex items-center justify-center text-accent">📝</span> Anotações
                    </h4>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{viewItem.observacao}</p>
                  </div>
                )}
                
                {/* Alterar Status */}
                <div className="pt-4 border-t-2 border-black/10 pb-2">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 text-center">Situação do Aluno</p>
                  <div className="flex justify-center gap-2 flex-wrap">
                    {(Object.keys(statusConfig) as CatequizandoStatus[]).map(s => {
                      const isAtivo = (viewItem.status || 'ativo') === s;
                      return (
                        <button key={s} onClick={() => handleStatusChange(viewItem, s)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${isAtivo ? 'bg-foreground text-background border-foreground shadow-md scale-105' : 'bg-muted text-muted-foreground hover:bg-black/5 border-black/10'}`}>
                          {statusConfig[s].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
          {viewItem && editMode && (
            <div className="p-5 sm:p-6 bg-background rounded-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center justify-between mb-4">
                  <DialogTitle className="text-xl font-bold">Editar Inscrição</DialogTitle>
                  <button onClick={() => setEditMode(false)} className="p-2 rounded-xl bg-muted hover:bg-black/5 transition-colors"><X className="h-4 w-4" /></button>
                </div>
              </DialogHeader>
              <div className="space-y-8 mt-4 pb-6">
                {/* SEÇÃO 1: DADOS PESSOAIS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-primary font-black">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm"><Pencil className="w-5 h-5" /></div>
                    <span className="text-lg tracking-tight">DADOS PESSOAIS</span>
                  </div>
                  <Separator className="bg-primary/20 h-0.5" />
                  
                  <div className="flex justify-center mb-4">
                    <ImagePicker 
                      onImageUpload={(url) => setEditForm(f => ({ ...f, foto: url }))} 
                      folder="catequizandos" 
                      currentImageUrl={editForm.foto} 
                      shape="circle" 
                      label="Alterar Foto"
                    />
                  </div>

                  <div className="space-y-4">
                    <FieldInput label="Nome completo *" value={editForm.nome} onChange={(v) => setEditForm(f => ({ ...f, nome: v }))} />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <CustomDatePicker 
                        label="Data de Nascimento" 
                        value={editForm.dataNascimento} 
                        onChange={(v) => setEditForm(f => ({ ...f, dataNascimento: v }))} 
                      />
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Idade</label>
                        <div className="h-10 flex items-center px-3 bg-muted/30 rounded-md border border-input font-bold text-primary">
                          {calcularIdade(editForm.dataNascimento) || "—"}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FieldInput label="Telefone" type="tel" value={editForm.telefone} onChange={(v) => setEditForm(f => ({ ...f, telefone: mascaraTelefone(v) }))} />
                      <FieldInput label="E-mail" type="email" value={editForm.email} onChange={(v) => setEditForm(f => ({ ...f, email: v }))} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FieldInput label="Endereço / Rua" value={editForm.endereco} onChange={(v) => setEditForm(f => ({ ...f, endereco: v }))} />
                      <div className="grid grid-cols-2 gap-4">
                        <FieldInput label="Número" value={editForm.numero} onChange={(v) => setEditForm(f => ({ ...f, numero: v }))} />
                         <FieldInput label="Bairro" value={editForm.bairro} onChange={(v) => setEditForm(f => ({ ...f, bairro: v }))} />
                      </div>
                    </div>
                    <FieldInput label="Complemento" value={editForm.complemento} onChange={(v) => setEditForm(f => ({ ...f, complemento: v }))} />
                  </div>
                </div>

                {/* SEÇÃO 2: DADOS PASTORAIS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-orange-600 font-black">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shadow-sm">✝️</div>
                    <span className="text-lg tracking-tight">DADOS PASTORAIS</span>
                  </div>
                  <Separator className="bg-orange-500/20 h-0.5" />

                  <div className="space-y-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sacramentos Recebidos</p>
                    <div className="grid grid-cols-1 gap-4">
                      {(["batismo", "eucaristia", "crisma"] as const).map((sac) => (
                        <div key={sac} className="space-y-2">
                          <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 transition-colors cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={editForm[sac].recebido} 
                              onChange={(e) => setEditForm(f => ({ ...f, [sac]: { ...f[sac], recebido: e.target.checked } }))} 
                              className="w-5 h-5 rounded-md border-border text-primary focus:ring-primary" 
                            />
                            <span className="text-sm font-bold text-foreground capitalize">{sac}</span>
                          </label>
                          {editForm[sac].recebido && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-7 animate-in slide-in-from-left-2">
                              <FieldInput label="Paróquia" value={editForm[sac].paroquia} onChange={(v) => setEditForm(f => ({ ...f, [sac]: { ...f[sac], paroquia: v } }))} placeholder="Local do sacramento" />
                              <CustomDatePicker label="Data" value={editForm[sac].data || ""} onChange={(v) => setEditForm(f => ({ ...f, [sac]: { ...f[sac], data: v } }))} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Participa de alguma Pastoral ou Grupo?</label>
                    <textarea 
                      value={editForm.participacaoPastoral} 
                      onChange={(e) => setEditForm(f => ({ ...f, participacaoPastoral: e.target.value }))} 
                      className="form-input min-h-[60px] resize-none" 
                    />
                  </div>
                </div>

                {/* SEÇÃO 3: DADOS DO RESPONSÁVEL */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-500 font-bold">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mt-[-4px]">👥</div>
                      <span>DADOS DO RESPONSÁVEL</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => addResponsavel(true)}
                      className="text-[10px] font-black uppercase text-blue-600 bg-blue-50/50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Adicionar Outro
                    </button>
                  </div>
                  <Separator className="bg-blue-500/20 h-0.5" />

                  <div className="space-y-4">
                    {editForm.responsaveis.map((resp, idx) => (
                      <div key={resp.id} className="p-4 bg-white/40 border border-blue-200 rounded-xl space-y-4 relative group animate-in zoom-in-95 shadow-sm">
                        {editForm.responsaveis.length > 1 && (
                          <button 
                            onClick={() => removeResponsavel(resp.id, true)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FieldInput label="Nome do Responsável" value={resp.nome} onChange={(v) => updateResponsavel(resp.id, "nome", v, true)} />
                          <FieldInput label="Telefone Contato" type="tel" value={resp.telefone} onChange={(v) => updateResponsavel(resp.id, "telefone", mascaraTelefone(v), true)} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Vínculo / Parentesco</label>
                          <Select 
                            value={resp.vinculo} 
                            onValueChange={(v) => updateResponsavel(resp.id, "vinculo", v, true)}
                          >
                            <SelectTrigger className="h-10 bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pais">Pais</SelectItem>
                              <SelectItem value="avós">Avós</SelectItem>
                              <SelectItem value="tios">Tios</SelectItem>
                              <SelectItem value="outros">Outros</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Necessidade Especial</label>
                    <Select 
                      value={editForm.necessidadeEspecial} 
                      onValueChange={(v) => setEditForm(f => ({ ...f, necessidadeEspecial: v }))}
                    >
                      <SelectTrigger className="h-10 bg-background border-2 border-black/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NECESSIDADES_ESPECIAIS.map(n => (
                          <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Observação Geral</label>
                    <textarea value={editForm.observacao} onChange={(e) => setEditForm(f => ({ ...f, observacao: e.target.value }))} className="form-input min-h-[60px] resize-none border-2 border-black/10" />
                  </div>
                </div>
                
                <button 
                  onClick={handleSaveEdit} 
                  disabled={mutation.isPending} 
                  className="w-full action-btn h-12 text-lg font-black"
                >
                  {mutation.isPending ? "Salvando..." : "SALVAR ALTERAÇÕES"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
