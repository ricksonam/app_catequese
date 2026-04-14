import { BookOpen, Users, CalendarDays, ChevronRight, Cake, Star, X, BellRing } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useCatequizandos } from "@/hooks/useSupabaseData";
import { useMemo, useState, useEffect } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatarDataVigente } from "@/lib/utils";
import WelcomeModal from "@/components/WelcomeModal";
import { cn } from "@/lib/utils";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: turmas = [], isLoading: tLoading } = useTurmas();
  const { data: encontros = [], isLoading: eLoading } = useEncontros();
  const { data: catequizandos = [], isLoading: cLoading } = useCatequizandos();
  const [selectedTurmaId, setSelectedTurmaId] = useState<string | "all">("all");
  const [turmaPickerOpen, setTurmaPickerOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const { permission, subscribe, loading: pushLoading } = usePushNotifications();

  const loading = tLoading || eLoading || cLoading;

  useEffect(() => {
    if (!loading && turmas.length === 0 && !localStorage.getItem("ivc_welcome_seen")) {
      setWelcomeOpen(true);
    }
  }, [loading, turmas.length]);

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

  // Filtragem baseada na turma selecionada
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

  // Apenas o PRÓXIMO encontro mais próximo (da turma selecionada)
  const proximoEncontro = useMemo(() => {
    const pendentes = filteredEncontros
      .filter((e) => parseDataLocal(e.data) >= hoje && e.status === 'pendente')
      .sort((a, b) => parseDataLocal(a.data).getTime() - parseDataLocal(b.data).getTime());
    return pendentes[0] || null;
  }, [filteredEncontros, hoje]);

  // Aniversariantes: prioriza semana atual, fallback para o mais próximo
  const { aniversariantesSemana, fallbackAniversario } = useMemo(() => {
    const fimSemana = new Date(hoje);
    fimSemana.setDate(fimSemana.getDate() + 7);
    const thisYear = hoje.getFullYear();

    const todos = filteredCatequizandos
      .filter((c) => c.dataNascimento)
      .map((c) => {
        const bday = new Date(c.dataNascimento);
        let nextBday = new Date(thisYear, bday.getMonth(), bday.getDate());
        if (nextBday < hoje) nextBday = new Date(thisYear + 1, bday.getMonth(), bday.getDate());
        return { ...c, proximoAniversario: nextBday };
      })
      .sort((a, b) => a.proximoAniversario.getTime() - b.proximoAniversario.getTime());

    const semana = todos.filter((c) => c.proximoAniversario >= hoje && c.proximoAniversario <= fimSemana);
    return {
      aniversariantesSemana: semana,
      fallbackAniversario: semana.length === 0 && todos.length > 0 ? todos[0] : null,
    };
  }, [filteredCatequizandos, hoje]);

  function getDiasRestantes(dataStr: string) {
    const d = parseDataLocal(dataStr);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - hoje.getTime()) / 86400000);
  }

  const stats = [
    { 
      label: selectedTurmaId === "all" ? "Turmas" : (selectedTurma?.etapa || ""),
      value: selectedTurmaId === "all" ? turmas.length : (selectedTurma?.nome || "Turma"),
      icon: BookOpen,
      color: "bg-primary/10 text-primary",
      isTurma: true,
      action: () => setTurmaPickerOpen(true),
      isInteractive: true
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
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-lg bg-primary/20 animate-pulse" />
      </div>
    );
  }

  const dias = proximoEncontro ? getDiasRestantes(proximoEncontro.data) : 0;
  const isUrgent = proximoEncontro ? dias <= 3 : false;
  const turmaEncontro = proximoEncontro ? turmas.find((t) => t.id === proximoEncontro.turmaId) : null;
  const diaLabel = proximoEncontro
    ? (dias === 0 ? "Hoje!" : dias === 1 ? "Amanhã" : DIAS_SEMANA[parseDataLocal(proximoEncontro.data).getDay()])
    : "";

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
                stat.isTurma 
                  ? "border-primary bg-primary/5 shadow-2xl shadow-primary/20 ring-4 ring-primary/10 animate-pulse-subtle" 
                  : "border-transparent"
              )}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {stat.isTurma && (
                <div className="absolute top-0 right-0 p-1.5 bg-primary text-white rounded-bl-xl shadow-lg">
                  <ChevronRight className="h-3.5 w-3.5 animate-bounce-horizontal" />
                </div>
              )}


              <div className={`icon-box ${stat.color} mx-auto mb-1.5 sm:mb-2.5 w-9 h-9 sm:w-10 sm:h-10`}>
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <p className={cn(
                "font-bold leading-tight truncate",
                stat.isTurma && selectedTurmaId !== "all" ? "text-xs sm:text-sm mb-1 text-primary" : "text-xl sm:text-2xl text-foreground"
              )} title={String(stat.value)}>
                {stat.value}
              </p>
              <div className="text-[8px] sm:text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-0.5 leading-tight break-words">
                {stat.isTurma ? (
                  <div className="flex flex-col items-center gap-0.5">
                    {selectedTurmaId === "all" ? (
                      <span className="text-muted-foreground">{stat.label}</span>
                    ) : (
                       <span className="text-[9px] text-muted-foreground/80 capitalize font-medium">{stat.label}</span>
                    )}
                    <span className="flex items-center justify-center gap-1 text-primary animate-pulse pt-0.5">
                      {selectedTurmaId === "all" ? "● SELECIONAR" : "● TROCAR"}
                    </span>
                  </div>
                ) : stat.label}
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
            {/* Faixa do status no topo */}
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
      {(aniversariantesSemana.length > 0 || fallbackAniversario) && (
        <div className="animate-float-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md animate-bounce" style={{ animationDelay: '500ms' }}>
              <Cake className="h-4 w-4 text-white" />
            </div>
            <p className="text-lg font-black text-foreground uppercase tracking-tight mb-0">
              {aniversariantesSemana.length > 0 ? "Aniversariantes desta Semana" : "Próximo Aniversário"}
            </p>
          </div>

          {aniversariantesSemana.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {aniversariantesSemana.map((c, i) => {
                const diasAte = Math.round((c.proximoAniversario.getTime() - hoje.getTime()) / 86400000);
                const isHoje = diasAte === 0;
                return (
                  <div
                    key={c.id}
                    className={`shrink-0 flex flex-col items-center text-center p-4 rounded-2xl border-2 w-28 animate-float-up ${
                      isHoje
                        ? "bg-gradient-to-b from-primary/20 to-violet-500/10 border-primary/50 shadow-lg shadow-primary/15"
                        : "bg-card border-black/10"
                    }`}
                    style={{ animationDelay: `${(i + 5) * 60}ms` }}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black mb-2 shadow-sm ${
                      isHoje
                        ? "bg-gradient-to-br from-primary to-violet-600 text-white"
                        : "bg-gradient-to-br from-primary/20 to-primary/10 text-primary"
                    }`}>
                      {c.nome?.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-xs font-bold text-foreground leading-tight break-words w-full">
                      {c.nome?.split(" ")[0]}
                    </p>
                    <p className={`text-[10px] font-black mt-1 ${isHoje ? "text-primary" : "text-muted-foreground"}`}>
                      {isHoje ? "🎉 Hoje!" : `em ${diasAte} dia${diasAte !== 1 ? "s" : ""}`}
                    </p>
                    {isHoje && <Star className="h-3 w-3 text-primary mt-1 animate-pulse" />}
                  </div>
                );
              })}
            </div>
                );
              })()
            ) : null}
        </div>
      )}

      {turmas.length === 0 && (
        <div 
          className="float-card p-8 text-center animate-card-activate"
          onClick={() => navigate("/turmas/nova")}
          style={{ cursor: 'pointer' }}
        >
          <div className="icon-box bg-primary/20 text-primary mx-auto mb-4 scale-110 animate-bounce-subtle">
            <BookOpen className="h-6 w-6" />
          </div>
          
          <h3 className="text-lg font-black text-foreground mb-2">Comece criando sua turma</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto leading-relaxed">
            Tudo pronto! Crie sua primeira turma e comece a organizar seus encontros de catequese.
          </p>

          <button 
            onClick={(e) => { e.stopPropagation(); navigate("/turmas/nova"); }}
            className="mx-auto flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-sm bg-primary text-white shadow-xl shadow-primary/25 hover:scale-105 active:scale-95 transition-all animate-soft-pulse"
          >
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            Criar Turma
          </button>

          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.2em] animate-pulse">
            <span>✦</span>
            <span>Acesso Liberado</span>
            <span>✦</span>
          </div>
        </div>
      )}



      {/* Turma intelligence picker dialog */}
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
    </div>
  );
}
