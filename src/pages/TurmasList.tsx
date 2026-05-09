import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useCatequizandos, useComunidades } from "@/hooks/useSupabaseData";
import { JoinTurmaModal } from "@/components/JoinTurmaModal";
import { BookOpen, Plus, CalendarDays, Users, Link2, ArrowRight, UsersRound, Star, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Palette: vivid gradients for each turma
const CARD_PALETTES = [
  { bg: "from-[#10B981] to-[#047857]", accent: "bg-white/20", text: "text-white", sub: "text-white/80", border: "border-white/20", badge: "bg-white/25 text-white" }, // Vivid Emerald/Green
  { bg: "from-[#3B82F6] to-[#1D4ED8]", accent: "bg-white/20", text: "text-white", sub: "text-white/80", border: "border-white/20", badge: "bg-white/25 text-white" }, // Vivid Blue
  { bg: "from-[#8B5CF6] to-[#6D28D9]", accent: "bg-white/20", text: "text-white", sub: "text-white/80", border: "border-white/20", badge: "bg-white/25 text-white" }, // Vivid Purple
  { bg: "from-[#F43F5E] to-[#BE123C]", accent: "bg-white/20", text: "text-white", sub: "text-white/80", border: "border-white/20", badge: "bg-white/25 text-white" }, // Vivid Rose/Red
  { bg: "from-[#0EA5E9] to-[#0369A1]", accent: "bg-white/20", text: "text-white", sub: "text-white/80", border: "border-white/20", badge: "bg-white/25 text-white" }, // Vivid Sky Blue
  { bg: "from-[#F59E0B] to-[#B45309]", accent: "bg-white/20", text: "text-white", sub: "text-white/80", border: "border-white/20", badge: "bg-white/25 text-white" }, // Vivid Amber/Gold
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
  const [clickingId, setClickingId] = useState<string | null>(null);

  // Sort by criadoEm ascending (first created = first shown)
  const turmas = [...turmasRaw].sort((a, b) => {
    const da = a.criadoEm ? new Date(a.criadoEm).getTime() : 0;
    const db = b.criadoEm ? new Date(b.criadoEm).getTime() : 0;
    return da - db;
  });

  const handleTurmaClick = (id: string) => {
    setClickingId(id);
    setTimeout(() => {
      navigate(`/turmas/${id}`);
    }, 300); // Matches the animation duration mostly
  };

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
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white shadow-lg active:scale-95 transition-all font-bold text-xs uppercase tracking-widest hover:brightness-110"
          style={{ background: "linear-gradient(135deg, #0B8A7C, #0E9B8A)" }}
        >
          <Plus className="h-4 w-4" /> Nova Turma
        </button>
      </div>

      {/* Join with Code Card — colorful & elegant */}
      <div
        onClick={() => setJoinModalOpen(true)}
        className="group relative overflow-hidden flex items-center gap-4 p-5 rounded-[1.75rem] cursor-pointer active:scale-[0.98] transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 animate-fade-in animate-card-float"
        style={{ background: "linear-gradient(135deg, #0EA5E9 0%, #2563EB 50%, #4F46E5 100%)", animationDelay: "0ms" }}
      >
        {/* Glow blobs */}
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/20 blur-2xl pointer-events-none group-hover:bg-white/30 transition-colors duration-500" />
        <div className="absolute -bottom-4 left-8 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none group-hover:bg-white/20 transition-colors duration-500" />

        {/* Animated icon */}
        <div className="relative w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-lg shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
          <Link2 className="h-7 w-7" />
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-300 flex items-center justify-center shadow-glow">
            <Sparkles className="h-2.5 w-2.5 text-yellow-800 animate-pulse" />
          </div>
        </div>

        <div className="relative z-10 flex-1">
          <p className="text-base font-black text-white font-liturgical leading-tight">Entrar em uma Turma</p>
          <p className="text-[10px] font-bold text-white/80 uppercase tracking-[0.2em] mt-0.5">Com código de acesso</p>
        </div>
        <ArrowRight className="h-5 w-5 text-white/60 group-hover:text-white group-hover:translate-x-1.5 transition-all shrink-0 relative z-10" />
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
            className="px-8 py-3.5 rounded-full text-white font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg, #0B8A7C, #0E9B8A)" }}
          >
            Criar Primeira Turma
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {turmas.map((turma, i) => {
            const tEncontros = encontros.filter(e => e.turmaId === turma.id);
            const tCatequizandos = catequizandos.filter(c => c.turmaId === turma.id);
            const turmaCom = comunidades.find(c => c.id === turma.comunidadeId)?.nome;
            const palette = CARD_PALETTES[i % CARD_PALETTES.length];
            const dataCriacao = formatDate(turma.criadoEm);
            const isFirst = i === 0;
            const isClicking = clickingId === turma.id;

            return (
              <div
                key={turma.id}
                onClick={() => handleTurmaClick(turma.id)}
                className={cn(
                  "group relative overflow-hidden rounded-[1.75rem] cursor-pointer transition-all shadow-lg hover:shadow-2xl animate-fade-in animate-card-float",
                  isClicking && "animate-card-select shadow-none"
                )}
                style={{ animationDelay: `${(i + 1) * 150}ms` }}
              >
                {/* Colored gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${palette.bg} transition-transform duration-700 group-hover:scale-105`} />
                {/* Subtle light blobs */}
                <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/20 blur-3xl pointer-events-none group-hover:bg-white/30 transition-colors duration-500" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-black/20 blur-2xl pointer-events-none group-hover:bg-black/10 transition-colors duration-500" />

                <div className="relative z-10 flex items-center gap-4 p-5">
                  {/* Animated Icon */}
                  <div className={cn(
                    `w-14 h-14 rounded-2xl ${palette.accent} border ${palette.border} flex items-center justify-center text-white shadow-lg shrink-0 transition-all duration-500`,
                    "group-hover:scale-110 group-hover:-rotate-6",
                    isClicking && "scale-90 rotate-12"
                  )}>
                    <UsersRound className="h-7 w-7" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className={`text-lg font-black ${palette.text} truncate font-liturgical leading-tight`}>{turma.nome}</h3>
                      {isFirst && (
                        <span className="shrink-0 flex items-center gap-0.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-950 shadow-sm">
                          <Star className="h-2.5 w-2.5" /> Primeira
                        </span>
                      )}
                      {turma.isShared && (
                        <span className={`shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${palette.badge}`}>Partilhada</span>
                      )}
                    </div>

                    {turmaCom && (
                      <p className={`text-[10px] font-bold ${palette.sub} uppercase tracking-widest truncate mb-2`}>{turmaCom}</p>
                    )}

                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`flex items-center gap-1.5 text-[10px] ${palette.sub} font-bold bg-black/10 px-2 py-1 rounded-md`}>
                        <CalendarDays className="h-3 w-3 opacity-70" />
                        {turma.diaCatequese} • {turma.horario}
                      </span>
                      <span className={`flex items-center gap-1.5 text-[10px] ${palette.sub} font-bold bg-black/10 px-2 py-1 rounded-md`}>
                        <Users className="h-3 w-3 opacity-70" />
                        {tCatequizandos.length} catequiz. • {tEncontros.length} enc.
                      </span>
                    </div>

                    {dataCriacao && (
                      <p className={`text-[9px] ${palette.sub} font-bold mt-2.5 opacity-80 uppercase tracking-wider`}>
                        Criada em {dataCriacao}
                      </p>
                    )}
                  </div>

                  {/* Year + Arrow */}
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <span className={`text-xs font-black ${palette.badge} px-2.5 py-1 rounded-lg shadow-sm backdrop-blur-sm`}>{turma.ano}</span>
                    <div className={cn(
                      "w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20 transition-all duration-300",
                      "group-hover:bg-white/20 group-hover:translate-x-1"
                    )}>
                      <ArrowRight className="h-4 w-4 text-white" />
                    </div>
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
