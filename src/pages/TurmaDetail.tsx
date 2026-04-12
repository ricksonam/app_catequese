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
    { label: "Encontros", desc: "Calendário e freq.", icon: CalendarDays, count: encontros.length, path: `/turmas/${id}/encontros`, color: "bg-primary/10 text-primary", gradient: "from-primary/5 to-primary/10" },
    { label: "Catequizandos", desc: "Perfis e acompanhamento", icon: Users, count: catequizandos.length, path: `/turmas/${id}/catequizandos`, color: "bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))]", gradient: "from-[hsl(var(--accent))]/5 to-[hsl(var(--accent))]/10" },
    { label: "Atividades", desc: "Eventos e projetos", icon: ListChecks, count: atividades.length, path: `/turmas/${id}/atividades`, color: "bg-[hsl(var(--liturgical))]/15 text-[hsl(var(--liturgical))]", gradient: "from-[hsl(var(--liturgical))]/5 to-[hsl(var(--liturgical))]/10" },
    { label: "Plano Aula", desc: "Conteúdos e etapas", icon: GitBranch, count: null, path: `/turmas/${id}/plano`, color: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]", gradient: "from-[hsl(var(--success))]/5 to-[hsl(var(--success))]/10" },
  ];

  const relatorioModulo = { label: "Relatórios", icon: PieChart, path: `/turmas/${id}/relatorios` };

  return (
    <div className="space-y-6 pb-10">
      {/* Header & Info Bar */}
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/turmas")} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
            <h1 className="text-xl font-black text-foreground tracking-tight">{turma.nome}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate(relatorioModulo.path)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/10 text-gold-700 text-[10px] font-black uppercase tracking-widest border border-gold/20 shadow-sm active:scale-95 transition-all"
            >
              <PieChart className="h-3.5 w-3.5" />
              Relatórios
            </button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button disabled={deleteMutation.isPending} className="w-9 h-9 flex items-center justify-center rounded-xl text-destructive bg-destructive/10 hover:bg-destructive/20 transition-all active:scale-95">
                  <Trash2 className="h-4 w-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Turma</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita e removerá todos os dados vinculados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
                    Confirmar Exclusão
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Barra de Informações Compacta */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide px-0.5">
          <InfoBadge label="Ano" value={turma.ano} color="bg-primary/5 text-primary border-primary/10" />
          <InfoBadge label="Etapa" value={turma.etapa} color="bg-accent/5 text-accent-foreground border-accent/10" />
          <InfoBadge label="Dia" value={turma.diaCatequese} color="bg-liturgical/5 text-liturgical border-liturgical/10" />
          <InfoBadge label="Hora" value={turma.horario} color="bg-success/5 text-success border-success/10" />
          <InfoBadge label="Local" value={turma.local} color="bg-muted/50 text-muted-foreground border-black/5" />
        </div>
      </div>

      {/* Grade 2x2 de Módulos */}
      <div className="grid grid-cols-2 gap-4">
        {modulos.map((mod, i) => {
          const Icon = mod.icon;
          return (
            <div 
              key={mod.label}
              className="relative p-[1.5px] rounded-2xl bg-gradient-to-br from-gold/40 via-gold/10 to-primary/20 shadow-sm hover:shadow-xl animate-float-up transition-all duration-300 hover:-translate-y-1 active:scale-[0.97] cursor-pointer group"
              style={{ animationDelay: `${i * 100}ms` }}
              onClick={() => navigate(mod.path)}
            >
              <div className="absolute inset-[2px] rounded-xl border border-white/30 z-20 pointer-events-none opacity-40 mix-blend-overlay"></div>
              
              <div className={`relative flex flex-col items-center justify-center p-5 rounded-[14px] bg-card h-full bg-gradient-to-b ${mod.gradient} overflow-hidden text-center`}>
                
                <div className="absolute -right-2 -bottom-2 opacity-[0.03] pointer-events-none group-hover:scale-125 transition-transform duration-700">
                   <Icon className="w-20 h-20" />
                </div>

                <div className={`w-12 h-12 rounded-2xl ${mod.color} flex items-center justify-center shrink-0 shadow-md relative z-30 border border-white/20 mb-3`}>
                  <Icon className="h-6 w-6" />
                </div>
                
                <div className="relative z-30 space-y-1">
                  <h3 className="text-[13px] font-black text-foreground tracking-tight leading-tight group-hover:text-primary transition-colors">{mod.label}</h3>
                  <p className="text-[9px] text-muted-foreground leading-tight px-1">{mod.desc}</p>
                  
                  {mod.count !== null && (
                    <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full bg-white/80 dark:bg-black/20 shadow-sm border border-border/40 text-[9px] font-black text-foreground">
                      {mod.count} {mod.count !== 1 ? 'itens' : 'item'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {turma.outrosDados && (
        <div className="float-card p-4 animate-float-up" style={{ animationDelay: '400ms' }}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">Observações da Turma</p>
          <p className="text-xs text-foreground leading-relaxed italic">"{turma.outrosDados}"</p>
        </div>
      )}
    </div>
  );
}

function InfoBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold ${color}`}>
      <span className="opacity-60">{label}:</span>
      <span className="truncate max-w-[100px]">{value}</span>
    </div>
  );
}
