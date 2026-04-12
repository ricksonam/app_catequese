import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useCatequizandos, useAtividades, useDeleteTurma } from "@/hooks/useSupabaseData";
import { ArrowLeft, CalendarDays, Users, ListChecks, GitBranch, Trash2, PieChart, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
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
    { label: "Encontros", desc: "Calendário e freq.", icon: CalendarDays, count: encontros.length, unit: "encontro", path: `/turmas/${id}/encontros`, color: "bg-primary text-white", bg: "bg-primary/10", border: "border-primary/20", gradient: "from-primary/15 to-white" },
    { label: "Catequizandos", desc: "Perfis e acompanhamento", icon: Users, count: catequizandos.length, unit: "catequizando", path: `/turmas/${id}/catequizandos`, color: "bg-emerald-600 text-white", bg: "bg-emerald-500/10", border: "border-emerald-500/20", gradient: "from-emerald-500/15 to-white" },
    { label: "Atividades", desc: "Eventos e projetos", icon: ListChecks, count: atividades.length, unit: "atividade", path: `/turmas/${id}/atividades`, color: "bg-amber-600 text-white", bg: "bg-amber-500/10", border: "border-amber-500/20", gradient: "from-amber-500/15 to-white" },
    { label: "Plano da turma", desc: "Conteúdos e etapas", icon: GitBranch, count: null, unit: "", path: `/turmas/${id}/plano`, color: "bg-sky-600 text-white", bg: "bg-sky-500/10", border: "border-sky-500/20", gradient: "from-sky-500/15 to-white" },
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

        {/* Barra de Informações Centralizada */}
        <div className="space-y-2 px-0.5">
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
            <InfoBadge label="Ano" value={turma.ano} color="bg-primary/10 text-primary border-primary/20" />
            <InfoBadge label="Etapa" value={turma.etapa} color="bg-liturgical/10 text-liturgical border-liturgical/20" />
          </div>
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
            <InfoBadge label="Dia" value={turma.diaCatequese} color="bg-muted/10 text-muted-foreground border-black/10" />
            <InfoBadge label="Hora" value={turma.horario} color="bg-muted/10 text-muted-foreground border-black/10" />
            <InfoBadge label="Local" value={turma.local} color="bg-muted/10 text-muted-foreground border-black/10" />
          </div>
        </div>
      </div>

      {/* Grade 2x2 de Módulos */}
      <div className="grid grid-cols-2 gap-3">
        {modulos.map((mod, i) => {
          const Icon = mod.icon;
          const isPlan = mod.label === "Plano da turma";
          return (
            <div 
              key={mod.label}
              className={cn(
                "relative p-[1.5px] rounded-3xl animate-float-up transition-all duration-300 hover:-translate-y-1 active:scale-[0.96] cursor-pointer group shadow-md h-[150px]",
                mod.label === "Encontros" ? "bg-gradient-to-br from-primary/60 via-primary/30 to-white" :
                mod.label === "Catequizandos" ? "bg-gradient-to-br from-emerald-500/60 via-emerald-500/30 to-white" :
                mod.label === "Atividades" ? "bg-gradient-to-br from-amber-500/60 via-amber-500/30 to-white" :
                "bg-gradient-to-br from-sky-500/60 via-sky-500/30 to-white"
              )}
              style={{ animationDelay: `${i * 100}ms` }}
              onClick={() => navigate(mod.path)}
            >
              <div className="absolute inset-[3px] rounded-[22px] border-2 border-white/40 z-20 pointer-events-none opacity-60"></div>
              
              <div className={`relative flex flex-col items-center justify-between p-3.5 rounded-[22px] bg-white h-full bg-gradient-to-b ${mod.gradient} overflow-hidden text-center`}>
                
                <div className="absolute -right-3 -top-3 opacity-[0.05] pointer-events-none group-hover:scale-150 group-hover:rotate-12 transition-transform duration-1000">
                   <Icon className="w-20 h-20" />
                </div>

                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg relative z-30 border-2 border-white/50 transition-transform group-hover:scale-110 duration-500",
                  mod.color
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                
                <div className="relative z-30 flex-1 flex flex-col items-center justify-center w-full min-h-0">
                  <div className="flex flex-col items-center justify-center mb-1">
                    <h3 className="text-[13px] font-black text-foreground tracking-tight leading-none group-hover:text-primary transition-colors">{mod.label}</h3>
                    {isPlan && (
                      <p className="text-[8px] text-muted-foreground leading-tight mt-1 px-1 font-medium line-clamp-1">{mod.desc}</p>
                    )}
                  </div>
                  
                  {(mod.count !== null || isPlan) && (
                    <div className={cn(
                      "mt-1.5 flex flex-col items-center justify-center min-w-[70px] py-1 rounded-xl shadow-sm border transition-colors",
                      mod.label === "Encontros" ? "bg-blue-500/10 text-blue-700 border-blue-500/20" :
                      mod.label === "Catequizandos" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" :
                      mod.label === "Atividades" ? "bg-amber-500/10 text-amber-700 border-amber-500/20" :
                      "bg-sky-500/10 text-sky-700 border-sky-500/20"
                    )}>
                      <span className={cn("font-black leading-none", isPlan ? "text-[10px]" : "text-lg")}>
                        {isPlan ? (turma.etapa || "N/A") : mod.count}
                      </span>
                      <span className="text-[7px] font-black uppercase tracking-wider mt-0.5 opacity-80">
                        {isPlan ? "Etapa Atual" : (mod.count !== 1 ? `${mod.unit}s` : mod.unit)}
                      </span>
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
