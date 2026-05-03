import { useNavigate } from "react-router-dom";
import { 
  Church, Users, UserCheck, Image, BookOpen, FileText, Library, 
  CalendarDays, Dices, ChevronRight, ChevronDown, KeyRound, LogOut, Sparkles,
  Bell, Mail, MessageSquare, Trash, Settings, HelpCircle, AlertTriangle,
  GraduationCap, ChevronLeft, Heart, BarChart2, X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTurmas } from "@/lib/supabaseStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MenuContentProps {
  onClose: () => void;
  onShowObjective?: () => void;
  onShowGuide?: () => void;
}

const cadastros = [
  { label: "Paróquia e Comunidade", icon: Church, path: "/cadastros/paroquia-comunidade", color: "bg-liturgical/10 text-liturgical" },
  { label: "Catequistas", icon: UserCheck, path: "/cadastros/catequistas", color: "bg-success/10 text-success" },
  { label: "Turmas de Catequese", icon: BookOpen, path: "/turmas", color: "bg-primary/10 text-primary" },
];

const modulosGlobais = [
  { label: "Jogos", icon: Dices, path: "/jogos", color: "bg-gold/15 text-gold" },
  { label: "Agenda catequética", icon: CalendarDays, path: "/modulos/calendario", color: "bg-destructive/10 text-destructive" },
  { label: "Mural de Fotos", icon: Image, path: "/modulos/mural", color: "bg-success/10 text-success" },
  { label: "Bíblia", icon: BookOpen, path: "/modulos/biblia", color: "bg-primary/10 text-primary" },
  { label: "Material de Apoio", icon: FileText, path: "/modulos/material", color: "bg-liturgical/10 text-liturgical" },
  { label: "Biblioteca de Modelos", icon: Library, path: "/modulos/biblioteca", color: "bg-success/10 text-success" },
];

const classModules = [
  { label: "Encontros", icon: CalendarDays, getPath: (id: string) => `/turmas/${id}/encontros`, color: "bg-blue-500/10 text-blue-500" },
  { label: "Catequizandos", icon: Users, getPath: (id: string) => `/turmas/${id}/catequizandos`, color: "bg-success/10 text-success" },
  { label: "Atividades e Eventos", icon: Sparkles, getPath: (id: string) => `/turmas/${id}/atividades`, color: "bg-amber-500/10 text-amber-500" },
  { label: "Catequese em Família", icon: Heart, getPath: (id: string) => `/turmas/${id}/familia`, color: "bg-rose-500/10 text-rose-500" },
  { label: "Plano da Turma", icon: BookOpen, getPath: (id: string) => `/turmas/${id}/plano`, color: "bg-primary/10 text-primary" },
];

const comunicacao = [
  { label: "Painel", icon: MessageSquare, path: "/comunicacao", color: "bg-purple-500/10 text-purple-500" },
  { label: "Criar Novo", icon: FileText, path: "/comunicacao/novo", color: "bg-liturgical/10 text-liturgical" },
];

export function MenuContent({ onClose, onShowObjective }: MenuContentProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  // Queries
  const { data: turmas = [], isLoading: isLoadingTurmas } = useQuery({
    queryKey: ["menu-turmas"],
    queryFn: () => fetchTurmas(),
    enabled: !!user
  });

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [turmaPickerOpen, setTurmaPickerOpen] = useState(false);

  // Lê a turma selecionada do localStorage (sincronizado com o Dashboard)
  const selectedTurmaId = localStorage.getItem("ivc_selected_turma") || null;

  // Auto-seleciona se houver apenas uma turma
  useEffect(() => {
    if (turmas.length === 1 && !localStorage.getItem("ivc_selected_turma")) {
      localStorage.setItem("ivc_selected_turma", turmas[0].id);
    }
  }, [turmas]);

  // Senha
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Sugestão
  const [suggestion, setSuggestion] = useState("");
  const [savingSuggestion, setSavingSuggestion] = useState(false);

  // Notificações
  const [birthdaysEnabled, setBirthdaysEnabled] = useState(true);
  const [meetingsEnabled, setMeetingsEnabled] = useState(true);

  // Alertas Inteligentes
  const [showAlertsDialog, setShowAlertsDialog] = useState(false);
  const [alertConfig, setAlertConfig] = useState(() => {
    const defaultState = {
      moduloEncontros: { ativo: true, presenca: true, avaliacao: true, status: true },
      moduloCatequizandos: { ativo: true, faltas: 3 }
    };
    const saved = localStorage.getItem('ivc_alertas_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.ativos !== undefined) return defaultState; // if old flat shape detected, overwrite
        return {
          moduloEncontros: { ...defaultState.moduloEncontros, ...(parsed.moduloEncontros || {}) },
          moduloCatequizandos: { ...defaultState.moduloCatequizandos, ...(parsed.moduloCatequizandos || {}) }
        };
      } catch (e) {
        return defaultState;
      }
    }
    return defaultState;
  });

  const saveAlertConfig = (newConfig: any) => {
    setAlertConfig(newConfig);
    localStorage.setItem('ivc_alertas_config', JSON.stringify(newConfig));
  };

  // Exclusão
  const [exitReason, setExitReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const DELETION_REASONS = [
    "Não usei o app",
    "Achei muito difícil de usar",
    "Faltam funcionalidades que eu preciso",
    "Migrei para outra plataforma",
    "Não faço mais parte da catequese",
    "Outro"
  ];

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: "Senha alterada com sucesso." });
      setShowPasswordDialog(false);
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleSuggestion = async () => {
    if (!suggestion.trim()) return;
    setSavingSuggestion(true);
    try {
      const { error } = await supabase.from('sugestoes').insert({
        usuario_id: user?.id,
        email_usuario: user?.email,
        texto: suggestion,
        tipo: 'sugestao'
      });
      if (error) throw error;
      
      toast({ 
        title: "Sugestão Enviada!", 
        description: "Enviamos também para ricksonam@hotmail.com. Obrigado!" 
      });
      setShowSuggestionDialog(false);
      setSuggestion("");
    } catch (error: any) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    } finally {
      setSavingSuggestion(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!exitReason.trim()) {
      toast({ title: "Atenção", description: "Conte-nos o motivo antes de confirmar.", variant: "destructive" });
      return;
    }
    setDeletingAccount(true);
    try {
      await supabase.from('sugestoes').insert({
        usuario_id: user?.id,
        email_usuario: user?.email,
        texto: "PEDIDO DE EXCLUSÃO",
        motivo_exclusao: exitReason === "Outro" ? otherReason : exitReason,
        tipo: 'exclusao'
      });
      
      await supabase.rpc('confirmar_exclusao_usuario');
      
      toast({ 
        title: "Sucesso!", 
        description: "Sua conta foi excluída conforme solicitado." 
      });
      
      await signOut();
      onClose();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      onClose();
      navigate("/auth", { replace: true });
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-zinc-950 overflow-hidden">
      {/* Nome do Usuário Logado */}
      <div className="p-4 pb-1 border-b border-black/5 mb-1">
        <p className="text-[9px] font-black tracking-[0.2em] text-muted-foreground uppercase mb-0.5">Conta Ativa</p>
        <p className="text-xs font-bold text-foreground truncate">{user?.email}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 scrollbar-hide">
        <Accordion type="single" collapsible className="w-full space-y-2 border-none">
          
          {/* SEÇÃO: CADASTROS BÁSICOS */}
          <AccordionItem value="cadastros" className="border-none shadow-none">
            <AccordionTrigger className="hover:no-underline py-0 group [&>svg]:hidden rounded-2xl mb-1">
               <div className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-white dark:bg-zinc-900 transition-all duration-300 border-2 border-black/25 dark:border-white/20 shadow-md hover:shadow-lg group-data-[state=open]:border-primary/60 group-data-[state=open]:shadow-lg group-hover:border-primary/50">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                   <Church className="h-5 w-5" />
                 </div>
                 <span className="flex-1 text-[11px] font-black text-foreground text-left uppercase tracking-[0.2em]">Cadastros</span>
                 <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-180 opacity-50" />
               </div>
            </AccordionTrigger>
            <AccordionContent className="pt-1 px-1 space-y-1">
              {cadastros.map((item) => (
                <button
                  key={item.path}
                  onClick={() => go(item.path)}
                  className="w-full group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color} shadow-sm border border-black/5 group-hover:scale-110 transition-transform`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-foreground/80 text-left"> {item.label}</span>
                </button>
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* SEÇÃO: MINHA TURMA (DINÂMICA) */}
          <AccordionItem value="minha-turma" className="border-none shadow-none">
            <AccordionTrigger className="hover:no-underline py-0 group [&>svg]:hidden rounded-2xl mb-1">
               <div className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-white dark:bg-zinc-900 transition-all duration-300 border-2 border-blue-500/50 shadow-md hover:shadow-lg group-data-[state=open]:border-blue-500 group-data-[state=open]:shadow-[0_0_24px_rgba(59,130,246,0.25)] group-hover:border-blue-500/70">
                 <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
                   <GraduationCap className="h-5 w-5" />
                 </div>
                 <span className="flex-1 text-xs font-black text-foreground text-left uppercase tracking-[0.2em]">Minha Turma</span>
                 <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-180 opacity-50" />
               </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 px-2 space-y-2">
              {isLoadingTurmas ? (
                <div className="p-4 text-center text-[10px] font-black uppercase text-muted-foreground animate-pulse">Carregando Turmas...</div>
              ) : turmas.length === 0 ? (
                <button onClick={() => go("/turmas/nova")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center opacity-50"><BookOpen className="h-5 w-5" /></div>
                  <span className="text-sm font-bold text-muted-foreground italic">Criar minha primeira turma</span>
                </button>
              ) : !selectedTurmaId ? (
                /* Lista de Seleção (caso tenha múltiplas turmas) */
                <div className="space-y-1">
                  <p className="px-4 py-2 text-[9px] font-black uppercase text-muted-foreground tracking-widest">Selecione uma turma:</p>
                  {turmas.map((t) => (
                    <button key={t.id} onClick={() => setSelectedTurmaId(t.id)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors text-left">
                      <div className="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center"><BookOpen className="h-4 w-4" /></div>
                      <span className="text-sm font-bold truncate">{t.nome}</span>
                    </button>
                  ))}
                </div>
              ) : (
                /* Módulos da Turma Selecionada */
                <div className="space-y-1">
                  {turmas.length > 1 && (
                    <button onClick={() => setSelectedTurmaId(null)} className="mb-2 flex items-center gap-2 px-4 py-1.5 text-[9px] font-black uppercase text-primary hover:opacity-70 transition-opacity">
                      <ChevronLeft className="h-3 w-3" /> Trocar de Turma
                    </button>
                  )}
                  
                  <div className="px-4 pb-3 mb-2 border-b border-black/5">
                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Turma Ativa:</p>
                    <p className="text-xs font-black text-foreground truncate mt-0.5">{turmas.find(t => t.id === selectedTurmaId)?.nome}</p>
                  </div>

                  {classModules.map((m) => (
                    <button key={m.label} onClick={() => go(m.getPath(selectedTurmaId))} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.color} shadow-sm border border-black/5`}>
                        <m.icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-bold text-foreground/80">{m.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* SEÇÃO: MÓDULOS GLOBAIS */}
          <AccordionItem value="modulos" className="border-none shadow-none">
            <AccordionTrigger className="hover:no-underline py-0 group [&>svg]:hidden rounded-2xl mb-1">
               <div className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-white dark:bg-zinc-900 transition-all duration-300 border-2 border-black/25 dark:border-white/20 shadow-md hover:shadow-lg group-data-[state=open]:border-primary/60 group-data-[state=open]:shadow-lg group-hover:border-primary/50">
                 <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                   <Sparkles className="h-5 w-5" />
                 </div>
                 <span className="flex-1 text-[11px] font-black text-foreground text-left uppercase tracking-[0.2em]">Módulos Gerais</span>
                 <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-180 opacity-50" />
               </div>
            </AccordionTrigger>
            <AccordionContent className="pt-1 px-1 space-y-1">
              {modulosGlobais.map((item) => (
                <button
                  key={item.path}
                  onClick={() => go(item.path)}
                  className="w-full group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color} shadow-sm border border-black/5 group-hover:scale-110 transition-transform`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-foreground/80 text-left"> {item.label}</span>
                </button>
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* SEÇÃO: FEEDBACK INTERATIVO */}
          <AccordionItem value="comunicacao" className="border-none shadow-none">
            <AccordionTrigger className="hover:no-underline py-0 group [&>svg]:hidden rounded-2xl mb-1">
               <div className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-white dark:bg-zinc-900 transition-all duration-300 border-2 border-black/25 dark:border-white/20 shadow-md hover:shadow-lg group-data-[state=open]:border-primary/60 group-data-[state=open]:shadow-lg group-hover:border-primary/50">
                 <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                   <MessageSquare className="h-5 w-5" />
                 </div>
                 <span className="flex-1 text-[11px] font-black text-foreground text-left uppercase tracking-[0.2em]">CONECTA FAMÍLIAS</span>
                 <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-180 opacity-50" />
               </div>
            </AccordionTrigger>
            <AccordionContent className="pt-1 px-1 space-y-1">
              {comunicacao.map((item) => (
                <button
                  key={item.path}
                  onClick={() => go(item.path)}
                  className="w-full group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color} shadow-sm border border-black/5 group-hover:scale-110 transition-transform`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-foreground/80 text-left"> {item.label}</span>
                </button>
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* CARD STANDALONE: CENTRAL DE RELATÓRIOS */}
        </Accordion>

        <div className="mt-2 mb-2">
          <button
            onClick={() => {
              if (selectedTurmaId && turmas.find(t => t.id === selectedTurmaId)) {
                go(`/turmas/${selectedTurmaId}/relatorios`);
              } else if (turmas.length === 1) {
                go(`/turmas/${turmas[0].id}/relatorios`);
              } else if (turmas.length > 1) {
                setTurmaPickerOpen(true);
              } else {
                toast({ title: "Nenhuma turma encontrada", description: "Crie uma turma primeiro.", variant: "destructive" });
              }
            }}
            className="w-full group flex items-center gap-3 px-4 py-4 rounded-2xl bg-white dark:bg-zinc-900 transition-all duration-300 border-2 border-violet-500/50 dark:border-violet-400/30 shadow-md hover:shadow-lg hover:border-violet-500/80 active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-600 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <BarChart2 className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left">
              <span className="block text-[10px] font-black text-foreground uppercase tracking-[0.15em] whitespace-nowrap">Central de Relatórios</span>
              {selectedTurmaId && turmas.find(t => t.id === selectedTurmaId) && (
                <span className="block text-[9px] text-violet-500 font-bold mt-0.5 truncate">
                  {turmas.find(t => t.id === selectedTurmaId)?.nome}
                </span>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-violet-400 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

        {/* Modal: selecionar turma para os relatórios */}
        {turmaPickerOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setTurmaPickerOpen(false)}
          >
            <div
              className="w-full max-w-xs bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-violet-400 to-purple-600" />
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-black text-foreground">Escolher Turma</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Selecione para ver os relatórios</p>
                  </div>
                  <button
                    onClick={() => setTurmaPickerOpen(false)}
                    className="w-7 h-7 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-all"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
                <div className="space-y-2">
                  {turmas.map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        localStorage.setItem("ivc_selected_turma", t.id);
                        setTurmaPickerOpen(false);
                        go(`/turmas/${t.id}/relatorios`);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl border-2 border-transparent bg-muted/30 hover:bg-violet-500/10 hover:border-violet-500/30 transition-all active:scale-[0.98] text-left"
                    >
                      <div className="w-9 h-9 rounded-xl bg-violet-500/15 text-violet-600 flex items-center justify-center shrink-0">
                        <BarChart2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-foreground truncate">{t.nome}</p>
                        <p className="text-[9px] text-muted-foreground">{t.etapa} • {t.ano}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-violet-400" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <Accordion type="single" collapsible className="w-full space-y-2 border-none">
          {/* SEÇÃO: CONTA */}
          <AccordionItem value="conta" className="border-none shadow-none">
            <AccordionTrigger className="hover:no-underline py-0 group [&>svg]:hidden rounded-2xl mb-1">
               <div className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-white dark:bg-zinc-900 transition-all duration-300 border-2 border-black/25 dark:border-white/20 shadow-md hover:shadow-lg group-data-[state=open]:border-primary/60 group-data-[state=open]:shadow-lg group-hover:border-primary/50">
                 <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                   <Users className="h-5 w-5" />
                 </div>
                 <span className="flex-1 text-[11px] font-black text-foreground text-left uppercase tracking-[0.2em]">Configurações</span>
                 <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-180 opacity-50" />
               </div>
            </AccordionTrigger>
            <AccordionContent className="pt-1 px-1 space-y-1">
              <button onClick={() => setShowPasswordDialog(true)} className="w-full group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shadow-sm border border-black/5 group-hover:scale-110 group-hover:rotate-12 transition-transform"><KeyRound className="h-4 w-4" /></div>
                <span className="text-sm font-bold text-foreground/80 text-left">Alterar Senha</span>
              </button>
              
              <button onClick={() => setShowNotificationDialog(true)} className="w-full group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shadow-sm border border-black/5 group-hover:animate-icon-pulse"><Bell className="h-4 w-4" /></div>
                <span className="text-sm font-bold text-foreground/80 text-left">Notificações</span>
              </button>

              <button onClick={() => setShowAlertsDialog(true)} className="w-full group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shadow-sm border border-black/5 group-hover:scale-110 group-hover:-rotate-12 transition-transform"><AlertTriangle className="h-4 w-4" /></div>
                <span className="text-sm font-bold text-foreground/80 text-left">Sistema de Alertas</span>
              </button>

              <button onClick={() => setShowSuggestionDialog(true)} className="w-full group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-sm border border-black/5 group-hover:scale-110 group-hover:-translate-y-1 transition-transform"><MessageSquare className="h-4 w-4" /></div>
                <span className="text-sm font-bold text-foreground/80 text-left">Dar Sugestão</span>
              </button>

              <button onClick={() => setShowDeleteAccountDialog(true)} className="w-full group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors text-destructive">
                <div className="w-9 h-9 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shadow-sm border border-black/5 group-hover:scale-110 group-hover:skew-x-6 transition-transform"><Trash className="h-4 w-4" /></div>
                <span className="text-sm font-black text-left">Excluir Usuário</span>
              </button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Sobre o Aplicativo */}
        <div className="pt-3">
          <button 
             onClick={() => {
               onClose();
               setTimeout(() => { if (onShowObjective) onShowObjective(); }, 150);
             }}
             className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-white dark:bg-zinc-900 transition-all duration-300 border-2 border-black/10 dark:border-white/10 hover:border-primary/40 shadow-sm hover:shadow-md active:scale-[0.98] group"
           >
             <div className="w-10 h-10 rounded-xl bg-white border border-primary/20 flex items-center justify-center shadow-sm shrink-0 group-hover:scale-110 transition-transform overflow-hidden">
               <img src="/app-logo.png" className="w-full h-full object-contain p-1" alt="iCatequese" />
             </div>
             <span className="flex-1 text-sm font-black text-left tracking-wider animate-shimmer-text">Sobre o iCatequese</span>



             <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
           </button>
        </div>

      </div>

      {/* LOGOUT - FIXO NO RODAPÉ */}
      <div className="p-4 border-t border-black/5 bg-slate-50 dark:bg-zinc-950 mt-auto shrink-0">
         <button
           onClick={handleSignOut}
           className="w-full group flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border-2 border-destructive/10 hover:border-destructive/30 shadow-sm rounded-xl active:scale-95 transition-all text-destructive"
         >
           <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center group-hover:bg-destructive group-hover:text-white group-hover:rotate-12 transition-all duration-300">
             <LogOut className="h-4 w-4" strokeWidth={2.5} />
           </div>
           <span className="flex-1 text-xs font-black uppercase tracking-widest text-left">Sair do App</span>
         </button>
      </div>

      {/* DIALOGS */}
      
      {/* 1. Alterar Senha */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-sm rounded-[32px] border-none shadow-2xl overflow-hidden p-0">
          <div className="h-2 w-full bg-primary" />
          <div className="p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-foreground">Alterar Senha</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-900 ml-1">Nova Senha</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="rounded-2xl h-12 border-muted" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-900 ml-1">Confirmar Nova Senha</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="rounded-2xl h-12 border-muted" />
              </div>
              <Button onClick={handleChangePassword} className="w-full h-14 rounded-2xl font-black text-lg bg-primary shadow-xl shadow-primary/20" disabled={savingPassword}>
                {savingPassword ? "Salvando..." : "Salvar Senha"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Notificações */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent className="max-w-sm rounded-[32px] border-none shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-black mb-4">Central de Notificações</DialogTitle></DialogHeader>
          <div className="space-y-6">
             <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-muted">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center"><Bell className="w-5 h-5"/></div>
                 <div><p className="text-sm font-bold leading-none">Aviso de Aniversariantes</p><p className="text-[10px] text-muted-foreground mt-1">Lembretes no Celular</p></div>
               </div>
               <Switch 
                 checked={birthdaysEnabled} 
                 onCheckedChange={(c) => {
                   setBirthdaysEnabled(c);
                   if (c && "Notification" in window && Notification.permission !== "granted") {
                     Notification.requestPermission().then(p => {
                       if (p === "granted") toast({ title: "Notificações Ativadas!" });
                       else toast({ title: "Bloqueado pelo Navegador", description: "Desbloqueie nas configurações", variant: "destructive" });
                     });
                   }
                 }} 
               />
             </div>
             <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-muted">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center"><CalendarDays className="w-5 h-5"/></div>
                 <div><p className="text-sm font-bold leading-none">Aviso de Encontros</p><p className="text-[10px] text-muted-foreground mt-1">Lembretes no Celular</p></div>
               </div>
               <Switch 
                 checked={meetingsEnabled} 
                 onCheckedChange={(c) => {
                   setMeetingsEnabled(c);
                   if (c && "Notification" in window && Notification.permission !== "granted") {
                     Notification.requestPermission().then(p => {
                       if (p === "granted") toast({ title: "Notificações Ativadas!" });
                       else toast({ title: "Bloqueado pelo Navegador", description: "Desbloqueie nas configurações", variant: "destructive" });
                     });
                   }
                 }} 
               />
             </div>
             <Button onClick={() => { toast({title: "Preferências Salvas!"}); setShowNotificationDialog(false); }} className="w-full h-14 rounded-2xl font-black bg-orange-500 hover:bg-orange-600 text-white">Salvar Preferências</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2.5 Central de Alertas Inteligentes */}
      <Dialog open={showAlertsDialog} onOpenChange={setShowAlertsDialog}>
        <DialogContent className="max-w-[420px] rounded-[32px] border-none shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-black mb-4 flex items-center justify-center gap-2"><AlertTriangle className="text-red-500 w-6 h-6"/> Central de Avisos</DialogTitle></DialogHeader>
          <div className="space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
            
             {/* MÓDULO ENCONTROS */}
             <div className="flex flex-col gap-4 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center"><CalendarDays className="w-5 h-5"/></div>
                   <div><p className="text-sm font-bold leading-none text-blue-900 dark:text-blue-200">Alertas Módulo Encontros</p><p className="text-[10px] text-blue-600/70 dark:text-blue-400 mt-1 uppercase tracking-wider font-black">Ligar/Desligar Painel</p></div>
                 </div>
                 <Switch 
                   checked={alertConfig.moduloEncontros?.ativo ?? true} 
                   onCheckedChange={(c) => saveAlertConfig({ ...alertConfig, moduloEncontros: { ...alertConfig.moduloEncontros, ativo: c } })} 
                 />
               </div>
               
               {(alertConfig.moduloEncontros?.ativo ?? true) && (
                 <>
                   <div className="h-px bg-blue-500/10 w-full" />
                   <div className="space-y-4 px-1">
                     <div className="flex items-center justify-between">
                       <p className="text-xs font-bold text-muted-foreground flex items-center gap-2"><Bell className="w-3.5 h-3.5"/> Alerta de Presença</p>
                       <Switch checked={alertConfig.moduloEncontros?.presenca ?? true} onCheckedChange={(c) => saveAlertConfig({ ...alertConfig, moduloEncontros: { ...alertConfig.moduloEncontros, presenca: c } })} />
                     </div>
                     <div className="flex items-center justify-between">
                       <p className="text-xs font-bold text-muted-foreground flex items-center gap-2"><Sparkles className="w-3.5 h-3.5"/> Alerta de Avaliação</p>
                       <Switch checked={alertConfig.moduloEncontros?.avaliacao ?? true} onCheckedChange={(c) => saveAlertConfig({ ...alertConfig, moduloEncontros: { ...alertConfig.moduloEncontros, avaliacao: c } })} />
                     </div>
                     <div className="flex items-center justify-between">
                       <p className="text-xs font-bold text-muted-foreground flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5"/> Alerta de Status</p>
                       <Switch checked={alertConfig.moduloEncontros?.status ?? true} onCheckedChange={(c) => saveAlertConfig({ ...alertConfig, moduloEncontros: { ...alertConfig.moduloEncontros, status: c } })} />
                     </div>
                   </div>
                 </>
               )}
             </div>

             {/* MÓDULO CATEQUIZANDOS */}
             <div className="flex flex-col gap-4 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><Users className="w-5 h-5"/></div>
                   <div><p className="text-sm font-bold leading-none text-emerald-900 dark:text-emerald-200">Alertas Mod. Catequizandos</p><p className="text-[10px] text-emerald-600/70 dark:text-emerald-400 mt-1 uppercase tracking-wider font-black">Ligar/Desligar Painel</p></div>
                 </div>
                 <Switch 
                   checked={alertConfig.moduloCatequizandos?.ativo ?? true} 
                   onCheckedChange={(c) => saveAlertConfig({ ...alertConfig, moduloCatequizandos: { ...alertConfig.moduloCatequizandos, ativo: c } })} 
                 />
               </div>
               
               {(alertConfig.moduloCatequizandos?.ativo ?? true) && (
                 <>
                   <div className="h-px bg-emerald-500/10 w-full" />
                   <div className="px-1">
                     <Label className="text-[11px] font-bold text-zinc-900 mb-3 flex items-center gap-2"><Bell className="w-3.5 h-3.5"/> Alerta de faltas consecutivas</Label>
                     <div className="flex items-center justify-between gap-1 mt-2">
                       {[1, 2, 3, 4, 5].map(num => (
                         <button
                           key={num}
                           onClick={() => saveAlertConfig({ ...alertConfig, moduloCatequizandos: { ...alertConfig.moduloCatequizandos, faltas: num } })}
                           className={cn(
                             "w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center transition-all",
                             (alertConfig.moduloCatequizandos?.faltas ?? 3) === num 
                               ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-110" 
                               : "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
                           )}
                         >
                           {num}
                         </button>
                       ))}
                     </div>
                   </div>
                 </>
               )}
             </div>

             <Button onClick={() => { toast({title: "Alertas Configurados!"}); setShowAlertsDialog(false); }} className="w-full h-14 rounded-2xl font-black bg-foreground text-background shadow-lg hover:scale-[1.02] transition-transform">Salvar Ajustes</Button>
          </div>
        </DialogContent>
      </Dialog>



      {/* 3. Dar Sugestão */}
      <Dialog open={showSuggestionDialog} onOpenChange={setShowSuggestionDialog}>
        <DialogContent className="max-w-sm rounded-[32px] border-none shadow-2xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-black mb-4">Tem uma ideia?</DialogTitle></DialogHeader>
          <div className="space-y-4">
             <Textarea 
               placeholder="Escreva sua sugestão aqui..." 
               className="rounded-2xl min-h-[140px] bg-muted/20 border-muted p-4 text-sm font-medium"
               value={suggestion}
               onChange={(e) => setSuggestion(e.target.value)}
             />
             <p className="text-[10px] text-muted-foreground text-center italic">Você também pode enviar diretamente para ricksonam@hotmail.com</p>
             <Button onClick={handleSuggestion} disabled={savingSuggestion} className="w-full h-14 rounded-2xl font-black bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 text-lg">
                {savingSuggestion ? "Enviando..." : "Enviar Sugestão"}
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 4. Excluir Usuário */}
      <Dialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <DialogContent className="max-w-sm rounded-[32px] border-none shadow-2xl p-6">
          <div className="flex flex-col items-center text-center space-y-4">
             <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-2 animate-pulse">
               <AlertTriangle className="w-8 h-8" strokeWidth={3} />
             </div>
             <DialogHeader><DialogTitle className="text-xl font-black text-destructive">Tem certeza?</DialogTitle></DialogHeader>
             <p className="text-sm text-muted-foreground leading-relaxed">Sentimos muito que você esteja indo. Por favor, nos conte por que decidiu excluir sua conta para podermos melhorar:</p>
             
             <div className="w-full grid grid-cols-1 gap-2">
               {DELETION_REASONS.map((reason) => (
                 <button
                   key={reason}
                   onClick={() => setExitReason(reason)}
                   className={cn(
                     "w-full p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between",
                     exitReason === reason 
                       ? "bg-destructive/10 border-destructive text-destructive" 
                       : "bg-muted/20 border-transparent text-muted-foreground hover:bg-muted/40"
                   )}
                 >
                   {reason}
                   {exitReason === reason && <div className="w-2 h-2 rounded-full bg-destructive animate-in zoom-in-50" />}
                 </button>
               ))}
             </div>
             
             {exitReason === "Outro" && (
               <Textarea 
                 placeholder="Por favor, conte-nos mais..." 
                 className="w-full rounded-2xl border-destructive/20 focus:border-destructive animate-in slide-in-from-top-2"
                 value={otherReason}
                 onChange={(e) => setOtherReason(e.target.value)}
               />
             )}

             <div className="w-full grid grid-cols-2 gap-3 pt-4">
               <Button variant="outline" onClick={() => setShowDeleteAccountDialog(false)} className="h-14 rounded-2xl border-2">Voltar</Button>
               <Button onClick={handleDeleteAccount} disabled={deletingAccount} className="h-14 rounded-2xl bg-destructive hover:bg-red-700 font-black text-white">
                 {deletingAccount ? "Excluindo..." : "Excluir"}
               </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}