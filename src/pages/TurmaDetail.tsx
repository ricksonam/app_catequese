import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useCatequizandos, useAtividades } from "@/hooks/useSupabaseData";
import { ArrowLeft, CalendarDays, Users, ListChecks, GitBranch } from "lucide-react";

export default function TurmaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: turmas = [], isLoading } = useTurmas();
  const { data: encontros = [] } = useEncontros(id);
  const { data: catequizandos = [] } = useCatequizandos(id);
  const { data: atividades = [] } = useAtividades(id);

  const turma = turmas.find((t) => t.id === id);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 rounded-lg bg-primary/20 animate-pulse" /></div>;
  }

  if (!turma) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Turma não encontrada</p>
        <button onClick={() => navigate("/turmas")} className="text-primary text-sm mt-2 font-semibold">Voltar</button>
      </div>
    );
  }

  const modulos = [
    { label: "Encontros", icon: CalendarDays, count: encontros.length, path: `/turmas/${id}/encontros`, color: "bg-primary/12 text-primary", borderColor: "border-primary/20" },
    { label: "Catequizandos", icon: Users, count: catequizandos.length, path: `/turmas/${id}/catequizandos`, color: "bg-[hsl(38,92%,50%)]/12 text-[hsl(38,92%,50%)]", borderColor: "border-[hsl(38,92%,50%)]/20" },
    { label: "Atividades", icon: ListChecks, count: atividades.length, path: `/turmas/${id}/atividades`, color: "bg-[hsl(270,50%,55%)]/12 text-[hsl(270,50%,55%)]", borderColor: "border-[hsl(270,50%,55%)]/20" },
    { label: "Plano", icon: GitBranch, count: null, path: `/turmas/${id}/plano`, color: "bg-[hsl(152,60%,42%)]/12 text-[hsl(152,60%,42%)]", borderColor: "border-[hsl(152,60%,42%)]/20" },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header animate-fade-in">
        <button onClick={() => navigate("/turmas")} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{turma.nome}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{turma.diaCatequese} • {turma.horario} • {turma.local}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {modulos.map((mod, i) => {
          const Icon = mod.icon;
          return (
            <button
              key={mod.label}
              onClick={() => navigate(mod.path)}
              className={`float-card flex flex-col items-center p-4 text-center animate-float-up border ${mod.borderColor} active:scale-[0.97] transition-transform`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`w-12 h-12 rounded-xl ${mod.color} flex items-center justify-center mb-2`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-foreground leading-tight">{mod.label}</span>
              {mod.count !== null && <p className="text-[10px] text-muted-foreground mt-0.5">{mod.count} cadastrados</p>}
            </button>
          );
        })}
      </div>

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
