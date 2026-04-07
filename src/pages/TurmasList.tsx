import { useTurmas, useEncontros, useCatequizandos } from "@/hooks/useSupabaseData";
import { ETAPAS_CATEQUESE } from "@/lib/store";
import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, Plus, CalendarDays, Users } from "lucide-react";

export default function TurmasList() {
  const { data: turmas = [], isLoading } = useTurmas();
  const { data: encontros = [] } = useEncontros();
  const { data: catequizandos = [] } = useCatequizandos();
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 rounded-lg bg-primary/20 animate-pulse" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-fade-in">
        <h1 className="text-xl font-bold text-foreground">Turmas</h1>
        <button onClick={() => navigate("/turmas/nova")} className="action-btn-sm"><Plus className="h-4 w-4" /> Nova</button>
      </div>

      {turmas.length === 0 ? (
        <div className="empty-state animate-float-up">
          <div className="icon-box bg-primary/10 text-primary mx-auto mb-3"><BookOpen className="h-6 w-6" /></div>
          <h3 className="font-bold text-foreground mb-1">Nenhuma turma cadastrada</h3>
          <p className="text-sm text-muted-foreground">Crie sua primeira turma para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {turmas.map((turma, i) => {
            const tEncontros = encontros.filter(e => e.turmaId === turma.id);
            const tCatequizandos = catequizandos.filter(c => c.turmaId === turma.id);
            const etapa = ETAPAS_CATEQUESE.find((e) => e.id === turma.etapa);
            return (
              <button key={turma.id} onClick={() => navigate(`/turmas/${turma.id}`)} className="float-card w-full p-4 text-left animate-float-up border-l-4 border-l-primary" style={{ animationDelay: `${i * 70}ms` }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-foreground">{turma.nome}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{turma.diaCatequese} • {turma.horario} • {turma.local}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                    <CalendarDays className="h-3.5 w-3.5" /><span>{tEncontros.length} encontros</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10 px-2.5 py-1 rounded-lg">
                    <Users className="h-3.5 w-3.5" /><span>{tCatequizandos.length} catequizandos</span>
                  </div>
                  {etapa && <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]">{etapa.label}</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
