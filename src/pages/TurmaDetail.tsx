import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useCatequizandos, useAtividades, useDeleteTurma, useLeaveTurma, useTurmaMembros, useRemoveTurmaMembro, useMissoesFamilia } from "@/hooks/useSupabaseData";
import { ArrowLeft, CalendarDays, Users, ListChecks, GitBranch, Trash2, PieChart, Pencil, Copy, Link2, LogOut, Eye, EyeOff, UserMinus, Heart } from "lucide-react";
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
import { useState } from "react";

export default function TurmaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: turmas = [], isLoading } = useTurmas();
  const { data: encontros = [] } = useEncontros(id);
  const { data: catequizandos = [] } = useCatequizandos(id);
  const { data: atividades = [] } = useAtividades(id);
  const { data: missoes = [] } = useMissoesFamilia(id);
  const deleteMutation = useDeleteTurma();
  const leaveMutation = useLeaveTurma();
  const removeMembroMutation = useRemoveTurmaMembro();
  const { data: membros = [] } = useTurmaMembros(id!);

  const turma = turmas.find((t) => t.id === id);
  const [codeVisible, setCodeVisible] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id!);
      toast.success("Turma excluída com sucesso");
      navigate("/turmas");
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  const handleLeave = async () => {
    try {
      await leaveMutation.mutateAsync(id!);
      toast.success("Você saiu da turma.");
      navigate("/turmas");
    } catch (error: any) {
      toast.error("Erro ao sair da turma: " + error.message);
    }
  };

  const handleCopyCode = () => {
    if (turma?.codigoAcesso) {
      navigator.clipboard.writeText(turma.codigoAcesso);
      toast.success("Código copiado!");
    }
  };

  const handleRemoveMembro = async (userId: string) => {
    try {
      await removeMembroMutation.mutateAsync({ turmaId: id!, userId });
      toast.success("Acesso removido com sucesso.");
    } catch (error: any) {
      toast.error("Erro ao remover: " + error.message);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-lg bg-primary/20 animate-pulse" /></div>;
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
    { label: "Encontros", desc: "Calendário e freq.", icon: CalendarDays, count: encontros.length, unit: "encontro", path: `/turmas/${id}/encontros`, color: "bg-primary text-white", bgGradient: "from-primary/60 via-primary/30 to-white", gradient: "from-primary/15 to-white", textColor: "text-blue-700" },
    { label: "Catequizandos", desc: "Perfis e acompanhamento", icon: Users, count: catequizandos.length, unit: "catequizando", path: `/turmas/${id}/catequizandos`, color: "bg-emerald-600 text-white", bgGradient: "from-emerald-500/60 via-emerald-500/30 to-white", gradient: "from-emerald-500/15 to-white", textColor: "text-emerald-700" },
    { label: "Atividades", desc: "Eventos e projetos", icon: ListChecks, count: atividades.length, unit: "atividade", path: `/turmas/${id}/atividades`, color: "bg-amber-600 text-white", bgGradient: "from-amber-500/60 via-amber-500/30 to-white", gradient: "from-amber-500/15 to-white", textColor: "text-amber-700" },
    { label: "Plano da turma", desc: "Conteúdos e etapas", icon: GitBranch, count: null, unit: "", path: `/turmas/${id}/plano`, color: "bg-sky-600 text-white", bgGradient: "from-sky-500/60 via-sky-500/30 to-white", gradient: "from-sky-500/15 to-white", textColor: "text-sky-700" },
    { label: "Catequese em Família", desc: "Missões e integração", icon: Heart, count: missoes.length, unit: "missão", path: `/turmas/${id}/familia`, color: "bg-rose-600 text-white", bgGradient: "from-rose-500/60 via-rose-500/30 to-white", gradient: "from-rose-500/15 to-white", textColor: "text-rose-700" },
  ];

  const relatorioModulo = { label: "Relatórios", icon: PieChart, path: `/turmas/${id}/relatorios` };

  return (
    <div className="space-y-6 pb-10">
      {/* Header Centralizado */}
      <div className="space-y-6 animate-fade-in flex flex-col items-center text-center">
        <div className="w-full flex items-center justify-between">
          <button onClick={() => navigate("/turmas")} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate(relatorioModulo.path)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/10 text-gold-700 text-[10px] font-black uppercase tracking-widest border border-gold/20 shadow-sm active:scale-95 transition-all"
            >
              <PieChart className="h-3.5 w-3.5" />
              Relatórios
            </button>

            {/* Conditionally show edit/delete (owner) or leave (shared) */}
            {turma.isShared ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-destructive bg-destructive/10 hover:bg-destructive/20 transition-all active:scale-95 border border-destructive/20 text-[10px] font-black uppercase tracking-widest">
                    <LogOut className="h-3.5 w-3.5" /> Sair da Turma
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sair da Turma</AlertDialogTitle>
                    <AlertDialogDescription>
                      Você vai perder o acesso a esta turma. Para voltar, precisará do código novamente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLeave} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
                      Confirmar Saída
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <>
                <button 
                  onClick={() => navigate(`/turmas/${id}/editar`)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-primary bg-primary/10 hover:bg-primary/20 transition-all active:scale-95 border border-primary/20"
                >
                  <Pencil className="h-4 w-4" />
                </button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button disabled={deleteMutation.isPending} className="w-9 h-9 flex items-center justify-center rounded-xl text-destructive bg-destructive/10 hover:bg-destructive/20 transition-all active:scale-95 border border-destructive/20">
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
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
           <h1 className="text-2xl font-black text-foreground tracking-tight drop-shadow-sm">{turma.nome}</h1>
           <div className="h-1 w-12 bg-primary/20 rounded-full"></div>
        </div>

        {/* Barra de Informações Centralizada */}
        <div className="space-y-2 w-full">
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
                `bg-gradient-to-br ${mod.bgGradient}`
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
                      "mt-2 flex flex-col items-center justify-center min-w-[75px] transition-colors mx-auto",
                      mod.textColor
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

      {/* Código de Acesso - apenas para dono */}
      {!turma.isShared && turma.codigoAcesso && (
        <div className="animate-float-up space-y-4" style={{ animationDelay: '500ms' }}>
          {!codeVisible ? (
            // Chip fechado — clica para revelar
            <button
              onClick={() => setCodeVisible(true)}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-500/25 hover:border-emerald-500/50 hover:bg-emerald-100/50 transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Link2 className="h-4 w-4 text-emerald-700" />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-black uppercase tracking-[0.15em] text-emerald-700">Código de Compartilhamento</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Toque para revelar o código</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-[0.3em] text-emerald-700/40 select-none">••••••••</span>
                <Eye className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              </div>
            </button>
          ) : (
            // Código revelado
            <div className="float-card p-4 border-2 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-900/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                    <Link2 className="h-4 w-4 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Código de Acesso</p>
                    <p className="text-[9px] text-muted-foreground">Compartilhe com outro catequista</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-700 text-[10px] font-black uppercase tracking-wide border border-emerald-500/20 hover:bg-emerald-500/25 transition-all active:scale-95"
                  >
                    <Copy className="h-3 w-3" /> Copiar
                  </button>
                  <button
                    onClick={() => setCodeVisible(false)}
                    className="w-7 h-7 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-all active:scale-95"
                  >
                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div className="py-3 px-4 bg-white dark:bg-gray-900 rounded-xl border border-emerald-500/20 text-center">
                <span className="text-3xl font-black tracking-[0.5em] text-emerald-700 select-all">{turma.codigoAcesso}</span>
              </div>
            </div>
          )}

          {membros.length > 0 && (
            <div className="float-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Catequistas Vinculados</p>
                  <p className="text-[9px] text-muted-foreground">Usuários com acesso à turma</p>
                </div>
              </div>
              <div className="space-y-2">
                {membros.map((m: any) => (
                  <div key={m.user_id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                    <div>
                      <p className="text-xs font-semibold text-foreground truncate max-w-[180px]">{m.email}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">Desde {new Date(m.joined_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all active:scale-95">
                          <UserMinus className="h-3.5 w-3.5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover Acesso</AlertDialogTitle>
                          <AlertDialogDescription>
                            Deseja remover o acesso de <b>{m.email}</b> a esta turma? O usuário não poderá mais acessá-la.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRemoveMembro(m.user_id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
                            Confirmar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            </div>
          )}
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
