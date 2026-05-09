import { useTurmas, useEncontros, useCatequizandos, useComunidades } from "@/hooks/useSupabaseData";
import { useNavigate } from "react-router-dom";
import { BookOpen, Plus, CalendarDays, Users, Link2, UsersRound } from "lucide-react";
import { useState } from "react";
import { JoinTurmaModal } from "@/components/JoinTurmaModal";

export default function TurmasList() {
  const { data: turmas = [], isLoading } = useTurmas();
  const { data: encontros = [] } = useEncontros();
  const { data: catequizandos = [] } = useCatequizandos();
  const { data: comunidades = [] } = useComunidades();
  const navigate = useNavigate();
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5">
          <div className="w-6 h-6 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
        <p className="text-xs font-black text-primary/60 uppercase tracking-widest animate-pulse">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <h1 className="text-3xl font-black text-foreground tracking-tight font-liturgical">Turmas</h1>
        <button
          onClick={() => navigate("/turmas/nova")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-liturgical-green text-white shadow-md shadow-green-900/20 active:scale-95 transition-all font-bold text-xs uppercase tracking-widest"
        >
          <Plus className="h-4 w-4" />
          Nova
        </button>
      </div>

      {/* Join with Code Card */}
      <div
        onClick={() => setJoinModalOpen(true)}
        className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-dashed border-liturgical-green/25 hover:border-liturgical-green/50 cursor-pointer active:scale-[0.98] transition-all shadow-sm animate-fade-in"
      >
        <div className="w-10 h-10 rounded-xl bg-liturgical-paper border border-liturgical-green/15 flex items-center justify-center text-liturgical-green group-hover:bg-liturgical-green group-hover:text-white transition-all shrink-0">
          <Link2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-black text-foreground">Entrar em uma Turma</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Com código de acesso</p>
        </div>
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
          <button
            onClick={() => navigate("/turmas/nova")}
            className="px-8 py-3.5 rounded-full bg-liturgical-green text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-green-900/20 active:scale-95 transition-all"
          >
            Criar Primeira Turma
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {turmas.map((turma, i) => {
            const tEncontros = encontros.filter(e => e.turmaId === turma.id);
            const tCatequizandos = catequizandos.filter(c => c.turmaId === turma.id);
            const turmaComunidade = comunidades.find(c => c.id === turma.comunidadeId)?.nome;

            return (
              <div
                key={turma.id}
                onClick={() => navigate(`/turmas/${turma.id}`)}
                className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-black/5 shadow-sm hover:shadow-md hover:border-liturgical-green/20 active:scale-[0.98] cursor-pointer transition-all animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-2xl bg-liturgical-paper border border-liturgical-green/15 flex items-center justify-center text-liturgical-green group-hover:bg-liturgical-green group-hover:text-white transition-all duration-300 shrink-0">
                  <UsersRound className="h-6 w-6" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-black text-foreground truncate font-liturgical">{turma.nome}</h3>
                    {turma.isShared && (
                      <span className="shrink-0 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">Partilhada</span>
                    )}
                  </div>
                  {turmaComunidade && (
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest truncate mb-1">{turmaComunidade}</p>
                  )}
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {turma.diaCatequese} • {turma.horario}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {tCatequizandos.length}
                    </span>
                    <span>{tEncontros.length} enc.</span>
                  </div>
                </div>

                {/* Arrow */}
                <Plus className="h-5 w-5 rotate-45 text-liturgical-green/30 group-hover:text-liturgical-green transition-colors shrink-0" />
              </div>
            );
          })}
        </div>
      )}

      <JoinTurmaModal open={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
    </div>
  );
}
