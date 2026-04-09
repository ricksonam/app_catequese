import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useCatequizandos, useEncontroMutation, useDeleteEncontro, useOcorrencias, useOcorrenciaMutation } from "@/hooks/useSupabaseData";
import { type EncontroStatus, type RegistroOcorrencia } from "@/lib/store";
import { ArrowLeft, Edit, Trash2, Users, Play, Clock, User, BookOpen, CalendarDays, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { cn, formatarDataVigente } from "@/lib/utils";

const STATUS_OPTIONS: { value: EncontroStatus; label: string; color: string }[] = [
  { value: "pendente", label: "Pendente", color: "bg-muted text-muted-foreground" },
  { value: "realizado", label: "Realizado", color: "bg-success text-success-foreground" },
  { value: "transferido", label: "Transferido", color: "bg-caution text-caution-foreground" },
  { value: "cancelado", label: "Cancelado", color: "bg-destructive text-destructive-foreground" },
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
    const presencas = encontro.presencas.includes(catId) ? encontro.presencas.filter((p) => p !== catId) : [...encontro.presencas, catId];
    encontroMut.mutate({ ...encontro, presencas });
  };

  const tempoTotal = encontro.roteiro.reduce((acc, s) => acc + s.tempo, 0);

  return (
    <div className="space-y-5 pb-6">
      <div className="page-header animate-fade-in">
        <button onClick={() => navigate(`/turmas/${id}/encontros`)} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground truncate">{encontro.tema}</h1>
          <p className="text-xs text-muted-foreground">{turma?.nome}</p>
        </div>
        <button onClick={() => { setMotivoText(""); setShowDeleteMotivo(true); }} className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center"><Trash2 className="h-4 w-4 text-destructive" /></button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-float-up">
        <button onClick={() => setShowStatus(true)} className={`pill-btn ${currentStatus.color} justify-center`}>{currentStatus.label} ▾</button>
        <button onClick={() => navigate(`/turmas/${id}/encontros/${encontroId}/editar`)} className="pill-btn bg-primary/10 text-primary flex items-center justify-center gap-1"><Edit className="h-3.5 w-3.5" /> Editar</button>
        <button onClick={() => setShowPresenca(true)} className="pill-btn bg-success/10 text-success flex items-center justify-center gap-1"><Users className="h-3.5 w-3.5" /> Presença</button>
        <button onClick={() => navigate(`/turmas/${id}/encontros/${encontroId}/apresentacao`)} className="pill-btn bg-liturgical/10 text-liturgical flex items-center justify-center gap-1"><Play className="h-3.5 w-3.5" /> Apresentar</button>
      </div>

      <div className="float-card p-5 space-y-3 animate-float-up" style={{ animationDelay: '60ms' }}>
        <div className="space-y-0.5"><p className="text-xs text-muted-foreground">Data</p><p className="text-sm font-semibold text-foreground">{formatarDataVigente(encontro.data, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p></div>
        {encontro.dataTransferida && <div className="space-y-0.5"><p className="text-xs text-muted-foreground">Transferido para</p><p className="text-sm font-semibold text-caution flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatarDataVigente(encontro.dataTransferida, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p></div>}
        {encontro.leituraBiblica && <div className="space-y-0.5"><p className="text-xs text-muted-foreground">Leitura Bíblica</p><p className="text-sm font-semibold text-foreground flex items-center gap-1"><BookOpen className="h-3.5 w-3.5 text-primary" /> {encontro.leituraBiblica}</p></div>}
        <div className="space-y-0.5"><p className="text-xs text-muted-foreground">Tempo Total</p><p className="text-sm font-semibold text-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-primary" /> {tempoTotal} min</p></div>
        <div className="space-y-0.5"><p className="text-xs text-muted-foreground">Presenças</p><p className="text-sm font-semibold text-foreground">{encontro.presencas.length}/{catequizandos.length}</p></div>
        {encontro.motivoCancelamento && <div className="space-y-0.5"><p className="text-xs text-muted-foreground">Motivo do Cancelamento</p><p className="text-sm font-semibold text-destructive">{encontro.motivoCancelamento}</p></div>}
      </div>

      {encontro.materialApoio && <div className="float-card p-5 animate-float-up" style={{ animationDelay: '120ms' }}><p className="section-title mb-2">Material de Apoio</p><p className="text-sm text-foreground whitespace-pre-wrap">{encontro.materialApoio}</p></div>}

      <div className="animate-float-up" style={{ animationDelay: '180ms' }}>
        <p className="section-title">Roteiro do Encontro</p>
        <div className="space-y-2">
          {encontro.roteiro.map((step, i) => (
            <div key={step.id} className="float-card px-4 py-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="text-sm font-semibold text-foreground">{step.label}</span>
                  {step.oracaoTipo && <span className="pill-btn bg-liturgical/10 text-liturgical text-[10px]">{step.oracaoTipo}</span>}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  {step.tempo > 0 && <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{step.tempo}min</span>}
                  {step.catequista && <span className="flex items-center gap-0.5"><User className="h-3 w-3" />{step.catequista}</span>}
                </div>
              </div>
              {step.conteudo && <p className="text-xs text-muted-foreground mt-2 ml-9 whitespace-pre-wrap">{step.conteudo}</p>}
            </div>
          ))}
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
        <DialogContent className="rounded-2xl border-border/30 max-h-[90vh] overflow-y-auto p-0 overflow-hidden">
          <div className="bg-liturgical/5 p-6 border-b border-liturgical/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 rounded-lg bg-liturgical/20 text-liturgical flex items-center justify-center">✝</span>
              <p className="text-[10px] font-black text-liturgical uppercase tracking-[0.2em]">Ficha de Avaliação</p>
            </div>
            <DialogTitle className="text-xl font-black text-foreground">Como foi o encontro?</DialogTitle>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                As atividades planejadas foram realizadas?
              </label>
              <div className="flex gap-2">
                {(['sim', 'nao', 'nulo'] as const).map(op => (
                  <button
                    key={op}
                    onClick={() => {
                      const aval = encontro.avaliacao || { atividadesRealizadas: 'nulo', pontosPositivos: '', pontosMelhorar: '', conclusao: '' };
                      encontroMut.mutate({ ...encontro, avaliacao: { ...aval, atividadesRealizadas: op } });
                    }}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-xs font-bold transition-all border-2",
                      (encontro.avaliacao?.atividadesRealizadas || 'nulo') === op
                        ? "bg-primary/10 border-primary text-primary shadow-sm"
                        : "bg-muted/30 border-transparent text-muted-foreground"
                    )}
                  >
                    {op === 'sim' ? '✅ Sim' : op === 'nao' ? '❌ Não' : '➖ Parcial'}
                  </button>
                ))}
              </div>
            </div>

            {[
              { id: 'pontosPositivos', label: 'Quais foram os pontos positivos?', icon: '✨' },
              { id: 'pontosMelhorar', label: 'Quais pontos podem ser melhorados?', icon: '💡' },
              { id: 'conclusao', label: 'Conclusão Geral', icon: '📝' }
            ].map(field => (
              <div key={field.id} className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <span className="text-sm">{field.icon}</span>
                  {field.label}
                </label>
                <textarea
                  value={encontro.avaliacao?.[field.id as keyof AvaliacaoEncontro] || ''}
                  onChange={(e) => {
                    const aval = encontro.avaliacao || { atividadesRealizadas: 'nulo', pontosPositivos: '', pontosMelhorar: '', conclusao: '' };
                    encontroMut.mutate({ ...encontro, avaliacao: { ...aval, [field.id]: e.target.value } });
                  }}
                  placeholder="Escreva aqui..."
                  className="w-full min-h-[80px] rounded-2xl border-2 border-muted/30 bg-muted/10 p-4 text-sm text-foreground focus:border-primary/30 focus:bg-background transition-all outline-none resize-none"
                />
              </div>
            ))}
            
            <button 
              onClick={() => setShowOcorrencias(false)}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-[0.1em] shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
            >
              Salvar Avaliação
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
