import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useCatequizandos, useComunidades } from "@/hooks/useSupabaseData";
import { JoinTurmaModal } from "@/components/JoinTurmaModal";
import { BookOpen, Plus, CalendarDays, Users, Link2, ArrowRight, UsersRound } from "lucide-react";

export default function TurmasList() {
  const navigate = useNavigate();
  const { data: turmas = [], isLoading } = useTurmas();
  const { data: encontros = [] } = useEncontros();
  const { data: catequizandos = [] } = useCatequizandos();
  const { data: comunidades = [] } = useComunidades();
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <div className="w-6 h-6 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
      <p className="text-xs font-black text-primary/60 uppercase tracking-widest animate-pulse">Carregando...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <h1 className="text-3xl font-black text-foreground tracking-tight font-liturgical">Turmas</h1>
        <button onClick={() => navigate("/turmas/nova")} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-liturgical-green text-white shadow-md active:scale-95 transition-all font-bold text-xs uppercase tracking-widest">
          <Plus className="h-4 w-4" /> Nova Turma
        </button>
      </div>

      {/* Join with Code Card */}
      <div onClick={() => setJoinModalOpen(true)} className="group flex items-center gap-4 p-4 rounded-2xl bg-white border-2 border-dashed border-liturgical-green/20 hover:border-liturgical-green/40 cursor-pointer active:scale-[0.98] transition-all shadow-sm animate-fade-in">
        <div className="w-11 h-11 rounded-xl bg-liturgical-paper border border-liturgical-green/15 flex items-center justify-center text-liturgical-green group-hover:bg-liturgical-green group-hover:text-white transition-all duration-300 shrink-0">
          <Link2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-black text-foreground">Entrar em uma Turma</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Com código de acesso</p>
        </div>
        <ArrowRight className="h-4 w-4 text-liturgical-green/30 group-hover:text-liturgical-green ml-auto transition-colors" />
      </div>

      {/* Turmas List */}
      {turmas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-liturgical-paper rounded-3xl border border-liturgical-green/10">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-liturgical-green mb-6 shadow-lg border border-liturgical-green/10">
            <BookOpen className="h-9 w-9" />
          </div>
          <h3 className="text-2xl font-black text-foreground mb-3 font-liturgical">Nenhuma turma ainda</h3>
          <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed mb-8 italic">
            "Ide por todo o mundo e pregai o Evangelho a toda criatura."
            <span className="block text-[10px] font-bold not-italic tracking-widest mt-2">— Marcos 16:15</span>
          </p>
          <button onClick={() => navigate("/turmas/nova")} className="px-8 py-3.5 rounded-full bg-liturgical-green text-white font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">
            Criar Primeira Turma
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {turmas.map((turma, i) => {
            const tEncontros = encontros.filter(e => e.turmaId === turma.id);
            const tCatequizandos = catequizandos.filter(c => c.turmaId === turma.id);
            const turmaCom = comunidades.find(c => c.id === turma.comunidadeId)?.nome;

            return (
              <div
                key={turma.id}
                onClick={() => navigate(`/turmas/${turma.id}`)}
                className="group relative overflow-hidden flex items-center gap-4 p-5 rounded-[1.75rem] bg-white border border-black/5 shadow-sm hover:shadow-lg hover:border-liturgical-green/20 active:scale-[0.98] cursor-pointer transition-all animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-liturgical-green/[0.03] opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Left accent bar */}
                <div className="w-1 self-stretch rounded-full bg-liturgical-green/20 group-hover:bg-liturgical-green transition-colors shrink-0" />

                {/* Icon */}
                <div className="w-12 h-12 rounded-2xl bg-liturgical-paper border border-liturgical-green/15 flex items-center justify-center text-liturgical-green group-hover:bg-liturgical-green group-hover:text-white transition-all duration-300 shrink-0 relative z-10">
                  <UsersRound className="h-6 w-6" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 relative z-10">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-base font-black text-foreground truncate font-liturgical">{turma.nome}</h3>
                    {turma.isShared && (
                      <span className="shrink-0 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">Partilhada</span>
                    )}
                  </div>
                  {turmaCom && (
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest truncate mb-2">{turmaCom}</p>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
                      <CalendarDays className="h-3 w-3 text-liturgical-green/40" />
                      {turma.diaCatequese} • {turma.horario}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[10px] font-black text-foreground/70">
                        <Users className="h-3 w-3 text-liturgical-green/40" />
                        {tCatequizandos.length} <span className="font-normal text-muted-foreground">catequiz.</span>
                      </span>
                      <span className="text-[10px] font-black text-foreground/70">
                        {tEncontros.length} <span className="font-normal text-muted-foreground">enc.</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Year + Arrow */}
                <div className="flex flex-col items-end gap-2 shrink-0 relative z-10">
                  <span className="text-xs font-black text-muted-foreground/40 bg-black/5 px-2 py-0.5 rounded-lg">{turma.ano}</span>
                  <ArrowRight className="h-4 w-4 text-liturgical-green/20 group-hover:text-liturgical-green group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <JoinTurmaModal open={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
    </div>
  );
}
