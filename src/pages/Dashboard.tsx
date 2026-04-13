import { BookOpen, Users, CalendarDays, ChevronRight, Cake, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useCatequizandos } from "@/hooks/useSupabaseData";
import { useMemo, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatarDataVigente } from "@/lib/utils";
import WelcomeModal from "@/components/WelcomeModal";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: turmas = [], isLoading: tLoading } = useTurmas();
  const { data: encontros = [], isLoading: eLoading } = useEncontros();
  const { data: catequizandos = [], isLoading: cLoading } = useCatequizandos();
  const [turmaPickerOpen, setTurmaPickerOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

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

  // Apenas o PRÓXIMO encontro mais próximo
  const proximoEncontro = useMemo(() => {
    const pendentes = encontros
      .filter((e) => parseDataLocal(e.data) >= hoje && e.status === 'pendente')
      .sort((a, b) => parseDataLocal(a.data).getTime() - parseDataLocal(b.data).getTime());
    return pendentes[0] || null;
  }, [encontros]);

  // Aniversariantes: prioriza semana atual, fallback para o mais próximo
  const { aniversariantesSemana, fallbackAniversario } = useMemo(() => {
    const fimSemana = new Date(hoje);
    fimSemana.setDate(fimSemana.getDate() + 7);
    const thisYear = hoje.getFullYear();

    const todos = catequizandos
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
  }, [catequizandos]);

  function getDiasRestantes(dataStr: string) {
    const d = parseDataLocal(dataStr);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - hoje.getTime()) / 86400000);
  }

  function handleCatequizandosClick() {
    if (turmas.length === 0) return;
    if (turmas.length === 1) navigate(`/turmas/${turmas[0].id}/catequizandos`);
    else setTurmaPickerOpen(true);
  }

  function handleEncontrosClick() {
    if (turmas.length === 0) return;
    if (turmas.length === 1) navigate(`/turmas/${turmas[0].id}/encontros`);
    else navigate("/turmas");
  }

  const stats = [
    { label: "Turmas",        value: turmas.length,                                           icon: BookOpen,    color: "bg-primary/10 text-primary",          action: () => navigate("/turmas") },
    { label: "Catequizandos", value: catequizandos.length,                                    icon: Users,       color: "bg-accent/15 text-accent-foreground",  action: handleCatequizandosClick },
    { label: "Encontros",     value: encontros.filter((e) => e.status === 'pendente').length, icon: CalendarDays,color: "bg-success/10 text-success",            action: handleEncontrosClick },
  ];

  const showTourButton = !welcomeOpen && !!localStorage.getItem("ivc_welcome_seen");

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

      <div className="animate-fade-in flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Olá, Catequista! 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">Bem-vindo ao iCatequese</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <button key={stat.label} onClick={stat.action} className="float-card p-2.5 sm:p-4 text-center animate-float-up active:scale-95 transition-transform min-w-0" style={{ animationDelay: `${i * 80}ms` }}>
              <div className={`icon-box ${stat.color} mx-auto mb-1.5 sm:mb-2.5 w-9 h-9 sm:w-10 sm:h-10`}>
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-[8px] sm:text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mt-0.5 leading-tight break-words">{stat.label}</p>
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
            <p className="text-sm text-muted-foreground">Nenhum encontro agendado</p>
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
              {/* Coluna da data — estilo almanaque */}
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

              {/* Conteúdo */}
              <div className="flex-1 px-4 py-4 min-w-0">
                <p className="text-sm font-bold text-foreground truncate mb-1">{proximoEncontro.tema}</p>
                <p className="text-xs text-muted-foreground">{turmaEncontro?.nome}</p>
                <p className="text-xs text-muted-foreground">{formatarDataVigente(proximoEncontro.data)}</p>
              </div>

              {/* Badge piscante + seta */}
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

      {/* ── ANIVERSARIANTES DA SEMANA ou mais próximo ── */}
      {(aniversariantesSemana.length > 0 || fallbackAniversario) && (
        <div className="animate-float-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-md animate-bounce" style={{ animationDelay: '500ms' }}>
              <Cake className="h-4 w-4 text-white" />
            </div>
            <p className="text-lg font-black text-foreground uppercase tracking-tight mb-0">
              {aniversariantesSemana.length > 0 ? "Aniversariantes desta Semana" : "Próximo Aniversário"}
            </p>
          </div>

          {aniversariantesSemana.length > 0 ? (
            /* Scroll horizontal estilo cards de festa */
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
          ) : fallbackAniversario ? (
            /* Card horizontal compacto para o próximo aniversário */
            (() => {
              const fb = fallbackAniversario;
              const diasAte = Math.round((fb.proximoAniversario.getTime() - hoje.getTime()) / 86400000);
              return (
                <div className="float-card flex items-center gap-4 px-5 py-4 border-black/10">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-base font-black text-primary shrink-0">
                    {fb.nome?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{fb.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {fb.proximoAniversario.toLocaleDateString("pt-BR", { weekday: 'long', day: '2-digit', month: 'long' })}
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20 shrink-0">
                    em {diasAte}d
                  </span>
                </div>
              );
            })()
          ) : null}
        </div>
      )}



      {turmas.length === 0 && (
        <div className="float-card p-8 text-center bg-primary/5 border-primary/20 animate-float-up" style={{ animationDelay: '400ms' }}>
          <div className="icon-box bg-primary/10 text-primary mx-auto mb-3"><BookOpen className="h-5 w-5" /></div>
          <h3 className="text-base font-bold text-foreground mb-1">Comece criando sua turma</h3>
          <p className="text-sm text-muted-foreground mb-5">Crie sua primeira turma de catequese para começar a gerenciar encontros e catequizandos.</p>
          <button onClick={() => navigate("/turmas/nova")} className="action-btn mx-auto">Criar Turma</button>
        </div>
      )}

      {/* Turma picker dialog */}
      <Dialog open={turmaPickerOpen} onOpenChange={setTurmaPickerOpen}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">Escolha a Turma</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {turmas.map((t) => {
              const count = catequizandos.filter((c) => c.turmaId === t.id).length;
              return (
                <button
                  key={t.id}
                  onClick={() => { setTurmaPickerOpen(false); navigate(`/turmas/${t.id}/catequizandos`); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors active:scale-[0.98] text-left"
                >
                  <div className="icon-box bg-primary/10 w-10 h-10"><BookOpen className="h-4 w-4 text-primary" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{t.nome}</p>
                    <p className="text-xs text-muted-foreground">{count} catequizando{count !== 1 ? "s" : ""}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
