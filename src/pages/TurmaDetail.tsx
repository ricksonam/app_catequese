import { useParams, useNavigate } from "react-router-dom";
import { getTurmas, getEncontros, getCatequizandos } from "@/lib/store";
import { ArrowLeft, CalendarDays, Users, ListChecks, GitBranch } from "lucide-react";

export default function TurmaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const turma = getTurmas().find((t) => t.id === id);
  const encontros = getEncontros(id);
  const catequizandos = getCatequizandos(id);

  if (!turma) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Turma não encontrada</p>
        <button onClick={() => navigate("/turmas")} className="text-primary text-sm mt-2">
          Voltar
        </button>
      </div>
    );
  }

  const modulos = [
    { label: "Encontros", icon: CalendarDays, count: encontros.length, path: `/turmas/${id}/encontros`, color: "bg-primary/10 text-primary" },
    { label: "Catequizandos", icon: Users, count: catequizandos.length, path: `/turmas/${id}/catequizandos`, color: "bg-accent/20 text-accent-foreground" },
    { label: "Atividades", icon: ListChecks, count: 0, path: `/turmas/${id}/atividades`, color: "bg-liturgical/10 text-liturgical" },
    { label: "Plano", icon: GitBranch, count: null, path: `/turmas/${id}/plano`, color: "bg-success/10 text-success" },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/turmas")} className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{turma.nome}</h1>
          <p className="text-xs text-muted-foreground">
            {turma.diaCatequese} • {turma.horario} • {turma.local}
          </p>
        </div>
      </div>

      {/* Quick Access Modules - larger grid */}
      <div className="grid grid-cols-2 gap-3">
        {modulos.map((mod) => {
          const Icon = mod.icon;
          return (
            <button
              key={mod.label}
              onClick={() => navigate(mod.path)}
              className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/50 hover:shadow-md transition-all text-left"
            >
              <div className={`w-12 h-12 rounded-xl ${mod.color} flex items-center justify-center shrink-0`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <span className="text-sm font-semibold text-foreground">{mod.label}</span>
                {mod.count !== null && (
                  <p className="text-xs text-muted-foreground">{mod.count} cadastrados</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Info */}
      <div className="ios-card p-4 space-y-2">
        <p className="ios-section-title">Informações</p>
        <div className="space-y-1.5 text-sm">
          <p><span className="text-muted-foreground">Ano:</span> <span className="font-medium text-foreground">{turma.ano}</span></p>
          <p><span className="text-muted-foreground">Etapa:</span> <span className="font-medium text-foreground">{turma.etapa}</span></p>
          {turma.outrosDados && (
            <p><span className="text-muted-foreground">Notas:</span> <span className="font-medium text-foreground">{turma.outrosDados}</span></p>
          )}
          <p><span className="text-muted-foreground">Criada em:</span> <span className="font-medium text-foreground">{new Date(turma.criadoEm).toLocaleDateString("pt-BR")}</span></p>
        </div>
      </div>
    </div>
  );
}
