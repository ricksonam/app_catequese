import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useCatequizandos, useAtividades, useDeleteTurma } from "@/hooks/useSupabaseData";
import { ArrowLeft, CalendarDays, Users, ListChecks, GitBranch, Trash2, PieChart, ChevronRight } from "lucide-react";
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
    { label: "Encontros", desc: "Gestão de calendário e frequência", icon: CalendarDays, count: encontros.length, path: `/turmas/${id}/encontros`, color: "bg-primary/10 text-primary", gradient: "from-primary/5 to-primary/10" },
    { label: "Catequizandos", desc: "Perfis e acompanhamento detalhado", icon: Users, count: catequizandos.length, path: `/turmas/${id}/catequizandos`, color: "bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))]", gradient: "from-[hsl(var(--accent))]/5 to-[hsl(var(--accent))]/10" },
    { label: "Atividades e Eventos", desc: "Eventos extras e projetos especiais", icon: ListChecks, count: atividades.length, path: `/turmas/${id}/atividades`, color: "bg-[hsl(var(--liturgical))]/15 text-[hsl(var(--liturgical))]", gradient: "from-[hsl(var(--liturgical))]/5 to-[hsl(var(--liturgical))]/10" },
    { label: "Plano da Turma", desc: "Planejamento de conteúdos e etapas", icon: GitBranch, count: null, path: `/turmas/${id}/plano`, color: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]", gradient: "from-[hsl(var(--success))]/5 to-[hsl(var(--success))]/10" },
    { label: "Relatórios", desc: "Métricas, dados e geração de PDF", icon: PieChart, count: null, path: `/turmas/${id}/relatorios`, color: "bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))]", gradient: "from-[hsl(var(--destructive))]/5 to-[hsl(var(--destructive))]/10" },
  ];

  return (
    <div className="space-y-4">
      <div className="page-header animate-fade-in mb-6">
        <button onClick={() => navigate("/turmas")} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{turma.nome}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{turma.diaCatequese} • {turma.horario} • {turma.local}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {modulos.map((mod, i) => {
          const Icon = mod.icon;
          return (
            <div 
              key={mod.label}
              className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[hsl(var(--gold))]/50 via-[hsl(var(--liturgical))]/40 to-primary/30 shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.15)] animate-float-up transition-all duration-300 hover:-translate-y-1.5 cursor-pointer group"
              style={{ animationDelay: `${i * 100}ms` }}
              onClick={() => navigate(mod.path)}
            >
              {/* Moldura litúrgica dupla interna */}
              <div className="absolute inset-[3px] rounded-xl border border-white/40 dark:border-white/10 z-20 pointer-events-none opacity-50 mix-blend-overlay"></div>
              
              <div className={`relative flex items-center p-4 rounded-[14px] bg-card w-full h-full bg-gradient-to-r ${mod.gradient} overflow-hidden`}>
                
                {/* Marca d'água / Ícone de fundo para dar charme inteligente */}
                <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                   <Icon className="w-28 h-28" />
                </div>

                <div className={`w-14 h-14 rounded-2xl ${mod.color} flex items-center justify-center shrink-0 shadow-lg relative z-30 border border-white/20 dark:border-white/5`}>
                  <Icon className="h-6 w-6" />
                </div>
                
                <div className="ml-4 flex-1 text-left relative z-30">
                  <h3 className="text-[15px] font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{mod.label}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{mod.desc}</p>
                  
                  {mod.count !== null && (
                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full bg-background/80 shadow-sm border border-border/50 text-[10px] font-semibold text-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))] mr-1.5 shadow-[0_0_5px_hsl(var(--success))]"></span>
                      {mod.count} ativo{mod.count !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                
                <div className="w-8 h-8 rounded-full bg-background/50 flex items-center justify-center ml-2 border border-border/50 shadow-sm relative z-30 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="float-card p-4 space-y-2 animate-float-up" style={{ animationDelay: '300ms' }}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 mb-1">Informações</p>
        <div className="space-y-1.5 text-xs">
          <InfoRow label="Ano" value={turma.ano} />
          <InfoRow label="Etapa" value={turma.etapa} />
          {turma.outrosDados && <InfoRow label="Notas" value={turma.outrosDados} />}
          <InfoRow label="Criada em" value={new Date(turma.criadoEm).toLocaleDateString("pt-BR")} />
        </div>

        <div className="pt-3 mt-1 border-t border-border/40">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button disabled={deleteMutation.isPending} className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-destructive bg-destructive/5 hover:bg-destructive/10 transition-colors font-semibold text-xs">
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
