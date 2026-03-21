import { useParams, useNavigate } from "react-router-dom";
import { getTurmas, getEncontros, getAtividades, type Encontro, type Atividade } from "@/lib/store";
import { ArrowLeft, CalendarDays, ListChecks, Eye } from "lucide-react";

type TimelineItem = {
  id: string;
  tipo: 'encontro' | 'atividade';
  titulo: string;
  subtitulo: string;
  data: string;
  color: string;
};

const statusColors: Record<string, string> = {
  pendente: 'bg-muted-foreground',
  realizado: 'bg-success',
  adiado: 'bg-warning',
  transferido: 'bg-caution',
  cancelado: 'bg-destructive',
};

export default function PlanoTurma() {
  const { id } = useParams();
  const navigate = useNavigate();
  const turma = getTurmas().find(t => t.id === id);
  const encontros = getEncontros(id);
  const atividades = getAtividades(id);

  const items: TimelineItem[] = [
    ...encontros.map((e): TimelineItem => ({
      id: e.id,
      tipo: 'encontro',
      titulo: e.tema,
      subtitulo: `Encontro • ${e.status}`,
      data: e.data,
      color: statusColors[e.status] || 'bg-muted-foreground',
    })),
    ...atividades.map((a): TimelineItem => ({
      id: a.id,
      tipo: 'atividade',
      titulo: a.nome,
      subtitulo: `${a.tipo}${a.local ? ` • ${a.local}` : ''}`,
      data: a.data,
      color: 'bg-primary',
    })),
  ].sort((a, b) => {
    if (!a.data && !b.data) return 0;
    if (!a.data) return 1;
    if (!b.data) return -1;
    return new Date(a.data).getTime() - new Date(b.data).getTime();
  });

  const handleOpen = (item: TimelineItem) => {
    if (item.tipo === 'encontro') {
      navigate(`/turmas/${id}/encontros/${item.id}`);
    }
    // Atividades open in the list view (could be enhanced later)
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/turmas/${id}`)} className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Plano da Turma</h1>
          <p className="text-xs text-muted-foreground">{turma?.nome} • {items.length} itens na timeline</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="ios-card p-8 text-center">
          <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum encontro ou atividade cadastrada</p>
          <p className="text-xs text-muted-foreground mt-1">Crie encontros e atividades para montar a timeline</p>
        </div>
      ) : (
        <div className="relative pl-6">
          {/* Timeline line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

          <div className="space-y-1">
            {items.map((item, i) => {
              const Icon = item.tipo === 'encontro' ? CalendarDays : ListChecks;
              const dateStr = item.data ? new Date(item.data + 'T00:00').toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' }) : 'Sem data';

              return (
                <div key={`${item.tipo}-${item.id}`} className="relative flex items-start gap-3 py-2">
                  {/* Timeline dot */}
                  <div className={`absolute -left-6 top-3 w-3 h-3 rounded-full ${item.color} ring-2 ring-background z-10`} />

                  <button
                    onClick={() => handleOpen(item)}
                    className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:shadow-sm transition-all text-left"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.tipo === 'encontro' ? 'bg-primary/10' : 'bg-accent/20'}`}>
                      <Icon className={`h-4 w-4 ${item.tipo === 'encontro' ? 'text-primary' : 'text-accent-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.titulo}</p>
                      <p className="text-xs text-muted-foreground">{item.subtitulo}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-muted-foreground">{dateStr}</p>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
