import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useCatequizandos } from "@/hooks/useSupabaseData";
import { type EncontroStatus } from "@/lib/store";
import { ArrowLeft, Plus, CalendarDays, Eye, Play, Users } from "lucide-react";
import { formatarDataVigente } from "@/lib/utils";

const STATUS_CONFIG: Record<EncontroStatus, { label: string; bg: string; text: string; border: string }> = {
  pendente: { label: "Pendente", bg: "bg-muted", text: "text-muted-foreground", border: "border-l-muted-foreground" },
  realizado: { label: "Realizado", bg: "bg-success/10", text: "text-success", border: "border-l-success" },
  transferido: { label: "Transferido", bg: "bg-caution/10", text: "text-caution", border: "border-l-caution" },
  cancelado: { label: "Cancelado", bg: "bg-destructive/10", text: "text-destructive", border: "border-l-destructive" },
};

export default function EncontrosList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: turmas = [] } = useTurmas();
  const { data: encontros = [], isLoading } = useEncontros(id);
  const { data: catequizandos = [] } = useCatequizandos(id);
  const turma = turmas.find((t) => t.id === id);

  const totalAlunos = catequizandos.length || 1;

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 rounded-lg bg-primary/20 animate-pulse" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/turmas/${id}`)} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
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
          <div className="icon-box bg-primary/10 text-primary mx-auto mb-3"><CalendarDays className="h-6 w-6" /></div>
          <p className="text-sm font-medium text-muted-foreground">Nenhum encontro cadastrado</p>
          <p className="text-xs text-muted-foreground mt-1">Crie seu primeiro encontro ou use um modelo da biblioteca</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(() => {
            const sorted = [...encontros].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
            const groups: Record<string, typeof sorted> = {};
            
            sorted.forEach(enc => {
              const date = new Date(enc.data + 'T12:00:00');
              const monthYear = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
              const key = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
              if (!groups[key]) groups[key] = [];
              groups[key].push(enc);
            });

            return Object.entries(groups).map(([month, items], groupIndex) => (
              <div key={month} className="space-y-4">
                <div className="flex items-center justify-center gap-4 py-4">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-primary/20"></div>
                  <h3 className="text-sm font-extrabold text-primary uppercase tracking-[0.15em] bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10 shadow-sm">{month}</h3>
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-primary/20"></div>
                </div>
                <div className="space-y-3">
                  {items.map((enc, i) => {
                    const status = STATUS_CONFIG[enc.status] || STATUS_CONFIG.pendente;
                    const presPct = Math.round(((enc.presencas || []).length / totalAlunos) * 100);

                    return (
                      <div key={enc.id} className={`float-card overflow-hidden border-l-4 ${status.border} animate-float-up`} style={{ animationDelay: `${(i + 1) * 60}ms` }}>
                        <div className="px-4 py-4 flex flex-col items-center text-center">
                          <p className={`text-base font-bold leading-tight mb-2 ${enc.status === 'cancelado' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {enc.tema}
                          </p>
                          
                          <div className="flex flex-col items-center gap-1 mb-3">
                            <p className="text-xs font-medium text-muted-foreground">{formatarDataVigente(enc.data, { weekday: 'long', day: '2-digit', month: 'long' })}</p>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10 mt-1">
                              <Users className="h-3 w-3" /> {presPct}% de Presença
                            </div>
                            {enc.leituraBiblica && <p className="text-xs text-muted-foreground italic mt-1">📖 {enc.leituraBiblica}</p>}
                          </div>

                          <span className={`pill-btn py-1 px-3 text-[10px] font-bold uppercase tracking-wider mb-4 ${status.bg} ${status.text} border border-current/10`}>
                            {status.label}
                          </span>

                          <div className="flex items-center justify-center gap-3 w-full border-t border-border/5 pt-4">
                            <button onClick={() => navigate(`/turmas/${id}/encontros/${enc.id}`)} className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-4 py-2 rounded-xl active:scale-95 transition-transform">
                              <Eye className="h-3.5 w-3.5" /> Detalhes
                            </button>
                            <button onClick={() => navigate(`/turmas/${id}/encontros/${enc.id}/apresentacao`)} className="flex items-center gap-1.5 text-xs font-bold text-liturgical bg-liturgical/10 px-4 py-2 rounded-xl active:scale-95 transition-transform">
                              <Play className="h-3.5 w-3.5" /> Apresentar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
}
