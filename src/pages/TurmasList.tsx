import { useTurmas, useEncontros, useCatequizandos, useComunidades } from "@/hooks/useSupabaseData";
import { ETAPAS_CATEQUESE } from "@/lib/store";
import { useNavigate } from "react-router-dom";
import { BookOpen, Plus, CalendarDays, Users, Link2, UsersRound } from "lucide-react";
import { useState, useEffect } from "react";
import { JoinTurmaModal } from "@/components/JoinTurmaModal";

export default function TurmasList() {
  const { data: turmas = [], isLoading } = useTurmas();
  const { data: encontros = [] } = useEncontros();
  const { data: catequizandos = [] } = useCatequizandos();
  const { data: comunidades = [] } = useComunidades();
  const navigate = useNavigate();
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [selectedTurmaId, setSelectedTurmaId] = useState<string | null>(null);

  useEffect(() => {
    if (turmas.length > 0 && !selectedTurmaId) {
      const saved = localStorage.getItem("ivc_selected_turma");
      if (saved && turmas.some(t => t.id === saved)) {
        setSelectedTurmaId(saved);
      } else {
        setSelectedTurmaId(turmas[0].id);
        localStorage.setItem("ivc_selected_turma", turmas[0].id);
      }
    }
  }, [turmas, selectedTurmaId]);

  const handleSelectSecondary = (id: string) => {
    setSelectedTurmaId(id);
    localStorage.setItem("ivc_selected_turma", id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const mainTurma = turmas.find(t => t.id === selectedTurmaId) || turmas[0];
  const secondaryTurmas = turmas.filter(t => t.id !== mainTurma?.id);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5 animate-bounce-subtle">
          <div className="w-6 h-6 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
        <p className="text-xs font-black text-primary/60 uppercase tracking-widest animate-pulse">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header - Refined Liturgical Style */}
      <div className="flex flex-col gap-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-black text-foreground tracking-tight font-liturgical">Turmas</h1>
          <button 
            onClick={() => navigate("/turmas/nova")} 
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-liturgical-green text-white shadow-lg shadow-green-900/20 active:scale-95 transition-all group font-bold text-xs uppercase tracking-widest"
          >
            <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
            Nova Turma
          </button>
        </div>

        {/* Join Turma Card - Elegant & Full Width */}
        <div
          onClick={() => setJoinModalOpen(true)}
          className="group relative flex items-center justify-between p-6 rounded-[2rem] bg-liturgical-paper border liturgical-border shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer overflow-hidden"
        >
          <div className="absolute inset-0 bg-liturgical-green/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white border liturgical-border flex items-center justify-center text-liturgical-green shadow-sm group-hover:scale-110 transition-transform duration-500">
              <Link2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground">Entrar em uma Turma</h3>
              <p className="text-[10px] font-bold text-liturgical-green/60 uppercase tracking-widest">Com código de acesso</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white border liturgical-border flex items-center justify-center text-liturgical-green/30 group-hover:text-liturgical-green transition-colors relative z-10">
            <Plus className="h-4 w-4 rotate-45" />
          </div>
        </div>
      </div>

      {turmas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-liturgical-float bg-liturgical-paper rounded-[3rem] border liturgical-border">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-liturgical-green mb-6 shadow-xl border liturgical-border">
            <BookOpen className="h-10 w-10 animate-sacred-rays" />
          </div>
          <h3 className="text-2xl font-black text-foreground mb-3 font-liturgical">Semeie a Palavra</h3>
          <p className="text-sm text-muted-foreground max-w-[320px] leading-relaxed mb-10 italic">
            "Ide por todo o mundo e pregai o Evangelho a toda criatura." <br/>
            <span className="text-[10px] uppercase font-bold not-italic tracking-wider mt-2 block">— Marcos 16:15</span>
          </p>
          <div className="flex flex-col sm:flex-row w-full gap-4 max-w-md">
            <button
              onClick={() => navigate("/turmas/nova")}
              className="flex-1 py-4 rounded-full bg-liturgical-green text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-green-900/20 active:scale-95 transition-all"
            >
              Criar Primeira Turma
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8 pb-16">
          {/* MAIN TURMA CARD - COMPACT GREEN MODEL */}
          {mainTurma && (() => {
            const tEncontros = encontros.filter(e => e.turmaId === mainTurma.id);
            const tCatequizandos = catequizandos.filter(c => c.turmaId === mainTurma.id);
            const etapa = ETAPAS_CATEQUESE.find(e => e.id === mainTurma.etapa);
            const mainTurmaComunidade = comunidades.find(c => c.id === mainTurma.comunidadeId)?.nome || "Comunidade não informada";
            
            return (
              <div
                onClick={() => navigate(`/turmas/${mainTurma.id}`)}
                className="liturgical-frame overflow-hidden rounded-[2rem] cursor-pointer group animate-card-activate shadow-lg"
              >
                {/* Liturgical Rays Background */}
                <div className="absolute inset-0 liturgical-rays-bg animate-sacred-rays opacity-40" />
                
                {/* Content Container - Compact Split Layout */}
                <div className="relative z-10 bg-liturgical-paper/60 backdrop-blur-[2px] flex flex-col md:flex-row">
                  {/* Accent Side */}
                  <div className="w-full md:w-24 bg-liturgical-green flex md:flex-col items-center justify-between p-4 md:py-6 text-white shrink-0">
                     <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <UsersRound className="h-5 w-5" />
                     </div>
                     <div className="flex flex-col items-end md:items-center">
                        <span className="text-xl font-black leading-none">{tCatequizandos.length}</span>
                        <span className="text-[8px] font-black uppercase tracking-tighter opacity-70">Alunos</span>
                     </div>
                  </div>

                  {/* Info Side */}
                  <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
                    <div className="space-y-1 mb-4">
                      <div className="flex items-center gap-2 mb-1">
                         <div className="px-2 py-0.5 rounded-full bg-liturgical-green/10 text-liturgical-green text-[8px] font-black uppercase tracking-widest border border-liturgical-green/10">
                            Principal
                         </div>
                         {mainTurma.isShared && (
                           <Link2 className="h-3 w-3 text-emerald-600" />
                         )}
                      </div>
                      <h2 className="text-2xl font-black text-foreground tracking-tight leading-tight font-liturgical group-hover:text-liturgical-green transition-colors">
                        {mainTurma.nome}
                        <span className="ml-1.5 text-muted-foreground/40 text-lg font-bold">'{mainTurma.ano.toString().slice(-2)}</span>
                      </h2>
                      <p className="text-[10px] font-black text-liturgical-green/60 uppercase tracking-widest">{mainTurmaComunidade}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-liturgical-green/5">
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-liturgical-green/40" />
                          <span className="text-[11px] font-medium">{mainTurma.diaCatequese} • {mainTurma.horario}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-liturgical-green/20" />
                          <span className="text-[11px] font-black text-foreground/70 uppercase tracking-tighter">{tEncontros.length} enc.</span>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-liturgical-green text-white flex items-center justify-center shadow-md active:scale-90 transition-all">
                        <Plus className="h-4 w-4 rotate-45" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* SECONDARY TURMAS */}
          {secondaryTurmas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {secondaryTurmas.map((turma, i) => {
                const etapa = ETAPAS_CATEQUESE.find(e => e.id === turma.etapa);
                const turmaComunidade = comunidades.find(c => c.id === turma.comunidadeId)?.nome;
                
                return (
                  <div
                    key={turma.id}
                    onClick={() => handleSelectSecondary(turma.id)}
                    className="group relative flex flex-col p-6 rounded-[2rem] bg-liturgical-paper border liturgical-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer animate-liturgical-float"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    {/* Inner decoration */}
                    <div className="absolute top-3 right-3 w-8 h-8 border-t border-r border-liturgical-green/10 rounded-tr-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex items-start justify-between mb-5 relative z-10">
                      <div className="w-11 h-11 rounded-2xl bg-white shadow-sm border liturgical-border flex items-center justify-center group-hover:bg-liturgical-green group-hover:text-white transition-all duration-500">
                        <UsersRound className="h-5 w-5 text-liturgical-green/80 group-hover:text-white" />
                      </div>
                      {turma.isShared && (
                        <div className="p-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                          <Link2 className="h-3 w-3" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 relative z-10">
                      <h4 className="text-lg font-black text-foreground font-liturgical group-hover:text-liturgical-green transition-colors line-clamp-1">
                        {turma.nome}
                      </h4>
                      {turmaComunidade && (
                        <p className="text-[9px] font-black text-liturgical-green/60 uppercase tracking-widest line-clamp-1">
                          {turmaComunidade}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 flex items-center justify-between pt-4 border-t border-liturgical-green/5 relative z-10">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                        <CalendarDays className="h-3 w-3 text-liturgical-green/30" />
                        <span>{turma.diaCatequese} • {turma.horario}</span>
                      </div>
                      <button className="text-[9px] font-black text-liturgical-green uppercase tracking-widest px-3 py-1.5 rounded-xl bg-white border liturgical-border hover:bg-liturgical-green hover:text-white transition-all shadow-sm">
                        Selecionar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <JoinTurmaModal 
        open={joinModalOpen} 
        onClose={() => setJoinModalOpen(false)} 
      />
    </div>
  );
}
