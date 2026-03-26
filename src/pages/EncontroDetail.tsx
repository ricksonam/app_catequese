import { useParams, useNavigate } from "react-router-dom";
import { getEncontros, saveEncontro, deleteEncontro, getCatequizandos, getTurmas, getOcorrencias, saveOcorrencia, type EncontroStatus, type RegistroOcorrencia } from "@/lib/store";
import { ArrowLeft, Edit, Trash2, Users, Play, Clock, User, BookOpen, CalendarDays, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: EncontroStatus; label: string; color: string }[] = [
  { value: "pendente", label: "Pendente", color: "bg-muted text-muted-foreground" },
  { value: "realizado", label: "Realizado", color: "bg-success text-success-foreground" },
  { value: "transferido", label: "Transferido", color: "bg-caution text-caution-foreground" },
  { value: "cancelado", label: "Cancelado", color: "bg-destructive text-destructive-foreground" },
];

export default function EncontroDetail() {
  const { id, encontroId } = useParams();
  const navigate = useNavigate();
  const turma = getTurmas().find((t) => t.id === id);
  const [encontro, setEncontro] = useState(() => getEncontros(id).find((e) => e.id === encontroId));
  const catequizandos = getCatequizandos(id);
  const [showStatus, setShowStatus] = useState(false);
  const [showPresenca, setShowPresenca] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showTransferCalendar, setShowTransferCalendar] = useState(false);
  const [showCancelMotivo, setShowCancelMotivo] = useState(false);
  const [showDeleteMotivo, setShowDeleteMotivo] = useState(false);
  const [motivoText, setMotivoText] = useState("");
  const [showConflict, setShowConflict] = useState(false);
  const [conflictEncontro, setConflictEncontro] = useState<any>(null);
  const [selectedTransferDate, setSelectedTransferDate] = useState<Date | undefined>();
  const [showOcorrencias, setShowOcorrencias] = useState(false);

  if (!encontro) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Encontro não encontrado</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm mt-2 font-semibold">Voltar</button>
      </div>
    );
  }

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === encontro.status)!;
  const allEncontros = getEncontros(id);
  const ocorrencias = getOcorrencias(id);

  // Dates with existing encounters for calendar marking
  const encontroDates = allEncontros
    .filter(e => e.id !== encontro.id && e.status !== 'cancelado')
    .map(e => new Date(e.data));

  const handleStatusClick = (status: EncontroStatus) => {
    if (status === 'transferido') {
      setShowStatus(false);
      setShowTransferCalendar(true);
    } else if (status === 'cancelado') {
      setShowStatus(false);
      setMotivoText("");
      setShowCancelMotivo(true);
    } else {
      const updated = { ...encontro, status };
      saveEncontro(updated);
      setEncontro(updated);
      setShowStatus(false);
      toast.success(`Status alterado para ${STATUS_OPTIONS.find((s) => s.value === status)?.label}`);
    }
  };

  const handleTransferDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedTransferDate(date);
    const dateStr = date.toISOString().split('T')[0];
    const conflict = allEncontros.find(e => e.id !== encontro.id && e.data === dateStr && e.status !== 'cancelado');
    if (conflict) {
      setConflictEncontro(conflict);
      setShowConflict(true);
    } else {
      finishTransfer(dateStr);
    }
  };

  const finishTransfer = (dateStr: string) => {
    const updated = { ...encontro, status: 'transferido' as EncontroStatus, dataTransferida: dateStr };
    saveEncontro(updated);
    setEncontro(updated);
    setShowTransferCalendar(false);
    setShowConflict(false);
    toast.success(`Encontro transferido para ${new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR')}`);
  };

  const handleConflictAction = (action: 'remanejar' | 'cancelar') => {
    if (!selectedTransferDate || !conflictEncontro) return;
    const dateStr = selectedTransferDate.toISOString().split('T')[0];
    if (action === 'cancelar') {
      const cancelledEncontro = { ...conflictEncontro, status: 'cancelado' as EncontroStatus, motivoCancelamento: 'Cancelado por transferência de outro encontro' };
      saveEncontro(cancelledEncontro);
      saveOcorrencia({
        id: crypto.randomUUID(),
        encontroId: conflictEncontro.id,
        turmaId: id!,
        tipo: 'cancelamento',
        motivo: 'Cancelado por transferência de outro encontro',
        data: new Date().toISOString(),
        temaNome: conflictEncontro.tema,
      });
    } else {
      // remanejar - swap dates
      const remanejado = { ...conflictEncontro, data: encontro.data };
      saveEncontro(remanejado);
    }
    finishTransfer(dateStr);
  };

  const handleCancelConfirm = () => {
    if (!motivoText.trim()) {
      toast.error("Informe o motivo do cancelamento");
      return;
    }
    const updated = { ...encontro, status: 'cancelado' as EncontroStatus, motivoCancelamento: motivoText };
    saveEncontro(updated);
    setEncontro(updated);
    saveOcorrencia({
      id: crypto.randomUUID(),
      encontroId: encontro.id,
      turmaId: id!,
      tipo: 'cancelamento',
      motivo: motivoText,
      data: new Date().toISOString(),
      temaNome: encontro.tema,
    });
    setShowCancelMotivo(false);
    toast.success("Encontro cancelado");
  };

  const handleDelete = () => {
    if (!motivoText.trim()) {
      toast.error("Informe o motivo da exclusão");
      return;
    }
    saveOcorrencia({
      id: crypto.randomUUID(),
      encontroId: encontro.id,
      turmaId: id!,
      tipo: 'exclusao',
      motivo: motivoText,
      data: new Date().toISOString(),
      temaNome: encontro.tema,
    });
    deleteEncontro(encontro.id);
    toast.success("Encontro movido para a lixeira");
    navigate(`/turmas/${id}/encontros`);
  };

  const togglePresenca = (catId: string) => {
    const presencas = encontro.presencas.includes(catId)
      ? encontro.presencas.filter((p) => p !== catId)
      : [...encontro.presencas, catId];
    const updated = { ...encontro, presencas };
    saveEncontro(updated);
    setEncontro(updated);
  };

  const tempoTotal = encontro.roteiro.reduce((acc, s) => acc + s.tempo, 0);

  return (
    <div className="space-y-5 pb-6">
      {/* Header with delete button top-right */}
      <div className="page-header animate-fade-in">
        <button onClick={() => navigate(`/turmas/${id}/encontros`)} className="back-btn">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground truncate">{encontro.tema}</h1>
          <p className="text-xs text-muted-foreground">{turma?.nome}</p>
        </div>
        <button onClick={() => { setMotivoText(""); setShowDeleteMotivo(true); }} className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
          <Trash2 className="h-4 w-4 text-destructive" />
        </button>
      </div>

      {/* Action buttons - responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-float-up">
        <button onClick={() => setShowStatus(true)} className={`pill-btn ${currentStatus.color} justify-center`}>
          {currentStatus.label} ▾
        </button>
        <button onClick={() => navigate(`/turmas/${id}/encontros/${encontroId}/editar`)} className="pill-btn bg-primary/10 text-primary flex items-center justify-center gap-1">
          <Edit className="h-3.5 w-3.5" /> Editar
        </button>
        <button onClick={() => setShowPresenca(true)} className="pill-btn bg-success/10 text-success flex items-center justify-center gap-1">
          <Users className="h-3.5 w-3.5" /> Presença
        </button>
        <button onClick={() => navigate(`/turmas/${id}/encontros/${encontroId}/apresentacao`)} className="pill-btn bg-liturgical/10 text-liturgical flex items-center justify-center gap-1">
          <Play className="h-3.5 w-3.5" /> Apresentar
        </button>
      </div>

      {/* Info - left aligned */}
      <div className="float-card p-5 space-y-3 animate-float-up" style={{ animationDelay: '60ms' }}>
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">Data</p>
          <p className="text-sm font-semibold text-foreground">
            {new Date(encontro.data).toLocaleDateString("pt-BR", { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {encontro.dataTransferida && (
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Transferido para</p>
            <p className="text-sm font-semibold text-caution flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {new Date(encontro.dataTransferida + 'T12:00:00').toLocaleDateString("pt-BR", { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        )}
        {encontro.leituraBiblica && (
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Leitura Bíblica</p>
            <p className="text-sm font-semibold text-foreground flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5 text-primary" /> {encontro.leituraBiblica}
            </p>
          </div>
        )}
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">Tempo Total</p>
          <p className="text-sm font-semibold text-foreground flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-primary" /> {tempoTotal} min
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">Presenças</p>
          <p className="text-sm font-semibold text-foreground">{encontro.presencas.length}/{catequizandos.length}</p>
        </div>
        {encontro.motivoCancelamento && (
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Motivo do Cancelamento</p>
            <p className="text-sm font-semibold text-destructive">{encontro.motivoCancelamento}</p>
          </div>
        )}
      </div>

      {encontro.materialApoio && (
        <div className="float-card p-5 animate-float-up" style={{ animationDelay: '120ms' }}>
          <p className="section-title mb-2">Material de Apoio</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{encontro.materialApoio}</p>
        </div>
      )}

      {/* Roteiro */}
      <div className="animate-float-up" style={{ animationDelay: '180ms' }}>
        <p className="section-title">Roteiro do Encontro</p>
        <div className="space-y-2">
          {encontro.roteiro.map((step, i) => (
            <div key={step.id} className="float-card px-4 py-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{step.label}</span>
                  {step.oracaoTipo && (
                    <span className="pill-btn bg-liturgical/10 text-liturgical text-[10px]">{step.oracaoTipo}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  {step.tempo > 0 && (
                    <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{step.tempo}min</span>
                  )}
                  {step.catequista && (
                    <span className="flex items-center gap-0.5"><User className="h-3 w-3" />{step.catequista}</span>
                  )}
                </div>
              </div>
              {step.conteudo && (
                <p className="text-xs text-muted-foreground mt-2 ml-9 whitespace-pre-wrap">{step.conteudo}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Ocorrências button */}
      <button onClick={() => setShowOcorrencias(true)} className="float-card w-full px-4 py-3 flex items-center gap-2 text-sm font-semibold text-foreground animate-float-up" style={{ animationDelay: '240ms' }}>
        <FileText className="h-4 w-4 text-primary" /> Relatório de Ocorrências ({ocorrencias.length})
      </button>

      {/* Status Dialog */}
      <Dialog open={showStatus} onOpenChange={setShowStatus}>
        <DialogContent className="rounded-2xl border-border/30">
          <DialogHeader><DialogTitle>Alterar Status</DialogTitle></DialogHeader>
          <div className="space-y-2 mt-2">
            {STATUS_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => handleStatusClick(opt.value)} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${encontro.status === opt.value ? opt.color : "bg-muted/50 text-foreground hover:bg-muted"}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Calendar Dialog */}
      <Dialog open={showTransferCalendar} onOpenChange={setShowTransferCalendar}>
        <DialogContent className="rounded-2xl border-border/30">
          <DialogHeader><DialogTitle>Transferir para qual data?</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">Datas com encontros marcados estão sinalizadas em azul.</p>
          <div className="flex justify-center mt-2">
            <Calendar
              mode="single"
              selected={selectedTransferDate}
              onSelect={handleTransferDateSelect}
              modifiers={{ booked: encontroDates }}
              modifiersClassNames={{ booked: "bg-primary/20 text-primary font-bold" }}
              className={cn("p-3 pointer-events-auto")}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Conflict Dialog */}
      <Dialog open={showConflict} onOpenChange={setShowConflict}>
        <DialogContent className="rounded-2xl border-border/30">
          <DialogHeader><DialogTitle>Conflito de Data</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Já existe o encontro <span className="font-semibold text-foreground">"{conflictEncontro?.tema}"</span> nesta data. O que deseja fazer?
          </p>
          <div className="flex flex-col gap-2 mt-4">
            <button onClick={() => handleConflictAction('remanejar')} className="w-full py-3 rounded-xl text-sm font-semibold bg-primary/10 text-primary">
              Remanejar (trocar datas)
            </button>
            <button onClick={() => handleConflictAction('cancelar')} className="w-full py-3 rounded-xl text-sm font-semibold bg-destructive/10 text-destructive">
              Cancelar o encontro existente
            </button>
            <button onClick={() => setShowConflict(false)} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-muted text-foreground">
              Voltar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Motivo Dialog */}
      <Dialog open={showCancelMotivo} onOpenChange={setShowCancelMotivo}>
        <DialogContent className="rounded-2xl border-border/30">
          <DialogHeader><DialogTitle>Motivo do Cancelamento</DialogTitle></DialogHeader>
          <textarea
            value={motivoText}
            onChange={(e) => setMotivoText(e.target.value)}
            placeholder="Informe o motivo do cancelamento..."
            className="w-full min-h-[100px] rounded-xl border border-border bg-background p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={() => setShowCancelMotivo(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-muted text-foreground">Voltar</button>
            <button onClick={handleCancelConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-destructive text-destructive-foreground">Confirmar</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Motivo Dialog */}
      <Dialog open={showDeleteMotivo} onOpenChange={setShowDeleteMotivo}>
        <DialogContent className="rounded-2xl border-border/30">
          <DialogHeader><DialogTitle>Excluir Encontro</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Informe o motivo da exclusão:</p>
          <textarea
            value={motivoText}
            onChange={(e) => setMotivoText(e.target.value)}
            placeholder="Motivo da exclusão..."
            className="w-full min-h-[80px] rounded-xl border border-border bg-background p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={() => setShowDeleteMotivo(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-muted text-foreground">Cancelar</button>
            <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-destructive text-destructive-foreground">Excluir</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Presença Dialog */}
      <Dialog open={showPresenca} onOpenChange={setShowPresenca}>
        <DialogContent className="rounded-2xl border-border/30">
          <DialogHeader><DialogTitle>Lista de Presença</DialogTitle></DialogHeader>
          {catequizandos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum catequizando cadastrado nesta turma</p>
          ) : (
            <div className="space-y-1.5 mt-2 max-h-[50vh] overflow-y-auto">
              {catequizandos.map((c) => {
                const presente = encontro.presencas.includes(c.id);
                return (
                  <button key={c.id} onClick={() => togglePresenca(c.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${presente ? "bg-success/10" : "bg-muted/50"}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${presente ? "bg-success border-success" : "border-border"}`}>
                      {presente && <span className="text-success-foreground text-xs">✓</span>}
                    </div>
                    <span className="text-sm text-foreground font-medium">{c.nome}</span>
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ocorrências Dialog */}
      <Dialog open={showOcorrencias} onOpenChange={setShowOcorrencias}>
        <DialogContent className="rounded-2xl border-border/30 max-w-lg">
          <DialogHeader><DialogTitle>Relatório de Ocorrências</DialogTitle></DialogHeader>
          {ocorrencias.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma ocorrência registrada</p>
          ) : (
            <div className="space-y-2 mt-2 max-h-[60vh] overflow-y-auto">
              {ocorrencias.map((o) => (
                <div key={o.id} className="float-card px-4 py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold uppercase ${o.tipo === 'cancelamento' ? 'text-destructive' : 'text-warning'}`}>
                      {o.tipo === 'cancelamento' ? 'Cancelamento' : 'Exclusão'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(o.data).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{o.temaNome}</p>
                  <p className="text-xs text-muted-foreground">{o.motivo}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
