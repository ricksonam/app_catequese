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
              <div 
                key={turma.id} 
                onClick={() => navigate(`/turmas/${turma.id}`)} 
                className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[hsl(var(--gold))]/60 via-[hsl(var(--liturgical))]/40 to-primary/40 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.12)] animate-float-up transition-all duration-300 hover:-translate-y-1.5 cursor-pointer group"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                {/* Moldura litúrgica interna */}
                <div className="absolute inset-[3px] rounded-xl border border-white/50 dark:border-white/10 z-20 pointer-events-none opacity-60 mix-blend-overlay"></div>
                
                <div className="relative flex flex-col p-4 rounded-[14px] bg-card w-full h-full overflow-hidden">
                  
                  {/* Marca d'água de fundo */}
                  <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">
                     <BookOpen className="w-32 h-32 text-primary" />
                  </div>
                  
                  <div className="flex items-start justify-between mb-4 relative z-30">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary/20 to-primary/5 border border-primary/20 flex flex-col items-center justify-center shrink-0 shadow-sm">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{turma.nome}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{turma.diaCatequese} • {turma.horario} • {turma.local}</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-background/60 flex items-center justify-center border border-border/50 shadow-sm shrink-0 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap relative z-30">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/10">
                      <CalendarDays className="h-3.5 w-3.5" /><span>{tEncontros.length} encontros</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10 px-2.5 py-1 rounded-lg border border-[hsl(var(--accent))]/10">
                      <Users className="h-3.5 w-3.5" /><span>{tCatequizandos.length} inscritos</span>
                    </div>
                    {etapa && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] drop-shadow-sm border border-[hsl(var(--success))]/20">{etapa.label}</span>}
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
