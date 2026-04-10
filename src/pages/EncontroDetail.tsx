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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-float-up">
        <button onClick={() => setShowStatus(true)} className={`pill-btn ${currentStatus.color} justify-center`}>{currentStatus.label} ▾</button>
        <button onClick={() => navigate(`/turmas/${id}/encontros/${encontroId}/editar`)} className="pill-btn bg-primary/10 text-primary flex items-center justify-center gap-1"><Edit className="h-3.5 w-3.5" /> Editar</button>
        <button onClick={() => setShowPresenca(true)} className="pill-btn bg-success/10 text-success flex items-center justify-center gap-1"><Users className="h-3.5 w-3.5" /> Presença</button>
        <button onClick={() => navigate(`/turmas/${id}/encontros/${encontroId}/apresentacao`)} className="pill-btn bg-liturgical/10 text-liturgical flex items-center justify-center gap-1"><Play className="h-3.5 w-3.5" /> Apresentar</button>
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

      {encontro.materialApoio && <div className="float-card p-5 animate-float-up" style={{ animationDelay: '120ms' }}><p className="section-title mb-2">Material de Apoio</p><p className="text-sm text-foreground whitespace-pre-wrap">{encontro.materialApoio}</p></div>}

      {/* Roteiro */}
      <div className="animate-float-up" style={{ animationDelay: '180ms' }}>
        {/* Cabeçalho da seção */}
        <div className="flex items-center justify-between mb-3">
          <p className="section-title mb-0">Roteiro do Encontro</p>
          <span className="text-[10px] font-black text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
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
      {/* Status Modal */}
      <Dialog open={showStatus} onOpenChange={setShowStatus}>
        <DialogContent className="rounded-2xl border-border/30">
          <DialogTitle>Alterar Status</DialogTitle>
          <div className="space-y-3 mt-4">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleStatusClick(opt.value)}
                disabled={encontro.status === opt.value}
                className={cn(
                  "w-full p-4 rounded-xl font-bold flex items-center justify-between transition-all",
                  encontro.status === opt.value ? "bg-muted/50 text-muted-foreground cursor-not-allowed" : `${opt.color.replace('text-', 'hover:bg-opacity-20 text-')} hover:bg-opacity-10 bg-muted/10`
                )}
              >
                <span>{opt.label}</span>
                {encontro.status === opt.value && <span className="text-[10px] uppercase tracking-wider">Atual</span>}
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
            <p className="text-xs text-muted-foreground mt-1">{encontro.presencas.length} de {catequizandos.length} alunos presentes</p>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {catequizandos.map(cat => {
              const present = encontro.presencas.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => togglePresenca(cat.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-colors ${present ? 'border-success bg-success/5' : 'border-muted/30 bg-muted/10 hover:border-muted/50'}`}
                >
                  <div className="text-left">
                    <p className={`text-sm font-bold ${present ? 'text-foreground' : 'text-muted-foreground'}`}>{cat.nome}</p>
                    <p className="text-[10px] uppercase text-muted-foreground font-semibold">RM: {cat.id.substring(0,6)}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${present ? 'bg-success border-success' : 'border-muted-foreground/30'}`}>
                    {present && <Users className="h-3 w-3 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="shrink-0 pt-4 mt-2 border-t border-border/10">
            <button onClick={() => setShowPresenca(false)} className="w-full action-btn">
              Concluído
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
