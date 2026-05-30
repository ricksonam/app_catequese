import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useCatequizandos, useAtividades, useReunioes, useDeleteTurma, useLeaveTurma, useTurmaMembros, useRemoveTurmaMembro, useApproveTurmaMembro, useComunidades } from "@/hooks/useSupabaseData";
import { ArrowLeft, CalendarDays, Users, ListChecks, GitBranch, Trash2, PieChart, Pencil, Copy, Link2, LogOut, Eye, EyeOff, UserMinus, QrCode, Shield, CheckCircle2, BellRing, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
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
import { useState, useMemo } from "react";
import { AuditLogModal } from "@/components/AuditLogPanel";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { resetTurmaCode } from "@/lib/supabaseStore";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, ChevronDown } from "lucide-react";
import { JoinTurmaModal } from "@/components/JoinTurmaModal";

export default function TurmaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: turmas = [], isLoading, isFetching } = useTurmas();
  const { data: encontros = [] } = useEncontros(id);
  const { data: catequizandos = [] } = useCatequizandos(id);
  const { data: atividades = [] } = useAtividades(id);
  const { data: reunioes = [] } = useReunioes(id);
  const { data: comunidades = [] } = useComunidades();
  const deleteMutation = useDeleteTurma();
  const leaveMutation = useLeaveTurma();
  const removeMembroMutation = useRemoveTurmaMembro();
  const approveMembroMutation = useApproveTurmaMembro();
  const { data: membros = [] } = useTurmaMembros(id!);

  const turma = turmas.find((t) => t.id === id);
  const allOtherTurmas = turmas.filter(t => t.id !== id);
  const [codeVisible, setCodeVisible] = useState(false);
  const [shareWarningOpen, setShareWarningOpen] = useState(false);
  const [shareWarningAccepted, setShareWarningAccepted] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [memberEmailToRemove, setMemberEmailToRemove] = useState<string>("");
  const [isResettingCode, setIsResettingCode] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const alertConfig = useMemo(() => {
    const saved = localStorage.getItem('ivc_alertas_config');
    const defaultState = {
      moduloEncontros: { ativo: true, presenca: true, avaliacao: true, status: true },
      moduloCatequizandos: { ativo: true, faltas: 3 }
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          moduloEncontros: { ...defaultState.moduloEncontros, ...(parsed.moduloEncontros || {}) },
          moduloCatequizandos: { ...defaultState.moduloCatequizandos, ...(parsed.moduloCatequizandos || {}) }
        };
      } catch (e) {
        return defaultState;
      }
    }
    return defaultState;
  }, []);

  const parseDataLocal = (dataStr: string) => {
    if (!dataStr) return new Date();
    const parts = dataStr.split('T')[0].split('-');
    if (parts.length === 3) return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return new Date(dataStr);
  };

  const catequizandosEmAlerta = useMemo(() => {
    const cfg = alertConfig.moduloCatequizandos;
    if (!cfg?.ativo) return 0;
    const limit = cfg.faltas ?? 3;
    if (limit <= 0) return 0;

    const pastEncontros = encontros
      .filter(e => e.status === 'realizado')
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    let alertCount = 0;
    catequizandos.forEach(c => {
      const tEncontros = pastEncontros.slice(0, limit);
      if (tEncontros.length >= limit) {
        const wasPresentOrJustifiedInAny = tEncontros.some(e => 
          e.presencas.includes(c.id) || (e.justificativas && e.justificativas[c.id])
        );
        if (!wasPresentOrJustifiedInAny) {
          alertCount++;
        }
      }
    });

    return alertCount;
  }, [encontros, catequizandos, alertConfig.moduloCatequizandos]);

  const encontrosEmAlerta = useMemo(() => {
    const cfg = alertConfig.moduloEncontros;
    if (!cfg?.ativo) return 0;
    const { presenca, status, avaliacao } = cfg;

    let count = 0;
    const nowTime = new Date().getTime();
    encontros.forEach(e => {
       const isPendente = e.status === 'pendente';
       const isRealizado = e.status === 'realizado';
       const noPresence = (e.presencas || []).length === 0;
       const d = parseDataLocal(e.data);
       const isPastPendente = isPendente && nowTime > d.getTime() + 86400000;
       
       let encounterHasAlert = false;

       // Presença missing
       if (presenca && noPresence && (isRealizado || isPastPendente)) {
           encounterHasAlert = true;
       }
       
       // Status pendente/atrasado 
       if (status && isPastPendente) {
           encounterHasAlert = true;
       }

       // Avaliacao missing
       const hasEval = !!(e.avaliacao && (e.avaliacao.conclusao || e.avaliacao.pontosPositivos || e.avaliacao.pontosMelhorar));
       if (avaliacao && isRealizado && !hasEval) {
           encounterHasAlert = true;
       }

       if (encounterHasAlert) {
           count++;
       }
    });
    return count;
  }, [encontros, alertConfig.moduloEncontros]);

  const confirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id!);
      setDeleteConfirmOpen(false);
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

  const handleResetCode = async () => {
    if (!id) return;
    setIsResettingCode(true);
    setResetConfirmOpen(false);
    try {
      await resetTurmaCode(id);
      await queryClient.invalidateQueries({ queryKey: ["turmas"] });
      toast.success("Código da turma redefinido com sucesso! Os catequistas com o código antigo precisarão do novo código para acessar.");
    } catch (error: any) {
      toast.error("Erro ao redefinir o código: " + error.message);
    } finally {
      setIsResettingCode(false);
    }
  };

  const confirmRemoveMembro = async () => {
    if (!memberToRemove) return;
    try {
      await removeMembroMutation.mutateAsync({ turmaId: id!, userId: memberToRemove });
      setMemberToRemove(null);
      toast.success("Acesso removido com sucesso.");
    } catch (error: any) {
      toast.error("Erro ao remover: " + error.message);
    }
  };


  const handleApproveMembro = async (userId: string) => {
    try {
      await approveMembroMutation.mutateAsync({ turmaId: id!, userId });
      toast.success("Acesso aprovado com sucesso.");
    } catch (error: any) {
      toast.error("Erro ao aprovar: " + error.message);
    }
  };

  if (isLoading || (!turma && isFetching)) {
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
    { label: "Encontros", desc: "Calendário e freq.", icon: CalendarDays, count: encontros.length, unit: "encontro", path: `/turmas/${id}/encontros`, color: "bg-primary text-white", bgGradient: "from-primary/60 via-primary/30 to-white", gradient: "from-primary/15 to-white", textColor: "text-blue-700", hasAlert: encontrosEmAlerta > 0, alertTitle: `${encontrosEmAlerta} encontro(s) pendente(s) de chamada` },
    { label: "Catequizandos", desc: "Perfis e acompanhamento", icon: Users, count: catequizandos.length, unit: "catequizando", path: `/turmas/${id}/catequizandos`, color: "bg-emerald-600 text-white", bgGradient: "from-emerald-500/60 via-emerald-500/30 to-white", gradient: "from-emerald-500/15 to-white", textColor: "text-emerald-700", hasAlert: catequizandosEmAlerta > 0, alertTitle: `${catequizandosEmAlerta} catequizando(s) com 3 ou mais faltas seguidas` },
    { label: "Eventos", desc: "Calendário e freq.", icon: ListChecks, count: atividades.length, unit: "evento", path: `/turmas/${id}/eventos`, color: "bg-amber-600 text-white", bgGradient: "from-amber-500/60 via-amber-500/30 to-white", gradient: "from-amber-500/15 to-white", textColor: "text-amber-700", hasAlert: false },
    { label: "Reuniões", desc: "Atas e pautas", icon: Users, count: reunioes.length, unit: "reunião", path: `/turmas/${id}/reunioes`, color: "bg-blue-600 text-white", bgGradient: "from-blue-500/60 via-blue-500/30 to-white", gradient: "from-blue-500/15 to-white", textColor: "text-blue-700", hasAlert: false },
    { label: "Plano da turma", desc: "Conteúdos e etapas", icon: GitBranch, count: null, unit: "", path: `/turmas/${id}/plano`, color: "bg-sky-600 text-white", bgGradient: "from-sky-500/60 via-sky-500/30 to-white", gradient: "from-sky-500/15 to-white", textColor: "text-sky-700", hasAlert: false },
  ];

  const relatorioModulo = { label: "Relatórios", icon: PieChart, path: `/turmas/${id}/relatorios` };

  return (
    <>
    <div className="space-y-6 pb-10">
      {/* Header Compacto Reorganizado */}
      <div className="space-y-4 animate-fade-in flex flex-col pt-4">
        {/* Row 1: Back Button + Nome/Ano (Centralizado) */}
        <div className="flex items-center justify-center min-h-[44px] relative">
          <button onClick={() => navigate("/turmas")} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border-2 border-black/5 shadow-sm active:scale-90 transition-all absolute left-0">
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          
          <div className="flex flex-col items-center gap-3 mt-1">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-foreground tracking-tight uppercase text-center leading-tight">
                {turma.nome}
              </h1>
              <span className="shrink-0 text-sm font-black px-2.5 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 border border-black/10 shadow-sm">
                {turma.ano}
              </span>
            </div>
            
            {!turma.isShared && turma.codigoAcesso && (
              <button 
                onClick={() => setShareWarningOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border-2 border-black text-emerald-700 hover:bg-emerald-100/50 transition-all active:scale-95 group shadow-sm w-auto min-w-[200px]"
              >
                <Link2 className="h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-widest">Código da Turma</span>
                {!codeVisible ? (
                  <Eye className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                ) : (
                  <span className="ml-1 font-mono font-bold tracking-wider text-sm">{turma.codigoAcesso}</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Info Chips (Logo abaixo do nome, centralizado) */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pb-1">
          <InfoBadge label="Etapa" value={turma.etapa} color="bg-white text-foreground border-black/10 shadow-sm" />
          <InfoBadge label="Dia" value={turma.diaCatequese} color="bg-white text-foreground border-black/10 shadow-sm" />
          <InfoBadge label="Hora" value={turma.horario} color="bg-white text-foreground border-black/10 shadow-sm" />
        </div>


        {/* Row 3: Relatórios (Esquerda) + Ações (Direita) */}
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-black/5">
          <button 
            onClick={() => navigate(relatorioModulo.path)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-violet-600 dark:bg-violet-700 text-white shadow-md hover:shadow-lg active:scale-95 transition-all font-black text-[10px] uppercase tracking-widest"
          >
            <PieChart className="h-3.5 w-3.5" />
            Relatórios
          </button>

          <div className="flex items-center gap-2">
            {/* Audit log - apenas para dono */}
            {!turma.isShared && (
              <button
                onClick={() => setAuditOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-violet-700 bg-violet-100 hover:bg-violet-200 dark:bg-violet-900/30 dark:hover:bg-violet-900/50 transition-all active:scale-95 border border-violet-200/50"
                title="Log de Auditoria"
              >
                <Shield className="h-4 w-4" />
              </button>
            )}
            {/* Conditionally show edit/delete (owner) or leave (shared) */}
            {turma.isShared ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-destructive bg-destructive/10 hover:bg-destructive/20 transition-all active:scale-95 border border-destructive/20 text-[10px] font-black uppercase tracking-widest">
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sair da turma</span>
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



              </>
            )}
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
                "relative p-[1.5px] rounded-3xl animate-float-up transition-all duration-300 hover:-translate-y-1 active:scale-[0.96] cursor-pointer group shadow-md h-[115px]",
                `bg-gradient-to-br ${mod.bgGradient}`
              )}
              style={{ animationDelay: `${i * 100}ms` }}
              onClick={() => navigate(mod.path)}
            >
              <div className="absolute inset-[3px] rounded-[22px] border-2 border-white/40 z-20 pointer-events-none opacity-60"></div>
              
              <div className={`relative flex flex-col items-center justify-between py-2 px-2.5 rounded-[22px] bg-white h-full bg-gradient-to-b ${mod.gradient} overflow-hidden text-center`}>
                
                <div className="absolute -right-3 -top-3 opacity-[0.05] pointer-events-none group-hover:scale-125 group-hover:rotate-12 transition-transform duration-1000">
                   <Icon className="w-16 h-16" />
                </div>

                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg relative z-30 border-2 border-white/50 transition-transform group-hover:scale-110 duration-500",
                  mod.color
                )}>
                  <Icon className="h-4.5 w-4.5" />
                </div>

                {mod.hasAlert && (
                  <div className="absolute top-2 right-2 flex flex-col items-center animate-pulse z-40" title={mod.alertTitle}>
                    <div className="w-5 h-5 bg-destructive border-[1.5px] border-white rounded-full flex items-center justify-center shadow-sm">
                      <BellRing className="h-2.5 w-2.5 text-white animate-wiggle" />
                    </div>
                    <span className="text-[6px] font-black uppercase text-destructive mt-[1px] tracking-tighter">Alerta!</span>
                  </div>
                )}
                
                <div className="relative z-30 flex-1 flex flex-col items-center justify-center w-full min-h-0">
                  <div className="flex flex-col items-center justify-center mb-0.5">
                    <h3 className="text-[12px] font-black text-foreground tracking-tight leading-none group-hover:text-primary transition-colors">{mod.label}</h3>
                    {isPlan && (
                      <p className="text-[7px] text-muted-foreground leading-tight mt-0.5 px-1 font-medium line-clamp-1">{mod.desc}</p>
                    )}
                  </div>
                  
                  {(mod.count !== null || isPlan) && (
                    <div className={cn(
                      "mt-1 flex flex-col items-center justify-center min-w-[65px] transition-colors mx-auto",
                      mod.textColor
                    )}>
                      <span className={cn("font-black leading-none", isPlan ? "text-[9px]" : "text-base")}>
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
                  <div key={m.user_id} className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all shadow-sm",
                    m.status === 'pending' 
                      ? "bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/30" 
                      : "bg-muted/30 border-border/50"
                  )}>
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-semibold text-foreground truncate">{m.email}</p>
                        {m.status === 'pending' && (
                          <span className="text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-200">
                            Pendente
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-0.5">Desde {new Date(m.joined_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {m.status === 'pending' ? (
                        <>
                          <button 
                            onClick={() => handleApproveMembro(m.user_id)}
                            className="flex items-center justify-center px-4 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest shadow-sm"
                          >
                            Autorizar
                          </button>
                          <button 
                            onClick={() => {
                              setMemberToRemove(m.user_id);
                              setMemberEmailToRemove(m.email);
                            }}
                            className="flex items-center justify-center px-4 py-1.5 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest border border-red-200/50"
                          >
                            Recusar
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => {
                            setMemberToRemove(m.user_id);
                            setMemberEmailToRemove(m.email);
                          }}
                          className="flex items-center justify-center px-4 py-1.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest border border-destructive/20"
                        >
                          Cancelar Acesso
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Log de Auditoria - modal */}
          {!turma.isShared && (
            <AuditLogModal
              turmaId={id!}
              open={auditOpen}
              onClose={() => setAuditOpen(false)}
            />
          )}

      {!turma.isShared && (
        <div className="pt-10 pb-4 flex justify-center animate-fade-in">
          <button 
            disabled={deleteMutation.isPending} 
            onClick={() => setDeleteConfirmOpen(true)}
            className="px-6 py-2 rounded-full text-destructive bg-destructive/5 hover:bg-destructive/10 transition-all active:scale-95 border border-destructive/20"
          >
            <span className="text-[10px] font-black uppercase tracking-widest">Excluir Turma permanentemente</span>
          </button>
        </div>
      )}

    </div>
      
      <DeleteConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDelete}
        itemName={turma.nome}
        isLoading={deleteMutation.isPending}
      />

      <DeleteConfirmationDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        onConfirm={confirmRemoveMembro}
        title="Remover Acesso?"
        description="O usuário não poderá mais acessar esta turma. Você poderá convidá-lo novamente se necessário."
        itemName={memberEmailToRemove}
        isLoading={removeMembroMutation.isPending}
      />

      {/* Modal Aviso de Compartilhamento */}
      <AlertDialog open={shareWarningOpen} onOpenChange={setShareWarningOpen}>
        <AlertDialogContent className="rounded-3xl max-w-sm p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-emerald-600 p-6 text-white text-center space-y-2">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm">
               <Shield className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">Segurança</AlertDialogTitle>
          </div>
          <div className="p-6 space-y-6 bg-[#F8F9FE]">
            <p className="text-sm text-foreground/80 leading-relaxed font-medium text-center">
              Ao compartilhar o código, outro catequista poderá ver e editar os dados desta turma e de seus catequizandos.
            </p>
            <label className="flex items-start gap-3 cursor-pointer p-4 bg-white rounded-2xl border-2 border-emerald-100 hover:border-emerald-200 transition-all shadow-sm">
              <input 
                type="checkbox" 
                className="mt-1 shrink-0 h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600 shadow-sm"
                checked={shareWarningAccepted}
                onChange={(e) => setShareWarningAccepted(e.target.checked)}
              />
              <span className="text-[11px] font-bold text-foreground leading-snug">
                Estou ciente e me responsabilizo pelo compartilhamento destas informações.
              </span>
            </label>
            
            <div className="flex flex-col gap-2">
              <AlertDialogAction 
                disabled={!shareWarningAccepted}
                onClick={(e) => {
                  if (!shareWarningAccepted) { e.preventDefault(); return; }
                  setCodeVisible(true);
                  setShareWarningOpen(false);
                  setShareWarningAccepted(false);
                }} 
                className="w-full h-12 rounded-xl font-black tracking-wide disabled:opacity-50 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Revelar Código
              </AlertDialogAction>
              <AlertDialogCancel onClick={() => { setShareWarningOpen(false); setShareWarningAccepted(false); }} className="w-full h-12 rounded-xl font-bold border-none bg-transparent text-muted-foreground hover:bg-black/5">Cancelar</AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Código de Acesso Revelado */}
      <AlertDialog open={codeVisible} onOpenChange={setCodeVisible}>
        <AlertDialogContent className="rounded-3xl max-w-sm p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-emerald-600 p-6 text-white text-center space-y-2 relative">
             <button onClick={() => setCodeVisible(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors">
               <X className="w-4 h-4" />
             </button>
             <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm">
               <Link2 className="h-6 w-6" />
             </div>
             <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">Código de Acesso</AlertDialogTitle>
          </div>
          <div className="p-6 space-y-6 bg-[#F8F9FE]">
            <div className="py-4 px-4 bg-white rounded-2xl border-2 border-emerald-100 text-center shadow-inner">
               <span className="text-4xl font-black tracking-[0.4em] text-emerald-700 select-all">{turma?.codigoAcesso}</span>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-3xl border-4 border-emerald-50 shadow-xl">
                <QRCodeSVG value={turma?.codigoAcesso || ""} size={180} />
              </div>
              <p className="text-[10px] font-black text-emerald-700/60 uppercase tracking-widest text-center">Aponte a câmera para escanear</p>
            </div>

            <button
              onClick={handleCopyCode}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-xl font-black flex items-center justify-center gap-2"
            >
              <Copy className="h-4 w-4" /> Copiar Código
            </button>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-center mb-3">Zona de Segurança</p>
              <button
                onClick={() => setResetConfirmOpen(true)}
                disabled={isResettingCode}
                className="w-full border-2 border-red-200 text-red-600 hover:bg-red-50 h-11 rounded-xl font-black flex items-center justify-center gap-2 text-xs uppercase tracking-wide transition-all disabled:opacity-50"
              >
                {isResettingCode ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {isResettingCode ? "Redefinindo..." : "Redefinir Código"}
              </button>
              <p className="text-[9px] text-gray-400 text-center mt-2 leading-relaxed">O código atual será invalidado e um novo será gerado.</p>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Confirmação Reset de Código */}
      <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <AlertDialogContent className="rounded-3xl max-w-sm border-none shadow-2xl">
          <AlertDialogHeader>
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <RefreshCw className="h-6 w-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-center text-lg font-black uppercase">Redefinir Código?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm leading-relaxed">
              O código atual será <strong>permanentemente invalidado</strong>. Todos os catequistas que usavam o código antigo precisarão do novo para acessar novamente.
              <br /><br />
              <span className="font-bold text-foreground">Esta ação não pode ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={handleResetCode}
              className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black"
            >
              Confirmar e Gerar Novo Código
            </AlertDialogAction>
            <AlertDialogCancel className="w-full h-11 rounded-xl border-none font-bold text-muted-foreground">
              Cancelar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <JoinTurmaModal open={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
    </>
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
