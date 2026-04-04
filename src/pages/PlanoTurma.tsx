import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useAtividades } from "@/hooks/useSupabaseData";
import { ArrowLeft, CalendarDays, ListChecks } from "lucide-react";

type TimelineItem = { id: string; tipo: 'encontro' | 'atividade'; titulo: string; subtitulo: string; data: string; color: string; };
const statusColors: Record<string, string> = { pendente: 'bg-muted-foreground', realizado: 'bg-success', transferido: 'bg-caution', cancelado: 'bg-destructive' };

export default function PlanoTurma() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: turmas = [] } = useTurmas();
  const { data: encontros = [] } = useEncontros(id);
  const { data: atividades = [] } = useAtividades(id);
  const turma = turmas.find(t => t.id === id);

  const items: TimelineItem[] = [
    ...encontros.map((e): TimelineItem => ({ id: e.id, tipo: 'encontro', titulo: e.tema, subtitulo: `Encontro • ${e.status}`, data: e.data, color: statusColors[e.status] || 'bg-muted-foreground' })),
    ...atividades.map((a): TimelineItem => ({ id: a.id, tipo: 'atividade', titulo: a.nome, subtitulo: `${a.tipo}${a.local ? ` • ${a.local}` : ''}`, data: a.data, color: 'bg-primary' })),
  ].sort((a, b) => { if (!a.data && !b.data) return 0; if (!a.data) return 1; if (!b.data) return -1; return new Date(a.data).getTime() - new Date(b.data).getTime(); });

  const handleOpen = (item: TimelineItem) => { if (item.tipo === 'encontro') navigate(`/turmas/${id}/encontros/${item.id}`); };

  return (
    <div className="space-y-5">
      <div className="page-header animate-fade-in">
        <button onClick={() => navigate(`/turmas/${id}`)} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
        <div><h1 className="text-xl font-bold text-foreground">Plano da Turma</h1><p className="text-xs text-muted-foreground">{turma?.nome} • {items.length} itens na timeline</p></div>
      </div>
      {items.length === 0 ? (
        <div className="empty-state animate-float-up"><div className="icon-box bg-primary/10 text-primary mx-auto mb-3"><CalendarDays className="h-6 w-6" /></div><p className="text-sm font-medium text-muted-foreground">Nenhum encontro ou atividade cadastrada</p></div>
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border/60" />
          <div className="space-y-2">{items.map((item, i) => {
            const Icon = item.tipo === 'encontro' ? CalendarDays : ListChecks;
            const dateStr = item.data ? new Date(item.data + 'T00:00').toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' }) : 'Sem data';
            return (
              <div key={`${item.tipo}-${item.id}`} className="relative flex items-start gap-3 py-1 animate-float-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className={`absolute -left-6 top-4 w-3 h-3 rounded-full ${item.color} ring-2 ring-background z-10`} />
                <button onClick={() => handleOpen(item)} className="flex-1 float-card flex items-center gap-3 p-3.5 text-left">
                  <div className={`icon-box w-9 h-9 rounded-lg ${item.tipo === 'encontro' ? 'bg-primary/10' : 'bg-accent/15'}`}><Icon className={`h-4 w-4 ${item.tipo === 'encontro' ? 'text-primary' : 'text-accent-foreground'}`} /></div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-foreground truncate">{item.titulo}</p><p className="text-xs text-muted-foreground">{item.subtitulo}</p></div>
                  <p className="text-xs font-semibold text-muted-foreground shrink-0">{dateStr}</p>
                </button>
              </div>
            );
          })}</div>
        </div>
      )}
    </div>
  );
}
