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
  { bg: "from-emerald-100 to-emerald-200", accent: "bg-emerald-300", text: "text-black", sub: "text-black/70", border: "border-emerald-300", borderMain: "border-emerald-400", badge: "bg-emerald-300 text-black", icon: "text-emerald-700" },
  { bg: "from-blue-100 to-blue-200", accent: "bg-blue-300", text: "text-black", sub: "text-black/70", border: "border-blue-300", borderMain: "border-blue-400", badge: "bg-blue-300 text-black", icon: "text-blue-700" },
  { bg: "from-purple-100 to-purple-200", accent: "bg-purple-300", text: "text-black", sub: "text-black/70", border: "border-purple-300", borderMain: "border-purple-400", badge: "bg-purple-300 text-black", icon: "text-purple-700" },
  { bg: "from-rose-100 to-rose-200", accent: "bg-rose-300", text: "text-black", sub: "text-black/70", border: "border-rose-300", borderMain: "border-rose-400", badge: "bg-rose-300 text-black", icon: "text-rose-700" },
  { bg: "from-sky-100 to-sky-200", accent: "bg-sky-300", text: "text-black", sub: "text-black/70", border: "border-sky-300", borderMain: "border-sky-400", badge: "bg-sky-300 text-black", icon: "text-sky-700" },
  { bg: "from-amber-100 to-amber-200", accent: "bg-amber-300", text: "text-black", sub: "text-black/70", border: "border-amber-300", borderMain: "border-amber-400", badge: "bg-amber-300 text-black", icon: "text-amber-700" },
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
                  "group relative overflow-hidden rounded-[2rem] p-0.5 cursor-pointer transition-all duration-500 shadow-xl hover:shadow-2xl hover:-translate-y-2 active:scale-95 animate-fade-in animate-card-float border-2",
                  isClicking ? "scale-95 opacity-80" : "scale-100",
                  palette.borderMain,
                  `bg-gradient-to-br ${palette.bg}`
                )}
                style={{ animationDelay: `${(i + 1) * 150}ms` }}
              >
                <div className={cn(
                  "relative overflow-hidden rounded-[1.95rem] bg-white p-5 flex items-center gap-5 h-full",
                  `bg-gradient-to-br ${palette.bg} border-b-4 ${palette.border}/50`
                )}>
                  {/* Subtle light blobs */}
                  <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/20 blur-3xl pointer-events-none group-hover:bg-white/30 transition-colors duration-500" />

                  {/* Animated Icon */}
                  <div className={cn(
                    `w-14 h-14 rounded-2xl ${palette.accent} border ${palette.border} flex items-center justify-center ${palette.icon} shadow-sm shrink-0 transition-all duration-500`,
                    "group-hover:scale-110 group-hover:-rotate-6",
                    isClicking && "scale-90 rotate-12"
                  )}>
                    <UsersRound className="h-7 w-7" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 pr-8">
                    <h3 className={`text-lg font-black ${palette.text} truncate font-liturgical leading-tight mb-0.5`}>{turma.nome}</h3>
                    
                    {turmaCom && (
                      <p className={`text-[9px] font-bold ${palette.sub} uppercase tracking-widest truncate mb-2`}>{turmaCom}</p>
                    )}

                    <div className="flex flex-col gap-1 mt-1">
                      <div className={`flex items-center gap-1.5 text-[9px] ${palette.sub} font-bold bg-black/5 px-2 py-1 rounded-md w-fit`}>
                        <CalendarDays className="h-3 w-3 opacity-70" />
                        {turma.diaCatequese}, {turma.horario}
                      </div>
                      <div className={`flex items-center gap-1.5 text-[9px] ${palette.sub} font-bold bg-black/5 px-2 py-1 rounded-md w-fit`}>
                        <Users className="h-3 w-3 opacity-70" />
                        {tCatequizandos.length} inscritos • {tEncontros.length} encontros
                      </div>
                    </div>

                    {dataCriacao && (
                      <p className={`text-[8px] ${palette.sub} font-bold mt-2.5 opacity-60 uppercase tracking-widest`}>
                        Criada em {dataCriacao}
                      </p>
                    )}
                  </div>

                  {/* Badges Stack - Top Right */}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-20">
                    <span className={`text-[10px] font-black ${palette.badge} px-2 py-0.5 rounded-md shadow-sm border border-black/5`}>{turma.ano}</span>
                    
                    {turma.isShared && (
                      <span className={`shrink-0 text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${palette.badge} border border-black/5 shadow-sm`}>
                        Partilhada
                      </span>
                    )}

                    {turma.id === selectedTurmaId && (
                      <span className="shrink-0 flex items-center gap-0.5 text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-yellow-400 text-yellow-950 shadow-sm border border-yellow-500/20 mt-0.5">
                        <Sparkles className="h-2 w-2" /> Selecionada
                      </span>
                    )}
                    
                    {/* Arrow at the bottom-right of this flex stack or separate */}
                    <div className={cn(
                      "w-7 h-7 rounded-full bg-black/5 flex items-center justify-center border border-black/5 transition-all duration-300 mt-1",
                      "group-hover:bg-black/10 group-hover:translate-x-1"
                    )}>
                      <ArrowRight className="h-3.5 w-3.5" />
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
