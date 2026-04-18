import { BookOpen, Users, CalendarDays, ChevronRight, Cake, Star, X, BellRing, Trophy, Book, AlertTriangle, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useCatequizandos, useMissoesFamilia } from "@/hooks/useSupabaseData";
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
import { Button } from "@/components/ui/button";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedTurmaId, setSelectedTurmaId] = useState<string | "all">("all");
  const { data: turmas = [], isLoading: tLoading, error: tError, refetch: tRefetch } = useTurmas();
  const { data: encontros = [], isLoading: eLoading } = useEncontros();
  const { data: catequizandos = [], isLoading: cLoading } = useCatequizandos();
  const { data: atividades = [], isLoading: aLoading } = useAtividades(selectedTurmaId === "all" ? undefined : selectedTurmaId);
  const { data: missoes = [], isLoading: mLoading } = useMissoesFamilia(selectedTurmaId === "all" ? undefined : selectedTurmaId);
  const [turmaPickerOpen, setTurmaPickerOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const { permission, subscribe, loading: pushLoading } = usePushNotifications();
  const joinMutation = useJoinTurma();

  const loading = tLoading || eLoading || cLoading || aLoading || mLoading;

  useEffect(() => {
    if (!loading && !tError && turmas.length === 0 && !localStorage.getItem("ivc_welcome_seen")) {
      setWelcomeOpen(true);
    }
  }, [loading, tError, turmas.length]);

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
    // Pré-Catequese: Azul claro
    if (e.includes("pre") || e.includes("biblia")) return "text-blue-600 bg-blue-50 border-blue-100";
    // Eucaristia: Amarelo claro
    if (e.includes("eucaristia")) return "text-yellow-600 bg-yellow-50 border-yellow-100";
    // Crisma / Pré-Crisma: Vermelho claro
    if (e.includes("crisma")) return "text-red-600 bg-red-50 border-red-100";
    // Adultos: Verde claro
    if (e.includes("adulto")) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    
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

  const proximosAniversariantesBatismo = useMemo(() => {
    const thisYear = hoje.getFullYear();

    return filteredCatequizandos
      .filter((c) => c.sacramentos?.batismo?.data)
      .map((c) => {
        const bday = new Date(c.sacramentos!.batismo!.data);
        // Correct for timezone offsets by getting UTC values if needed, but local is fine here since it only matters for month/day
        let nextBday = new Date(thisYear, bday.getUTCMonth(), bday.getUTCDate());
        if (nextBday < hoje) nextBday = new Date(thisYear + 1, bday.getUTCMonth(), bday.getUTCDate());
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
    { 
      label: "Missões em Família", 
      value: missoes.length, 
      icon: Heart, 
      color: "bg-rose-500/10 text-rose-500", 
      action: () => {
        if (selectedTurmaId !== "all") {
          navigate(`/turmas/${selectedTurmaId}/familia`);
        } else {
          setTurmaPickerOpen(true);
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

  if (tError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center animate-fade-in">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mb-2 shadow-lg shadow-red-500/10">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-black text-foreground">Erro ao carregar dados</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Não conseguimos conectar com o servidor para buscar suas turmas. Verifique sua conexão.
          </p>
        </div>
        <Button 
          onClick={() => tRefetch()} 
          className="rounded-2xl px-8 h-12 font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          Tentar Novamente
        </Button>
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
          className="relative p-[2px] rounded-[32px] bg-gradient-to-br from-[hsl(var(--gold))]/60 via-[hsl(var(--liturgical))]/40 to-primary/40 shadow-[0_15px_45px_rgba(0,0,0,0.08)] animate-card-activate transition-all duration-300 hover:-translate-y-1.5 cursor-pointer group overflow-hidden"
          onClick={() => selectedTurmaId !== "all" && navigate(`/turmas/${selectedTurmaId}`)}
        >
          {/* Moldura litúrgica interna */}
          <div className="absolute inset-[3px] rounded-[30px] border border-white/50 dark:border-white/10 z-20 pointer-events-none opacity-60 mix-blend-overlay"></div>
          
          <div className="relative flex flex-col p-0 rounded-[30px] bg-card w-full h-full overflow-hidden">
            {/* Marca d'água de fundo */}
            <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">
               <BookOpen className="w-32 h-32 text-primary" />
            </div>

            <div className="px-5 py-6 flex flex-col items-center relative z-10 text-center">
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center justify-center gap-2 mb-1">
                   <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border shadow-sm", heroColors)}>
                     <LiturgicalIcon type={selectedTurma?.etapa} className="h-3.5 w-3.5" />
                   </div>
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">Turma Selecionada</p>
                </div>
                
                <h3 className="text-xl font-black text-foreground leading-tight tracking-tight truncate px-4">
                  {selectedTurmaId === "all" ? "Todas as Turmas" : selectedTurma?.nome}
                </h3>
                
                <p className="text-xs text-muted-foreground font-medium truncate px-8">
                  {selectedTurmaId === "all" ? "Visão geral do seu trabalho" : `${selectedTurma?.etapa || 'Catequese'} • ${filteredCatequizandos.length} catequizandos`}
                </p>
              </div>

              <div className="mt-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); if (selectedTurmaId !== "all") navigate(`/turmas/${selectedTurmaId}`); }}
                  className="flex items-center gap-2 px-10 py-2.5 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.1em] shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Abrir Turma
                </button>
              </div>
            </div>

            {(turmas.length > 1 || selectedTurmaId === "all") && (
              <div 
                onClick={(e) => { e.stopPropagation(); setTurmaPickerOpen(true); }}
                className="bg-primary/5 px-6 py-4 flex items-center justify-between border-t border-primary/10 hover:bg-primary/10 transition-colors mt-auto"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 text-primary animate-spin-slow" />
                  <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Trocar de Turma</span>
                </div>
                <ChevronRight className="h-4 w-4 text-primary/40" />
              </div>
            )}
          </div>
        </div>
      )}


      {/* Stats Inteligentes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <button 
              key={`${stat.label}-${i}`} 
              onClick={stat.action} 
              className={cn(
                "float-card p-2.5 sm:p-4 text-center animate-float-up active:scale-95 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl min-w-0 border-2 border-primary/20 relative overflow-hidden shadow-md bg-white dark:bg-zinc-900",
                stat.color.includes("text-primary") && "bg-primary/5 shadow-primary/10 border-primary"
              )}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`icon-box ${stat.color} mx-auto mb-1.5 sm:mb-2.5 w-9 h-9 sm:w-10 sm:h-10 animate-bounce-subtle`}>
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

      {/* ── CARD RESUMO PRÓXIMO ENCONTRO ── */}
      {proximoEncontro && (
        <div className="animate-float-up" style={{ animationDelay: '200ms' }}>
          <div className="flex flex-col items-center justify-center px-1 mb-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center border border-blue-200 shadow-sm mb-2">
              <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground uppercase tracking-tight">Próximo Encontro</h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-none">Prepare seu material</p>
            </div>
          </div>

          <div 
            className="float-card p-0 overflow-hidden border-2 border-blue-300 shadow-xl shadow-blue-500/10 bg-gradient-to-br from-blue-50/80 to-white/90 dark:from-blue-950/20 dark:to-zinc-900/80 backdrop-blur-md cursor-pointer group"
            onClick={() => navigate(`/turmas/${proximoEncontro.turmaId}/encontros/${proximoEncontro.id}`)}
          >
            <div className="p-5 active:scale-[0.99] transition-all">
              <div className="flex gap-4 items-stretch">
                {/* Chip de Data */}
                <div className="flex flex-col items-center justify-center w-14 h-14 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/40 rounded-2xl shadow-md border-b-2 border-blue-200 dark:border-blue-800/50 shrink-0 transform group-hover:-translate-y-1 transition-transform animate-float-up relative overflow-hidden self-center">
                  <div className="absolute top-0 inset-x-0 h-1 bg-white/40" />
                  <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none mb-0.5 mt-1">
                    {DIAS_SEMANA[parseDataLocal(proximoEncontro.data).getDay()]}
                  </span>
                  <span className="text-xl font-black text-blue-600 dark:text-blue-200 leading-none drop-shadow-sm">
                    {String(parseDataLocal(proximoEncontro.data).getDate()).padStart(2, "0")}
                  </span>
                  <span className="text-[8px] font-black text-blue-600/80 dark:text-blue-400/80 uppercase tracking-widest mt-0.5 mb-1">
                    {parseDataLocal(proximoEncontro.data).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase()}
                  </span>
                </div>

                {/* Card de Informações Principal */}
                <div className="flex-1 float-card bg-white/80 dark:bg-zinc-900/80 border-2 border-blue-100 dark:border-blue-900/30 p-4 flex flex-col justify-center relative overflow-hidden animate-float-up" style={{ animationDelay: '100ms' }}>
                  {/* Watermark Litúrgico */}
                  <div className="absolute -right-2 -bottom-2 opacity-[0.03] transform scale-150 rotate-12">
                    <BookOpen className="w-16 h-16 text-blue-500" />
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse ${
                      isUrgent ? "bg-destructive text-white" : "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                    }`}>
                      {diaLabel}
                    </span>
                    <div className="flex items-center gap-1 uppercase text-[9px] font-black tracking-widest text-blue-600 dark:text-blue-500 mr-1">
                      <BookOpen className="h-2.5 w-2.5" />
                      Próximo Encontro
                    </div>
                  </div>

                  <h3 className="text-base font-black text-foreground drop-shadow-sm leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                    {proximoEncontro.tema}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/70">
                    <span className="bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-lg border border-blue-100/50 dark:border-blue-900/30">
                      {turmaEncontro?.nome}
                    </span>
                  </div>

                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-1">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CARD DE ANIVERSÁRIOS INDEPENDENTES ── */}
      <div className="grid gap-6">
        {/* Aniversários de Nascimento */}
        <div className="animate-float-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-center gap-3 px-1 mb-3 text-center">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-sm animate-bounce-subtle shrink-0">
              <Cake className="h-5 w-5 text-amber-600" />
            </div>
            <div className="text-left">
              <h2 className="text-[13px] font-black text-foreground uppercase tracking-tight leading-none mb-0.5">ANIVERSÁRIOS de NASCIMENTO</h2>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest leading-none">Próximos aniversários</p>
            </div>
          </div>

          <div className="relative p-[1.5px] rounded-[28px] bg-gradient-to-br from-amber-400/60 via-amber-500/40 to-amber-600/40 shadow-[0_12px_35px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="absolute inset-[2.5px] rounded-[26px] border border-white/50 dark:border-white/10 z-20 pointer-events-none opacity-60 mix-blend-overlay"></div>
            
            <div className="relative p-4 rounded-[26px] bg-white dark:bg-zinc-900 border-2 border-amber-500/5 shadow-xl shadow-amber-500/5 backdrop-blur-md text-center overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-[0.02] transform scale-150 rotate-12">
                <Cake className="w-20 h-20 text-amber-500" />
              </div>

              {proximosAniversariantes.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-3xl">🎂</div>
                  <p className="text-sm font-bold text-muted-foreground/70">Nenhum aniversário próximo</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 relative z-10">
                  {proximosAniversariantes.map((c) => {
                    const diasAte = Math.round((c.proximoAniversario.getTime() - hoje.getTime()) / 86400000);
                    const isHoje = diasAte === 0;
                    return (
                      <div key={c.id} className={`p-3 rounded-2xl flex flex-col items-center text-center transition-all hover:scale-105 ${isHoje ? "bg-amber-400/10 ring-2 ring-amber-400/40 shadow-lg" : "bg-muted/30 border border-black/5"}`}>
                        <div className={`relative w-14 h-14 rounded-xl mb-2 overflow-hidden border-2 ${isHoje ? "border-amber-400 animate-soft-pulse scale-105" : "border-background shadow-sm"}`}>
                          {c.foto ? (
                            <img src={c.foto} alt={c.nome} className="w-full h-full object-cover" />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center text-lg font-black ${isHoje ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"}`}>
                              {c.nome?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {isHoje && (
                            <div className="absolute top-0 right-0 p-1 bg-amber-400 rounded-bl-xl">
                              <Star className="h-2.5 w-2.5 text-white fill-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] font-black text-foreground truncate w-full px-1 mb-0.5">{c.nome?.split(" ")[0]}</p>
                        <p className={`text-[8px] font-black uppercase tracking-widest ${isHoje ? "text-amber-600" : "text-muted-foreground/50"}`}>
                          {isHoje ? "🎉 HOJE!" : `${diasAte} DIAS`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Aniversários de Batismo */}
        <div className="animate-float-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-center gap-3 px-1 mb-3 text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-sm animate-bounce-subtle shrink-0">
               <span className="text-lg" style={{ animation: 'candle-flicker 1.5s ease-in-out infinite alternate' }}>🕯️</span>
            </div>
            <div className="text-left">
              <h2 className="text-[13px] font-black text-foreground uppercase tracking-tight leading-none mb-0.5">ANIVERSÁRIOS DE BATISMO</h2>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest leading-none">próximos aniversários</p>
            </div>
          </div>

          <div className="relative p-[1.5px] rounded-[28px] bg-gradient-to-br from-blue-400/60 via-blue-500/40 to-blue-600/40 shadow-[0_12px_35px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="absolute inset-[2.5px] rounded-[26px] border border-white/50 dark:border-white/10 z-20 pointer-events-none opacity-60 mix-blend-overlay"></div>
            
            <div className="relative p-4 rounded-[26px] bg-white dark:bg-zinc-900 border-2 border-blue-500/5 shadow-xl shadow-blue-500/5 backdrop-blur-md text-center overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-[0.02] transform scale-150 rotate-12">
                 <span className="text-4xl opacity-20">🕯️</span>
              </div>

              {proximosAniversariantesBatismo.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-3xl">🕯️</div>
                  <p className="text-sm font-bold text-muted-foreground/70">Nenhum batismo próximo</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 relative z-10">
                  {proximosAniversariantesBatismo.map((c) => {
                    const diasAte = Math.round((c.proximoAniversario.getTime() - hoje.getTime()) / 86400000);
                    const isHoje = diasAte === 0;
                    return (
                      <div key={`batismo-${c.id}`} className={`p-3 rounded-2xl flex flex-col items-center text-center transition-all hover:scale-105 ${isHoje ? "bg-blue-400/10 ring-2 ring-blue-400/40 shadow-lg" : "bg-muted/30 border border-black/5"}`}>
                        <div className={`relative w-14 h-14 rounded-xl mb-2 overflow-hidden border-2 ${isHoje ? "border-blue-400 animate-soft-pulse scale-105" : "border-background shadow-sm"}`}>
                          {c.foto ? (
                            <img src={c.foto} alt={c.nome} className="w-full h-full object-cover" />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center text-lg font-black ${isHoje ? "bg-blue-100 text-blue-600" : "bg-primary/10 text-primary"}`}>
                              {c.nome?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {isHoje && (
                            <div className="absolute top-0 right-0 p-1 bg-blue-400 rounded-bl-xl text-white flex items-center justify-center">
                              <span className="text-[10px]" style={{ animation: 'candle-flicker 1.2s ease-in-out infinite alternate' }}>🕯️</span>
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] font-black text-foreground truncate w-full px-1 mb-0.5">{c.nome?.split(" ")[0]}</p>
                        <p className={`text-[8px] font-black uppercase tracking-widest ${isHoje ? "text-blue-600" : "text-muted-foreground/50"}`}>
                          {isHoje ? "🎉 HOJE!" : `${diasAte} DIAS`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
              <style>{`
                @keyframes candle-flicker {
                  0%   { transform: scaleY(1)   rotate(-2deg); opacity: 0.85; }
                  30%  { transform: scaleY(1.08) rotate(2deg);  opacity: 1;    }
                  60%  { transform: scaleY(0.96) rotate(-1deg); opacity: 0.90; }
                  100% { transform: scaleY(1.04) rotate(3deg);  opacity: 0.95; }
                }
              `}</style>
            </div>
          </div>
        </div>
      </div>

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
