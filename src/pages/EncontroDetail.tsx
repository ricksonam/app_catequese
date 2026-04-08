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

      <button onClick={() => setShowOcorrencias(true)} className="float-card w-full px-4 py-3 flex items-center gap-2 text-sm font-semibold text-foreground animate-float-up" style={{ animationDelay: '240ms' }}>
        <FileText className="h-4 w-4 text-primary" /> Relatório de Ocorrências ({ocorrencias.length})
      </button>

      {/* Status Dialog */}
      <Dialog open={showStatus} onOpenChange={setShowStatus}>
        <DialogContent className="rounded-2xl border-border/30"><DialogHeader><DialogTitle>Alterar Status</DialogTitle></DialogHeader>
          <div className="space-y-2 mt-2">{STATUS_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => handleStatusClick(opt.value)} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${encontro.status === opt.value ? opt.color : "bg-muted/50 text-foreground hover:bg-muted"}`}>{opt.label}</button>
          ))}</div>
        </DialogContent>
      </Dialog>

      {/* Transfer Calendar */}
      <Dialog open={showTransferCalendar} onOpenChange={setShowTransferCalendar}>
        <DialogContent className="rounded-2xl border-border/30"><DialogHeader><DialogTitle>Transferir para qual data?</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">Datas com encontros marcados estão sinalizadas em azul.</p>
          <div className="flex justify-center mt-2"><Calendar mode="single" selected={selectedTransferDate} onSelect={handleTransferDateSelect} modifiers={{ booked: encontroDates }} modifiersClassNames={{ booked: "bg-primary/20 text-primary font-bold" }} className={cn("p-3 pointer-events-auto")} /></div>
        </DialogContent>
      </Dialog>

      {/* Conflict */}
      <Dialog open={showConflict} onOpenChange={setShowConflict}>
        <DialogContent className="rounded-2xl border-border/30"><DialogHeader><DialogTitle>Conflito de Data</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Já existe o encontro <span className="font-semibold text-foreground">"{conflictEncontro?.tema}"</span> nesta data.</p>
          <div className="flex flex-col gap-2 mt-4">
            <button onClick={() => handleConflictAction('remanejar')} className="w-full py-3 rounded-xl text-sm font-semibold bg-primary/10 text-primary">Remanejar (trocar datas)</button>
            <button onClick={() => handleConflictAction('cancelar')} className="w-full py-3 rounded-xl text-sm font-semibold bg-destructive/10 text-destructive">Cancelar o encontro existente</button>
            <button onClick={() => setShowConflict(false)} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-muted text-foreground">Voltar</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Motivo */}
      <Dialog open={showCancelMotivo} onOpenChange={setShowCancelMotivo}>
        <DialogContent className="rounded-2xl border-border/30"><DialogHeader><DialogTitle>Motivo do Cancelamento</DialogTitle></DialogHeader>
          <textarea value={motivoText} onChange={(e) => setMotivoText(e.target.value)} placeholder="Informe o motivo..." className="w-full min-h-[100px] rounded-xl border border-border bg-background p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <div className="flex gap-2 mt-2"><button onClick={() => setShowCancelMotivo(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-muted text-foreground">Voltar</button><button onClick={handleCancelConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-destructive text-destructive-foreground">Confirmar</button></div>
        </DialogContent>
      </Dialog>

      {/* Delete Motivo */}
      <Dialog open={showDeleteMotivo} onOpenChange={setShowDeleteMotivo}>
        <DialogContent className="rounded-2xl border-border/30"><DialogHeader><DialogTitle>Excluir Encontro</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Informe o motivo da exclusão:</p>
          <textarea value={motivoText} onChange={(e) => setMotivoText(e.target.value)} placeholder="Motivo da exclusão..." className="w-full min-h-[80px] rounded-xl border border-border bg-background p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <div className="flex gap-2 mt-2"><button onClick={() => setShowDeleteMotivo(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-muted text-foreground">Cancelar</button><button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-destructive text-destructive-foreground">Excluir</button></div>
        </DialogContent>
      </Dialog>

      {/* Presença */}
      <Dialog open={showPresenca} onOpenChange={setShowPresenca}>
        <DialogContent className="rounded-2xl border-border/30"><DialogHeader><DialogTitle>Lista de Presença</DialogTitle></DialogHeader>
          {catequizandos.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Nenhum catequizando cadastrado</p> : (
            <div className="space-y-1 mt-2 max-h-[50vh] overflow-y-auto">{catequizandos.map((c) => {
              const present = encontro.presencas.includes(c.id);
              return <button key={c.id} onClick={() => togglePresenca(c.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${present ? 'bg-success/10' : 'hover:bg-muted/50'}`}>
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${present ? 'bg-success border-success' : 'border-border'}`}>{present && <span className="text-white text-xs">✓</span>}</div>
                <span className={`font-medium ${present ? 'text-foreground' : 'text-muted-foreground'}`}>{c.nome}</span>
              </button>;
            })}</div>
          )}
          <p className="text-xs text-muted-foreground text-center mt-2">{encontro.presencas.length}/{catequizandos.length} presentes</p>
        </DialogContent>
      </Dialog>

      {/* Ocorrencias */}
      <Dialog open={showOcorrencias} onOpenChange={setShowOcorrencias}>
        <DialogContent className="rounded-2xl border-border/30 max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>Relatório de Ocorrências</DialogTitle></DialogHeader>
          {ocorrencias.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Nenhuma ocorrência registrada</p> : (
            <div className="space-y-2 mt-2">{ocorrencias.map((o) => (
              <div key={o.id} className="float-card p-3"><p className="text-sm font-semibold text-foreground">{o.temaNome}</p><p className="text-xs text-muted-foreground">{o.tipo === 'cancelamento' ? '🔴 Cancelamento' : '🗑️ Exclusão'} • {new Date(o.data).toLocaleDateString('pt-BR')}</p><p className="text-xs text-muted-foreground mt-1">{o.motivo}</p></div>
            ))}</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
