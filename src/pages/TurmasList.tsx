import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useCatequizandos, useComunidades } from "@/hooks/useSupabaseData";
import { JoinTurmaModal } from "@/components/JoinTurmaModal";
import { BookOpen, Plus, CalendarDays, Users, Link2, ArrowRight, UsersRound, Star, Sparkles } from "lucide-react";

// Palette: each turma gets a unique color theme
const CARD_PALETTES = [
  { bg: "from-[#1B4D2E] to-[#2D7A4F]", accent: "bg-white/15", text: "text-white", sub: "text-white/60", border: "border-white/10", badge: "bg-white/20 text-white" },
  { bg: "from-[#1A3A5C] to-[#2563B0]", accent: "bg-white/15", text: "text-white", sub: "text-white/60", border: "border-white/10", badge: "bg-white/20 text-white" },
  { bg: "from-[#5B1A6E] to-[#8B2FC9]", accent: "bg-white/15", text: "text-white", sub: "text-white/60", border: "border-white/10", badge: "bg-white/20 text-white" },
  { bg: "from-[#7A2020] to-[#C0392B]", accent: "bg-white/15", text: "text-white", sub: "text-white/60", border: "border-white/10", badge: "bg-white/20 text-white" },
  { bg: "from-[#1A5C52] to-[#0E9B8A]", accent: "bg-white/15", text: "text-white", sub: "text-white/60", border: "border-white/10", badge: "bg-white/20 text-white" },
  { bg: "from-[#7A5C1A] to-[#C47D0E]", accent: "bg-white/15", text: "text-white", sub: "text-white/60", border: "border-white/10", badge: "bg-white/20 text-white" },
];

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return null; }
}

export default function TurmasList() {
  const navigate = useNavigate();
  const { data: turmasRaw = [], isLoading } = useTurmas();
  const { data: encontros = [] } = useEncontros();
  const { data: catequizandos = [] } = useCatequizandos();
  const { data: comunidades = [] } = useComunidades();
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  // Sort by criadoEm ascending (first created = first shown)
  const turmas = [...turmasRaw].sort((a, b) => {
    const da = a.criadoEm ? new Date(a.criadoEm).getTime() : 0;
    const db = b.criadoEm ? new Date(b.criadoEm).getTime() : 0;
    return da - db;
  });

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
        <button
          onClick={() => navigate("/turmas/nova")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white shadow-lg active:scale-95 transition-all font-bold text-xs uppercase tracking-widest"
          style={{ background: "linear-gradient(135deg, #0B8A7C, #0E9B8A)" }}
        >
          <Plus className="h-4 w-4" /> Nova Turma
        </button>
      </div>

      {/* Join with Code Card — colorful & elegant */}
      <div
        onClick={() => setJoinModalOpen(true)}
        className="group relative overflow-hidden flex items-center gap-4 p-5 rounded-[1.75rem] cursor-pointer active:scale-[0.98] transition-all shadow-xl animate-fade-in"
        style={{ background: "linear-gradient(135deg, #0E4D6E 0%, #1565A0 50%, #1976D2 100%)" }}
      >
        {/* Glow blobs */}
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-4 left-8 w-20 h-20 rounded-full bg-white/5 blur-xl pointer-events-none" />

        {/* Animated icon */}
        <div className="relative w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-lg shrink-0 group-hover:scale-110 transition-transform duration-500">
          <Link2 className="h-7 w-7 animate-pulse" />
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-300 flex items-center justify-center">
            <Sparkles className="h-2.5 w-2.5 text-yellow-800" />
          </div>
        </div>

        <div className="relative z-10 flex-1">
          <p className="text-base font-black text-white font-liturgical leading-tight">Entrar em uma Turma</p>
          <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em] mt-0.5">Com código de acesso</p>
        </div>
        <ArrowRight className="h-5 w-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 relative z-10" />
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
            className="px-8 py-3.5 rounded-full text-white font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg, #0B8A7C, #0E9B8A)" }}
          >
            Criar Primeira Turma
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {turmas.map((turma, i) => {
            const tEncontros = encontros.filter(e => e.turmaId === turma.id);
            const tCatequizandos = catequizandos.filter(c => c.turmaId === turma.id);
            const turmaCom = comunidades.find(c => c.id === turma.comunidadeId)?.nome;
            const palette = CARD_PALETTES[i % CARD_PALETTES.length];
            const dataCriacao = formatDate(turma.criadoEm);
            const isFirst = i === 0;

            return (
              <div
                key={turma.id}
                onClick={() => navigate(`/turmas/${turma.id}`)}
                className="group relative overflow-hidden rounded-[1.75rem] cursor-pointer active:scale-[0.98] transition-all shadow-lg hover:shadow-xl animate-fade-in"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                {/* Colored gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${palette.bg}`} />
                {/* Subtle light blobs */}
                <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-black/10 blur-2xl pointer-events-none" />

                <div className="relative z-10 flex items-center gap-4 p-5">
                  {/* Animated Icon */}
                  <div className={`w-13 h-13 w-14 h-14 rounded-2xl ${palette.accent} border ${palette.border} flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                    <UsersRound className="h-6 w-6 group-hover:animate-bounce" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <h3 className={`text-base font-black ${palette.text} truncate font-liturgical`}>{turma.nome}</h3>
                      {isFirst && (
                        <span className="shrink-0 flex items-center gap-0.5 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-400/90 text-yellow-900">
                          <Star className="h-2.5 w-2.5" /> Primeira
                        </span>
                      )}
                      {turma.isShared && (
                        <span className={`shrink-0 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${palette.badge}`}>Partilhada</span>
                      )}
                    </div>

                    {turmaCom && (
                      <p className={`text-[9px] font-bold ${palette.sub} uppercase tracking-widest truncate mb-1.5`}>{turmaCom}</p>
                    )}

                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`flex items-center gap-1 text-[10px] ${palette.sub} font-bold`}>
                        <CalendarDays className="h-3 w-3 text-white/40" />
                        {turma.diaCatequese} • {turma.horario}
                      </span>
                      <span className={`flex items-center gap-1 text-[10px] ${palette.sub} font-bold`}>
                        <Users className="h-3 w-3 text-white/40" />
                        {tCatequizandos.length} catequiz. • {tEncontros.length} enc.
                      </span>
                    </div>

                    {dataCriacao && (
                      <p className={`text-[9px] ${palette.sub} font-bold mt-1.5 opacity-60`}>
                        Criada em {dataCriacao}
                      </p>
                    )}
                  </div>

                  {/* Year + Arrow */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-xs font-black ${palette.badge} px-2 py-0.5 rounded-lg`}>{turma.ano}</span>
                    <ArrowRight className={`h-4 w-4 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all`} />
                  </div>
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
