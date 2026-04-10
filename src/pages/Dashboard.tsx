import { BookOpen, Users, CalendarDays, ChevronRight, Cake } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useCatequizandos } from "@/hooks/useSupabaseData";
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatarDataVigente } from "@/lib/utils";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: turmas = [], isLoading: tLoading } = useTurmas();
  const { data: encontros = [], isLoading: eLoading } = useEncontros();
  const { data: catequizandos = [], isLoading: cLoading } = useCatequizandos();
  const [turmaPickerOpen, setTurmaPickerOpen] = useState(false);

  const loading = tLoading || eLoading || cLoading;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Analisa datas ISO ignorando timezone, mantendo a data exata local
  const parseDataLocal = (dataStr: string) => {
    if (!dataStr) return new Date();
    const parts = dataStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return new Date(dataStr);
  };

  const proximosEncontros = useMemo(() => {
    return encontros
      .filter((e) => parseDataLocal(e.data) >= hoje && e.status === 'pendente')
      .sort((a, b) => parseDataLocal(a.data).getTime() - parseDataLocal(b.data).getTime())
      .slice(0, 3);
  }, [encontros]);

  const proximosAniversarios = useMemo(() => {
    const thisYear = hoje.getFullYear();
    return catequizandos
      .filter((c) => c.dataNascimento)
      .map((c) => {
        const bday = new Date(c.dataNascimento);
        const nextBday = new Date(thisYear, bday.getMonth(), bday.getDate());
        if (nextBday < hoje) nextBday.setFullYear(thisYear + 1);
        return { ...c, proximoAniversario: nextBday };
      })
      .sort((a, b) => a.proximoAniversario.getTime() - b.proximoAniversario.getTime())
      .slice(0, 3);
  }, [catequizandos]);

  function getDiasRestantes(dataStr: string) {
    const d = parseDataLocal(dataStr);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - hoje.getTime()) / 86400000);
  }

  function handleCatequizandosClick() {
    if (turmas.length === 0) return;
    if (turmas.length === 1) {
      navigate(`/turmas/${turmas[0].id}/catequizandos`);
    } else {
      setTurmaPickerOpen(true);
    }
  }

  function handleEncontrosClick() {
    if (turmas.length === 0) return;
    if (turmas.length === 1) {
      navigate(`/turmas/${turmas[0].id}/encontros`);
    } else {
      navigate("/turmas");
    }
  }

  const stats = [
    { label: "Turmas", value: turmas.length, icon: BookOpen, color: "bg-primary/10 text-primary", action: () => navigate("/turmas") },
    { label: "Catequizandos", value: catequizandos.length, icon: Users, color: "bg-accent/15 text-accent-foreground", action: handleCatequizandosClick },
    { label: "Encontros", value: encontros.filter((e) => e.status === 'pendente').length, icon: CalendarDays, color: "bg-success/10 text-success", action: handleEncontrosClick },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-lg bg-primary/20 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Olá, Catequista! 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">Bem-vindo ao IVC - Gestão de Catequese</p>
      </div>

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

      <div className="animate-float-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="section-title mb-0">Próximos Encontros</p>
          <button onClick={() => navigate("/turmas")} className="text-xs text-primary font-semibold">Ver todos</button>
        </div>
        {proximosEncontros.length === 0 ? (
          <div className="float-card p-8 text-center">
            <div className="icon-box bg-primary/10 text-primary mx-auto mb-3"><CalendarDays className="h-5 w-5" /></div>
            <p className="text-sm text-muted-foreground">Nenhum encontro agendado</p>
            <button onClick={() => navigate("/turmas")} className="text-sm text-primary font-semibold mt-2">Agendar encontro</button>
          </div>
        ) : (
          <div className="space-y-2">
            {proximosEncontros.map((e, i) => {
              const turma = turmas.find((t) => t.id === e.turmaId);
              const dias = getDiasRestantes(e.data);
              const isUrgent = dias <= 3;
              return (
                <button
                  key={e.id}
                  onClick={() => navigate(`/turmas/${e.turmaId}/encontros/${e.id}`)}
                  className={`flex items-center gap-3 px-4 py-3.5 animate-float-up w-full text-left transition-all active:scale-[0.98] ${isUrgent ? "float-card animate-pulse-border-red border-destructive/60 bg-red-500/5 relative z-10 scale-[1.02] shadow-lg ring-1 ring-destructive/20" : "float-card"}`}
                  style={{ animationDelay: `${(i + 3) * 60}ms` }}
                >
                  <div className={`icon-box ${isUrgent ? "bg-destructive/10" : "bg-primary/10"}`}>
                    <CalendarDays className={`h-5 w-5 ${isUrgent ? "text-destructive" : "text-primary"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{e.tema}</p>
                    <p className="text-xs text-muted-foreground">{turma?.nome} • {formatarDataVigente(e.data)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isUrgent && (
                      <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full animate-pulse-slow">
                        {dias === 0 
                          ? "Hoje!" 
                          : dias === 1 
                            ? "Amanhã" 
                            : parseDataLocal(e.data).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "").toUpperCase()}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {proximosAniversarios.length > 0 && (
        <div className="animate-float-up" style={{ animationDelay: '300ms' }}>
          <p className="section-title">🎂 Próximos Aniversários</p>
          <div className="space-y-2">
            {proximosAniversarios.map((c, i) => (
              <div key={c.id} className="float-card flex items-center gap-3 px-4 py-3.5 animate-float-up" style={{ animationDelay: `${(i + 5) * 60}ms` }}>
                <div className="icon-box bg-gold/15"><Cake className="h-5 w-5 text-gold" /></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">{c.proximoAniversario.toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            ))}
          </div>
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

      {/* Turma picker dialog for catequizandos */}
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
                  <div className="icon-box bg-primary/10 w-10 h-10">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
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
