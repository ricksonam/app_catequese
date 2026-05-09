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
      {/* Header - Premium iOS Style */}
      <div className="flex flex-col gap-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-foreground tracking-tight">Turmas</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Gerenciamento Geral</p>
          </div>
          <button 
            onClick={() => navigate("/turmas/nova")} 
            className="w-12 h-12 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 flex items-center justify-center active:scale-90 transition-all group"
          >
            <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setJoinModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-card border border-border/60 text-muted-foreground hover:bg-muted/50 transition-all active:scale-95 shadow-sm"
          >
            <Link2 className="h-4 w-4" /> Entrar com Código
          </button>
        </div>
      </div>

      {turmas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-float-up">
          <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-inner">
            <BookOpen className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-black text-foreground mb-2">Nenhuma turma encontrada</h3>
          <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed mb-8">
            Você ainda não faz parte de nenhuma turma. Comece criando uma nova ou entrando com um código.
          </p>
          <div className="flex flex-col w-full gap-3">
            <button
              onClick={() => navigate("/turmas/nova")}
              className="w-full py-4 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              Criar Nova Turma
            </button>
            <button
              onClick={() => setJoinModalOpen(true)}
              className="w-full py-4 rounded-2xl bg-card border border-border/60 text-muted-foreground font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
            >
              Entrar com Código
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8 pb-10">
          {/* MAIN TURMA CARD - HERO STYLE */}
          {mainTurma && (() => {
            const tEncontros = encontros.filter(e => e.turmaId === mainTurma.id);
            const tCatequizandos = catequizandos.filter(c => c.turmaId === mainTurma.id);
            const etapa = ETAPAS_CATEQUESE.find(e => e.id === mainTurma.etapa);
            const mainTurmaComunidade = comunidades.find(c => c.id === mainTurma.comunidadeId)?.nome || "Comunidade não informada";
            
            return (
              <div
                onClick={() => navigate(`/turmas/${mainTurma.id}`)}
                className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-primary/95 to-liturgical/90 shadow-[0_20px_50px_rgba(var(--primary),0.25)] animate-card-activate cursor-pointer group"
              >
                {/* Visual Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/10 rounded-full blur-3xl -ml-10 -mb-10 animate-sacred-rays" />
                
                {/* Content Container */}
                <div className="relative z-10 p-6 md:p-8 flex flex-col min-h-[220px]">
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20">
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Turma Ativa</span>
                    </div>
                    {mainTurma.isShared && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/20">
                        <Link2 className="h-3 w-3 text-emerald-100" />
                        <span className="text-[10px] font-black text-emerald-100 uppercase tracking-widest">Compartilhada</span>
                      </div>
                    )}
                  </div>

                  {/* Title Area */}
                  <div className="mb-8">
                    <h2 className="text-3xl font-black text-white tracking-tight leading-none mb-2 group-hover:scale-[1.02] transition-transform duration-500 origin-left">
                      {mainTurma.nome}
                      <span className="ml-2 text-white/50 text-xl font-bold">{mainTurma.ano}</span>
                    </h2>
                    <div className="flex items-center gap-2 text-white/70">
                      <p className="text-xs font-bold uppercase tracking-wider">{mainTurmaComunidade}</p>
                      <span className="w-1 h-1 rounded-full bg-white/30" />
                      <p className="text-xs font-medium">{mainTurma.diaCatequese} às {mainTurma.horario}</p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-auto">
                    <div className="flex flex-col gap-1 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 group-hover:bg-white/15 transition-colors">
                      <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Encontros</span>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-white/80" />
                        <span className="text-lg font-black text-white">{tEncontros.length}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 group-hover:bg-white/15 transition-colors">
                      <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Catequizandos</span>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-white/80" />
                        <span className="text-lg font-black text-white">{tCatequizandos.length}</span>
                      </div>
                    </div>
                    {etapa && (
                      <div className="col-span-2 flex flex-col gap-1 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 group-hover:bg-white/15 transition-colors">
                        <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Etapa Atual</span>
                        <span className="text-sm font-black text-white line-clamp-1">{etapa.label}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="relative z-10 bg-white/10 backdrop-blur-xl border-t border-white/10 px-6 py-4 flex items-center justify-between group-hover:bg-white/20 transition-all">
                  <span className="text-xs font-black text-white uppercase tracking-widest">Acessar Painel Completo</span>
                  <div className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Plus className="h-5 w-5 rotate-45" />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* SECONDARY TURMAS - IOS PLATTER STYLE */}
          {secondaryTurmas.length > 0 && (
            <div className="space-y-4 pt-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                  Outras Turmas
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                  {secondaryTurmas.length} {secondaryTurmas.length === 1 ? 'turma' : 'turmas'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {secondaryTurmas.map((turma, i) => {
                  const etapa = ETAPAS_CATEQUESE.find(e => e.id === turma.etapa);
                  const turmaComunidade = comunidades.find(c => c.id === turma.comunidadeId)?.nome;
                  
                  return (
                    <div
                      key={turma.id}
                      onClick={() => handleSelectSecondary(turma.id)}
                      className="group relative flex flex-col p-5 rounded-[2rem] bg-card border border-border/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer animate-fade-in"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-500">
                          <UsersRound className="h-6 w-6 text-primary/70" />
                        </div>
                        {turma.isShared && (
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/10">
                            <Link2 className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-lg font-black text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {turma.nome}
                        </h4>
                        {turmaComunidade && (
                          <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest line-clamp-1">
                            {turmaComunidade}
                          </p>
                        )}
                        <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5" />
                          <span>{turma.diaCatequese} • {turma.horario}</span>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between pt-4 border-t border-border/50">
                        {etapa ? (
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                            {etapa.label.split(' ')[0]}
                          </span>
                        ) : <div />}
                        <button className="text-[10px] font-black text-primary uppercase tracking-widest px-3 py-1.5 rounded-full bg-primary/5 hover:bg-primary/10 transition-colors">
                          Selecionar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
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
