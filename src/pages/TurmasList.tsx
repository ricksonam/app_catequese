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
    <div className="space-y-10">
      {/* Header - Liturgical Style */}
      <div className="flex flex-col gap-6 animate-fade-in text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-foreground tracking-tight font-liturgical">Turmas</h1>
            <div className="flex items-center justify-center md:justify-start gap-2">
               <div className="h-[1px] w-8 bg-liturgical-gold/40" />
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Comunidade de Fé</p>
               <div className="h-[1px] w-8 bg-liturgical-gold/40" />
            </div>
          </div>
          <button 
            onClick={() => navigate("/turmas/nova")} 
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-liturgical-gold text-white shadow-lg shadow-gold/20 active:scale-95 transition-all group font-bold text-sm"
          >
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            Nova Turma
          </button>
        </div>

        <div className="flex items-center justify-center md:justify-start gap-3">
          <button
            onClick={() => setJoinModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-liturgical-paper border liturgical-border text-liturgical-gold/80 hover:bg-white transition-all active:scale-95 shadow-sm"
          >
            <Link2 className="h-4 w-4" /> Ingressar com Código
          </button>
        </div>
      </div>

      {turmas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-liturgical-float bg-liturgical-paper rounded-[3rem] border liturgical-border">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-liturgical-gold mb-6 shadow-xl border liturgical-border">
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
              className="flex-1 py-4 rounded-full bg-liturgical-gold text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-gold/20 active:scale-95 transition-all"
            >
              Criar Primeira Turma
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-10 pb-16">
          {/* MAIN TURMA CARD - SACRED HERO STYLE */}
          {mainTurma && (() => {
            const tEncontros = encontros.filter(e => e.turmaId === mainTurma.id);
            const tCatequizandos = catequizandos.filter(c => c.turmaId === mainTurma.id);
            const etapa = ETAPAS_CATEQUESE.find(e => e.id === mainTurma.etapa);
            const mainTurmaComunidade = comunidades.find(c => c.id === mainTurma.comunidadeId)?.nome || "Comunidade não informada";
            
            return (
              <div
                onClick={() => navigate(`/turmas/${mainTurma.id}`)}
                className="liturgical-frame overflow-hidden rounded-[2.5rem] cursor-pointer group animate-card-activate"
              >
                {/* Liturgical Rays Background */}
                <div className="absolute inset-0 liturgical-rays-bg animate-sacred-rays opacity-50" />
                
                {/* Content Container */}
                <div className="relative z-10 bg-liturgical-paper/40 backdrop-blur-[2px] p-8 md:p-10 flex flex-col min-h-[260px]">
                  {/* Decorative Corners */}
                  <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-liturgical-gold/30 rounded-tl-2xl" />
                  <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-liturgical-gold/30 rounded-tr-2xl" />
                  
                  {/* Top Badge Row */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border liturgical-border shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-liturgical-gold animate-pulse" />
                      <span className="text-[10px] font-black text-liturgical-gold uppercase tracking-widest">Turma Principal</span>
                    </div>
                    {mainTurma.isShared && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <Link2 className="h-3 w-3 text-emerald-700" />
                        <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Partilhada</span>
                      </div>
                    )}
                  </div>

                  {/* Title Area */}
                  <div className="mb-10 text-center">
                    <h2 className="text-4xl font-black text-foreground tracking-tight leading-none mb-3 font-liturgical group-hover:scale-[1.03] transition-transform duration-700">
                      {mainTurma.nome}
                    </h2>
                    <div className="flex flex-col items-center gap-2">
                       <p className="text-xs font-black text-liturgical-gold uppercase tracking-[0.25em]">{mainTurmaComunidade}</p>
                       <div className="flex items-center gap-3 text-muted-foreground/80 mt-1">
                          <span className="text-[11px] font-bold uppercase tracking-widest">{mainTurma.ano}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-liturgical-gold/30" />
                          <span className="text-xs font-medium italic">{mainTurma.diaCatequese} às {mainTurma.horario}</span>
                       </div>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-center gap-8 md:gap-12 mt-auto">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-full bg-white shadow-md border liturgical-border flex items-center justify-center text-liturgical-gold group-hover:scale-110 transition-all">
                        <CalendarDays className="h-5 w-5" />
                      </div>
                      <div className="text-center">
                        <span className="block text-lg font-black text-foreground leading-none">{tEncontros.length}</span>
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Encontros</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-full bg-white shadow-md border liturgical-border flex items-center justify-center text-liturgical-gold group-hover:scale-110 transition-all">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="text-center">
                        <span className="block text-lg font-black text-foreground leading-none">{tCatequizandos.length}</span>
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Alunos</span>
                      </div>
                    </div>

                    {etapa && (
                      <div className="hidden sm:flex flex-col items-center gap-1.5">
                        <div className="w-10 h-10 rounded-full bg-white shadow-md border liturgical-border flex items-center justify-center text-liturgical-gold group-hover:scale-110 transition-all">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div className="text-center">
                          <span className="block text-sm font-black text-foreground leading-none line-clamp-1">{etapa.label.split(' ')[0]}</span>
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Etapa</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="relative z-10 bg-white/60 backdrop-blur-md border-t liturgical-border px-8 py-5 flex items-center justify-between group-hover:bg-white/90 transition-all">
                  <span className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">Entrar no Painel de Catequese</span>
                  <div className="flex items-center gap-2 text-liturgical-gold">
                    <span className="text-xs font-black uppercase tracking-widest">Acessar</span>
                    <Plus className="h-5 w-5 rotate-45" />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* SECONDARY TURMAS - SACRED PLATTER STYLE */}
          {secondaryTurmas.length > 0 && (
            <div className="space-y-6 pt-6">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <div className="h-[1px] w-6 bg-liturgical-gold/30" />
                  <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.25em]">Outros Rebanhos</h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-liturgical-paper border liturgical-border text-[10px] font-bold text-liturgical-gold/70">
                  {secondaryTurmas.length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {secondaryTurmas.map((turma, i) => {
                  const etapa = ETAPAS_CATEQUESE.find(e => e.id === turma.etapa);
                  const turmaComunidade = comunidades.find(c => c.id === turma.comunidadeId)?.nome;
                  
                  return (
                    <div
                      key={turma.id}
                      onClick={() => handleSelectSecondary(turma.id)}
                      className="group relative flex flex-col p-6 rounded-[2rem] bg-liturgical-paper border liturgical-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer animate-liturgical-float"
                      style={{ animationDelay: `${i * 150}ms` }}
                    >
                      {/* Inner border decoration */}
                      <div className="absolute inset-2 border border-liturgical-gold/5 rounded-[1.6rem] pointer-events-none" />
                      
                      <div className="flex items-start justify-between mb-5 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border liturgical-border flex items-center justify-center group-hover:scale-110 transition-all duration-700">
                          <UsersRound className="h-6 w-6 text-liturgical-gold/80" />
                        </div>
                        {turma.isShared && (
                          <div className="p-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                            <Link2 className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 relative z-10">
                        <h4 className="text-xl font-black text-foreground font-liturgical group-hover:text-liturgical-gold transition-colors line-clamp-1">
                          {turma.nome}
                        </h4>
                        {turmaComunidade && (
                          <p className="text-[9px] font-black text-liturgical-gold/60 uppercase tracking-[0.2em] line-clamp-1">
                            {turmaComunidade}
                          </p>
                        )}
                        <div className="flex items-center gap-2 pt-2 text-[11px] text-muted-foreground italic font-medium">
                          <CalendarDays className="h-3.5 w-3.5 text-liturgical-gold/40" />
                          <span>{turma.diaCatequese} • {turma.horario}</span>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between pt-4 border-t border-liturgical-gold/10 relative z-10">
                        {etapa ? (
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                            {etapa.label.split(' ')[0]}
                          </span>
                        ) : <div />}
                        <button className="text-[10px] font-black text-liturgical-gold uppercase tracking-widest px-4 py-2 rounded-full bg-white border liturgical-border hover:bg-liturgical-gold hover:text-white transition-all shadow-sm">
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
