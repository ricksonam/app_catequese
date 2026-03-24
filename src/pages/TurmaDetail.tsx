import { useParams, useNavigate } from "react-router-dom";
import { getTurmas, getEncontros, getCatequizandos, getAtividades } from "@/lib/store";
import { ArrowLeft, CalendarDays, Users, ListChecks, GitBranch } from "lucide-react";

export default function TurmaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const turma = getTurmas().find((t) => t.id === id);
  const encontros = getEncontros(id);
  const catequizandos = getCatequizandos(id);
  const atividades = getAtividades(id);

  if (!turma) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Turma não encontrada</p>
        <button onClick={() => navigate("/turmas")} className="text-primary text-sm mt-2 font-semibold">Voltar</button>
      </div>
    );
  }

  const modulos = [
    { label: "Encontros", icon: CalendarDays, count: encontros.length, path: `/turmas/${id}/encontros`, color: "bg-primary/10 text-primary" },
    { label: "Catequizandos", icon: Users, count: catequizandos.length, path: `/turmas/${id}/catequizandos`, color: "bg-accent/15 text-accent-foreground" },
    { label: "Atividades", icon: ListChecks, count: atividades.length, path: `/turmas/${id}/atividades`, color: "bg-liturgical/10 text-liturgical" },
    { label: "Plano", icon: GitBranch, count: null, path: `/turmas/${id}/plano`, color: "bg-success/10 text-success" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header animate-fade-in">
        <button onClick={() => navigate("/turmas")} className="back-btn">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{turma.nome}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {turma.diaCatequese} • {turma.horario} • {turma.local}
          </p>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-2 gap-3">
        {modulos.map((mod, i) => {
          const Icon = mod.icon;
          return (
            <button
              key={mod.label}
              onClick={() => navigate(mod.path)}
              className="float-card flex flex-col items-center p-5 text-center animate-float-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`icon-box w-14 h-14 rounded-2xl ${mod.color} mb-3`}>
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-bold text-foreground">{mod.label}</span>
              {mod.count !== null && (
                <p className="text-xs text-muted-foreground mt-0.5">{mod.count} cadastrados</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Info */}
      <div className="float-card p-5 space-y-3 animate-float-up" style={{ animationDelay: '300ms' }}>
        <p className="section-title mb-2">Informações</p>
        <div className="space-y-2 text-sm">
          <InfoRow label="Ano" value={turma.ano} />
          <InfoRow label="Etapa" value={turma.etapa} />
          {turma.outrosDados && <InfoRow label="Notas" value={turma.outrosDados} />}
          <InfoRow label="Criada em" value={new Date(turma.criadoEm).toLocaleDateString("pt-BR")} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
