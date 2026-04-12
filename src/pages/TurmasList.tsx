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
                  
                  <div className="flex flex-col items-center justify-center mb-5 relative z-30 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shrink-0 shadow-md mb-3 group-hover:scale-110 transition-transform duration-500">
                      <BookOpen className="h-7 w-7 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                        {turma.nome} <span className="opacity-40 font-bold ml-1">— {turma.ano}</span>
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium">{turma.diaCatequese} • {turma.horario} • {turma.local}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 flex-wrap relative z-30">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/10 shadow-sm">
                      <CalendarDays className="h-3.5 w-3.5" /><span>{tEncontros.length} encontros</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/10 shadow-sm">
                      <Users className="h-3.5 w-3.5" /><span>{tCatequizandos.length} catequizandos</span>
                    </div>
                    {etapa && <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/10 shadow-sm">{etapa.label}</span>}
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
