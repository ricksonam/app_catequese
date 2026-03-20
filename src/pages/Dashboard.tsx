import { BookOpen, Users, CalendarDays, ChevronRight, Cross, Cake } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getTurmas, getEncontros, getCatequizandos } from "@/lib/store";
import { useMemo } from "react";
import { EtapaMap } from "@/components/EtapaMap";

export default function Dashboard() {
  const navigate = useNavigate();
  const turmas = getTurmas();
  const encontros = getEncontros();
  const catequizandos = getCatequizandos();

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

  // Simple liturgical time calculation
  const tempoLiturgico = useMemo(() => {
    const month = hoje.getMonth();
    if (month === 11 || month <= 0) return { nome: "Advento / Natal", cor: "bg-liturgical" };
    if (month >= 1 && month <= 2) return { nome: "Tempo Comum", cor: "bg-success" };
    if (month >= 2 && month <= 3) return { nome: "Quaresma", cor: "bg-liturgical" };
    if (month === 3 || month === 4) return { nome: "Páscoa", cor: "bg-gold" };
    return { nome: "Tempo Comum", cor: "bg-success" };
  }, []);

  const stats = [
    { label: "Turmas", value: turmas.length, icon: BookOpen, color: "bg-primary/10 text-primary" },
    { label: "Catequizandos", value: catequizandos.length, icon: Users, color: "bg-accent/20 text-accent-foreground" },
    { label: "Encontros", value: encontros.filter((e) => e.status === 'pendente').length, icon: CalendarDays, color: "bg-success/10 text-success" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Olá, Catequista! 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">Bem-vindo ao IVC - Gestão de Catequese</p>
      </div>

      {/* Liturgical Banner */}
      <div className={`ios-card overflow-hidden ${tempoLiturgico.cor} p-4`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-card/20 flex items-center justify-center">
            <Cross className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-xs font-medium text-primary-foreground/80 uppercase tracking-wider">Tempo Litúrgico</p>
            <p className="text-lg font-bold text-primary-foreground">{tempoLiturgico.nome}</p>
          </div>
        </div>
      </div>

      {/* Evangelho do Dia */}
      <div className="ios-card p-4">
        <p className="ios-section-title">📖 Evangelho do Dia</p>
        <p className="text-sm text-foreground leading-relaxed mt-2">
          "Pedi e vos será dado; buscai e encontrareis; batei e vos será aberto." 
        </p>
        <p className="text-xs text-muted-foreground mt-2">Mt 7,7 — Tempo Comum</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="ios-card p-3 text-center">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mx-auto mb-2`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground font-medium">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Próximos Encontros */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="ios-section-title mb-0">Próximos Encontros</p>
          <button onClick={() => navigate("/turmas")} className="text-xs text-primary font-medium">
            Ver todos
          </button>
        </div>
        {proximosEncontros.length === 0 ? (
          <div className="ios-card p-6 text-center">
            <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum encontro agendado</p>
            <button
              onClick={() => navigate("/turmas")}
              className="text-sm text-primary font-medium mt-2"
            >
              Agendar encontro
            </button>
          </div>
        ) : (
          <div className="ios-card overflow-hidden">
            {proximosEncontros.map((e, i) => {
              const turma = turmas.find((t) => t.id === e.turmaId);
              return (
                <div
                  key={e.id}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    i < proximosEncontros.length - 1 ? "border-b border-border/50" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{e.tema}</p>
                    <p className="text-xs text-muted-foreground">{turma?.nome} • {new Date(e.data).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Aniversários */}
      {proximosAniversarios.length > 0 && (
        <div>
          <p className="ios-section-title">🎂 Próximos Aniversários</p>
          <div className="ios-card overflow-hidden">
            {proximosAniversarios.map((c, i) => (
              <div
                key={c.id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i < proximosAniversarios.length - 1 ? "border-b border-border/50" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
                  <Cake className="h-5 w-5 text-gold" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.proximoAniversario.toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA para criar turma */}
      {turmas.length === 0 && (
        <div className="ios-card p-6 text-center bg-primary/5 border-primary/20">
          <BookOpen className="h-10 w-10 text-primary mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground mb-1">Comece criando sua turma</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Crie sua primeira turma de catequese para começar a gerenciar encontros e catequizandos.
          </p>
          <button
            onClick={() => navigate("/turmas/nova")}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm"
          >
            Criar Turma
          </button>
        </div>
      )}
    </div>
  );
}
