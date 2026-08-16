import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTurmas, useCatequizandos, useCatequizandoMutation, useDeleteCatequizando, useEncontros, useParoquias, useComunidades } from "@/hooks/useSupabaseData";
import { useDiarioEspiritual } from "@/hooks/useDiarioEspiritual";
import { type Catequizando, type CatequizandoStatus } from "@/lib/store";
import { ArrowLeft, ArrowRight, Plus, UserPlus, ChevronDown, ChevronUp, ChevronRight, Camera, Pencil, Trash2, X, Printer, Cake, BellRing, BellOff, ShieldCheck, CalendarDays, CheckCircle2, AlertCircle, FileSignature, Users, LayoutDashboard, Link2, TrendingUp, MessageSquare, Save, Loader2, Info, Share2, FileText } from "lucide-react";
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import * as Templates from "@/components/reports/ReportTemplates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImagePicker } from "@/components/ImagePicker";
import { StarRating } from "@/components/StarRating";
import { mascaraTelefone, cn } from "@/lib/utils";
import { CustomDatePicker } from "@/components/CustomDatePicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { generateUUID, copyToClipboardOrShare, getAppUrl } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { toggleInscricoesAbertas, garantirCodigoAcesso } from "@/lib/supabaseStore";
import { useQueryClient } from "@tanstack/react-query";
import { ModuleReportSheet, type ReportItem } from "@/components/reports/ModuleReportSheet";

// --- Helpers ---
function InfoRow({ label, value }: { label: string; value?: string }) { 
  if (!value) return null; 
  return <p><span className="text-muted-foreground">{label}:</span> <span className="font-semibold text-foreground">{value}</span></p>; 
}

function FieldInput({ label, type = "text", value, onChange, placeholder }: { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const labelWithRedAsterisk = label.includes("*") ? (
    <>
      {label.replace("*", "")}
      <span className="text-red-500">*</span>
    </>
  ) : label;

  return (
    <div>
      <label className="text-sm font-black text-zinc-900 mb-1.5 block uppercase tracking-wide">{labelWithRedAsterisk}</label>
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

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];


function LanyardDrawing({ type }: { type: string }) {
  const need = NECESSIDADES_ESPECIAIS.find(n => n.id === type);
  if (!need || !need.lanyard) return null;

  return (
    <div className="flex flex-col items-center gap-2 p-3 bg-white/50 rounded-2xl border-2 border-dashed border-black/10 animate-in zoom-in-95">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Cordão de Identificação</p>
      <div className="relative w-full max-w-[200px] h-12 flex items-center justify-center">
        {/* Simulação do Cordão (Strap) */}
        <div className={`absolute inset-x-0 h-6 rounded-full border border-black/10 ${need.color} shadow-sm overflow-hidden flex items-center justify-around px-2`}>
          {[...Array(6)].map((_, i) => (
            <span key={i} className="text-xs filter saturate-150 drop-shadow-sm">{need.pattern}</span>
          ))}
        </div>
        {/* O Crachá (Badge) */}
        <div className="absolute left-1/2 -translate-x-1/2 top-4 w-10 h-14 bg-white rounded-md border border-black/10 shadow-lg flex flex-col items-center p-1 z-10">
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
  responsaveis: [{ id: generateUUID(), nome: "", telefone: "", vinculo: 'pais' }],
};

const statusConfig: Record<CatequizandoStatus, { label: string; color: string; bg: string; text: string; border: string; icon: any; activeClasses: string }> = {
  ativo: { 
    label: "Ativo", color: "bg-emerald-500 text-white", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", icon: CheckCircle2, activeClasses: "bg-emerald-600 text-white border-emerald-700 shadow-emerald-200" 
  },
  transferido: { 
    label: "Transferido", color: "bg-blue-500 text-white", bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", icon: ArrowRight, activeClasses: "bg-blue-600 text-white border-blue-700 shadow-blue-200" 
  },
  desistente: { 
    label: "Desistente", color: "bg-orange-500 text-white", bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200", icon: X, activeClasses: "bg-orange-600 text-white border-orange-700 shadow-orange-200" 
  },
  afastado: { 
    label: "Afastado", color: "bg-red-500 text-white", bg: "bg-red-50", text: "text-red-600", border: "border-red-200", icon: AlertCircle, activeClasses: "bg-red-600 text-white border-red-700 shadow-red-200" 
  },
  mudou_se: { 
    label: "Mudou-se", color: "bg-cyan-500 text-white", bg: "bg-cyan-50", text: "text-cyan-600", border: "border-cyan-200", icon: ArrowRight, activeClasses: "bg-cyan-600 text-white border-cyan-700 shadow-cyan-200" 
  },
  outro: { 
    label: "Outro", color: "bg-zinc-500 text-white", bg: "bg-zinc-50", text: "text-zinc-600", border: "border-zinc-200", icon: AlertCircle, activeClasses: "bg-zinc-600 text-white border-zinc-700 shadow-zinc-200" 
  }
};

export default function CatequizandosList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: turmas = [], isLoading: tLoading } = useTurmas();
  const { data: list = [], isLoading } = useCatequizandos(id, true);
  const { data: paroquias = [] } = useParoquias();
  const { data: comunidades = [] } = useComunidades();
  const mutation = useCatequizandoMutation();
  const deleteMut = useDeleteCatequizando();
  const turma = turmas.find((t) => t.id === id);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CatequizandoForm>({ ...emptyForm });
  const [showSacramentos, setShowSacramentos] = useState(false);

  const [showInscricaoModal, setShowInscricaoModal] = useState(false);
  const [isTogglingInscricoes, setIsTogglingInscricoes] = useState(false);
  const [isSharingFrequencia, setIsSharingFrequencia] = useState(false);
  const queryClient = useQueryClient();

  const handleToggleInscricoes = async (novoEstado: boolean) => {
    if (!turma?.id) return;
    setIsTogglingInscricoes(true);
    try {
      await toggleInscricoesAbertas(turma.id, novoEstado);
      await queryClient.invalidateQueries({ queryKey: ["turmas"] });
      toast.success(
        novoEstado
          ? "✅ Inscrições abertas! O link público já está aceitando novas inscrições."
          : "🔒 Inscrições encerradas. O link público exibirá a mensagem de encerramento."
      );
    } catch (error: any) {
      toast.error("Erro ao alterar inscrições: " + error.message);
    } finally {
      setIsTogglingInscricoes(false);
    }
  };

  const handleCopyInscricaoLink = async () => {
    const url = `${getAppUrl()}/inscricao-catequizando/${turma?.codigoAcesso}`;

    const success = await copyToClipboardOrShare(url, {
      title: 'Inscrição de Catequizando',
      text: `Faça a inscrição online para a turma ${turma?.nome || ''}`
    });

    if (success) {
      // Se não for share nativo que avisa sozinho, o toast de copiado pode ser útil, mas o utilitário
      // já cuida disso. Como o usuário pode ter apenas copiado, vamos avisar:
      // Verificação simples se o navigator.share foi usado com sucesso seria não mostrar toast
      // mas vamos mostrar só para garantir caso ele tenha copiado.
      toast.success("Link pronto para enviar!");
    }
  };

  const handleCopyFrequenciaLink = async () => {
    if (!turma?.id) {
      toast.error("Turma não encontrada.");
      return;
    }
    setIsSharingFrequencia(true);
    try {
      // Garante que a turma tenha um codigo_acesso válido (gera e salva se necessário)
      const codigo = await garantirCodigoAcesso(turma.id, turma);
      if (!codigo) {
        toast.error("Não foi possível gerar o link. Tente novamente.");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["turmas"] });
      const url = `${getAppUrl()}/frequencia-turma/${codigo}`;
      const success = await copyToClipboardOrShare(url, {
        title: 'Resumo Público de Frequência',
        text: `Acompanhe a frequência da turma ${turma?.nome || ''}`
      });
      if (success) {
        toast.success("Link copiado! Envie para os catequizandos/pais.");
      }
    } catch (err: any) {
      toast.error("Erro ao gerar link: " + err.message);
    } finally {
      setIsSharingFrequencia(false);
    }
  };




  const [viewItem, setViewItem] = useState<Catequizando | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [singleReportItem, setSingleReportItem] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; motivo: string }>({ open: false, motivo: '' });
  const [deleteTarget, setDeleteTarget] = useState<Catequizando | null>(null);
  const [editMode, setEditMode] = useState(false);

  const [editForm, setEditForm] = useState<CatequizandoForm>({ ...emptyForm });
  const [showEditSacramentos, setShowEditSacramentos] = useState(false);
  const [filterAniversarios, setFilterAniversarios] = useState(false);
  const [filterBatismos, setFilterBatismos] = useState(false);
  const [filterAtivos, setFilterAtivos] = useState<'ativos' | 'inativos'>('ativos');
  const [catPage, setCatPage] = useState(0);
  const CAT_PAGE_SIZE = 20;
  const [evolutionPeriod, setEvolutionPeriod] = useState<"mes" | "semestre" | "ano">("ano");
  const [showEvolucao, setShowEvolucao] = useState(false);
  const [evolucaoSelectedId, setEvolucaoSelectedId] = useState<string>("");
  
  // --- Alerta Faltas Mute States ---
  const [showMuteAlertDropdown, setShowMuteAlertDropdown] = useState(false);

  const MUTE_OPTIONS = [
    { value: 'resolvido', label: '✅ Já resolvido' },
    { value: 'verificar', label: '🔍 Vou verificar' },
    { value: 'desistente', label: '🚪 Catequizando desistente' },
    { value: 'outros', label: '📝 Outros' },
  ] as const;
  type MuteOption = typeof MUTE_OPTIONS[number]['value'];

  const handleMuteAlert = async (catequizando: Catequizando, opcao: MuteOption) => {
    const updated: Catequizando = {
      ...catequizando,
      dadosPastorais: {
        ...(catequizando.dadosPastorais as any),
        alertaFaltasConfig: {
          mutado: true,
          opcao,
          dataRegistro: new Date().toISOString(),
        },
      } as any,
    };
    try {
      await mutation.mutateAsync(updated);
      setViewItem(updated);
      setShowMuteAlertDropdown(false);
      toast.success('Aviso de faltas desativado!');
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
  };

  const handleUnmuteAlert = async (catequizando: Catequizando) => {
    const dadosPastoraisAtual = catequizando.dadosPastorais as any;
    const { alertaFaltasConfig, ...restDadosPastorais } = dadosPastoraisAtual || {};
    const updated: Catequizando = {
      ...catequizando,
      dadosPastorais: restDadosPastorais as any,
    };
    try {
      await mutation.mutateAsync(updated);
      setViewItem(updated);
      toast.success('Aviso de faltas reativado!');
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
  };

  // --- Frequência Modal States ---
  const [showFrequencia, setShowFrequencia] = useState(false);
  const [freqTab, setFreqTab] = useState<'encontro' | 'resumo'>('encontro');
  const [freqEncontroId, setFreqEncontroId] = useState<string>('');
  const [freqMes, setFreqMes] = useState<string>('');
  const [printEncontroId, setPrintEncontroId] = useState<string | null>(null);

  const orgNomes = useMemo(() => {
    const p = paroquias.find(x => x.id === turma?.paroquia_id)?.nome || "Paróquia não informada";
    const c = comunidades.find(x => x.id === turma?.comunidade_id)?.nome || "Comunidade não informada";
    return { paroquia: p, comunidade: c };
  }, [paroquias, comunidades, turma]);
  
  const org = orgNomes;
  
  // --- Celebrações Modal States ---
  const [showCelebracoes, setShowCelebracoes] = useState(false);
  const [celebracoesTab, setCelebracoesTab] = useState<'nascimento' | 'batismo'>('nascimento');
  const [periodoCelebracao, setPeriodoCelebracao] = useState<'anual' | 'mensal'>('anual');
  const [mesCelebracao, setMesCelebracao] = useState<number>(new Date().getMonth());

  
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
  const { diarios = [] } = useDiarioEspiritual(id!);

  const catequizandoStats = useMemo(() => {
    if (!evolucaoSelectedId || !diarios || diarios.length === 0) return null;
    
    let soma = {
      pontualidade: 0, part_grupo: 0, engajamento: 0,
      ev_espiritual: 0, ev_comportamental: 0,
      count_av: 0, count_ev: 0
    };

    const hoje = new Date();
    const currentYear = hoje.getFullYear();
    const currentMonth = hoje.getMonth();
    const startOfSemester = currentMonth < 6 ? new Date(currentYear, 0, 1) : new Date(currentYear, 6, 1);
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const startOfYear = new Date(currentYear, 0, 1);
    
    let startDate: Date;
    if (evolutionPeriod === "mes") startDate = startOfMonth;
    else if (evolutionPeriod === "semestre") startDate = startOfSemester;
    else startDate = startOfYear;

    diarios.forEach((d: any) => {
      const dataRegistro = d.data_registro ? new Date(d.data_registro + 'T12:00') : null;
      if (dataRegistro && dataRegistro >= startDate) {
        if (d.avaliacoes_catequizandos && Array.isArray(d.avaliacoes_catequizandos)) {
          const av = d.avaliacoes_catequizandos.find((x: any) => x.catequizando_id === evolucaoSelectedId);
          if (av && (av.pontualidade > 0 || av.participacao_grupo > 0 || av.engajamento > 0)) {
            soma.pontualidade += av.pontualidade || 0;
            soma.part_grupo += av.participacao_grupo || 0;
            soma.engajamento += av.engajamento || 0;
            soma.count_av++;
          }
        }
        if (d.evolucao_catequizandos && Array.isArray(d.evolucao_catequizandos)) {
          const ev = d.evolucao_catequizandos.find((x: any) => x.catequizando_id === evolucaoSelectedId);
          if (ev && (ev.evolucao_espiritual > 0 || ev.evolucao_comportamental > 0)) {
            soma.ev_espiritual += ev.evolucao_espiritual || 0;
            soma.ev_comportamental += ev.evolucao_comportamental || 0;
            soma.count_ev++;
          }
        }
      }
    });

    if (soma.count_av === 0 && soma.count_ev === 0) return null;

    return {
      pontualidade: soma.count_av > 0 ? soma.pontualidade / soma.count_av : 0,
      part_grupo: soma.count_av > 0 ? soma.part_grupo / soma.count_av : 0,
      engajamento: soma.count_av > 0 ? soma.engajamento / soma.count_av : 0,
      ev_espiritual: soma.count_ev > 0 ? soma.ev_espiritual / soma.count_ev : 0,
      ev_comportamental: soma.count_ev > 0 ? soma.ev_comportamental / soma.count_ev : 0,
      count_av: soma.count_av,
      count_ev: soma.count_ev,
    };
  }, [evolucaoSelectedId, diarios, evolutionPeriod]);

  const activeList = useMemo(() => list.filter(c => !c.status || c.status === 'ativo'), [list]);

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
    activeList.forEach(c => {
      // Check if alert is muted for this catequizando
      const isMuted = (c.dadosPastorais as any)?.alertaFaltasConfig?.mutado === true;
      if (isMuted) return;

      if (pastEncontros.length >= limit && limit > 0) {
        const wasPresentOrJustifiedInAny = pastEncontros.some(e => 
            e.presencas.includes(c.id) || (e.justificativas && e.justificativas[c.id])
        );
        if (!wasPresentOrJustifiedInAny) alertas.add(c.id);
      }
    });
    return alertas;
  }, [activeList, pastEncontros, alertConfig.moduloCatequizandos]);

  // --- Lógica de Frequência ---
  // Exibe todos os encontros (realizados e pendentes) no card de frequência
  // O status "pendente" não deve ser uma trava para visualização de dados
  const encontrosRealizados = useMemo(() => 
    encontros
      .filter(e => e.status !== 'cancelado')
      .sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
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
    
    return activeList.map(c => {
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
  }, [freqMes, encontrosRealizados, activeList]);

  const updateField = useCallback((field: string, value: string) => { setForm((f) => ({ ...f, [field]: value })); }, []);
  const updateSacramento = useCallback((sac: 'batismo' | 'eucaristia' | 'crisma', field: string, value: string | boolean) => { setForm((f) => ({ ...f, [sac]: { ...f[sac], [field]: value } })); }, []);

  const handleAdd = async () => {
    if (!form.nome) { toast.error("Nome é obrigatório"); return; }
    const novo: Catequizando = {
      id: generateUUID(), turmaId: id!, nome: form.nome, dataNascimento: form.dataNascimento,
      responsavel: form.responsaveis[0]?.nome || "", telefone: form.telefone, email: form.email, 
      endereco: form.endereco, numero: form.numero, bairro: form.bairro, complemento: form.complemento,
      necessidadeEspecial: form.necessidadeEspecial, observacao: form.observacao, status: 'ativo',
      foto: form.foto || undefined,
      sacramentos: { batismo: form.batismo, eucaristia: form.eucaristia, crisma: form.crisma } as any,
      responsaveis: form.responsaveis as any[],
      dadosPastorais: {
        sacramentos: { batismo: form.batismo, eucaristia: form.eucaristia, crisma: form.crisma },
        participacaoPastoral: form.participacaoPastoral
      } as any,
      origem: 'manual'
    };


    try { await mutation.mutateAsync(novo); setForm({ ...emptyForm }); setShowSacramentos(false); setOpen(false); toast.success("Catequizando adicionado!"); }
    catch (err: any) { toast.error("Erro: " + err.message); }
  };

  const addResponsavel = (isEdit: boolean) => {
    const newItem = { id: generateUUID(), nome: "", telefone: "", vinculo: 'pais' as const };
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
      responsaveis: (viewItem.responsaveis?.length ? viewItem.responsaveis : [{ id: generateUUID(), nome: viewItem.responsavel || "", telefone: viewItem.telefone || "", vinculo: 'pais' }]) as ResponsavelForm[],
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
        ...(viewItem.dadosPastorais || {}),
        sacramentos: { batismo: editForm.batismo as any, eucaristia: editForm.eucaristia as any, crisma: editForm.crisma as any },
        participacaoPastoral: editForm.participacaoPastoral
      } as any,
      sacramentos: { batismo: editForm.batismo as any, eucaristia: editForm.eucaristia as any, crisma: editForm.crisma as any },
    };
    try { await mutation.mutateAsync(updated); setViewItem(updated); setEditMode(false); toast.success("Atualizado!"); }
    catch (err: any) { toast.error("Erro: " + err.message); }
  };

  const handleDelete = () => {
    if (!viewItem) return;
    const target = viewItem;
    setViewItem(null);
    setEditMode(false);
    setTimeout(() => {
      setDeleteTarget(target);
      setDeleteModal({ open: true, motivo: '' });
    }, 150);
  };

  const cancelDelete = () => {
    const target = deleteTarget;
    setDeleteModal({ open: false, motivo: '' });
    setDeleteTarget(null);
    if (target) {
      setTimeout(() => setViewItem(target), 150);
    }
  };

  const confirmDelete = async () => {
    if (deleteTarget && deleteModal.motivo) {
      try {
        await deleteMut.mutateAsync({ id: deleteTarget.id, motivo: deleteModal.motivo });
        setDeleteModal({ open: false, motivo: '' });
        setDeleteTarget(null);
        toast.success("Catequizando excluído com sucesso.");
      } catch (error: any) {
        toast.error("Erro ao excluir: " + error.message);
      }
    }
  };


  const aniversariantesFiltrados = useMemo(() => {
    const hoje = new Date();
    const diaAtual = hoje.getDate();
    const mesAtual = hoje.getMonth();
    
    return activeList
      .filter(c => {
        if (!c.dataNascimento) return false;
        const nasc = new Date(c.dataNascimento + (c.dataNascimento.includes('T') ? '' : 'T12:00:00'));
        if (periodoCelebracao === 'anual') return true;
        return nasc.getMonth() === mesCelebracao;
      })
      .sort((a, b) => {
        const dateA = new Date(a.dataNascimento + 'T12:00:00');
        const dateB = new Date(b.dataNascimento + 'T12:00:00');
        
        if (periodoCelebracao === 'mensal') {
          const diaA = dateA.getDate();
          const diaB = dateB.getDate();
          if (mesCelebracao === mesAtual) {
            const aNoFuturo = diaA >= diaAtual;
            const bNoFuturo = diaB >= diaAtual;
            if (aNoFuturo && !bNoFuturo) return -1;
            if (!aNoFuturo && bNoFuturo) return 1;
          }
          return diaA - diaB;
        } else {
          const mA = dateA.getMonth();
          const mB = dateB.getMonth();
          if (mA !== mB) return mA - mB;
          return dateA.getDate() - dateB.getDate();
        }
      });
  }, [activeList, periodoCelebracao, mesCelebracao]);

  const batismosFiltrados = useMemo(() => {
    const hoje = new Date();
    const diaAtual = hoje.getDate();
    const mesAtual = hoje.getMonth();
    
    return activeList
      .filter(c => {
        const dataB = c.sacramentos?.batismo?.data || c.dadosPastorais?.sacramentos?.batismo?.data;
        if (!dataB) return false;
        const date = new Date(dataB + 'T12:00:00');
        if (periodoCelebracao === 'anual') return true;
        return date.getMonth() === mesCelebracao;
      })
      .sort((a, b) => {
        const dataA = a.sacramentos?.batismo?.data || a.dadosPastorais?.sacramentos?.batismo?.data;
        const dataB = b.sacramentos?.batismo?.data || b.dadosPastorais?.sacramentos?.batismo?.data;
        const dateA = new Date((dataA || "") + 'T12:00:00');
        const dateB = new Date((dataB || "") + 'T12:00:00');
        
        if (periodoCelebracao === 'mensal') {
          const diaA = dateA.getDate();
          const diaB = dateB.getDate();
          if (mesCelebracao === mesAtual) {
            const aNoFuturo = diaA >= diaAtual;
            const bNoFuturo = diaB >= diaAtual;
            if (aNoFuturo && !bNoFuturo) return -1;
            if (!aNoFuturo && bNoFuturo) return 1;
          }
          return diaA - diaB;
        } else {
          const mA = dateA.getMonth();
          const mB = dateB.getMonth();
          if (mA !== mB) return mA - mB;
          return dateA.getDate() - dateB.getDate();
        }
      });
  }, [activeList, periodoCelebracao, mesCelebracao]);

  const hasQualquerCelebracao = useMemo(() => {
    const hoje = new Date();
    return activeList.some(c => isAniversarianteMes(c.dataNascimento) || isAniversarianteMesBatismo(c.sacramentos?.batismo?.data));
  }, [activeList]);

  
  const filteredList = useMemo(() => {
    let baseList = list.filter(c => filterAtivos === 'ativos' ? (!c.status || c.status === 'ativo') : (c.status && c.status !== 'ativo'));

    if (filterAniversarios) {
      const hoje = new Date();
      return baseList.filter(c => isAniversarianteMes(c.dataNascimento));
    }
    if (filterBatismos) {
      return baseList.filter(c => isAniversarianteMesBatismo(c.sacramentos?.batismo?.data));
    }
    return baseList;
  }, [filterAniversarios, filterBatismos, list, filterAtivos]);

  // Reset page when filters change
  const handleSetFilterAtivos = (v: 'ativos' | 'inativos') => { setFilterAtivos(v); setCatPage(0); };
  const pagedList = useMemo(() => filteredList.slice(catPage * CAT_PAGE_SIZE, (catPage + 1) * CAT_PAGE_SIZE), [filteredList, catPage]);
  const totalPages = Math.ceil(filteredList.length / CAT_PAGE_SIZE);


  if (isLoading || tLoading) {
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
    <div className="space-y-5 pb-10">
      <div className="space-y-4 animate-fade-in flex flex-col pt-4">
        {/* Row 1: Back Button + Título (Centralizado) */}
        <div className="flex items-center justify-center min-h-[44px] relative">
          <button onClick={() => navigate(`/turmas/${id}`)} className="back-btn absolute left-0">
            <ArrowLeft className="h-5 w-5 text-black" />
          </button>
          
          <div className="flex flex-col items-center gap-1 text-center">
            {turma?.nome && <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-[-2px]">{turma.nome}</p>}
            <h1 className="text-xl font-black text-foreground tracking-tight uppercase">
              Catequizandos
            </h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">{list.length} cadastrados</p>
          </div>
        </div>

        <div className="flex flex-col w-full sm:w-auto gap-3 shrink-0">
          <div className="flex items-center justify-end gap-2 w-full overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setShowReportDialog(true)}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all active:scale-95 border border-purple-400"
              title="Relatórios"
            >
              <FileText className="h-4 w-4 drop-shadow-sm" />
            </button>
            <button 
              onClick={() => setShowInscricaoModal(true)}
              className="action-btn-sm shrink-0 whitespace-nowrap bg-indigo-50 text-indigo-500 hover:bg-indigo-100 border border-indigo-200"
            >
              <LayoutDashboard className="h-4 w-4" /> Inscrição Online
            </button>
            <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><button className="action-btn-sm shrink-0 whitespace-nowrap"><Plus className="h-4 w-4" /> Novo</button></DialogTrigger>
            <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto border-border/30 w-full max-w-2xl">
              <DialogHeader><DialogTitle className="text-2xl font-black">Ficha de Inscrição</DialogTitle></DialogHeader>

              {/* BOTÃO FLUTUANTE DE SALVAR (Modal) */}
              <div className="sticky top-2 flex justify-end w-full pointer-events-none z-50 -mb-14 pr-2">
                <button 
                  onClick={handleAdd} 
                  disabled={mutation.isPending}
                  title="Concluir Inscrição"
                  className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all pointer-events-auto disabled:opacity-50"
                >
                  {mutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                </button>
              </div>

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
                      hideCamera={true}
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
                        <label className="text-sm font-black text-zinc-900 mb-1.5 block uppercase tracking-wide">Idade</label>
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
                    <label className="text-sm font-black text-zinc-900 mb-1.5 block uppercase tracking-wide">Participa de alguma Pastoral ou Grupo?</label>
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
                          <label className="text-xs font-semibold text-zinc-900 mb-1 block">Vínculo / Parentesco</label>
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
                      <label className="text-xs font-semibold text-zinc-900 mb-1 block">Necessidade Especial</label>
                      <Select 
                        value={form.necessidadeEspecial} 
                        onValueChange={(v) => updateField("necessidadeEspecial", v)}
                      >
                        <SelectTrigger className="h-10 bg-background border border-black/10">
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
                      <label className="text-xs font-semibold text-zinc-900 mb-1 block">Observação Geral</label>
                      <textarea 
                        value={form.observacao} 
                        onChange={(e) => updateField("observacao", e.target.value)} 
                        className="form-input min-h-[80px] resize-none border border-black/10" 
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
          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/20 dark:to-background rounded-2xl border-2 border-slate-200/50 p-5 shadow-md space-y-4">
            <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
               <LayoutDashboard className="w-4 h-4 text-slate-400" />
               Painel de Gestão
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-row gap-3">
                <button 
                  onClick={() => setShowFrequencia(true)} 
                  className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 py-3.5 rounded-xl bg-amber-100 border-2 border-amber-300 text-amber-800 hover:bg-amber-200 transition-all group active:scale-95 shadow-sm"
                >
                  <CalendarDays className="h-5 w-5 group-hover:animate-bounce" />
                  <span className="text-xs sm:text-sm font-black uppercase tracking-tight">Frequência</span>
                </button>
                <button 
                  onClick={() => setShowCelebracoes(true)} 
                  className="relative flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-100 border-2 border-blue-300 text-blue-800 hover:bg-blue-200 transition-all group active:scale-95 shadow-sm"
                >
                  <Cake className="h-5 w-5 group-hover:animate-bounce" />
                  <span className="text-xs sm:text-sm font-black uppercase tracking-tight">Aniversários</span>
                  {hasQualquerCelebracao && (
                    <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse shadow-sm" />
                  )}
                </button>
              </div>
              <div className="flex flex-row gap-3">
                <button 
                  onClick={handleCopyFrequenciaLink} 
                  disabled={isSharingFrequencia}
                  className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-100 border-2 border-indigo-300 text-indigo-800 hover:bg-indigo-200 transition-all group active:scale-95 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSharingFrequencia
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Share2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  }
                  <span className="text-xs sm:text-sm font-black uppercase tracking-tight text-center">
                    {isSharingFrequencia ? 'Gerando...' : 'Frequência'}
                  </span>
                </button>
                <button 
                  onClick={() => setShowEvolucao(true)} 
                  className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-100 border-2 border-emerald-300 text-emerald-800 hover:bg-emerald-200 transition-all group active:scale-95 shadow-sm"
                >
                  <TrendingUp className="h-4 w-4 group-hover:animate-pulse" />
                  <span className="text-xs sm:text-sm font-black uppercase tracking-tight text-center">Painel de Evolução</span>
                </button>
              </div>
            </div>
          </div>

          {/* Modal Inscrição Online */}
          <Dialog open={showInscricaoModal} onOpenChange={setShowInscricaoModal}>
            <DialogContent className="max-w-md w-[95%] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
              <div className="bg-primary p-6 text-white text-center space-y-2">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm">
                   <UserPlus className="h-6 w-6" />
                </div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Inscrição Online</DialogTitle>
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Controle de inscrições recebidas</p>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-[#F8F9FE]">
                <div className="space-y-5">
                    <div className="p-4 bg-amber-50/50 rounded-2xl border-2 border-amber-200/50 shadow-sm">
                      <p className="text-[11px] font-bold text-amber-900/80 leading-relaxed italic">
                        "Por este Link de Inscrição as famílias podem realizar a inscrição ou atualização dos dados dos catequizandos e estes dados são cadastrados ou atualizados diretamente na ficha do catequizando de forma automática, mas sempre revise os dados recebidos para uma maior segurança."
                      </p>
                    </div>

                    {/* Toggle de Inscrições */}
                    {!turma?.isShared && turma?.codigoAcesso && (
                      <div className={cn(
                        "rounded-2xl p-4 border-2 shadow-sm transition-all duration-500",
                        turma.inscricoesAbertas
                          ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200"
                          : "bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200"
                      )}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                              turma.inscricoesAbertas ? "bg-emerald-500 text-white" : "bg-slate-300 text-slate-600"
                            )}>
                              {turma.inscricoesAbertas ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : (
                                <Link2 className="w-5 h-5" />
                              )}
                            </div>
                            <div className="min-w-0 text-left">
                              <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground/80">Status das Inscrições</p>
                              <p className={cn(
                                "text-sm font-black uppercase tracking-tight",
                                turma.inscricoesAbertas ? "text-emerald-700" : "text-slate-500"
                              )}>
                                {turma.inscricoesAbertas ? "Abertas" : "Encerradas"}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleInscricoes(!turma.inscricoesAbertas)}
                            disabled={isTogglingInscricoes}
                            className={cn(
                              "relative w-12 h-6 rounded-full transition-all duration-300 shrink-0 shadow-inner border-2 disabled:opacity-50",
                              turma.inscricoesAbertas
                                ? "bg-emerald-500 border-emerald-600"
                                : "bg-slate-300 border-slate-400"
                            )}
                          >
                            <span className={cn(
                              "absolute top-[1px] w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center",
                              turma.inscricoesAbertas ? "left-[22px]" : "left-[2px]"
                            )}>
                              {isTogglingInscricoes && (
                                <span className="w-2 h-2 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                              )}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    {turma?.inscricoesAbertas && (
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.2em] block ml-1">Link de Acolhida e Atualização</label>
                       <button 
                         onClick={handleCopyInscricaoLink}
                         className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/[0.02] transition-all group shadow-md shadow-primary/5 active:scale-[0.98]"
                       >
                          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                             <Link2 className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                             <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Copiar Link agora</p>
                             <code className="text-[10px] font-mono font-bold text-muted-foreground truncate block">
                               {`${getAppUrl()}/inscricao-catequizando/${turma?.codigoAcesso}`}
                             </code>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-colors">
                             <ArrowRight className="w-4 h-4" />
                          </div>
                       </button>
                       <p className="text-[9px] font-bold text-muted-foreground/60 text-center uppercase tracking-widest mt-2">Clique acima para copiar o link e enviar aos pais</p>
                    </div>
                    )}
                </div>


                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Vínculos e Atualizações Recebidas</h3>
                     <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                       {list.filter(c => c.origem === 'online').length}
                     </span>
                   </div>

                   
                   <div className="space-y-2">
                     {[...list].filter(c => c.origem === 'online').sort((a, b) => new Date(b.criadoEm || 0).getTime() - new Date(a.criadoEm || 0).getTime()).map((c) => (

                       <div key={c.id} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-black/10 group hover:border-primary/20 transition-all">
                          <div className="flex-1 min-w-0">
                             <p className="text-xs font-black text-foreground truncate uppercase">{c.nome}</p>
                             <div className="flex items-center gap-1.5 mt-0.5 text-muted-foreground font-bold">
                               <CalendarDays className="w-3 h-3" />
                               <span className="text-[9px] uppercase tracking-tighter">
                                 {c.criadoEm ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(c.criadoEm)) : 'Data indisponível'}
                               </span>
                             </div>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200" title="Cadastrado" />
                       </div>
                     ))}
                     {list.filter(c => c.origem === 'online').length === 0 && (
                       <div className="text-center py-8 opacity-40">
                          <UserPlus className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-[10px] font-black uppercase">Nenhuma inscrição online ainda</p>
                       </div>
                     )}

                   </div>
                </div>
              </div>

              <div className="p-4 bg-white border-t border-black/5 text-center">
                 <button onClick={() => setShowInscricaoModal(false)} className="text-[10px] font-black uppercase text-muted-foreground hover:text-foreground transition-colors">Fechar Painel</button>
              </div>
            </DialogContent>
          </Dialog>




        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 bg-white p-1 rounded-xl shadow-sm border border-black/5 w-fit">
        <button 
          onClick={() => handleSetFilterAtivos('ativos')}
          className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all", filterAtivos === 'ativos' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-black/5")}
        >
          Ativos ({list.filter(c => !c.status || c.status === 'ativo').length})
        </button>
        <button 
          onClick={() => handleSetFilterAtivos('inativos')}
          className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all", filterAtivos === 'inativos' ? "bg-zinc-600 text-white shadow-sm" : "text-muted-foreground hover:bg-black/5")}
        >
          Inativos ({list.filter(c => c.status && c.status !== 'ativo').length})
        </button>
      </div>

      {filteredList.length === 0 ? (
        <div className="empty-state animate-float-up"><div className="icon-box bg-accent/15 text-accent-foreground mx-auto mb-3"><UserPlus className="h-6 w-6" /></div><p className="text-sm font-medium text-muted-foreground">{filterAniversarios ? "Nenhum aniversariante encontrado" : "Nenhum catequizando cadastrado"}</p></div>
      ) : (
        <div className="space-y-2">{pagedList.map((c, i) => {
          const st = statusConfig[c.status || 'ativo'];
          const emAlerta = catequizandosEmAlerta.has(c.id);
          const globalIndex = catPage * CAT_PAGE_SIZE + i;
          return (
            <button key={c.id} onClick={() => { setViewItem(c); setEditMode(false); }} className="relative w-full group animate-float-up text-left" style={{ animationDelay: `${i * 30}ms` }}>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className={cn("relative flex flex-col bg-card rounded-2xl border shadow-sm transition-all active:scale-[0.98] overflow-hidden", emAlerta ? "border-destructive group-hover:shadow-md" : "border-zinc-800 group-hover:shadow-md group-hover:border-primary")}>
                {/* Sinalização de Status Lateral */}
                <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", st.color.split(' ')[0])} />
                
                {emAlerta && (
                  <div className="bg-destructive/10 border-b border-destructive/20 py-1.5 px-3 flex justify-center items-center gap-1.5 animate-pulse w-full">
                    <BellRing className="w-3 h-3 text-destructive" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-destructive">Catequizando com mais de {alertConfig.moduloCatequizandos?.faltas} faltas</span>
                  </div>
                )}
                <div className="relative flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 w-full">
                <div className="flex items-center justify-center w-6 text-sm font-bold text-muted-foreground">{globalIndex + 1}</div>
                <div className="relative shrink-0 ml-1.5">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden shadow-inner ring-2 ring-background">
                    {c.foto ? <img src={c.foto} className="w-full h-full object-cover" alt="" /> : <span className="text-lg font-black text-primary/70">{c.nome.charAt(0).toUpperCase()}</span>}
                  </div>
                  {isAniversarianteMes(c.dataNascimento) && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-bounce z-20">
                      <Cake className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-foreground truncate leading-tight group-hover:text-primary transition-colors">{c.nome}</h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-black/5", st.color.split(' ')[0], "text-white")}>
                      {st.label}
                    </span>
                    {c.dataNascimento && (
                      <span className="text-xs sm:text-sm font-black text-primary bg-primary/10 px-2.5 py-1 rounded-lg border-2 border-primary/20 shadow-sm">
                        {calcularIdade(c.dataNascimento)}
                      </span>
                    )}
                    {c.origem === 'online' && c.protocolo && (
                      <span className="flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shadow-sm uppercase tracking-widest" title="Inscrição Online">
                        <Link2 className="w-2.5 h-2.5" />
                        {c.protocolo}
                      </span>
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

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 pb-4">
          <button
            onClick={() => { setCatPage(p => Math.max(0, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={catPage === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-black/10 bg-white shadow-sm hover:bg-primary/5 hover:border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Anterior
          </button>
          <span className="text-xs font-black text-muted-foreground">
            {catPage + 1} / {totalPages} &nbsp;·&nbsp; {filteredList.length} total
          </span>
          <button
            onClick={() => { setCatPage(p => Math.min(totalPages - 1, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={catPage >= totalPages - 1}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-black/10 bg-white shadow-sm hover:bg-primary/5 hover:border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Próxima <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
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
            
            {/* Aviso de Origem de Dados */}
            <div className="flex items-start gap-2 p-3 mt-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <Info className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
              <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium leading-relaxed">
                Os dados apresentados neste painel são registrados automaticamente através da <strong>Ficha do Encontro</strong>.
              </p>
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
                      <label className="text-xs font-black text-zinc-900 uppercase tracking-widest">Selecionar Encontro</label>
                      <Select value={freqEncontroId} onValueChange={setFreqEncontroId}>
                        <SelectTrigger className="w-full h-12 bg-white rounded-xl shadow-sm border-2 border-indigo-100 hover:border-indigo-300 transition-colors">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {encontrosRealizados.map(e => (
                            <SelectItem key={e.id} value={e.id} className="cursor-pointer font-medium">
                              {new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR')} - {e.tema}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="bg-white rounded-2xl border border-black/10 overflow-hidden shadow-sm mt-4">
                      {activeList.map((c, i) => {
                        const isPresent = selectedEncontroObj?.presencas?.includes(c.id);
                        const justificativa = selectedEncontroObj?.justificativas?.[c.id];
                        const isFalta = !isPresent && !justificativa;
                        
                        return (
                          <div key={c.id} className={cn("flex items-center justify-between p-3.5", i !== activeList.length - 1 && "border-b border-black/5")}>
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
                      <label className="text-xs font-black text-zinc-900 uppercase tracking-widest">Filtrar por Mês</label>
                      <Select value={freqMes} onValueChange={setFreqMes}>
                        <SelectTrigger className="w-full h-12 bg-white rounded-xl shadow-sm border-2 border-indigo-100 hover:border-indigo-300 transition-colors">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {mesesDisponiveis.map(m => {
                            const [year, month] = m.split('-');
                            const nomeMes = new Date(Number(year), Number(month)-1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                            return (
                              <SelectItem key={m} value={m} className="capitalize cursor-pointer font-medium">
                                {nomeMes}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="bg-white rounded-2xl border border-black/10 overflow-hidden shadow-sm mt-4">
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
            {freqTab === 'encontro' ? (
              <button 
                onClick={() => {
                  setPrintEncontroId(freqEncontroId);
                  setTimeout(() => window.print(), 100);
                }} 
                disabled={!freqEncontroId}
                className="action-btn-sm bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white w-full sm:w-auto font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Gerar Relatório
              </button>
            ) : (
              <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                <button 
                  onClick={handleCopyFrequenciaLink} 
                  disabled={isSharingFrequencia}
                  className="action-btn-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 w-full sm:w-auto font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSharingFrequencia
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Share2 className="w-4 h-4" />
                  }
                  {isSharingFrequencia ? 'Gerando link...' : 'Compartilhar Resumo Público'}
                </button>
                <button onClick={() => setShowFrequencia(false)} className="action-btn-sm bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto">
                  Fechar
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Celebrações */}
      <Dialog open={showCelebracoes} onOpenChange={setShowCelebracoes}>
        <DialogContent className="rounded-3xl border-amber-500/20 max-w-2xl w-[95vw] max-h-[90vh] p-0 overflow-hidden shadow-2xl flex flex-col bg-background">
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent p-5 border-b border-amber-500/10 shrink-0">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center shadow-inner">
                  <Cake className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black text-foreground leading-tight">Painel de Celebrações</DialogTitle>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">Aniversários e Datas Especiais</p>
                </div>
              </div>
            </div>

            {/* Tabs Control */}
            <div className="flex items-center gap-2 mt-5 bg-black/5 p-1 rounded-xl">
              <button 
                onClick={() => setCelebracoesTab('nascimento')}
                className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-all", celebracoesTab === 'nascimento' ? "bg-white text-amber-600 shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                Nascimento ({aniversariantesFiltrados.length})
              </button>
              <button 
                onClick={() => setCelebracoesTab('batismo')}
                className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-all", celebracoesTab === 'batismo' ? "bg-white text-amber-600 shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                Batismo ({batismosFiltrados.length})
              </button>
            </div>

            {/* Period Filter (Anual/Mensal) */}
            <div className="flex flex-col gap-4 mt-5">
              <div className="flex items-center gap-2 bg-black/5 p-1 rounded-xl">
                <button 
                  onClick={() => setPeriodoCelebracao('anual')}
                  className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-all", periodoCelebracao === 'anual' ? "bg-white text-amber-600 shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >
                  Anual
                </button>
                <button 
                  onClick={() => setPeriodoCelebracao('mensal')}
                  className={cn("flex-1 py-2 text-sm font-bold rounded-lg transition-all", periodoCelebracao === 'mensal' ? "bg-white text-amber-600 shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >
                  Mensal
                </button>
              </div>

              {periodoCelebracao === 'mensal' && (
                <div className="animate-in slide-in-from-top-2">
                  <Select 
                    value={mesCelebracao.toString()} 
                    onValueChange={(v) => setMesCelebracao(parseInt(v))}
                  >
                    <SelectTrigger className="h-10 bg-white border-amber-200">
                      <SelectValue placeholder="Selecione o mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {MESES.map((nome, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>{nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

          </div>

          <div className="flex-1 overflow-y-auto p-5 bg-black/[0.02]">
            <div className="space-y-3">
              {(celebracoesTab === 'nascimento' ? aniversariantesFiltrados : batismosFiltrados).length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm font-medium">Nenhuma celebração encontrada para este período.</div>
              ) : (
                (celebracoesTab === 'nascimento' ? aniversariantesFiltrados : batismosFiltrados).map((c) => {
                  const dataRaw = celebracoesTab === 'nascimento' ? c.dataNascimento : (c.sacramentos?.batismo?.data || c.dadosPastorais?.sacramentos?.batismo?.data);
                  const data = new Date(dataRaw + 'T12:00:00');
                  const hoje = new Date();
                  const eHoje = data.getDate() === hoje.getDate() && data.getMonth() === hoje.getMonth();
                  const jaPassou = data.getMonth() < hoje.getMonth() || (data.getMonth() === hoje.getMonth() && data.getDate() < hoje.getDate());

                  return (
                    <div key={c.id} className={cn("flex items-center justify-between p-4 rounded-2xl bg-white border border-black/5 shadow-sm", eHoje && "ring-2 ring-amber-500 bg-amber-50/30")}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                         <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                           {c.foto ? <img src={c.foto} className="w-full h-full object-cover" /> : <span className="text-sm font-bold">{c.nome.charAt(0)}</span>}
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground leading-snug">{c.nome}</p>
                            <p className="text-sm font-black text-amber-600 mt-0.5">
                              {periodoCelebracao === 'anual' ? (
                                `${data.getDate()} de ${MESES[data.getMonth()]}`
                              ) : (
                                `${jaPassou ? 'Celebrou dia ' : 'Dia '} ${data.getDate()}`
                              )}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                              {celebracoesTab === 'nascimento' ? `Nasc. ${data.getFullYear()}` : `Batismo ${data.getFullYear()}`}
                            </p>
                         </div>
                      </div>
                      
                      <div className="text-right shrink-0 ml-2">
                        {celebracoesTab === 'nascimento' ? (
                          <span className="text-sm font-black text-amber-600 bg-amber-100 px-3 py-1.5 rounded-lg">
                            {calcularIdade(c.dataNascimento)}
                          </span>
                        ) : (
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-sm font-black text-blue-600 bg-blue-100 px-3 py-1.5 rounded-lg">
                               Batismo
                            </span>
                            <span className="text-xs font-bold text-blue-500">
                              {data.toLocaleDateString('pt-BR')}
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
          
          <div className="p-4 bg-white border-t border-black/5 shrink-0 flex justify-end">
             <button onClick={() => setShowCelebracoes(false)} className="action-btn-sm bg-black/5 text-muted-foreground hover:bg-black/10 border-transparent justify-center w-full sm:w-auto">
              Fechar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE EVOLUÇÃO */}
      <Dialog open={showEvolucao} onOpenChange={setShowEvolucao}>
        <DialogContent className="rounded-3xl border-emerald-500/20 max-w-2xl w-[95vw] max-h-[90vh] p-0 overflow-hidden shadow-2xl flex flex-col bg-background">
          <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-zinc-950">
            <div className="p-5 border-b border-black/5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black text-emerald-900 dark:text-emerald-100 leading-tight">Painel de Evolução</DialogTitle>
                  <p className="text-[10px] font-bold text-emerald-700/70 dark:text-emerald-400/70 uppercase tracking-widest mt-0.5">Acompanhamento do Diário Espiritual</p>
                </div>
              </div>

              {/* Aviso de Origem de Dados */}
              <div className="flex items-start gap-2 p-3 mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <p className="text-xs text-emerald-800 dark:text-emerald-200 font-medium leading-relaxed">
                  Os dados de evolução são registrados automaticamente através do <strong>Diário do Catequista</strong>.
                </p>
              </div>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Selecione o Catequizando</label>
                <Select value={evolucaoSelectedId} onValueChange={setEvolucaoSelectedId}>
                  <SelectTrigger className="h-14 rounded-2xl border-2 shadow-sm font-bold bg-white dark:bg-zinc-900">
                    <SelectValue placeholder="Escolha um catequizando" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 rounded-2xl">
                    {activeList.map(c => (
                      <SelectItem key={c.id} value={c.id} className="font-bold cursor-pointer py-3">{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {evolucaoSelectedId && (
                <section className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-3xl p-6 border border-indigo-100 dark:border-indigo-500/10 shadow-sm mt-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                     <h3 className="text-sm font-black text-indigo-900 dark:text-indigo-100 uppercase tracking-widest text-center sm:text-left">Análise de Participação</h3>
                     
                     <div className="flex bg-white/50 dark:bg-black/20 p-1 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-500/10">
                       {[
                         { value: "mes", label: "Mês" },
                         { value: "semestre", label: "Semestre" },
                         { value: "ano", label: "Ano" }
                       ].map((opt) => (
                         <button
                           key={opt.value}
                           onClick={() => setEvolutionPeriod(opt.value as any)}
                           className={cn(
                             "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                             evolutionPeriod === opt.value
                               ? "bg-indigo-600 text-white shadow-md"
                               : "text-indigo-600/70 hover:bg-indigo-100 dark:text-indigo-400/70 dark:hover:bg-indigo-500/20"
                           )}
                         >
                           {opt.label}
                         </button>
                       ))}
                     </div>
                  </div>
                  
                  {!catequizandoStats ? (
                     <div className="text-center py-6 bg-white/50 dark:bg-black/20 rounded-2xl border border-indigo-50 dark:border-indigo-500/10">
                       <p className="text-xs font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-widest">Nenhum registro no período</p>
                     </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {catequizandoStats.count_av > 0 && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-500/20 shadow-sm space-y-5">
                          <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 flex items-center justify-between">
                            <span>Avaliações em Encontros</span>
                            <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md">{catequizandoStats.count_av} reg</span>
                          </h4>
                          
                          <div className="space-y-4">
                            {[
                              { label: "Pontualidade", value: catequizandoStats.pontualidade, color: "bg-indigo-500" },
                              { label: "Participação", value: catequizandoStats.part_grupo, color: "bg-indigo-500" },
                              { label: "Engajamento", value: catequizandoStats.engajamento, color: "bg-indigo-500" }
                            ].map((item, idx) => (
                              <div key={idx} className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase">{item.label}</span>
                                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">{(item.value / 5 * 100).toFixed(0)}%</span>
                                </div>
                                <div className="h-2 w-full bg-indigo-50 dark:bg-indigo-500/10 rounded-full overflow-hidden">
                                  <div className={cn("h-full transition-all duration-1000", item.color)} style={{ width: `${(item.value / 5 * 100)}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {catequizandoStats.count_ev > 0 && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-500/20 shadow-sm space-y-5">
                          <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center justify-between">
                            <span>Evolução</span>
                            <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md">{catequizandoStats.count_ev} reg</span>
                          </h4>
                          
                          <div className="space-y-4">
                            {[
                              { label: "Espiritual", value: catequizandoStats.ev_espiritual, color: "bg-emerald-500" },
                              { label: "Comportamental", value: catequizandoStats.ev_comportamental, color: "bg-emerald-500" }
                            ].map((item, idx) => (
                              <div key={idx} className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase">{item.label}</span>
                                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{(item.value / 5 * 100).toFixed(0)}%</span>
                                </div>
                                <div className="h-2 w-full bg-emerald-50 dark:bg-emerald-500/10 rounded-full overflow-hidden">
                                  <div className={cn("h-full transition-all duration-1000", item.color)} style={{ width: `${(item.value / 5 * 100)}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )}

              {/* Alerta de Faltas Muted Status */}
              {evolucaoSelectedId && (() => {
                const selectedCat = list.find(c => c.id === evolucaoSelectedId);
                if (!selectedCat) return null;
                const alertaConfig = (selectedCat.dadosPastorais as any)?.alertaFaltasConfig;
                const isMuted = alertaConfig?.mutado === true;
                const muteLabel = MUTE_OPTIONS.find(o => o.value === alertaConfig?.opcao)?.label;
                const dataRegistro = alertaConfig?.dataRegistro ? new Date(alertaConfig.dataRegistro).toLocaleDateString('pt-BR') : null;

                if (isMuted) {
                  return (
                    <section className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-3xl p-5 border border-emerald-100 dark:border-emerald-500/10 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Aviso de Faltas Desativado</p>
                          {muteLabel && <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200 mt-0.5">{muteLabel}</p>}
                          {dataRegistro && <p className="text-[9px] font-bold text-emerald-600/70 dark:text-emerald-500/70 mt-0.5 uppercase tracking-widest">Registrado em {dataRegistro}</p>}
                        </div>
                      </div>
                    </section>
                  );
                }
                return null;
              })()}
            </div>
            
            <div className="p-4 border-t border-black/5 bg-background">
              <button 
                onClick={() => setShowEvolucao(false)} 
                className="w-full action-btn bg-zinc-900 hover:bg-zinc-800 text-white"
              >
                FECHAR
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewItem} onOpenChange={(o) => { if (!o) { setViewItem(null); setEditMode(false); } }}>
        <DialogContent hideClose className="rounded-2xl max-h-[85vh] overflow-y-auto border-border/30 p-0 sm:p-0">
          {viewItem && !editMode && (
            <div className="flex flex-col h-full bg-[#F8F9FE] rounded-3xl overflow-hidden relative">
              {/* Top Bar Accent */}
              <div className="h-2 w-full bg-gradient-to-r from-primary via-primary/60 to-primary/30" />
              
              {/* Close Button */}
              <button 
                onClick={() => { setViewItem(null); setEditMode(false); }} 
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900 text-white shadow-lg hover:bg-zinc-800 transition-all active:scale-90 z-50"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="p-6 sm:p-8 space-y-8 overflow-y-auto">
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row items-center gap-6">
                   <div className="relative shrink-0">
                      <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[2.5rem] bg-white p-1 shadow-2xl shadow-primary/20 ring-4 ring-white">
                         <div className="w-full h-full rounded-[2rem] bg-muted overflow-hidden">
                            {viewItem.foto ? <img src={viewItem.foto} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center bg-primary/5 text-4xl font-black text-primary/40">{viewItem.nome.charAt(0).toUpperCase()}</div>}
                         </div>
                      </div>
                   </div>
                   <div className="flex-1 text-center pt-2">
                       <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-500 leading-tight uppercase" title={viewItem.nome}>{viewItem.nome}</h2>

                       {/* Chip de Idade - centralizado abaixo do nome */}
                       {viewItem.dataNascimento && (
                         <div className="flex justify-center mt-2">
                           <div className="flex items-center gap-2 text-primary font-black text-xs bg-primary/5 px-3 py-1.5 rounded-full border-2 border-primary/10">
                             {calcularIdade(viewItem.dataNascimento)}
                           </div>
                         </div>
                       )}

                       {/* Chips de Status + Aviso de Faltas */}
                       <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <button
                               className={cn(
                                 "flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all active:scale-95 group shadow-sm",
                                 statusConfig[viewItem.status || 'ativo'].bg,
                                 statusConfig[viewItem.status || 'ativo'].border
                               )}
                             >
                               <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white/80 shadow-sm">
                                 {(() => { const Icon = statusConfig[viewItem.status || 'ativo'].icon; return <Icon className={cn("h-3 w-3", statusConfig[viewItem.status || 'ativo'].text)} />; })()}
                               </div>
                               <span className={cn("text-[10px] font-black uppercase tracking-widest", statusConfig[viewItem.status || 'ativo'].text)}>
                                 {statusConfig[viewItem.status || 'ativo'].label}
                               </span>
                               <ChevronDown className="h-3 w-3 opacity-40 group-hover:translate-y-0.5 transition-transform ml-1" />
                             </button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="center" className="rounded-2xl p-2 border-2 border-zinc-100 shadow-xl min-w-[160px] z-[100]">
                             {(Object.keys(statusConfig) as CatequizandoStatus[]).map(s => {
                               const config = statusConfig[s];
                               const Icon = config.icon;
                               return (
                                 <DropdownMenuItem key={s} onClick={() => handleStatusChange(viewItem, s)} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-zinc-50 focus:bg-zinc-50 transition-colors">
                                   <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.bg)}><Icon className={cn("w-4 h-4", config.text)} /></div>
                                   <span className="text-xs font-black uppercase tracking-widest text-zinc-600">{config.label}</span>
                                 </DropdownMenuItem>
                               );
                             })}
                           </DropdownMenuContent>
                         </DropdownMenu>

                         {/* Chip Aviso de Faltas */}
                         {(() => {
                           const alertaConfig = (viewItem.dadosPastorais as any)?.alertaFaltasConfig;
                           const isMuted = alertaConfig?.mutado === true;

                           if (isMuted) {
                             const muteLabel = MUTE_OPTIONS.find(o => o.value === alertaConfig?.opcao)?.label || '—';
                             return (
                               <div className="relative flex flex-col items-center gap-0.5">
                                 <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border-2 border-emerald-200 shadow-sm cursor-default" title={muteLabel}>
                                   <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                   <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Aviso de Faltas</span>
                                 </div>
                                 <button onClick={() => handleUnmuteAlert(viewItem)} className="text-[7px] font-black uppercase text-red-400 hover:text-red-600 transition-colors leading-none">
                                   Reativar
                                 </button>
                               </div>
                             );
                           }

                           if (catequizandosEmAlerta.has(viewItem.id)) {
                             return (
                               <div className="relative flex flex-col items-center gap-0.5">
                                 <button
                                   onClick={() => setShowMuteAlertDropdown(v => !v)}
                                   className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border-2 border-red-200 shadow-sm hover:bg-red-100 transition-all active:scale-95 group"
                                 >
                                   <BellOff className="w-3.5 h-3.5 text-red-500" />
                                   <span className="text-[9px] font-black uppercase tracking-widest text-red-600">Aviso de Faltas</span>
                                   <ChevronDown className="w-3 h-3 text-red-400 group-hover:translate-y-0.5 transition-transform" />
                                 </button>
                                 {showMuteAlertDropdown && (
                                   <>
                                     <div className="fixed inset-0 z-[199]" onClick={() => setShowMuteAlertDropdown(false)} />
                                     <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-[200] bg-white rounded-2xl border-2 border-zinc-100 shadow-xl min-w-[200px] py-2 animate-in zoom-in-95">
                                       <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground px-3 py-1">Motivo da desativação</p>
                                       {MUTE_OPTIONS.map(opt => (
                                         <button key={opt.value} onClick={() => handleMuteAlert(viewItem, opt.value)} className="w-full text-left px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors">
                                           {opt.label}
                                         </button>
                                       ))}
                                     </div>
                                   </>
                                 )}
                               </div>
                             );
                           }
                           return null;
                         })()}
                       </div>
                    </div>
                 </div>

                {/* Ações (Relatório, Edit & Delete) */}
                <div className="flex flex-row items-stretch gap-2 mt-4">
                   <button
                     title="Emitir relatório"
                     onClick={() => { setSingleReportItem(viewItem); }}
                     className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-violet-50 text-violet-700 border-2 border-violet-200 shadow-sm hover:bg-violet-100 transition-all active:scale-95 group font-bold text-xs sm:text-sm uppercase tracking-wide"
                   >
                     <FileText className="h-4 w-4 group-hover:scale-110 transition-transform" />
                     <span className="hidden sm:inline">Relatório</span>
                     <span className="sm:hidden">Relat.</span>
                   </button>
                   <button 
                     onClick={handleEdit} 
                     className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-primary/10 text-primary border-2 border-primary/20 shadow-sm hover:bg-primary/20 transition-all active:scale-95 group font-bold text-xs sm:text-sm uppercase tracking-wide"
                   >
                      <Pencil className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                      Editar
                   </button>
                   <button 
                     onClick={handleDelete} 
                     className="flex-1 h-12 flex items-center justify-center gap-2 rounded-xl bg-destructive/10 text-destructive border-2 border-destructive/20 shadow-sm hover:bg-destructive/20 transition-all active:scale-95 group font-bold text-xs sm:text-sm uppercase tracking-wide"
                   >
                      <Trash2 className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                      Excluir
                   </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                   {/* Personal Info Section */}
                   <section className="bg-white rounded-3xl p-6 border-2 border-zinc-100 shadow-xl">
                      <h3 className="text-base font-black text-black uppercase tracking-widest mb-6 text-center">Dados de Identificação</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 px-4">
                         <div className="space-y-4 text-left">
                            <div className="flex flex-col gap-1">
                               <span className="text-xs font-black text-primary uppercase tracking-widest">Nascimento</span>
                               <p className="text-base font-bold text-zinc-900">{viewItem.dataNascimento ? new Date(viewItem.dataNascimento + 'T12:00').toLocaleDateString("pt-BR") : "—"}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                               <span className="text-xs font-black text-primary uppercase tracking-widest">Celular</span>
                               <p className="text-base font-bold text-zinc-900">{viewItem.telefone || "—"}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                               <span className="text-xs font-black text-primary uppercase tracking-widest">E-mail</span>
                               <p className="text-base font-bold text-zinc-900 break-all">{viewItem.email || "—"}</p>
                            </div>
                         </div>
                         <div className="space-y-4 text-left">
                            <div className="flex flex-col gap-1">
                               <span className="text-xs font-black text-primary uppercase tracking-widest">Residência</span>
                               {viewItem.endereco || viewItem.bairro || viewItem.numero ? (
                                 <p className="text-base font-bold text-zinc-900 leading-relaxed">
                                    {viewItem.endereco}{viewItem.numero ? `, ${viewItem.numero}` : ""}<br/>
                                    <span className="text-primary font-black uppercase text-xs">{viewItem.bairro}{viewItem.complemento ? ` (${viewItem.complemento})` : ""}</span>
                                 </p>
                               ) : <p className="text-base font-bold text-zinc-300 italic">—</p>}
                            </div>
                            {viewItem.necessidadeEspecial && viewItem.necessidadeEspecial !== 'nenhuma' && (
                               <div className="flex flex-col gap-1">
                                  <span className="text-xs font-black text-destructive uppercase tracking-widest">Necessidade Especial</span>
                                  <div className="flex items-center gap-2">
                                     <div className={cn("w-2.5 h-2.5 rounded-full", NECESSIDADES_ESPECIAIS.find(n => n.id === viewItem.necessidadeEspecial)?.color)} />
                                     <p className="text-base font-black text-zinc-900">{NECESSIDADES_ESPECIAIS.find(n => n.id === viewItem.necessidadeEspecial)?.label}</p>
                                  </div>
                               </div>
                            )}
                         </div>
                      </div>
                   </section>

                   {/* Family Section */}
                   <section className="bg-white rounded-3xl p-6 border-2 border-blue-100 shadow-xl shadow-blue-200/50">
                      <h3 className="text-base font-black text-black uppercase tracking-widest mb-6 text-center">Responsáveis Legais</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         {viewItem.responsaveis?.length ? (
                           viewItem.responsaveis.map(resp => (
                             <div key={resp.id} className="bg-blue-50/30 p-4 rounded-2xl border border-blue-100 flex items-center gap-4">
                                <div className="flex-1 min-w-0 text-left">
                                   <p className="text-sm font-black text-zinc-900 uppercase leading-tight">{resp.nome}</p>
                                   <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{resp.vinculo}</span>
                                      <span className="w-1 h-1 rounded-full bg-blue-200" />
                                      <span className="text-xs font-black text-blue-600">{resp.telefone}</span>
                                   </div>
                                </div>
                             </div>
                           ))
                         ) : (
                           <div className="col-span-full bg-blue-50/30 p-4 rounded-2xl border border-blue-100 flex items-center gap-4">
                              <div className="flex-1 min-w-0 text-left">
                                 <p className="text-sm font-black text-zinc-900 uppercase leading-tight">{viewItem.responsavel || "Não informado"}</p>
                                 <p className="text-xs font-black text-blue-600 mt-1">{viewItem.telefone}</p>
                              </div>
                           </div>
                         )}
                      </div>
                   </section>

                   {/* Sacramental Section */}
                   <section className="bg-white rounded-3xl p-6 border-2 border-orange-100 shadow-xl shadow-orange-200/50">
                      <h3 className="text-base font-black text-black uppercase tracking-widest mb-6 text-center">Caminhada Sacramental</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         {(["batismo", "eucaristia", "crisma"] as const).map(sac => { 
                           const s = viewItem.dadosPastorais?.sacramentos?.[sac] || viewItem.sacramentos?.[sac]; 
                           const isOk = s?.recebido;
                           const label = sac === 'eucaristia' ? '1ª Eucaristia' : sac;
                           return (
                             <div key={sac} className={cn("p-4 rounded-2xl border-2 transition-all text-center", isOk ? "bg-orange-50/30 border-orange-200" : "bg-zinc-50 border-zinc-100 opacity-60")}>
                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md", isOk ? "bg-orange-500 text-white" : "bg-zinc-200 text-zinc-400")}>
                                   {isOk ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                                </div>
                                <p className={cn("text-sm font-black uppercase tracking-widest", isOk ? "text-orange-600" : "text-zinc-500")}>{label}</p>
                                {isOk && s.paroquia && <p className="text-xs font-black text-orange-400 mt-1 uppercase tracking-tight leading-tight">{s.paroquia}</p>}
                                {isOk && s.data && <p className="text-sm font-black text-zinc-900 mt-1">{new Date(s.data + 'T12:00').toLocaleDateString("pt-BR")}</p>}
                             </div>
                           );
                         })}
                      </div>
                      {viewItem.dadosPastorais?.participacaoPastoral && (
                        <div className="mt-4 p-4 bg-orange-50/20 rounded-2xl border border-orange-100 italic text-center">
                           <span className="text-xs font-black text-orange-400 uppercase tracking-widest block mb-1">Engajamento Comunitário</span>
                           <p className="text-sm font-bold text-zinc-800">"{viewItem.dadosPastorais.participacaoPastoral}"</p>
                        </div>
                      )}
                   </section>

                   {/* Memorial */}
                   {viewItem.observacao && (
                     <section className="bg-zinc-900 rounded-3xl p-8 text-white shadow-2xl">
                        <div className="flex items-center justify-center gap-2 mb-6">
                           <MessageSquare className="w-4 h-4 text-primary" />
                           <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Memorial de Acompanhamento</h3>
                        </div>
                        <p className="text-sm font-medium leading-relaxed text-zinc-400 text-center italic">"{viewItem.observacao}"</p>
                     </section>
                   )}
                </div>

                {/* Footer */}
                <div className="mt-8 mb-4 text-center bg-zinc-100 py-3 rounded-full mx-auto max-w-fit px-6 border border-zinc-200 shadow-sm">
                   <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                     <CalendarDays className="w-3.5 h-3.5" /> Registrado em {viewItem.criadoEm ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(viewItem.criadoEm)) : '—'}
                   </p>
                </div>
              </div>
            </div>
          )}

          {viewItem && editMode && (
            <div className="p-5 sm:p-6 bg-background rounded-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center justify-between mb-4">
                  <DialogTitle className="text-xl font-bold">Editar Inscrição</DialogTitle>
                  <button onClick={() => setEditMode(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border-2 border-black/5 shadow-md text-foreground hover:bg-zinc-50 transition-all active:scale-90"><X className="h-5 w-5" /></button>
                </div>
              </DialogHeader>

              {/* BOTÃO FLUTUANTE DE SALVAR (Modal Edit) */}
              <div className="sticky top-2 flex justify-end w-full pointer-events-none z-50 -mb-14 pr-2">
                <button 
                  onClick={handleSaveEdit} 
                  disabled={mutation.isPending}
                  title="Salvar Alterações"
                  className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all pointer-events-auto disabled:opacity-50"
                >
                  {mutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                </button>
              </div>

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
                      hideCamera={true}
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
                        <label className="text-xs font-semibold text-zinc-900 mb-1 block">Idade</label>
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
                    <label className="text-xs font-semibold text-zinc-900 mb-1 block">Participa de alguma Pastoral ou Grupo?</label>
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
                          <label className="text-xs font-semibold text-zinc-900 mb-1 block">Vínculo / Parentesco</label>
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
                    <label className="text-xs font-semibold text-zinc-900 mb-1 block">Necessidade Especial</label>
                    <Select 
                      value={editForm.necessidadeEspecial} 
                      onValueChange={(v) => setEditForm(f => ({ ...f, necessidadeEspecial: v }))}
                    >
                      <SelectTrigger className="h-10 bg-background border border-black/10">
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
                    <label className="text-xs font-semibold text-zinc-900 mb-1 block">Observação Geral</label>
                    <textarea value={editForm.observacao} onChange={(e) => setEditForm(f => ({ ...f, observacao: e.target.value }))} className="form-input min-h-[60px] resize-none border border-black/10" />
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

      {/* Modal Excluir — renderizado fora de qualquer Dialog Radix */}
      {deleteModal.open && deleteTarget && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) cancelDelete(); }}
        >
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[420px] overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex flex-col items-center pt-8 pb-4 px-8 gap-3">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center shadow-inner">
                <Trash2 className="w-9 h-9 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 text-center leading-tight mt-1">Excluir Catequizando?</h3>
              <p className="text-sm text-zinc-500 text-center leading-relaxed">
                Você está prestes a excluir <span className="font-black text-zinc-800">{deleteTarget.nome}</span>. Esta ação não poderá ser desfeita.
              </p>
            </div>

            {/* Motivo */}
            <div className="px-8 pb-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Motivo da exclusão</label>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { value: 'engano', label: '✏️ Cadastrado por engano' },
                  { value: 'duplicado', label: '📋 Cadastro duplicado' },
                  { value: 'desistente', label: '🚪 Catequizando desistente' },
                  { value: 'transferido', label: '🔄 Transferido para outra turma' },
                  { value: 'outros', label: '📝 Outros' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setDeleteModal(m => ({ ...m, motivo: opt.value }))}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all',
                      deleteModal.motivo === opt.value
                        ? 'bg-red-50 border-red-400 text-red-700 shadow-sm'
                        : 'bg-zinc-50 border-zinc-100 text-zinc-600 hover:border-zinc-300'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-8 py-6">
              <button
                onClick={cancelDelete}
                className="flex-1 py-3 rounded-2xl border-2 border-zinc-200 bg-white text-zinc-600 font-bold hover:bg-zinc-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={!deleteModal.motivo || deleteMut.isPending}
                className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-500/30 active:scale-95"
              >
                {deleteMut.isPending ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Print Portal Oculto --- */}
      {printEncontroId && createPortal(
        <div className="print-wrapper" style={{ display: 'none', position: 'fixed', top: 0, left: 0, width: '100%', backgroundColor: 'white', zIndex: 999999 }}>
          <div className="bg-white text-black">
            <Templates.FrequenciaEncontrosSheet org={orgNomes} turma={turma} catequizandos={list} encontros={encontrosRealizados} encontroId={printEncontroId} />
          </div>
        </div>,
        document.body
      )}

      {/* Report Dialog for listing all catequizandos */}
      <ModuleReportSheet
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        title="Fichas Individuais"
        subtitle={turma?.nome}
        color="violet"
        reportName="Ficha_Individual"
        turmaName={turma?.nome || ""}
        items={list.filter(c => !c.status || c.status === 'ativo').map((cat) => ({
          id: cat.id,
          label: cat.nome,
          subtitle: cat.status || 'ativo',
          avatarInitial: cat.nome?.charAt(0),
          data: cat,
        }))}
        renderTemplate={(catData) => <Templates.CatequizandoIndividualSheet doc={catData} org={org} turma={turma} />}
      />

      {/* Report Dialog for a single catequizando from the viewItem dialog */}
      <ModuleReportSheet
        open={!!singleReportItem}
        onOpenChange={(v) => { if (!v) setSingleReportItem(null); }}
        title="Ficha Individual"
        subtitle={singleReportItem?.nome}
        color="violet"
        reportName="Ficha_Individual"
        turmaName={turma?.nome || ""}
        items={singleReportItem ? [{
          id: singleReportItem.id,
          label: singleReportItem.nome,
          subtitle: singleReportItem.status || 'ativo',
          avatarInitial: singleReportItem.nome?.charAt(0),
          data: singleReportItem,
        }] : []}
        renderTemplate={(catData) => <Templates.CatequizandoIndividualSheet doc={catData} org={org} turma={turma} />}
      />
    </div>
  );
}
