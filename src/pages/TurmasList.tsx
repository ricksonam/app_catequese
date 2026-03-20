import { getTurmas } from "@/lib/store";
import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, Plus } from "lucide-react";
import { EtapaMap } from "@/components/EtapaMap";

export default function TurmasList() {
  const turmas = getTurmas();
  const navigate = useNavigate();

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Turmas</h1>
        <button
          onClick={() => navigate("/turmas/nova")}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> Nova
        </button>
      </div>

      {turmas.length === 0 ? (
        <div className="ios-card p-8 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">Nenhuma turma cadastrada</h3>
          <p className="text-sm text-muted-foreground">Crie sua primeira turma para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {turmas.map((turma) => (
            <button
              key={turma.id}
              onClick={() => navigate(`/turmas/${turma.id}`)}
              className="ios-card w-full p-4 text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground">{turma.nome}</h3>
                  <p className="text-xs text-muted-foreground">
                    {turma.diaCatequese} • {turma.horario} • {turma.local}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground mt-1" />
              </div>
              <EtapaMap etapaAtual={turma.etapa} readonly />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
