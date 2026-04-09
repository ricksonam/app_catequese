import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useAtividades } from "@/hooks/useSupabaseData";
import { ArrowLeft, CalendarDays, ListChecks, Filter } from "lucide-react";
import { useState, useMemo } from "react";

type TimelineItem = { id: string; tipo: 'encontro' | 'atividade'; titulo: string; subtitulo: string; data: string; color: string; status?: string; };
const statusColors: Record<string, string> = { pendente: 'bg-muted-foreground', realizado: 'bg-success', transferido: 'bg-caution', cancelado: 'bg-destructive' };

export default function PlanoTurma() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: turmas = [] } = useTurmas();
  const { data: encontros = [] } = useEncontros(id);
  const { data: atividades = [] } = useAtividades(id);
  const turma = turmas.find(t => t.id === id);

  const [activeFilter, setActiveFilter] = useState<'all' | 'encontro' | 'atividade'>('all');

  const groupedItems = useMemo(() => {
    const rawItems: TimelineItem[] = [
      ...encontros.map((e): TimelineItem => ({ id: e.id, tipo: 'encontro', titulo: e.tema, subtitulo: `Encontro • ${e.status}`, data: e.data, color: statusColors[e.status] || 'bg-muted-foreground', status: e.status })),
      ...atividades.map((a): TimelineItem => ({ id: a.id, tipo: 'atividade', titulo: a.nome, subtitulo: `${a.tipo}${a.local ? ` • ${a.local}` : ''}`, data: a.data, color: 'bg-primary' })),
    ]
    .filter(item => activeFilter === 'all' || item.tipo === activeFilter)
    .sort((a, b) => {
      if (!a.data && !b.data) return 0;
      if (!a.data) return 1;
      if (!b.data) return -1;
      return new Date(a.data).getTime() - new Date(b.data).getTime();
    });

    const groups: Record<string, TimelineItem[]> = {};
    rawItems.forEach(item => {
      if (!item.data) {
        const key = "A Definir";
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
        return;
      }
      const date = new Date(item.data + 'T12:00:00');
      const monthYear = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      const key = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return Object.entries(groups);
  }, [encontros, atividades, activeFilter]);

  const handleOpen = (item: TimelineItem) => {
    if (item.tipo === 'encontro') navigate(`/turmas/${id}/encontros/${item.id}`);
    else navigate(`/turmas/${id}/atividades`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/turmas/${id}`)} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Plano da Turma</h1>
            <p className="text-xs text-muted-foreground">{turma?.nome} • {activeFilter === 'all' ? 'Cronograma completo' : activeFilter === 'encontro' ? 'Apenas encontros' : 'Apenas atividades'}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-muted/30 rounded-2xl animate-fade-in">
        {(['all', 'encontro', 'atividade'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === f 
                ? 'bg-primary text-primary-foreground shadow-md' 
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            {f === 'all' ? 'Tudo' : f === 'encontro' ? 'Encontros' : 'Atividades'}
          </button>
        ))}
      </div>

      {groupedItems.length === 0 ? (
        <div className="empty-state animate-float-up">
          <div className="icon-box bg-primary/10 text-primary mx-auto mb-3"><CalendarDays className="h-6 w-6" /></div>
          <p className="text-sm font-medium text-muted-foreground">Nenhum item encontrado</p>
        </div>
      ) : (
        <div className="space-y-8 pb-10">
          {groupedItems.map(([month, items]) => (
            <div key={month} className="space-y-4">
              <div className="flex items-center justify-center gap-4 py-2">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-primary/20"></div>
                <h3 className="text-sm font-extrabold text-primary uppercase tracking-[0.15em] bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10 shadow-sm">{month}</h3>
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-primary/20"></div>
              </div>
              
              <div className="space-y-3">
                {items.map((item, i) => {
                  const Icon = item.tipo === 'encontro' ? CalendarDays : ListChecks;
                  const dateStr = item.data 
                    ? new Date(item.data + 'T12:00:00').toLocaleDateString("pt-BR", { weekday: 'short', day: '2-digit', month: 'short' }) 
                    : 'A definir';
                  
                  return (
                    <button 
                      key={`${item.tipo}-${item.id}`} 
                      onClick={() => handleOpen(item)} 
                      className="w-full float-card flex flex-col items-center gap-2 px-4 py-5 animate-float-up text-center active:scale-[0.98] transition-transform"
                    >
                      <div className={`p-2 rounded-lg mb-1 ${item.tipo === 'encontro' ? 'bg-primary/10 text-primary' : 'bg-accent/15 text-accent-foreground'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      <p className={`text-base font-bold leading-tight ${item.status === 'cancelado' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {item.titulo}
                      </p>
                      
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-xs font-bold text-muted-foreground tracking-wide uppercase">{item.subtitulo}</p>
                        <p className="text-xs font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">{dateStr}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
