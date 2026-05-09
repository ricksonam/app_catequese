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

        {/* Join Turma Card - Sacred Tablet Style */}
        <div
          onClick={() => setJoinModalOpen(true)}
          className="group relative flex flex-col items-center justify-center p-8 rounded-[2.5rem] bg-liturgical-paper border-2 border-dashed border-liturgical-green/20 hover:border-liturgical-green/40 hover:bg-white transition-all active:scale-[0.98] cursor-pointer overflow-hidden animate-fade-in"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-liturgical-green/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-14 h-14 rounded-full bg-white border liturgical-border flex items-center justify-center text-liturgical-green shadow-sm group-hover:scale-110 transition-transform duration-500 mb-4 relative z-10">
            <Link2 className="h-7 w-7" />
          </div>
          <div className="text-center relative z-10">
            <h3 className="text-lg font-black text-foreground font-liturgical">Entrar em uma Turma</h3>
            <p className="text-[10px] font-bold text-liturgical-green/60 uppercase tracking-[0.2em] mt-1">Com código de acesso</p>
          </div>
        </div>
      </div>

      {turmas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-liturgical-float bg-liturgical-paper rounded-[3rem] border liturgical-border shadow-inner">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-liturgical-green mb-8 shadow-xl border liturgical-border">
            <BookOpen className="h-10 w-10 animate-sacred-rays" />
          </div>
          <h3 className="text-3xl font-black text-foreground mb-4 font-liturgical">Semeie a Palavra</h3>
          <p className="text-sm text-muted-foreground max-w-[340px] leading-relaxed mb-12 italic">
            "Ide por todo o mundo e pregai o Evangelho a toda criatura." <br/>
            <span className="text-[10px] uppercase font-bold not-italic tracking-wider mt-3 block">— Marcos 16:15</span>
          </p>
          <button
            onClick={() => navigate("/turmas/nova")}
            className="px-10 py-4 rounded-full bg-liturgical-green text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-green-900/20 active:scale-95 transition-all"
          >
            Criar Primeira Turma
          </button>
        </div>
      ) : (
        <div className="space-y-10 pb-16">
          {/* MAIN TURMA CARD - SACRED TABLET MODEL */}
          {mainTurma && (() => {
            const tEncontros = encontros.filter(e => e.turmaId === mainTurma.id);
            const tCatequizandos = catequizandos.filter(c => c.turmaId === mainTurma.id);
            const etapa = ETAPAS_CATEQUESE.find(e => e.id === mainTurma.etapa);
            const mainTurmaComunidade = comunidades.find(c => c.id === mainTurma.comunidadeId)?.nome || "Comunidade não informada";
            
            return (
              <div
                onClick={() => navigate(`/turmas/${mainTurma.id}`)}
                className="relative overflow-hidden rounded-[3rem] cursor-pointer group animate-card-activate shadow-2xl border-2 border-liturgical-green/10"
              >
                {/* Sacred Background with Gradient */}
                <div className="absolute inset-0 bg-liturgical-paper" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-liturgical-green/[0.02] to-liturgical-green/10" />
                <div className="absolute inset-0 liturgical-rays-bg animate-sacred-rays opacity-30" />
                
                {/* Liturgical Watermark Icon */}
                <div className="absolute -right-8 -top-8 w-48 h-48 text-liturgical-green/[0.03] rotate-12 pointer-events-none">
                  <UsersRound className="w-full h-full" />
                </div>

                <div className="relative z-10 p-10 md:p-14 flex flex-col items-center text-center">
                  {/* Status Badge */}
                  <div className="mb-8 flex items-center gap-2 px-5 py-2 rounded-full bg-white/90 backdrop-blur-md border border-liturgical-green/20 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-liturgical-green animate-pulse" />
                    <span className="text-[10px] font-black text-liturgical-green uppercase tracking-[0.2em]">Turma em Foco</span>
                  </div>

                  {/* Title Section */}
                  <div className="mb-10 space-y-3">
                    <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tight leading-none font-liturgical group-hover:scale-[1.02] transition-transform duration-700">
                      {mainTurma.nome}
                    </h2>
                    <div className="flex flex-col items-center">
                      <p className="text-xs font-black text-liturgical-green/60 uppercase tracking-[0.3em]">{mainTurmaComunidade}</p>
                      <div className="h-[1px] w-12 bg-liturgical-green/20 my-3" />
                      <div className="flex items-center gap-4 text-muted-foreground/60 font-bold uppercase tracking-widest text-[10px]">
                         <span>Ano {mainTurma.ano}</span>
                         <span className="w-1 h-1 rounded-full bg-liturgical-green/30" />
                         <span>{mainTurma.diaCatequese} às {mainTurma.horario}</span>
                      </div>
                    </div>
                  </div>

                  {/* Integrated Stats Area */}
                  <div className="grid grid-cols-2 gap-12 md:gap-20 w-full max-w-sm mb-12">
                    <div className="flex flex-col items-center gap-2">
                       <div className="w-14 h-14 rounded-2xl bg-white border liturgical-border flex items-center justify-center text-liturgical-green shadow-sm group-hover:bg-liturgical-green group-hover:text-white transition-all duration-500">
                          <UsersRound className="h-7 w-7" />
                       </div>
                       <div className="text-center">
                          <span className="block text-2xl font-black text-foreground leading-none">{tCatequizandos.length}</span>
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Catequizandos</span>
                       </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                       <div className="w-14 h-14 rounded-2xl bg-white border liturgical-border flex items-center justify-center text-liturgical-green shadow-sm group-hover:bg-liturgical-green group-hover:text-white transition-all duration-500">
                          <CalendarDays className="h-7 w-7" />
                       </div>
                       <div className="text-center">
                          <span className="block text-2xl font-black text-foreground leading-none">{tEncontros.length}</span>
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Encontros</span>
                       </div>
                    </div>
                  </div>

                  {/* Integrated Action Button */}
                  <button className="w-full max-w-[280px] py-4 rounded-2xl bg-liturgical-green text-white font-black text-xs uppercase tracking-[0.25em] shadow-xl shadow-green-900/20 active:scale-95 transition-all flex items-center justify-center gap-3 group/btn">
                    Acessar Painel
                    <Plus className="h-4 w-4 rotate-45 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })()}

          {/* SECONDARY TURMAS - FRAMED ENTRIES */}
          {secondaryTurmas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {secondaryTurmas.map((turma, i) => {
                const etapa = ETAPAS_CATEQUESE.find(e => e.id === turma.etapa);
                const turmaComunidade = comunidades.find(c => c.id === turma.comunidadeId)?.nome;
                
                return (
                  <div
                    key={turma.id}
                    onClick={() => handleSelectSecondary(turma.id)}
                    className="group relative flex flex-col p-8 rounded-[2.5rem] bg-liturgical-paper border-2 border-transparent hover:border-liturgical-green/10 shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer animate-liturgical-float overflow-hidden"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    {/* Background Subtle Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-liturgical-green/[0.03] opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex items-start justify-between mb-6 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-white border liturgical-border flex items-center justify-center text-liturgical-green shadow-sm group-hover:scale-110 transition-all duration-500">
                        <Users className="h-6 w-6" />
                      </div>
                      {turma.isShared && (
                        <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] font-black uppercase tracking-widest">
                          Partilhada
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 relative z-10">
                      <h4 className="text-xl font-black text-foreground font-liturgical group-hover:text-liturgical-green transition-colors line-clamp-1">
                        {turma.nome}
                      </h4>
                      {turmaComunidade && (
                        <p className="text-[9px] font-black text-liturgical-green/60 uppercase tracking-[0.2em] line-clamp-1">
                          {turmaComunidade}
                        </p>
                      )}
                    </div>

                    <div className="mt-8 flex items-center justify-between pt-6 border-t border-liturgical-green/5 relative z-10">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/80 font-bold uppercase tracking-tighter">
                          <CalendarDays className="h-3 w-3" />
                          <span>{turma.diaCatequese} • {turma.horario}</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white border liturgical-border flex items-center justify-center text-liturgical-green/40 group-hover:text-liturgical-green group-hover:bg-liturgical-green/5 transition-all">
                        <Plus className="h-5 w-5 rotate-45" />
                      </div>
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
