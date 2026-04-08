import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useCatequizandos, useAtividades, useDeleteTurma } from "@/hooks/useSupabaseData";
import { ArrowLeft, CalendarDays, Users, ListChecks, GitBranch, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function TurmaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: turmas = [], isLoading } = useTurmas();
  const { data: encontros = [] } = useEncontros(id);
  const { data: catequizandos = [] } = useCatequizandos(id);
  const { data: atividades = [] } = useAtividades(id);
  const deleteMutation = useDeleteTurma();

  const turma = turmas.find((t) => t.id === id);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id!);
      toast.success("Turma excluída com sucesso");
      navigate("/turmas");
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

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
    { label: "Encontros", icon: CalendarDays, count: encontros.length, path: `/turmas/${id}/encontros`, color: "bg-primary/15 text-primary", borderColor: "border-primary/30", gradient: "from-primary/5 to-primary/15" },
    { label: "Catequizandos", icon: Users, count: catequizandos.length, path: `/turmas/${id}/catequizandos`, color: "bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))]", borderColor: "border-[hsl(var(--accent))]/30", gradient: "from-[hsl(var(--accent))]/5 to-[hsl(var(--accent))]/15" },
    { label: "Atividades e Eventos", icon: ListChecks, count: atividades.length, path: `/turmas/${id}/atividades`, color: "bg-[hsl(var(--liturgical))]/15 text-[hsl(var(--liturgical))]", borderColor: "border-[hsl(var(--liturgical))]/30", gradient: "from-[hsl(var(--liturgical))]/5 to-[hsl(var(--liturgical))]/15" },
    { label: "Plano da Turma", icon: GitBranch, count: null, path: `/turmas/${id}/plano`, color: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]", borderColor: "border-[hsl(var(--success))]/30", gradient: "from-[hsl(var(--success))]/5 to-[hsl(var(--success))]/15" },
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
              className={`float-card flex flex-col items-center p-5 text-center animate-float-up border ${mod.borderColor} bg-gradient-to-br ${mod.gradient} active:scale-[0.97] transition-transform`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`w-14 h-14 rounded-2xl ${mod.color} flex items-center justify-center mb-2.5`}>
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-bold text-foreground leading-tight">{mod.label}</span>
              {mod.count !== null && <p className="text-[11px] text-muted-foreground mt-1">{mod.count} cadastrados</p>}
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

        <div className="pt-4 mt-2 border-t border-border/50">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button disabled={deleteMutation.isPending} className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-destructive bg-destructive/10 hover:bg-destructive/15 transition-colors font-semibold text-sm">
                <Trash2 className="h-4 w-4" />
                {deleteMutation.isPending ? "Excluindo..." : "Excluir Turma"}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Turma</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita e removerá todos os dados vinculados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Confirmar Exclusão
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
