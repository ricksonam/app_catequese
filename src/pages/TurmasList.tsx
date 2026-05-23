import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useCatequizandos, useComunidades } from "@/hooks/useSupabaseData";
import { JoinTurmaModal } from "@/components/JoinTurmaModal";
import { BookOpen, Plus, CalendarDays, Users, Link2, ArrowRight, UsersRound, Star, Sparkles, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Zap } from "lucide-react";

// Palette: more vibrant gradients for each turma
const CARD_PALETTES = [
  {
    bg: "from-emerald-50 to-teal-50", borderMain: "border-emerald-300",
    accent: "bg-gradient-to-br from-emerald-400 to-teal-500", icon: "text-white",
    text: "text-emerald-950", sub: "text-emerald-700/80",
    chipCal: "bg-gradient-to-r from-emerald-500 to-teal-500",
    chipUsers: "bg-gradient-to-r from-green-500 to-emerald-600",
    badge: "bg-emerald-500 text-white",
  },
  {
    bg: "from-blue-50 to-indigo-50", borderMain: "border-blue-300",
    accent: "bg-gradient-to-br from-blue-400 to-indigo-500", icon: "text-white",
    text: "text-blue-950", sub: "text-blue-700/80",
    chipCal: "bg-gradient-to-r from-blue-500 to-indigo-500",
    chipUsers: "bg-gradient-to-r from-indigo-500 to-blue-600",
    badge: "bg-blue-500 text-white",
  },
  {
    bg: "from-purple-50 to-violet-50", borderMain: "border-purple-300",
    accent: "bg-gradient-to-br from-purple-400 to-violet-500", icon: "text-white",
    text: "text-purple-950", sub: "text-purple-700/80",
    chipCal: "bg-gradient-to-r from-purple-500 to-violet-500",
    chipUsers: "bg-gradient-to-r from-violet-500 to-purple-600",
    badge: "bg-purple-500 text-white",
  },
  {
    bg: "from-rose-50 to-pink-50", borderMain: "border-rose-300",
    accent: "bg-gradient-to-br from-rose-400 to-pink-500", icon: "text-white",
    text: "text-rose-950", sub: "text-rose-700/80",
    chipCal: "bg-gradient-to-r from-rose-500 to-pink-500",
    chipUsers: "bg-gradient-to-r from-pink-500 to-rose-600",
    badge: "bg-rose-500 text-white",
  },
  {
    bg: "from-sky-50 to-cyan-50", borderMain: "border-sky-300",
    accent: "bg-gradient-to-br from-sky-400 to-cyan-500", icon: "text-white",
    text: "text-sky-950", sub: "text-sky-700/80",
    chipCal: "bg-gradient-to-r from-sky-500 to-cyan-500",
    chipUsers: "bg-gradient-to-r from-cyan-500 to-sky-600",
    badge: "bg-sky-500 text-white",
  },
  {
    bg: "from-amber-50 to-orange-50", borderMain: "border-amber-300",
    accent: "bg-gradient-to-br from-amber-400 to-orange-500", icon: "text-white",
    text: "text-amber-950", sub: "text-amber-700/80",
    chipCal: "bg-gradient-to-r from-amber-500 to-orange-500",
    chipUsers: "bg-gradient-to-r from-orange-500 to-amber-600",
    badge: "bg-amber-500 text-white",
  },
];

// ... (skipping formatDate)

// Inside TurmasList.tsx return:
// (Wait, I need to match the actual code lines)


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

  const selectedTurmaId = localStorage.getItem("ivc_selected_turma");

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
      <div className="flex flex-col items-center justify-center gap-4 animate-fade-in text-center">
        <h1 className="text-3xl font-black text-foreground tracking-tight font-liturgical">Turmas</h1>
      </div>

      <div className="flex flex-row items-stretch gap-3">
        {/* Join with Code Card — Premium & Compact */}
        <button
          onClick={() => setJoinModalOpen(true)}
          className="flex-[1.2] group relative overflow-hidden flex flex-row items-center justify-center gap-2.5 px-3 py-2 rounded-[1.2rem] bg-white cursor-pointer active:scale-95 transition-all duration-500 shadow-sm border-2 border-blue-400 hover:border-blue-500 shrink-0"
        >
          {/* Glass reflection */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity" />

          {/* Icon Container with animation */}
          <div className="relative z-10 w-10 h-10 shrink-0 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:-rotate-12 group-hover:bg-blue-100 transition-all duration-500">
            <Link2 className="h-5 w-5 text-blue-600 animate-pulse" />
          </div>
          
          <div className="relative z-10 flex flex-col items-start text-left">
            <span className="font-black text-[11px] uppercase tracking-widest text-blue-900 group-hover:text-blue-700 transition-colors leading-tight">
              Entrar na Turma
            </span>
            <span className="font-bold text-[9px] text-blue-500 uppercase tracking-widest leading-tight">
              com código
            </span>
          </div>

          {/* Interactive highlight overlay */}
          <div className="absolute inset-0 bg-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </button>

        {/* Nova Turma Button */}
        <button
          onClick={() => {
            navigate("/turmas/nova");
          }}
          className="group relative overflow-hidden flex flex-col items-center justify-center gap-0 px-3 py-2 rounded-[1.2rem] text-white shadow-lg active:scale-95 transition-all duration-500 font-bold text-[9px] uppercase tracking-[0.15em] border border-blue-400/40 shrink-0"
          style={{ background: "linear-gradient(135deg, #3B82F6, #1D4ED8, #1E3A8A)" }}
        >
          {/* Animated Glow Blobs */}
          <div className="absolute top-0 right-0 w-12 h-12 rounded-full bg-blue-300/20 blur-2xl pointer-events-none group-hover:bg-blue-300/40 transition-colors duration-700 -mr-2 -mt-2" />
          <div className="absolute bottom-0 left-0 w-10 h-10 rounded-full bg-indigo-500/20 blur-xl pointer-events-none group-hover:bg-indigo-500/40 transition-colors duration-700 -ml-2 -mb-2" />
          
          {/* Glass reflection */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-30 pointer-events-none group-hover:opacity-50 transition-opacity" />

          {/* Icon Container with animation */}
          <div className="relative z-10 w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-12 group-hover:bg-white/20 transition-all duration-500">
            <Plus className="h-5 w-5 text-white animate-pulse drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
          </div>
          
          <span className="relative z-10 whitespace-nowrap mt-1.5 drop-shadow-md group-hover:text-blue-100 transition-colors">
            Nova Turma
          </span>

          {/* Interactive highlight overlay */}
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
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
            const isClicking = clickingId === turma.id;

            return (
              <div
                key={turma.id}
                onClick={() => handleTurmaClick(turma.id)}
                className={cn(
                  "group relative overflow-hidden rounded-[2rem] p-0.5 cursor-pointer transition-all duration-500 shadow-lg hover:shadow-xl hover:-translate-y-1.5 active:scale-95 animate-fade-in border-2",
                  isClicking ? "scale-95 opacity-80" : "scale-100",
                  palette.borderMain
                )}
                style={{ animationDelay: `${(i + 1) * 150}ms` }}
              >
                <div className={cn(
                  "relative overflow-hidden rounded-[1.95rem] p-5 flex items-center gap-4 h-full bg-gradient-to-br",
                  palette.bg
                )}>
                  {/* Subtle glow top right */}
                  <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-20 blur-3xl pointer-events-none bg-white" />

                  {/* Animated Icon */}
                  <div className={cn(
                    `w-14 h-14 rounded-2xl ${palette.accent} flex items-center justify-center shadow-md shrink-0 transition-all duration-500`,
                    "group-hover:scale-110 group-hover:-rotate-6",
                    isClicking && "scale-90 rotate-12"
                  )}>
                    <UsersRound className={`h-7 w-7 ${palette.icon}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 pr-8">
                    <h3 className={`text-xl font-black ${palette.text} truncate font-liturgical leading-tight mb-0.5 drop-shadow-sm`}>{turma.nome}</h3>

                    {turmaCom && (
                      <p className={`text-[9px] font-bold ${palette.sub} uppercase tracking-widest truncate mb-2`}>{turmaCom}</p>
                    )}

                    <div className="flex flex-col gap-1.5 mt-1.5">
                      <div className={`flex items-center gap-1.5 text-white text-[9px] font-black px-2.5 py-1 rounded-lg shadow-sm w-fit ${palette.chipCal}`}>
                        <CalendarDays className="h-3 w-3" />
                        {turma.diaCatequese}, {turma.horario}
                      </div>
                      <div className={`flex items-center gap-1.5 text-white text-[9px] font-black px-2.5 py-1 rounded-lg shadow-sm w-fit ${palette.chipUsers}`}>
                        <Users className="h-3 w-3" />
                        {tCatequizandos.length} inscritos • {tEncontros.length} encontros
                      </div>
                    </div>

                    {dataCriacao && (
                      <p className={`text-[8px] ${palette.sub} font-bold mt-2 opacity-60 uppercase tracking-widest`}>
                        Criada em {dataCriacao}
                      </p>
                    )}
                  </div>

                  {/* Badges Stack - Top Right */}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-20">
                    {turma.ano && (
                      <span className={`text-[10px] font-black ${palette.badge} px-2 py-0.5 rounded-full shadow-sm`}>{turma.ano}</span>
                    )}

                    {turma.isShared && (
                      <span className={`shrink-0 text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${palette.badge} shadow-sm`}>
                        Partilhada
                      </span>
                    )}

                    {turma.id === selectedTurmaId && (
                      <span className="shrink-0 flex items-center gap-0.5 text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-950 shadow-sm border border-yellow-500/20">
                        <Sparkles className="h-2 w-2" /> Selecionada
                      </span>
                    )}

                    <div className={cn(
                      "w-7 h-7 rounded-full bg-white/40 flex items-center justify-center border border-white/60 transition-all duration-300 mt-1 shadow-sm",
                      "group-hover:bg-white/60 group-hover:translate-x-1"
                    )}>
                      <ArrowRight className={`h-3.5 w-3.5 ${palette.text}`} />
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
