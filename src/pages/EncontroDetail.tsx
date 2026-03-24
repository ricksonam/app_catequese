import { useParams, useNavigate } from "react-router-dom";
import { getEncontros, saveEncontro, deleteEncontro, getCatequizandos, getTurmas, type EncontroStatus } from "@/lib/store";
import { ArrowLeft, Edit, Trash2, Users, Play, Clock, User, BookOpen } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const STATUS_OPTIONS: { value: EncontroStatus; label: string; color: string }[] = [
  { value: "pendente", label: "Pendente", color: "bg-muted text-muted-foreground" },
  { value: "realizado", label: "Realizado", color: "bg-success text-success-foreground" },
  { value: "adiado", label: "Adiado", color: "bg-warning text-warning-foreground" },
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

  if (!encontro) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Encontro não encontrado</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm mt-2 font-semibold">Voltar</button>
      </div>
    );
  }

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === encontro.status)!;

  const handleStatusChange = (status: EncontroStatus) => {
    const updated = { ...encontro, status };
    saveEncontro(updated);
    setEncontro(updated);
    setShowStatus(false);
    toast.success(`Status alterado para ${STATUS_OPTIONS.find((s) => s.value === status)?.label}`);
  };

  const handleDelete = () => {
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
      <div className="page-header animate-fade-in">
        <button onClick={() => navigate(`/turmas/${id}/encontros`)} className="back-btn">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground truncate">{encontro.tema}</h1>
          <p className="text-xs text-muted-foreground">{turma?.nome}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 animate-float-up">
        <button onClick={() => setShowStatus(true)} className={`pill-btn ${currentStatus.color}`}>
          {currentStatus.label} ▾
        </button>
        <button onClick={() => navigate(`/turmas/${id}/encontros/${encontroId}/editar`)} className="pill-btn bg-primary/10 text-primary flex items-center gap-1">
          <Edit className="h-3.5 w-3.5" /> Editar
        </button>
        <button onClick={() => setShowPresenca(true)} className="pill-btn bg-success/10 text-success flex items-center gap-1">
          <Users className="h-3.5 w-3.5" /> Presença
        </button>
        <button onClick={() => navigate(`/turmas/${id}/encontros/${encontroId}/apresentacao`)} className="pill-btn bg-liturgical/10 text-liturgical flex items-center gap-1">
          <Play className="h-3.5 w-3.5" /> Apresentação
        </button>
        <button onClick={() => setShowDelete(true)} className="pill-btn bg-destructive/10 text-destructive flex items-center gap-1">
          <Trash2 className="h-3.5 w-3.5" /> Excluir
        </button>
      </div>

      {/* Info */}
      <div className="float-card p-5 space-y-3 animate-float-up" style={{ animationDelay: '60ms' }}>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Data</p>
          <p className="text-sm font-semibold text-foreground">
            {new Date(encontro.data).toLocaleDateString("pt-BR", { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {encontro.leituraBiblica && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Leitura Bíblica</p>
            <p className="text-sm font-semibold text-foreground flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5 text-primary" /> {encontro.leituraBiblica}
            </p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Tempo Total</p>
          <p className="text-sm font-semibold text-foreground flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-primary" /> {tempoTotal} min
          </p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Presenças</p>
          <p className="text-sm font-semibold text-foreground">{encontro.presencas.length}/{catequizandos.length}</p>
        </div>
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
                    <span className="pill-btn bg-liturgical/10 text-liturgical">{step.oracaoTipo}</span>
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

      {/* Dialogs */}
      <Dialog open={showStatus} onOpenChange={setShowStatus}>
        <DialogContent className="rounded-2xl border-border/30">
          <DialogHeader><DialogTitle>Alterar Status</DialogTitle></DialogHeader>
          <div className="space-y-2 mt-2">
            {STATUS_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => handleStatusChange(opt.value)} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${encontro.status === opt.value ? opt.color : "bg-muted/50 text-foreground hover:bg-muted"}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

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

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="rounded-2xl border-border/30">
          <DialogHeader><DialogTitle>Excluir Encontro</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja mover este encontro para a lixeira?</p>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowDelete(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-muted text-foreground">Cancelar</button>
            <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-destructive text-destructive-foreground">Excluir</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
