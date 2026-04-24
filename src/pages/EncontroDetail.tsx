import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTurmas, useEncontros, useCatequizandos, useEncontroMutation, useDeleteEncontro, useOcorrencias, useOcorrenciaMutation } from "@/hooks/useSupabaseData";
import { type EncontroStatus, type RegistroOcorrencia, type AvaliacaoEncontro } from "@/lib/store";
import { ArrowLeft, Edit, Trash2, Users, Play, Clock, User, BookOpen, CalendarDays, FileText, CheckCircle2, AlertCircle, Sparkles, MessageSquare, ChevronRight, FileSignature, Check, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { cn, formatarDataVigente } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS: { value: EncontroStatus; label: string; bg: string; text: string; border: string; activeClasses: string; }[] = [
  { value: "pendente", label: "Pendente", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", activeClasses: "border-slate-500 bg-slate-200 shadow-md ring-2 ring-slate-400/40 ring-offset-2 opacity-100" },
  { value: "realizado", label: "Realizado", bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", activeClasses: "border-emerald-500 bg-emerald-200 shadow-md ring-2 ring-emerald-400/40 ring-offset-2 opacity-100" },
  { value: "transferido", label: "Transferido", bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200", activeClasses: "border-orange-500 bg-orange-200 shadow-md ring-2 ring-orange-400/40 ring-offset-2 opacity-100" },
  { value: "cancelado", label: "Cancelado", bg: "bg-red-100", text: "text-red-700", border: "border-red-200", activeClasses: "border-red-500 bg-red-200 shadow-md ring-2 ring-red-400/40 ring-offset-2 opacity-100" },
];

export default function EncontroDetail() {
  const { id, encontroId } = useParams();
  const navigate = useNavigate();
  const { data: turmas = [] } = useTurmas();
  const { data: allEncontros = [] } = useEncontros(id);
  const { data: catequizandos = [] } = useCatequizandos(id);
  const { data: ocorrencias = [] } = useOcorrencias(id);
  const encontroMut = useEncontroMutation();
  const deleteMut = useDeleteEncontro();
  const ocorrenciaMut = useOcorrenciaMutation();

  const turma = turmas.find((t) => t.id === id);
  const encontro = allEncontros.find((e) => e.id === encontroId);

  const [showStatus, setShowStatus] = useState(false);
  const [showPresenca, setShowPresenca] = useState(false);
  const [showTransferCalendar, setShowTransferCalendar] = useState(false);
  const [showCancelMotivo, setShowCancelMotivo] = useState(false);
  const [showDeleteMotivo, setShowDeleteMotivo] = useState(false);
  const [motivoText, setMotivoText] = useState("");
  const [showConflict, setShowConflict] = useState(false);
  const [conflictEncontro, setConflictEncontro] = useState<any>(null);
  const [selectedTransferDate, setSelectedTransferDate] = useState<Date | undefined>();
  const [showOcorrencias, setShowOcorrencias] = useState(false);
  const [searchParams] = useSearchParams();
  const [draftAvaliacao, setDraftAvaliacao] = useState<AvaliacaoEncontro | null>(null);
  const [localPresencas, setLocalPresencas] = useState<string[]>([]);
  const [localJustificativas, setLocalJustificativas] = useState<Record<string, any>>({});

  useEffect(() => {
    if (encontro) {
      setLocalPresencas(encontro.presencas || []);
      setLocalJustificativas(encontro.justificativas || {});
    }
  }, [encontro?.id]); // Apenas inicializa quando o ID do encontro muda

  useEffect(() => {
    if (searchParams.get('eval') === 'true') {
      setShowOcorrencias(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (showOcorrencias && encontro?.avaliacao) {
      setDraftAvaliacao(encontro.avaliacao);
    } else if (showOcorrencias && !encontro?.avaliacao) {
      setDraftAvaliacao({ atividadesRealizadas: 'nulo', pontosPositivos: '', pontosMelhorar: '', conclusao: '' });
    }
  }, [showOcorrencias, encontro?.avaliacao]);

  if (!encontro) {
    return <div className="text-center py-20"><p className="text-muted-foreground">Encontro não encontrado</p><button onClick={() => navigate(-1)} className="text-primary text-sm mt-2 font-semibold">Voltar</button></div>;
  }

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === encontro.status)!;
  const encontroDates = allEncontros.filter(e => e.id !== encontro.id && e.status !== 'cancelado').map(e => new Date(e.data));

  const handleStatusClick = (status: EncontroStatus) => {
    if (status === 'transferido') { setShowStatus(false); setShowTransferCalendar(true); }
    else if (status === 'cancelado') { setShowStatus(false); setMotivoText(""); setShowCancelMotivo(true); }
    else { encontroMut.mutate({ ...encontro, status }); setShowStatus(false); toast.success(`Status alterado`); }
  };

  const handleTransferDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedTransferDate(date);
    const dateStr = date.toISOString().split('T')[0];
    const conflict = allEncontros.find(e => e.id !== encontro.id && e.data === dateStr && e.status !== 'cancelado');
    if (conflict) { setConflictEncontro(conflict); setShowConflict(true); }
    else { finishTransfer(dateStr); }
  };

  const finishTransfer = (dateStr: string) => {
    encontroMut.mutate({ ...encontro, status: 'transferido' as EncontroStatus, dataTransferida: dateStr });
    setShowTransferCalendar(false); setShowConflict(false);
    toast.success(`Encontro transferido`);
  };

  const handleConflictAction = (action: 'remanejar' | 'cancelar') => {
    if (!selectedTransferDate || !conflictEncontro) return;
    const dateStr = selectedTransferDate.toISOString().split('T')[0];
    if (action === 'cancelar') {
      encontroMut.mutate({ ...conflictEncontro, status: 'cancelado' as EncontroStatus, motivoCancelamento: 'Cancelado por transferência' });
      ocorrenciaMut.mutate({ id: crypto.randomUUID(), encontroId: conflictEncontro.id, turmaId: id!, tipo: 'cancelamento', motivo: 'Cancelado por transferência', data: new Date().toISOString(), temaNome: conflictEncontro.tema });
    } else { encontroMut.mutate({ ...conflictEncontro, data: encontro.data }); }
    finishTransfer(dateStr);
  };

  const handleCancelConfirm = () => {
    if (!motivoText.trim()) { toast.error("Informe o motivo"); return; }
    encontroMut.mutate({ ...encontro, status: 'cancelado' as EncontroStatus, motivoCancelamento: motivoText });
    ocorrenciaMut.mutate({ id: crypto.randomUUID(), encontroId: encontro.id, turmaId: id!, tipo: 'cancelamento', motivo: motivoText, data: new Date().toISOString(), temaNome: encontro.tema });
    setShowCancelMotivo(false); toast.success("Encontro cancelado");
  };

  const handleDelete = async () => {
    if (!motivoText.trim()) { toast.error("Informe o motivo"); return; }
    ocorrenciaMut.mutate({ id: crypto.randomUUID(), encontroId: encontro.id, turmaId: id!, tipo: 'exclusao', motivo: motivoText, data: new Date().toISOString(), temaNome: encontro.tema });
    await deleteMut.mutateAsync(encontro.id);
    toast.success("Encontro excluído"); navigate(`/turmas/${id}/encontros`);
  };

  const togglePresenca = (catId: string) => {
    if (!encontro) return;
    const isPresent = localPresencas.includes(catId);
    let newPresencas = [];
    if (isPresent) {
      newPresencas = localPresencas.filter((p) => p !== catId);
    } else {
      newPresencas = [...localPresencas, catId];
    }
    
    // Clear justificativa se ficou presente
    const newJust = { ...localJustificativas };
    if (!isPresent && newJust[catId]) {
      delete newJust[catId];
    }

    setLocalPresencas(newPresencas);
    setLocalJustificativas(newJust);
    encontroMut.mutate({ ...encontro, presencas: newPresencas, justificativas: newJust });
  };

  const setJustificativa = (catId: string, motivo: any) => {
    if (!encontro) return;
    const currentJust = { ...localJustificativas };
    if (motivo === null) {
      delete currentJust[catId];
    } else {
      currentJust[catId] = motivo;
    }
    
    // Se justificou, garante que não está na presença
    const newPresencas = localPresencas.filter(p => p !== catId);
    
    setLocalJustificativas(currentJust);
    setLocalPresencas(newPresencas);
    encontroMut.mutate({ ...encontro, presencas: newPresencas, justificativas: currentJust });
  };

  const tempoTotal = encontro.roteiro.reduce((acc, s) => acc + s.tempo, 0);

  return (
    <div className="space-y-4 pb-6">
      <div className="page-header animate-fade-in items-center py-4 flex-row gap-3">
        <div className="flex items-center flex-1 min-w-0 gap-3">
          <button onClick={() => navigate(`/turmas/${id}/encontros`)} className="back-btn shrink-0 hover:bg-muted/50"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{encontro.tema}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{turma?.nome}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => navigate(`/turmas/${id}/encontros/${encontroId}/editar`)} className="w-10 h-10 rounded-[14px] bg-primary/10 border-2 border-primary/20 flex items-center justify-center hover:bg-primary/20 transition-all hover:scale-105 active:scale-95 group">
            <Pencil className="h-4.5 w-4.5 text-primary group-hover:rotate-12 transition-transform" />
          </button>
          <button onClick={() => { setMotivoText(""); setShowDeleteMotivo(true); }} className="w-10 h-10 rounded-[14px] bg-destructive/10 border-2 border-destructive/20 flex items-center justify-center hover:bg-destructive/20 transition-all hover:scale-105 active:scale-95 group">
            <Trash2 className="h-4.5 w-4.5 text-destructive group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 animate-float-up px-4">
        {/* Status */}
        <button onClick={() => setShowStatus(true)} className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl border-2 hover:border-black/10 transition-all hover:scale-[1.02] active:scale-[0.98] bg-white shadow-sm group ${currentStatus.border}`}>
           <div className={`w-9 h-9 rounded-[12px] mb-1.5 flex items-center justify-center ${currentStatus.bg} border ${currentStatus.border} group-hover:shadow-md transition-all`}>
              {currentStatus.value === 'pendente' && <Clock className={`h-4 w-4 ${currentStatus.text}`} />}
              {currentStatus.value === 'realizado' && <CheckCircle2 className={`h-4 w-4 ${currentStatus.text}`} />}
              {currentStatus.value === 'transferido' && <CalendarDays className={`h-4 w-4 ${currentStatus.text}`} />}
              {currentStatus.value === 'cancelado' && <AlertCircle className={`h-4 w-4 ${currentStatus.text}`} />}
           </div>
           <span className={`text-[9px] font-black uppercase tracking-widest ${currentStatus.text}`}>{currentStatus.label} ▾</span>
        </button>
        
        {/* Presença */}
        <button onClick={() => setShowPresenca(true)} className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl border-2 border-black/5 bg-white shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all group">
           <div className="w-9 h-9 flex items-center justify-center bg-emerald-500/10 rounded-[12px] mb-1.5 border border-emerald-500/20 group-hover:shadow-md transition-all">
             <Users className="h-4 w-4 text-emerald-600" />
           </div>
           <span className="text-[9px] font-black uppercase tracking-widest text-foreground">Presença</span>
        </button>

        {/* Apresentar */}
        <button onClick={() => navigate(`/turmas/${id}/encontros/${encontroId}/apresentacao`)} className="flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl border-2 border-black/5 bg-white shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all group">
           <div className="w-9 h-9 flex items-center justify-center bg-liturgical/10 rounded-[12px] mb-1.5 border border-liturgical/20 group-hover:shadow-md transition-all">
             <Play className="h-4 w-4 text-liturgical" />
           </div>
           <span className="text-[9px] font-black uppercase tracking-widest text-foreground">Apresentar</span>
        </button>
      </div>

      {/* Card de informações gerais */}
      <div className="float-card overflow-hidden animate-float-up" style={{ animationDelay: '60ms' }}>
        {/* Header do card */}
        <div className="px-5 py-3 bg-gradient-to-r from-primary/8 to-primary/3 border-b border-black/5 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <p className="text-xs font-black text-primary uppercase tracking-widest">Detalhes do Encontro</p>
        </div>
        <div className="divide-y divide-black/5">
          {/* Data */}
          <div className="flex items-center px-5 py-3 gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
              <CalendarDays className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Data</p>
              <p className="text-sm font-semibold text-foreground capitalize">{formatarDataVigente(encontro.data, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          {/* Transferido */}
          {encontro.dataTransferida && (
            <div className="flex items-center px-5 py-3 gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <CalendarDays className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Transferido para</p>
                <p className="text-sm font-semibold text-amber-600 capitalize">{formatarDataVigente(encontro.dataTransferida, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          )}
          {/* Leitura Bíblica */}
          {encontro.leituraBiblica && (
            <div className="flex items-center px-5 py-3 gap-3">
              <div className="w-8 h-8 rounded-xl bg-liturgical/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-4 w-4 text-liturgical" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Leitura Bíblica</p>
                <p className="text-sm font-semibold text-foreground">{encontro.leituraBiblica}</p>
              </div>
            </div>
          )}
          {/* Tempo e Presenças */}
          <div className="grid grid-cols-2 divide-x divide-black/5">
            <div className="flex items-center px-5 py-3 gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-sky-600" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Duração</p>
                <p className="text-sm font-bold text-foreground">{tempoTotal} min</p>
              </div>
            </div>
            <div className="flex items-center px-5 py-3 gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Presenças</p>
                <p className="text-sm font-bold text-foreground">{encontro.presencas.length}/{catequizandos.length}</p>
              </div>
            </div>
          </div>
          {/* Motivo cancelamento */}
          {encontro.motivoCancelamento && (
            <div className="flex items-center px-5 py-3 gap-3 bg-destructive/5">
              <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-black text-destructive">!</span>
              </div>
              <div>
                <p className="text-[10px] font-black text-destructive uppercase tracking-widest">Motivo do Cancelamento</p>
                <p className="text-sm font-semibold text-destructive">{encontro.motivoCancelamento}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {encontro.materialApoio && (
        <div className="float-card p-5 animate-float-up" style={{ animationDelay: '120ms' }}>
          <p className="text-sm font-black text-blue-600 uppercase tracking-[0.2em] mb-3 text-center">Material de Apoio</p>
          <p className="text-sm text-foreground whitespace-pre-wrap text-left bg-blue-50/20 p-4 rounded-xl border border-blue-100/50 leading-relaxed">{encontro.materialApoio}</p>
        </div>
      )}

      {/* Roteiro */}
      <div className="animate-float-up mt-8" style={{ animationDelay: '180ms' }}>
        {/* Cabeçalho da seção */}
        <div className="flex flex-col items-center mb-6">
          <h2 className="text-lg font-black text-black/80 uppercase tracking-widest text-center">Roteiro do Encontro</h2>
          <div className="h-0.5 w-10 bg-primary/40 rounded-full mt-2 mb-3" />
          <span className="text-[10px] font-bold text-muted-foreground bg-muted/30 px-3 py-1 rounded-full uppercase tracking-tighter">
            {encontro.roteiro.length} tópico{encontro.roteiro.length !== 1 ? 's' : ''} • {tempoTotal}min
          </span>
        </div>

        {/* Linha de tempo do roteiro */}
        <div className="relative">
          {/* Linha vertical conectora */}
          <div className="absolute left-[27px] top-4 bottom-4 w-px bg-gradient-to-b from-primary/30 via-primary/15 to-transparent" />

          <div className="space-y-2">
            {encontro.roteiro.map((step, i) => (
              <div key={step.id} className="relative float-card overflow-hidden">
                {/* Faixa lateral com número */}
                <div className="flex items-stretch">
                  {/* Índice */}
                  <div className="flex flex-col items-center justify-start pt-3.5 px-3 relative z-10">
                    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-black flex items-center justify-center shadow-sm shadow-primary/30 shrink-0">
                      {i + 1}
                    </span>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0 py-3 pr-4">
                    {/* Linha principal: tópico + badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-sm font-bold text-foreground leading-snug">{step.label}</span>
                      {step.oracaoTipo && (
                        <span className="text-[9px] font-black uppercase tracking-widest bg-liturgical/10 text-liturgical px-1.5 py-0.5 rounded-full border border-liturgical/15">
                          {step.oracaoTipo}
                        </span>
                      )}
                    </div>

                    {/* Meta-linha: tempo e catequista */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {step.tempo > 0 && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-sky-600 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/15">
                          <Clock className="h-3 w-3" />{step.tempo} min
                        </span>
                      )}
                      {step.catequista && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-lg border border-black/8">
                          <User className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[150px]">{step.catequista}</span>
                        </span>
                      )}
                    </div>

                    {/* Conteúdo/detalhes */}
                    {step.conteudo && (
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed border-l-2 border-primary/20 pl-2.5 whitespace-pre-wrap">
                        {step.conteudo}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button onClick={() => setShowOcorrencias(true)} className="float-card w-full px-4 py-4 flex items-center justify-between group animate-float-up" style={{ animationDelay: '240ms' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-liturgical/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-liturgical" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">Avaliação do Encontro</p>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
              {encontro.avaliacao ? 'Concluída ✓' : 'Pendente'}
            </p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <Edit className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
        </div>
      </button>

      {/* Avaliação do Encontro Dialog */}
      <Dialog open={showOcorrencias} onOpenChange={setShowOcorrencias}>
        <DialogContent className="rounded-3xl border-gold/40 max-w-lg w-[95vw] max-h-[95vh] p-0 overflow-hidden shadow-2xl flex flex-col">
          {/* Header Fixo */}
          <div className="bg-gradient-to-br from-primary/10 via-gold/5 to-white p-6 border-b-2 border-gold/30 relative shrink-0">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary/40 via-gold to-primary/40" />
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-gold/20 text-gold flex items-center justify-center shadow-inner border border-gold/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gold-700 uppercase tracking-[0.2em] leading-none">Memorial do Encontro</p>
                <DialogTitle className="text-xl font-black text-foreground mt-1">Feedback & Avaliação</DialogTitle>
              </div>
            </div>
          </div>

          {/* Área de Conteúdo Rollável */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
            {/* Opção de Atividades */}
            <div className="space-y-4">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse border-2 border-primary/20" />
                As atividades planejadas foram realizadas?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'sim', label: 'Sim', icon: '✅', color: 'border-emerald-500/80 text-emerald-900 bg-emerald-50 shadow-emerald-500/10' },
                  { id: 'nulo', label: 'Parcial', icon: '➖', color: 'border-amber-500/80 text-amber-900 bg-amber-50 shadow-amber-500/10' },
                  { id: 'nao', label: 'Não', icon: '❌', color: 'border-destructive/80 text-destructive bg-destructive/5 shadow-destructive/10' }
                ].map(op => (
                  <button
                    key={op.id}
                    onClick={() => setDraftAvaliacao(prev => prev ? { ...prev, atividadesRealizadas: op.id as any } : null)}
                    className={cn(
                      "flex flex-col items-center justify-center py-4 rounded-2xl text-xs font-black transition-all border-2 gap-1.5",
                      draftAvaliacao?.atividadesRealizadas === op.id
                        ? `${op.color.split(' ')[0]} ${op.color.split(' ')[1]} ${op.color.split(' ')[2]} shadow-lg scale-[1.02]`
                        : "bg-muted/10 border-muted/30 text-muted-foreground hover:bg-muted/20"
                    )}
                  >
                    <span className="text-2xl">{op.icon}</span>
                    {op.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Campos de Texto */}
            {[
              { id: 'pontosPositivos', label: 'Quais foram os pontos positivos?', icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />, placeholder: "Ex: Participação ativa, compreensão do tema..." },
              { id: 'pontosMelhorar', label: 'O que pode ser melhorado?', icon: <AlertCircle className="h-5 w-5 text-amber-600" />, placeholder: "Ex: Controle do tempo, materiais extras..." },
              { id: 'conclusao', label: 'Conclusão Geral / Ocorrências', icon: <MessageSquare className="h-5 w-5 text-primary" />, placeholder: "Resumo final do encontro..." }
            ].map(field => (
              <div key={field.id} className="space-y-3 group">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 transition-colors group-focus-within:text-gold-700">
                  {field.icon}
                  {field.label}
                </label>
                <textarea
                  value={draftAvaliacao?.[field.id as keyof AvaliacaoEncontro] || ''}
                  onChange={(e) => setDraftAvaliacao(prev => prev ? { ...prev, [field.id]: e.target.value } : null)}
                  placeholder={field.placeholder}
                  className="w-full min-h-[140px] rounded-2xl border-2 border-gold/50 shadow-md bg-white p-5 text-lg sm:text-xl text-foreground placeholder:text-muted-foreground/30 focus:border-gold-600 focus:ring-4 focus:ring-gold/5 focus:shadow-2xl transition-all outline-none resize-none leading-relaxed"
                />
              </div>
            ))}
          </div>

          {/* Footer Fixo */}
          <div className="p-6 bg-white border-t-2 border-gold/30 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowOcorrencias(false)}
                className="flex-1 rounded-2xl font-black uppercase text-xs tracking-widest text-muted-foreground h-14"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!draftAvaliacao) return;
                  const newStatus = encontro.status === 'pendente' ? 'realizado' : encontro.status;
                  encontroMut.mutate({ 
                    ...encontro, 
                    status: newStatus as EncontroStatus,
                    avaliacao: draftAvaliacao 
                  });
                  setShowOcorrencias(false);
                  toast.success("Avaliação eternizada com sucesso!");
                }}
                className="flex-[2] rounded-2xl bg-primary hover:bg-primary/90 px-8 h-14 font-black uppercase tracking-tighter text-sm shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all text-white"
              >
                Salvar Avaliação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Status Modal Modernizado */}
      <Dialog open={showStatus} onOpenChange={setShowStatus}>
        <DialogContent className="rounded-3xl border-gold/40 p-0 overflow-hidden shadow-2xl max-w-sm">
          <div className="bg-gradient-to-b from-muted/50 to-background p-6 border-b border-black/5">
            <DialogTitle className="text-lg font-black uppercase tracking-tight">Status do Encontro</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">Selecione o estado atual deste momento.</p>
          </div>
          <div className="p-4 grid grid-cols-1 gap-2.5">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleStatusClick(opt.value)}
                disabled={encontro.status === opt.value}
                className={cn(
                  "relative group flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-[0.98]",
                  opt.text,
                  encontro.status === opt.value 
                    ? opt.activeClasses
                    : `${opt.bg} ${opt.border} hover:border-current/30 hover:brightness-95 cursor-pointer opacity-80 hover:opacity-100`
                )}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2", 
                   encontro.status === opt.value ? "border-current/40 bg-white/40" : "border-current/10 bg-white/50"
                )}>
                  {opt.value === 'pendente' && <Clock className="h-5 w-5" />}
                  {opt.value === 'realizado' && <CheckCircle2 className="h-5 w-5" />}
                  {opt.value === 'transferido' && <CalendarDays className="h-5 w-5" />}
                  {opt.value === 'cancelado' && <AlertCircle className="h-5 w-5" />}
                </div>
                <div className="text-left">
                  <p className="font-black text-sm uppercase tracking-wider">{opt.label}</p>
                  <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">
                    {encontro.status === opt.value ? 'Status Atual' : 'Alterar para este'}
                  </p>
                </div>
                {encontro.status !== opt.value && (
                  <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                )}
                {encontro.status === opt.value && (
                  <div className="absolute right-4">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Calendar Modal */}
      <Dialog open={showTransferCalendar} onOpenChange={setShowTransferCalendar}>
        <DialogContent className="rounded-2xl border-border/30">
          <DialogTitle>Escolher Nova Data</DialogTitle>
          <div className="flex justify-center p-4">
            <Calendar
              mode="single"
              selected={selectedTransferDate}
              onSelect={handleTransferDateSelect}
              className="rounded-xl border"
              disabled={(date) => {
                const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
                const isTaken = encontroDates.some(d => d.toISOString().split('T')[0] === date.toISOString().split('T')[0]);
                return isPast || isTaken;
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Conflict Modal */}
      <Dialog open={showConflict} onOpenChange={setShowConflict}>
        <DialogContent className="rounded-2xl border-border/30">
          <DialogTitle className="text-caution">Conflito de Data</DialogTitle>
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Já existe um encontro agendado para esta data: <strong>{conflictEncontro?.tema}</strong>.
            </p>
            <p className="text-xs text-muted-foreground">O que deseja fazer com o encontro existente?</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => handleConflictAction('remanejar')} className="action-btn">
                Mover para {formatarDataVigente(encontro.data)}
              </button>
              <button onClick={() => handleConflictAction('cancelar')} className="w-full py-3 rounded-xl border border-destructive/20 text-destructive font-bold text-sm hover:bg-destructive/10 transition-colors">
                Cancelar encontro existente
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel/Delete Motivo Modal */}
      <Dialog open={showCancelMotivo || showDeleteMotivo} onOpenChange={(o) => { if(!o){ setShowCancelMotivo(false); setShowDeleteMotivo(false); } }}>
        <DialogContent className="rounded-2xl border-border/30">
          <DialogTitle>{showCancelMotivo ? 'Motivo do Cancelamento' : 'Motivo da Exclusão'}</DialogTitle>
          <div className="space-y-4 mt-2">
            <p className="text-xs text-muted-foreground">
              Por favor, informe o motivo para registrar na aba de Ocorrências da turma.
            </p>
            <textarea
              className="w-full min-h-[100px] rounded-xl border-2 border-muted/50 bg-background p-3 text-sm resize-none focus:border-primary/50 outline-none transition-colors"
              placeholder="Ex: Falta de energia, catequista doente..."
              value={motivoText}
              onChange={(e) => setMotivoText(e.target.value)}
            />
            <button
              onClick={showCancelMotivo ? handleCancelConfirm : handleDelete}
              className="w-full action-btn bg-destructive hover:bg-destructive/90 text-destructive-foreground border-transparent"
            >
              Confirmar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Presence Manager Modal */}
      <Dialog open={showPresenca} onOpenChange={setShowPresenca}>
        <DialogContent className="rounded-2xl border-border/30 max-h-[85vh] flex flex-col">
          <div className="shrink-0 mb-4">
            <DialogTitle>Chamada do Encontro</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">{localPresencas.length} de {catequizandos.length} alunos presentes</p>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {catequizandos.map(cat => {
              const present = localPresencas.includes(cat.id);
              const justification = localJustificativas[cat.id];

              return (
                <div key={cat.id} className="flex gap-2">
                  {/* Botão de Justificar (Agora na Esquerda) */}
                  {!present && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className={cn(
                          "w-16 shrink-0 rounded-xl border-[2.5px] flex flex-col items-center justify-center transition-all px-1 space-y-1 cursor-pointer shadow-sm active:scale-90",
                          justification 
                            ? "bg-amber-100 border-amber-600 text-amber-600 ring-2 ring-amber-500/20" 
                            : "border-muted/30 text-muted-foreground hover:bg-muted/10 hover:border-muted-foreground/40 bg-white"
                        )}>
                          <span className={cn(
                            "text-[8.5px] font-black uppercase tracking-tighter leading-none text-center", 
                            justification ? "text-amber-800": "opacity-60"
                          )}>Justificar</span>
                          <FileSignature className={cn("w-5 h-5", justification ? "text-amber-600" : "text-muted-foreground/40")} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[260px] rounded-xl p-2 shadow-2xl border-muted/50 bg-white z-[100]">
                        <DropdownMenuLabel className="text-[10px] uppercase font-black text-muted-foreground tracking-widest px-2 py-1.5">Justificar Falta</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {[
                          'Problema de saúde',
                          'Motivos familiares ou pessoais',
                          'Compromissos',
                          'Conflitos com agenda escolar',
                          'Força maior',
                          'Outros'
                        ].map(motivo => (
                          <DropdownMenuItem 
                            key={motivo} 
                            onClick={() => setJustificativa(cat.id, motivo)}
                            className={cn("text-xs font-bold py-2.5 px-3 rounded-lg cursor-pointer flex items-center my-0.5", justification === motivo ? "bg-amber-100 text-amber-800 hover:bg-amber-200 focus:bg-amber-200" : "hover:bg-muted/50")}
                          >
                             {motivo} {justification === motivo && <Check className="w-3.5 h-3.5 ml-auto text-amber-600" />}
                          </DropdownMenuItem>
                        ))}
                        {justification && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setJustificativa(cat.id, null)} className="text-xs font-bold py-2.5 px-3 rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 my-0.5">
                              Remover Justificativa
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  
                  {/* Card de Presença */}
                  <button
                    onClick={() => togglePresenca(cat.id)}
                    className={cn(
                      "flex-1 flex items-center justify-between p-3 rounded-xl border-[2.5px] transition-all relative overflow-hidden active:scale-[0.98]",
                      present 
                        ? "border-emerald-600 bg-emerald-50 shadow-sm" 
                        : (justification 
                            ? "border-amber-600 bg-amber-50 shadow-sm" 
                            : "border-muted/30 bg-muted/5 hover:border-muted/40 bg-white")
                    )}
                  >
                    {/* Background indicator for justified */}
                    {!present && justification && (
                      <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full -mr-8 -mt-8" />
                    )}
                    
                    <div className="text-left relative z-10">
                      <p className={cn(
                        "text-sm font-black tracking-tight",
                        present ? "text-emerald-800" : (justification ? "text-amber-800" : "text-muted-foreground")
                      )}>{cat.nome}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                         {!present && justification && (
                           <div className="flex items-center gap-1 bg-amber-600 px-2 py-0.5 rounded-full shadow-sm ring-1 ring-white/20">
                             <FileSignature className="w-2.5 h-2.5 text-white" />
                             <span className="text-[8.5px] text-white font-black tracking-widest uppercase">{justification}</span>
                           </div>
                         )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center gap-1.5 relative z-10">
                      <span className={cn(
                        "text-[8.5px] font-black uppercase tracking-tighter leading-none mb-0.5 min-h-[10px]",
                        present ? 'text-emerald-600' : (justification ? 'text-amber-600' : 'opacity-0 select-none')
                      )}>
                        {present ? 'Presença' : (justification ? 'Justificado' : '-')}
                      </span>
                      <div className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all shrink-0 shadow-md",
                        present 
                          ? "bg-emerald-600 border-white scale-110 shadow-emerald-200" 
                          : (justification 
                              ? "bg-amber-600 border-white scale-110 shadow-amber-200" 
                              : "bg-white border-muted-foreground/30")
                      )}>
                        {present && <Users className="h-5 w-5 text-white" />}
                        {!present && justification && <Check className="h-5 w-5 text-white font-black" />}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
          <div className="shrink-0 pt-4 mt-2 border-t border-border/10">
            <button onClick={() => setShowPresenca(false)} className="w-full action-btn bg-primary text-white font-black uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
              Concluído
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
