import { BookOpen, Users, CalendarDays, ChevronRight, Cake, Star, X, BellRing, Trophy, Book } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useCatequizandos } from "@/hooks/useSupabaseData";
import { useMemo, useState, useEffect } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatarDataVigente } from "@/lib/utils";
import WelcomeModal from "@/components/WelcomeModal";
import { cn } from "@/lib/utils";
import { useJoinTurma } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { Link2, Loader2, RefreshCw, Flame, Sparkles } from "lucide-react";
import { useAtividades } from "@/hooks/useSupabaseData";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedTurmaId, setSelectedTurmaId] = useState<string | "all">("all");
  const { data: turmas = [], isLoading: tLoading } = useTurmas();
  const { data: encontros = [], isLoading: eLoading } = useEncontros();
  const { data: catequizandos = [], isLoading: cLoading } = useCatequizandos();
  const { data: atividades = [], isLoading: aLoading } = useAtividades(selectedTurmaId === "all" ? undefined : selectedTurmaId);
  const [turmaPickerOpen, setTurmaPickerOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const { permission, subscribe, loading: pushLoading } = usePushNotifications();
  const joinMutation = useJoinTurma();

  const loading = tLoading || eLoading || cLoading || aLoading;

  useEffect(() => {
    if (!loading && turmas.length === 0 && !localStorage.getItem("ivc_welcome_seen")) {
      setWelcomeOpen(true);
    }
  }, [loading, turmas.length]);

  useEffect(() => {
    if (!loading && turmas.length > 0 && selectedTurmaId === "all") {
       setSelectedTurmaId(turmas[0].id);
    }
  }, [loading, turmas.length, selectedTurmaId]);

  const LiturgicalIcon = ({ type, className }: { type?: string, className?: string }) => {
    const t = type?.toLowerCase() || "";
    
    // Bíblia / Pré-Catequese
    if (t.includes("pre-catecumenato") || t.includes("biblia") || t.includes("pré")) {
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <path d="M12 7v6" />
          <path d="M10 9h4" />
        </svg>
      );
    }
    
    // Eucaristia / Cálice
    if (t.includes("eucaristia")) {
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 3h10v5c0 3-2 5-5 5s-5-2-5-5V3z" />
          <path d="M12 13v6" />
          <path d="M9 21h6" />
          <circle cx="12" cy="7" r="1.5" fill="currentColor" className="opacity-40" />
        </svg>
      );
    }
    
    // Crisma / Fogo
    if (t.includes("crisma") || t.includes("adulto") || t.includes("espírito")) {
      return <Flame className={className} strokeWidth={2.5} />;
    }
    
    return <Sparkles className={className} strokeWidth={2.5} />;
  };

  const getEtapaColor = (etapa?: string) => {
    const e = etapa?.toLowerCase() || "";
    if (e.includes("pre") || e.includes("biblia")) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (e.includes("eucaristia")) return "text-amber-600 bg-amber-50 border-amber-100";
    if (e.includes("crisma") || e.includes("adulto")) return "text-red-600 bg-red-50 border-red-100";
    return "text-primary bg-primary/10 border-primary/20";
  };

  const hoje = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const parseDataLocal = (dataStr: string) => {
    if (!dataStr) return new Date();
    const parts = dataStr.split('T')[0].split('-');
    if (parts.length === 3) return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return new Date(dataStr);
  };

  const filteredCatequizandos = useMemo(() => {
    if (selectedTurmaId === "all") return catequizandos;
    return catequizandos.filter(c => c.turmaId === selectedTurmaId);
  }, [catequizandos, selectedTurmaId]);

  const filteredEncontros = useMemo(() => {
    if (selectedTurmaId === "all") return encontros;
    return encontros.filter(e => e.turmaId === selectedTurmaId);
  }, [encontros, selectedTurmaId]);

  const selectedTurma = useMemo(() => {
    if (selectedTurmaId === "all") return null;
    return turmas.find(t => t.id === selectedTurmaId);
  }, [turmas, selectedTurmaId]);

  const heroColors = getEtapaColor(selectedTurma?.etapa);

  const proximoEncontro = useMemo(() => {
    const pendentes = filteredEncontros
      .filter((e) => parseDataLocal(e.data) >= hoje && e.status === 'pendente')
      .sort((a, b) => parseDataLocal(a.data).getTime() - parseDataLocal(b.data).getTime());
    return pendentes[0] || null;
  }, [filteredEncontros, hoje]);

  const proximosAniversariantes = useMemo(() => {
    const thisYear = hoje.getFullYear();

    return filteredCatequizandos
      .filter((c) => c.dataNascimento)
      .map((c) => {
        const bday = new Date(c.dataNascimento);
        let nextBday = new Date(thisYear, bday.getMonth(), bday.getDate());
        if (nextBday < hoje) nextBday = new Date(thisYear + 1, bday.getMonth(), bday.getDate());
        return { ...c, proximoAniversario: nextBday };
      })
      .sort((a, b) => a.proximoAniversario.getTime() - b.proximoAniversario.getTime())
      .slice(0, 3);
  }, [filteredCatequizandos, hoje]);

  function getDiasRestantes(dataStr: string) {
    const d = parseDataLocal(dataStr);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - hoje.getTime()) / 86400000);
  }

  const stats = [
    { 
      label: "Atividades e Eventos", 
      value: atividades.length, 
      icon: Sparkles, 
      color: "bg-primary/10 text-primary",
      action: () => {
        if (selectedTurmaId !== "all") {
          navigate(`/turmas/${selectedTurmaId}/atividades`);
        } else {
          setTurmaPickerOpen(true);
        }
      } 
    },
    { 
      label: "Catequizandos", 
      value: filteredCatequizandos.length, 
      icon: Users, 
      color: "bg-accent/15 text-accent-foreground", 
      action: () => {
        if (selectedTurmaId !== "all") {
          navigate(`/turmas/${selectedTurmaId}/catequizandos`);
        } else {
          if (turmas.length === 1) navigate(`/turmas/${turmas[0].id}/catequizandos`);
          else setTurmaPickerOpen(true);
        }
      } 
    },
    { 
      label: "Encontros", 
      value: filteredEncontros.filter((e) => e.status === 'pendente').length, 
      icon: CalendarDays, 
      color: "bg-success/10 text-success", 
      action: () => {
        if (selectedTurmaId !== "all") {
          navigate(`/turmas/${selectedTurmaId}/encontros`);
        } else {
          navigate("/turmas");
        }
      } 
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5 animate-bounce-subtle">
           <div className="w-6 h-6 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
        <p className="text-xs font-black text-primary/60 uppercase tracking-widest animate-pulse">Carregando...</p>
      </div>
    );
  }

  const dias = proximoEncontro ? getDiasRestantes(proximoEncontro.data) : 0;
  const isUrgent = proximoEncontro ? dias <= 3 : false;
  const turmaEncontro = proximoEncontro ? turmas.find((t) => t.id === proximoEncontro.turmaId) : null;
  const diaLabel = proximoEncontro
    ? (dias === 0 ? "Hoje!" : dias === 1 ? "Amanhã" : DIAS_SEMANA[parseDataLocal(proximoEncontro.data).getDay()])
    : "";

  const handleJoinByCode = async () => {
    if (joinCode.trim().length < 8) {
      toast.error("O código deve ter 8 caracteres.");
      return;
    }
    try {
      const result = await joinMutation.mutateAsync(joinCode.trim());
      toast.success(`Acesso concedido à turma "${result.nome}"!`);
      setJoinModalOpen(false);
      setJoinCode("");
      setSelectedTurmaId(result.id);
    } catch (err: any) {
      toast.error(err.message || "Erro ao entrar na turma.");
    }
  };

  return (
    <div className="space-y-6">
      <WelcomeModal open={welcomeOpen} onClose={() => setWelcomeOpen(false)} />

      {/* ── ATIVAR NOTIFICAÇÕES ── */}
      {permission === "default" && (
        <div className="animate-card-activate relative overflow-hidden rounded-[32px] border-none bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 shadow-xl shadow-blue-500/20 p-1">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-[30px] p-5 flex items-center justify-between gap-4">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-700/50 animate-soft-pulse">
                 <BellRing className="h-5 w-5 text-blue-600 dark:text-blue-400" />
               </div>
               <div>
                 <h3 className="text-sm font-black text-foreground leading-tight">Lembretes por Notificação</h3>
                 <p className="text-[10px] text-muted-foreground mt-0.5">Receba avisos de encontros e aniversários</p>
               </div>
             </div>
             <button
               onClick={subscribe}
               disabled={pushLoading}
               className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2"
             >
               {pushLoading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Ligar"}
             </button>
          </div>
        </div>
      )}

      <div className="animate-fade-in flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Olá, Catequista! 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">Bem-vindo ao iCatequese</p>
        </div>
      </div>

      {/* ── CARD PRINCIPAL DE TURMA (TOPO) ── */}
      {turmas.length === 0 ? (
        <div 
          className="float-card p-8 text-center animate-card-activate border-2 border-primary/20 bg-primary/5"
          onClick={() => navigate("/turmas/nova")}
          style={{ cursor: 'pointer' }}
        >
          <div className="icon-box bg-primary/20 text-primary mx-auto mb-4 scale-110 animate-bounce-subtle">
            <BookOpen className="h-6 w-6" />
          </div>
          
          <h3 className="text-lg font-black text-foreground mb-2">Comece criando sua turma</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto leading-relaxed">
            Tudo pronto! Crie sua primeira turma ou entre com um código para começar.
          </p>

          <div className="flex flex-col gap-3 justify-center max-w-xs mx-auto">
             <button 
               onClick={(e) => { e.stopPropagation(); navigate("/turmas/nova"); }}
               className="w-full flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-black text-sm bg-primary text-white shadow-xl shadow-primary/25 hover:scale-105 active:scale-95 transition-all"
             >
               Criar Nova Turma
             </button>
             <button
               onClick={(e) => { e.stopPropagation(); setJoinModalOpen(true); }}
               className="w-full bg-emerald-500 text-white font-black text-sm px-6 py-3.5 rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
             >
               Entrar com Código
             </button>
          </div>
        </div>
      ) : (
        <div 
          className="float-card overflow-hidden animate-card-activate border-2 border-primary/20 relative group hover:border-primary/40 transition-all cursor-pointer shimmer-effect h-full"
          onClick={() => selectedTurmaId !== "all" && navigate(`/turmas/${selectedTurmaId}`)}
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 group-hover:opacity-10 transition-all duration-700">
             <LiturgicalIcon type={selectedTurma?.etapa} className="w-32 h-32" />
          </div>

          <div className="p-6 flex flex-col items-center gap-5 text-center relative z-10">
            <div className={cn(
              "w-20 h-20 rounded-[28px] flex items-center justify-center shrink-0 border-2 group-hover:scale-110 transition-all duration-500 shadow-xl",
              heroColors
            )}>
              <LiturgicalIcon type={selectedTurma?.etapa} className="h-10 w-10" />
            </div>
            
            <div className="space-y-1 w-full">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">Turma Selecionada</p>
              <h3 className="text-2xl font-black text-foreground leading-tight tracking-tight">
                {selectedTurmaId === "all" ? "Todas as Turmas" : selectedTurma?.nome}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                {selectedTurmaId === "all" ? "Visão geral do seu trabalho" : `${selectedTurma?.etapa || 'Catequese'} • ${filteredCatequizandos.length} catequizandos`}
              </p>
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); if (selectedTurmaId !== "all") navigate(`/turmas/${selectedTurmaId}`); }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all"
            >
              Abrir Turma
            </button>
          </div>

          {(turmas.length > 1 || selectedTurmaId === "all") && (
            <div 
              onClick={(e) => { e.stopPropagation(); setTurmaPickerOpen(true); }}
              className="bg-primary/5 px-5 py-3 flex items-center justify-between border-t border-primary/10 hover:bg-primary/10 transition-colors"
            >
              <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Trocar de Turma</span>
              <RefreshCw className="h-4 w-4 text-primary" />
            </div>
          )}
        </div>
      )}

      {/* Stats Inteligentes */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <button 
              key={`${stat.label}-${i}`} 
              onClick={stat.action} 
              className={cn(
                "float-card p-2.5 sm:p-4 text-center animate-float-up active:scale-95 transition-all min-w-0 border-4 relative overflow-hidden",
                stat.color.includes("text-primary") && "border-primary bg-primary/5 ring-4 ring-primary/10"
              )}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`icon-box ${stat.color} mx-auto mb-1.5 sm:mb-2.5 w-9 h-9 sm:w-10 sm:h-10`}>
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground leading-tight truncate">
                {stat.value}
              </p>
              <div className="text-[8px] sm:text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-0.5 leading-tight break-words">
                {stat.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── PRÓXIMO ENCONTRO ── */}
      <div className="animate-float-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md animate-bounce">
              <CalendarDays className="h-4 w-4 text-white" />
            </div>
            <p className="text-lg font-black text-foreground uppercase tracking-tight mb-0">Próximo Encontro</p>
          </div>
          <button onClick={() => navigate("/turmas")} className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors">Ver todos</button>
        </div>

        {!proximoEncontro ? (
          <div className="float-card p-8 text-center">
            <div className="icon-box bg-primary/10 text-primary mx-auto mb-3"><CalendarDays className="h-5 w-5" /></div>
            <p className="text-sm text-muted-foreground">Nenhum encontro agendado {selectedTurmaId !== 'all' ? 'para esta turma' : ''}</p>
            <button onClick={() => navigate("/turmas")} className="text-sm text-primary font-semibold mt-2">Agendar encontro</button>
          </div>
        ) : (
          <button
            onClick={() => navigate(`/turmas/${proximoEncontro.turmaId}/encontros/${proximoEncontro.id}`)}
            className={`w-full text-left animate-float-up transition-all active:scale-[0.98] overflow-hidden ${
              isUrgent
                ? "float-card border-destructive/50 bg-destructive/5 shadow-lg shadow-destructive/10 ring-1 ring-destructive/30"
                : "float-card"
            }`}
            style={{ animationDelay: '220ms' }}
          >
            <div className={`h-1 w-full ${isUrgent ? "bg-gradient-to-r from-destructive to-red-400" : "bg-gradient-to-r from-primary/40 to-primary/10"}`} />
            <div className="flex items-stretch">
              <div className="flex flex-col items-center justify-center px-5 py-4 bg-gradient-to-b from-primary/5 to-primary/10 shrink-0 min-w-[68px]">
                <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest leading-none">
                  {DIAS_SEMANA[parseDataLocal(proximoEncontro.data).getDay()]}
                </span>
                <span className="text-3xl font-black text-foreground leading-tight mt-0.5">
                  {String(parseDataLocal(proximoEncontro.data).getDate()).padStart(2, "0")}
                </span>
                <span className="text-[10px] font-black text-muted-foreground uppercase">
                  {parseDataLocal(proximoEncontro.data).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase()}
                </span>
              </div>
              <div className="flex-1 px-4 py-4 min-w-0">
                <p className="text-sm font-bold text-foreground truncate mb-1">{proximoEncontro.tema}</p>
                <p className="text-xs text-muted-foreground">{turmaEncontro?.nome}</p>
                <p className="text-xs text-muted-foreground">{formatarDataVigente(proximoEncontro.data)}</p>
              </div>
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-4 shrink-0">
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full animate-pulse ${
                  isUrgent
                    ? "text-destructive bg-destructive/15 border border-destructive/30"
                    : "text-primary bg-primary/10 border border-primary/20"
                }`}>
                  {diaLabel}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </button>
        )}
      </div>

      {/* ── ANIVERSARIANTES ── */}
      {proximosAniversariantes.length > 0 && (
        <div className="animate-float-up" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center gap-2.5 mb-4 group cursor-pointer" onClick={() => navigate("/catequizandos")}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Cake className="h-4 w-4 text-white" />
            </div>
            <p className="text-lg font-black text-foreground uppercase tracking-tight mb-0 group-hover:text-primary transition-colors">Próximos Aniversários</p>
          </div>

          <div className={cn(
            "grid gap-3 transition-all",
            proximosAniversariantes.length === 3 ? "grid-cols-3" : "flex overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide"
          )}>
            {proximosAniversariantes.map((c, i) => {
              const diasAte = Math.round((c.proximoAniversario.getTime() - hoje.getTime()) / 86400000);
              const isHoje = diasAte === 0;
              return (
                <div
                  key={c.id}
                  className={cn(
                    "flex flex-col items-center text-center p-4 rounded-3xl border-2 transition-all hover:scale-105 active:scale-95 duration-300",
                    isHoje
                      ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 shadow-lg shadow-amber-200/50 ring-2 ring-amber-200 ring-offset-2"
                      : "bg-white border-zinc-100 shadow-sm",
                    proximosAniversariantes.length !== 3 && "shrink-0 w-28"
                  )}
                  style={{ animation: `float-up 0.5s ease-out ${(i + 5) * 0.06}s both` }}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black mb-3 shadow-md transition-transform group-hover:rotate-6",
                    isHoje
                      ? "bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 text-white shadow-orange-200"
                      : "bg-gradient-to-br from-primary/10 to-primary/20 text-primary"
                  )}>
                    {c.nome?.charAt(0).toUpperCase()}
                    {isHoje && (
                      <div className="absolute -top-1 -right-1">
                        <Star className="h-5 w-5 text-amber-500 fill-amber-500 animate-pulse" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-black text-foreground leading-tight truncate px-1">
                      {c.nome?.split(" ")[0]}
                    </p>
                    <p className={cn(
                      "text-[9px] font-black uppercase tracking-widest",
                      isHoje ? "text-orange-600" : "text-muted-foreground/60"
                    )}>
                      {isHoje ? "🎉 Parabéns!" : `${diasAte} dia${diasAte !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                  
                  {isHoje && (
                    <div className="mt-2 w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Turma picker dialog */}
      <Dialog open={turmaPickerOpen} onOpenChange={setTurmaPickerOpen}>
        <DialogContent className="max-w-sm mx-auto rounded-[32px] p-6 shadow-2xl border-none bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight text-center">Selecionar Turma</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <button
               onClick={() => { setSelectedTurmaId("all"); setTurmaPickerOpen(false); }}
               className={cn(
                 "w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.98] text-left border-2",
                 selectedTurmaId === "all" ? "bg-primary/10 border-primary" : "bg-muted/30 border-transparent hover:bg-muted/50"
               )}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">Todas as Turmas</p>
                <p className="text-xs text-muted-foreground">Visão geral completa</p>
              </div>
            </button>

            {turmas.map((t) => {
              const count = catequizandos.filter((c) => c.turmaId === t.id).length;
              const isSelected = selectedTurmaId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => { setSelectedTurmaId(t.id); setTurmaPickerOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.98] text-left border-2",
                    isSelected ? "bg-primary/10 border-primary shadow-md" : "bg-muted/30 border-transparent hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    isSelected ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-primary/10"
                  )}>
                    <BookOpen className={cn("h-6 w-6", isSelected ? "text-white" : "text-primary")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{t.nome}</p>
                    <p className="text-xs text-muted-foreground">{t.etapa} • {count} alunos</p>
                  </div>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL ENTRAR COM CÓDIGO */}
      <Dialog open={joinModalOpen} onOpenChange={setJoinModalOpen}>
        <DialogContent className="max-w-sm mx-auto rounded-[32px] p-6 shadow-2xl border-none">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight text-center">Entrar com Código</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-4">
            <p className="text-xs text-center text-muted-foreground px-4">
              Peça o código de 8 caracteres ao catequista responsável pela turma.
            </p>
            <div className="space-y-2">
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Ex: TP847293"
                maxLength={8}
                autoFocus
                className="w-full px-4 py-4 rounded-2xl border-2 border-border bg-background text-foreground text-center text-2xl font-black tracking-[0.3em] uppercase focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <button
              onClick={handleJoinByCode}
              disabled={joinMutation.isPending || joinCode.trim().length < 8}
              className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-sm uppercase tracking-wider hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              {joinMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              {joinMutation.isPending ? "Verificando..." : "Entrar na Turma"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
