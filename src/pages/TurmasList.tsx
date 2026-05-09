import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useCatequizandos, useComunidades, useAtividades, useReunioes, useMissoesFamilia } from "@/hooks/useSupabaseData";
import { JoinTurmaModal } from "@/components/JoinTurmaModal";
import { cn } from "@/lib/utils";
import { BookOpen, Plus, CalendarDays, Users, Link2, UsersRound, Settings, ListChecks, GitBranch, Heart, PieChart, BellRing, Eye, EyeOff, Copy } from "lucide-react";
import { toast } from "sonner";

export default function TurmasList() {
  const navigate = useNavigate();
  const { data: turmas = [], isLoading } = useTurmas();
  const { data: comunidades = [] } = useComunidades();
  const [selectedTurmaId, setSelectedTurmaId] = useState<string | null>(null);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [codeVisible, setCodeVisible] = useState(false);

  useEffect(() => {
    if (turmas.length > 0 && !selectedTurmaId) {
      const saved = localStorage.getItem("ivc_selected_turma");
      const id = saved && turmas.some(t => t.id === saved) ? saved : turmas[0].id;
      setSelectedTurmaId(id);
      localStorage.setItem("ivc_selected_turma", id);
    }
  }, [turmas, selectedTurmaId]);

  // Reset code visibility when switching turma
  const handleSelect = (id: string) => {
    setSelectedTurmaId(id);
    setCodeVisible(false);
    localStorage.setItem("ivc_selected_turma", id);
  };

  const selectedTurma = turmas.find(t => t.id === selectedTurmaId) || turmas[0];
  const otherTurmas = turmas.filter(t => t.id !== selectedTurma?.id);

  const { data: encontros = [] } = useEncontros(selectedTurma?.id);
  const { data: catequizandos = [] } = useCatequizandos(selectedTurma?.id);
  const { data: atividades = [] } = useAtividades(selectedTurma?.id);
  const { data: reunioes = [] } = useReunioes(selectedTurma?.id);
  const { data: missoes = [] } = useMissoesFamilia(selectedTurma?.id);

  const encontrosEmAlerta = useMemo(() => {
    let count = 0;
    const nowTime = Date.now();
    encontros.forEach(e => {
      const parts = (e.data || '').split('T')[0].split('-');
      const d = parts.length === 3 ? new Date(+parts[0], +parts[1] - 1, +parts[2]) : new Date(e.data);
      const isPastPendente = e.status === 'pendente' && nowTime > d.getTime() + 86400000;
      const noPresence = (e.presencas || []).length === 0;
      if ((noPresence && (e.status === 'realizado' || isPastPendente)) || isPastPendente) count++;
    });
    return count;
  }, [encontros]);

  const catequizandosEmAlerta = useMemo(() => {
    const past = encontros.filter(e => e.status === 'realizado').sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 3);
    if (past.length < 3) return 0;
    return catequizandos.filter(c => !past.some(e => e.presencas.includes(c.id) || (e.justificativas && e.justificativas[c.id]))).length;
  }, [encontros, catequizandos]);

  const modulos = selectedTurma ? [
    { label: "Encontros", icon: CalendarDays, count: encontros.length, unit: "encontro", path: `/turmas/${selectedTurma.id}/encontros`, color: "bg-primary text-white", bgGradient: "from-primary/60 via-primary/30 to-white", gradient: "from-primary/15 to-white", textColor: "text-blue-700", hasAlert: encontrosEmAlerta > 0, alertTitle: `${encontrosEmAlerta} pendente(s)` },
    { label: "Catequizandos", icon: Users, count: catequizandos.length, unit: "catequizando", path: `/turmas/${selectedTurma.id}/catequizandos`, color: "bg-emerald-600 text-white", bgGradient: "from-emerald-500/60 via-emerald-500/30 to-white", gradient: "from-emerald-500/15 to-white", textColor: "text-emerald-700", hasAlert: catequizandosEmAlerta > 0, alertTitle: `${catequizandosEmAlerta} com faltas` },
    { label: "Eventos", icon: ListChecks, count: atividades.length, unit: "evento", path: `/turmas/${selectedTurma.id}/eventos`, color: "bg-amber-600 text-white", bgGradient: "from-amber-500/60 via-amber-500/30 to-white", gradient: "from-amber-500/15 to-white", textColor: "text-amber-700", hasAlert: false, alertTitle: '' },
    { label: "Reuniões", icon: Users, count: reunioes.length, unit: "reunião", path: `/turmas/${selectedTurma.id}/reunioes`, color: "bg-blue-600 text-white", bgGradient: "from-blue-500/60 via-blue-500/30 to-white", gradient: "from-blue-500/15 to-white", textColor: "text-blue-700", hasAlert: false, alertTitle: '' },
    { label: "Plano da turma", icon: GitBranch, count: null, unit: "", path: `/turmas/${selectedTurma.id}/plano`, color: "bg-sky-600 text-white", bgGradient: "from-sky-500/60 via-sky-500/30 to-white", gradient: "from-sky-500/15 to-white", textColor: "text-sky-700", hasAlert: false, alertTitle: '' },
    { label: "Catequese em Família", icon: Heart, count: missoes.length, unit: "missão", path: `/turmas/${selectedTurma.id}/familia`, color: "bg-rose-600 text-white", bgGradient: "from-rose-500/60 via-rose-500/30 to-white", gradient: "from-rose-500/15 to-white", textColor: "text-rose-700", hasAlert: false, alertTitle: '' },
  ] : [];

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <div className="w-6 h-6 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
      <p className="text-xs font-black text-primary/60 uppercase tracking-widest animate-pulse">Carregando...</p>
    </div>
  );

  return (
    <div className="space-y-5 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <h1 className="text-2xl font-black text-foreground tracking-tight">Catequese</h1>
        <button onClick={() => navigate("/turmas/nova")} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-liturgical-green text-white shadow-md active:scale-95 transition-all font-bold text-xs uppercase tracking-widest">
          <Plus className="h-3.5 w-3.5" /> Nova Turma
        </button>
      </div>

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
      ) : selectedTurma && (
        <>
          {/* ── MAIN TURMA CARD ── */}
          <div className="relative overflow-hidden rounded-[2rem] bg-liturgical-paper border border-liturgical-green/20 shadow-lg animate-fade-in">
            {/* Subtle rays background */}
            <div className="absolute inset-0 bg-gradient-to-br from-liturgical-green/[0.04] via-transparent to-transparent" />
            <div className="absolute -right-6 -top-6 w-32 h-32 text-liturgical-green/[0.04] pointer-events-none">
              <UsersRound className="w-full h-full" />
            </div>

            <div className="relative z-10 p-6">
              {/* Top row: name + actions */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full bg-liturgical-green animate-pulse shrink-0" />
                    <span className="text-[9px] font-black text-liturgical-green uppercase tracking-[0.25em]">Turma Principal</span>
                    {selectedTurma.isShared && (
                      <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">Partilhada</span>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-foreground font-liturgical leading-tight">{selectedTurma.nome}</h2>
                  {(() => {
                    const com = comunidades.find(c => c.id === selectedTurma.comunidadeId);
                    return com ? <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{com.nome}</p> : null;
                  })()}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-xs font-black text-muted-foreground/40 bg-black/5 px-2 py-1 rounded-lg">{selectedTurma.ano}</span>
                  <button onClick={() => navigate(`/turmas/${selectedTurma.id}`)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-black/5 shadow-sm text-muted-foreground hover:text-liturgical-green transition-colors active:scale-90">
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Info row */}
              <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground font-bold mb-5">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3 text-liturgical-green/50" />
                  {selectedTurma.diaCatequese} • {selectedTurma.horario}
                </span>
                {selectedTurma.etapa && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-liturgical-green/20" />
                    <span className="text-liturgical-green/60 font-black">{selectedTurma.etapa}</span>
                  </>
                )}
              </div>

              {/* Stats + Code row */}
              <div className="flex items-center gap-2 pt-4 border-t border-liturgical-green/8">
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-black/5 shadow-sm">
                  <UsersRound className="h-3.5 w-3.5 text-liturgical-green" />
                  <span className="text-sm font-black text-foreground">{catequizandos.length}</span>
                  <span className="text-[9px] text-muted-foreground font-bold">catequizandos</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-black/5 shadow-sm">
                  <CalendarDays className="h-3.5 w-3.5 text-liturgical-green" />
                  <span className="text-sm font-black text-foreground">{encontros.length}</span>
                  <span className="text-[9px] text-muted-foreground font-bold">encontros</span>
                </div>

                {/* Code chip */}
                {!selectedTurma.isShared && selectedTurma.codigoAcesso && (
                  <button
                    onClick={() => {
                      if (codeVisible) {
                        navigator.clipboard.writeText(selectedTurma.codigoAcesso!);
                        toast.success("Código copiado!");
                      } else {
                        setCodeVisible(true);
                      }
                    }}
                    className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-liturgical-green/10 border border-liturgical-green/20 text-liturgical-green hover:bg-liturgical-green hover:text-white transition-all active:scale-95 shadow-sm"
                  >
                    {codeVisible ? (
                      <>
                        <Copy className="h-3.5 w-3.5 shrink-0" />
                        <span className="font-mono font-black text-xs tracking-widest">{selectedTurma.codigoAcesso}</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Código</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── SECONDARY TURMAS + JOIN CARD ── */}
          {(otherTurmas.length > 0) && (
            <div className="flex gap-3 overflow-x-auto pb-1 animate-fade-in" style={{ scrollbarWidth: 'none' }}>
              {otherTurmas.map((t, i) => {
                const tCom = comunidades.find(c => c.id === t.comunidadeId)?.nome;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelect(t.id)}
                    className="shrink-0 relative overflow-hidden flex flex-col justify-between p-4 rounded-[1.5rem] bg-liturgical-paper border border-liturgical-green/15 shadow-sm hover:shadow-md hover:border-liturgical-green/30 active:scale-[0.97] cursor-pointer transition-all min-w-[160px] max-w-[200px] group"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-liturgical-green/[0.04] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-liturgical-green/40" />
                        <span className="text-[8px] font-black text-liturgical-green/60 uppercase tracking-widest truncate">{t.isShared ? 'Partilhada' : 'Turma'}</span>
                      </div>
                      <h4 className="text-sm font-black text-foreground font-liturgical line-clamp-2 leading-tight group-hover:text-liturgical-green transition-colors">{t.nome}</h4>
                      {tCom && <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mt-1 line-clamp-1">{tCom}</p>}
                    </div>
                    <div className="relative z-10 flex items-center justify-between mt-3 pt-2.5 border-t border-liturgical-green/8">
                      <span className="text-[9px] text-muted-foreground font-bold">{t.diaCatequese} • {t.ano}</span>
                      <div className="w-6 h-6 rounded-full bg-white border border-liturgical-green/15 flex items-center justify-center text-liturgical-green/40 group-hover:text-liturgical-green group-hover:border-liturgical-green/40 transition-all">
                        <Plus className="h-3.5 w-3.5 rotate-45" />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Join with Code Card */}
              <div
                onClick={() => setJoinModalOpen(true)}
                className="shrink-0 flex flex-col items-center justify-center p-4 rounded-[1.5rem] bg-white border-2 border-dashed border-liturgical-green/25 hover:border-liturgical-green/50 hover:bg-liturgical-paper active:scale-[0.97] cursor-pointer transition-all gap-2 min-w-[140px] group"
              >
                <div className="w-10 h-10 rounded-2xl bg-liturgical-paper border border-liturgical-green/20 flex items-center justify-center text-liturgical-green group-hover:bg-liturgical-green group-hover:text-white transition-all duration-300">
                  <Link2 className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-black text-foreground font-liturgical leading-tight">Entrar na Turma</p>
                  <p className="text-[8px] font-bold text-liturgical-green/60 uppercase tracking-wider mt-0.5">com código</p>
                </div>
              </div>
            </div>
          )}

          {/* ── MODULES GRID ── */}
          <div className="grid grid-cols-2 gap-3">
            {modulos.map((mod, i) => {
              const Icon = mod.icon;
              const isPlan = mod.label === "Plano da turma";
              return (
                <div key={mod.label} className={cn("relative p-[1.5px] rounded-3xl animate-float-up transition-all duration-300 hover:-translate-y-1 active:scale-[0.96] cursor-pointer group shadow-md h-[115px]", `bg-gradient-to-br ${mod.bgGradient}`)} style={{ animationDelay: `${i * 100}ms` }} onClick={() => navigate(mod.path)}>
                  <div className="absolute inset-[3px] rounded-[22px] border-2 border-white/40 z-20 pointer-events-none opacity-60" />
                  <div className={`relative flex flex-col items-center justify-between py-2 px-2.5 rounded-[22px] bg-white h-full bg-gradient-to-b ${mod.gradient} overflow-hidden text-center`}>
                    <div className="absolute -right-3 -top-3 opacity-[0.05] pointer-events-none group-hover:scale-125 group-hover:rotate-12 transition-transform duration-1000"><Icon className="w-16 h-16" /></div>
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg relative z-30 border-2 border-white/50 transition-transform group-hover:scale-110 duration-500", mod.color)}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    {mod.hasAlert && (
                      <div className="absolute top-2 right-2 flex flex-col items-center animate-pulse z-40" title={mod.alertTitle}>
                        <div className="w-5 h-5 bg-destructive border-[1.5px] border-white rounded-full flex items-center justify-center shadow-sm"><BellRing className="h-2.5 w-2.5 text-white animate-wiggle" /></div>
                        <span className="text-[6px] font-black uppercase text-destructive mt-[1px] tracking-tighter">Alerta!</span>
                      </div>
                    )}
                    <div className="relative z-30 flex-1 flex flex-col items-center justify-center w-full min-h-0">
                      <h3 className="text-[12px] font-black text-foreground tracking-tight leading-none group-hover:text-primary transition-colors mb-0.5">{mod.label}</h3>
                      {isPlan && <p className="text-[7px] text-muted-foreground leading-tight px-1 font-medium line-clamp-1">Conteúdos e etapas</p>}
                      {(mod.count !== null || isPlan) && (
                        <div className={cn("mt-1 flex flex-col items-center justify-center min-w-[65px]", mod.textColor)}>
                          <span className={cn("font-black leading-none", isPlan ? "text-[9px]" : "text-base")}>{isPlan ? (selectedTurma.etapa || "N/A") : mod.count}</span>
                          <span className="text-[7px] font-black uppercase tracking-wider mt-0.5 opacity-80">{isPlan ? "Etapa Atual" : (mod.count !== 1 ? `${mod.unit}s` : mod.unit)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Relatórios */}
          <button onClick={() => navigate(`/turmas/${selectedTurma.id}/relatorios`)} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-violet-600 text-white font-black text-xs uppercase tracking-widest shadow-md active:scale-95 transition-all">
            <PieChart className="h-4 w-4" /> Relatórios da Turma
          </button>
        </>
      )}

      <JoinTurmaModal open={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
    </div>
  );
}
