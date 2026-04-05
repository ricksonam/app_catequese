import { BookOpen, Users, CalendarDays, ChevronRight, Cake } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useCatequizandos } from "@/hooks/useSupabaseData";
import { useMemo } from "react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: turmas = [], isLoading: tLoading } = useTurmas();
  const { data: encontros = [], isLoading: eLoading } = useEncontros();
  const { data: catequizandos = [], isLoading: cLoading } = useCatequizandos();

  const loading = tLoading || eLoading || cLoading;

  const hoje = new Date();
  const proximosEncontros = useMemo(() => {
    return encontros
      .filter((e) => new Date(e.data) >= hoje && e.status === 'pendente')
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
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

  const stats = [
    { label: "Turmas", value: turmas.length, icon: BookOpen, color: "bg-primary/10 text-primary", path: "/turmas" },
    { label: "Catequizandos", value: catequizandos.length, icon: Users, color: "bg-accent/15 text-accent-foreground", path: "/turmas" },
    { label: "Encontros", value: encontros.filter((e) => e.status === 'pendente').length, icon: CalendarDays, color: "bg-success/10 text-success", path: "/turmas" },
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
            <button key={stat.label} onClick={() => navigate(stat.path)} className="float-card p-2.5 sm:p-4 text-center animate-float-up active:scale-95 transition-transform min-w-0" style={{ animationDelay: `${i * 80}ms` }}>
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
              return (
                <div key={e.id} className="float-card flex items-center gap-3 px-4 py-3.5 animate-float-up" style={{ animationDelay: `${(i + 3) * 60}ms` }}>
                  <div className="icon-box bg-primary/10"><CalendarDays className="h-5 w-5 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{e.tema}</p>
                    <p className="text-xs text-muted-foreground">{turma?.nome} • {new Date(e.data).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
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
    </div>
  );
}
