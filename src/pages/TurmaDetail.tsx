import { useParams, useNavigate } from "react-router-dom";
import { getTurmas, getEncontros, getCatequizandos } from "@/lib/store";
import { ArrowLeft, CalendarDays, Users, ListChecks, GitBranch, ChevronRight } from "lucide-react";
import { EtapaMap } from "@/components/EtapaMap";

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
    { label: "Atividades e Etapas", icon: ListChecks, count: 0, path: `/turmas/${id}/atividades`, color: "bg-liturgical/10 text-liturgical" },
    { label: "Plano da Turma", icon: GitBranch, count: null, path: `/turmas/${id}/plano`, color: "bg-success/10 text-success" },
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

      {/* Etapa Map */}
      <div className="ios-card p-4">
        <p className="ios-section-title mb-3">Itinerário de Formação</p>
        <EtapaMap etapaAtual={turma.etapa} readonly />
      </div>

      {/* Modules */}
      <div>
        <p className="ios-section-title">Módulos da Turma</p>
        <div className="ios-card overflow-hidden">
          {modulos.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.label}
                onClick={() => navigate(mod.path)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left ${
                  i < modulos.length - 1 ? "border-b border-border/50" : ""
                }`}
              >
                <div className={`w-10 h-10 rounded-xl ${mod.color} flex items-center justify-center`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{mod.label}</p>
                  {mod.count !== null && (
                    <p className="text-xs text-muted-foreground">{mod.count} registros</p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <div className="ios-card p-4 space-y-2">
        <p className="ios-section-title">Informações</p>
        <div className="space-y-1.5 text-sm">
          <p><span className="text-muted-foreground">Ano:</span> <span className="font-medium text-foreground">{turma.ano}</span></p>
          {turma.outrosDados && (
            <p><span className="text-muted-foreground">Notas:</span> <span className="font-medium text-foreground">{turma.outrosDados}</span></p>
          )}
          <p><span className="text-muted-foreground">Criada em:</span> <span className="font-medium text-foreground">{new Date(turma.criadoEm).toLocaleDateString("pt-BR")}</span></p>
        </div>
      </div>
    </div>
  );
}
