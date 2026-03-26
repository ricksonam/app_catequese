import { useParams, useNavigate } from "react-router-dom";
import { getEncontros, getTurmas, type EncontroStatus } from "@/lib/store";
import { ArrowLeft, Plus, CalendarDays, Eye, Play } from "lucide-react";
import { useState } from "react";

const STATUS_CONFIG: Record<EncontroStatus, { label: string; bg: string; text: string; border: string }> = {
  pendente: { label: "Pendente", bg: "bg-muted", text: "text-muted-foreground", border: "border-l-muted-foreground" },
  realizado: { label: "Realizado", bg: "bg-success/10", text: "text-success", border: "border-l-success" },
  transferido: { label: "Transferido", bg: "bg-caution/10", text: "text-caution", border: "border-l-caution" },
  cancelado: { label: "Cancelado", bg: "bg-destructive/10", text: "text-destructive", border: "border-l-destructive" },
};

export default function EncontrosList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const turma = getTurmas().find((t) => t.id === id);
  const [encontros] = useState(getEncontros(id));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/turmas/${id}`)} className="back-btn">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Encontros</h1>
            <p className="text-xs text-muted-foreground">{turma?.nome} • {encontros.length} encontros</p>
          </div>
        </div>
      </div>

      <button onClick={() => navigate(`/turmas/${id}/encontros/novo`)} className="w-full action-btn animate-float-up">
        <Plus className="h-4 w-4" /> Novo Encontro
      </button>

      {encontros.length === 0 ? (
        <div className="empty-state animate-float-up" style={{ animationDelay: '100ms' }}>
          <div className="icon-box bg-primary/10 text-primary mx-auto mb-3">
            <CalendarDays className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Nenhum encontro cadastrado</p>
          <p className="text-xs text-muted-foreground mt-1">Crie seu primeiro encontro ou use um modelo da biblioteca</p>
        </div>
      ) : (
        <div className="space-y-3">
          {encontros
            .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
            .map((enc, i) => {
              const status = STATUS_CONFIG[enc.status];
              return (
                <div
                  key={enc.id}
                  className={`float-card overflow-hidden border-l-4 ${status.border} animate-float-up`}
                  style={{ animationDelay: `${(i + 1) * 60}ms` }}
                >
                  <div className="px-4 py-3.5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${enc.status === 'cancelado' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {enc.tema}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(enc.data).toLocaleDateString("pt-BR", { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        {enc.leituraBiblica && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">📖 {enc.leituraBiblica}</p>
                        )}
                      </div>
                      <span className={`pill-btn ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => navigate(`/turmas/${id}/encontros/${enc.id}`)}
                        className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-xl active:scale-95 transition-transform"
                      >
                        <Eye className="h-3.5 w-3.5" /> Visualizar
                      </button>
                      <button
                        onClick={() => navigate(`/turmas/${id}/encontros/${enc.id}/apresentacao`)}
                        className="flex items-center gap-1 text-xs font-semibold text-liturgical bg-liturgical/10 px-3 py-1.5 rounded-xl active:scale-95 transition-transform"
                      >
                        <Play className="h-3.5 w-3.5" /> Apresentação
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
