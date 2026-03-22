import { useParams, useNavigate } from "react-router-dom";
import { getEncontros, getTurmas, type Encontro, type EncontroStatus } from "@/lib/store";
import { ArrowLeft, Plus, CalendarDays, Eye, Play } from "lucide-react";
import { useState } from "react";

const STATUS_CONFIG: Record<EncontroStatus, { label: string; bg: string; text: string; border: string }> = {
  pendente: { label: "Pendente", bg: "bg-muted", text: "text-muted-foreground", border: "border-l-muted-foreground" },
  realizado: { label: "Realizado", bg: "bg-success/10", text: "text-success", border: "border-l-success" },
  adiado: { label: "Adiado", bg: "bg-warning/10", text: "text-warning", border: "border-l-warning" },
  transferido: { label: "Transferido", bg: "bg-caution/10", text: "text-caution", border: "border-l-caution" },
  cancelado: { label: "Cancelado", bg: "bg-destructive/10", text: "text-destructive", border: "border-l-destructive" },
};

export default function EncontrosList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const turma = getTurmas().find((t) => t.id === id);
  const [encontros] = useState(getEncontros(id));

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/turmas/${id}`)} className="p-2 rounded-xl hover:bg-muted">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Encontros</h1>
            <p className="text-xs text-muted-foreground">{turma?.nome} • {encontros.length} encontros</p>
          </div>
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={() => navigate(`/turmas/${id}/encontros/novo`)}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-xl text-sm font-semibold"
      >
        <Plus className="h-4 w-4" /> Novo Encontro
      </button>

      {encontros.length === 0 ? (
        <div className="ios-card p-8 text-center">
          <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum encontro cadastrado</p>
          <p className="text-xs text-muted-foreground mt-1">Crie seu primeiro encontro ou use um modelo da biblioteca</p>
        </div>
      ) : (
        <div className="space-y-2">
          {encontros
            .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
            .map((enc) => {
              const status = STATUS_CONFIG[enc.status];
              return (
                <div
                  key={enc.id}
                  className={`ios-card overflow-hidden border-l-4 ${status.border}`}
                >
                  <div className="px-4 py-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${enc.status === 'cancelado' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {enc.tema}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(enc.data).toLocaleDateString("pt-BR", { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        {enc.leituraBiblica && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">📖 {enc.leituraBiblica}</p>
                        )}
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => navigate(`/turmas/${id}/encontros/${enc.id}`)}
                        className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-lg"
                      >
                        <Eye className="h-3.5 w-3.5" /> Visualizar
                      </button>
                      <button
                        onClick={() => navigate(`/turmas/${id}/encontros/${enc.id}/apresentacao`)}
                        className="flex items-center gap-1 text-xs font-medium text-liturgical bg-liturgical/10 px-3 py-1.5 rounded-lg"
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
