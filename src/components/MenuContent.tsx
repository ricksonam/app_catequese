import { useNavigate } from "react-router-dom";
import { 
  Church, Users, UserCheck, Image, BookOpen, FileText, Library, 
  CalendarDays, Dices, ChevronRight, ChevronDown, KeyRound, LogOut, Sparkles,
  Bell, Mail, MessageSquare, Trash, Settings, HelpCircle, AlertTriangle,
  GraduationCap, ChevronLeft, Heart
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

interface MenuContentProps {
  onClose: () => void;
  onShowObjective?: () => void;
}

const cadastros = [
  { label: "Paróquia e Comunidade", icon: Church, path: "/cadastros/paroquia-comunidade", color: "bg-liturgical/10 text-liturgical" },
  { label: "Catequistas", icon: UserCheck, path: "/cadastros/catequistas", color: "bg-success/10 text-success" },
  { label: "Turmas de Catequese", icon: BookOpen, path: "/turmas", color: "bg-primary/10 text-primary" },
];

const modulosGlobais = [
  { label: "Jogos", icon: Dices, path: "/jogos", color: "bg-gold/15 text-gold" },
  { label: "Calendário Litúrgico", icon: CalendarDays, path: "/modulos/calendario", color: "bg-destructive/10 text-destructive" },
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

export function MenuContent({ onClose, onShowObjective }: MenuContentProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  // Queries
  const { data: turmas = [], isLoading: isLoadingTurmas } = useQuery({
    queryKey: ["menu-turmas"],
    queryFn: () => fetchTurmas(),
    enabled: !!user
  });

  // States para Dialogs
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [selectedTurmaId, setSelectedTurmaId] = useState<string | null>(null);
  
  // Auto-seleciona se houver apenas uma turma
  useEffect(() => {
    if (turmas.length === 1 && !selectedTurmaId) {
      setSelectedTurmaId(turmas[0].id);
    }
  }, [turmas, selectedTurmaId]);

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

  // Exclusão
  const [exitReason, setExitReason] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

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
        motivo_exclusao: exitReason,
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
    <div className="flex flex-col h-full bg-slate-100 dark:bg-zinc-950">
      {/* Nome do Usuário Logado */}
      <div className="p-6 pb-2 border-b border-black/5 mb-2">
        <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase mb-1">Conta Ativa</p>
        <p className="text-sm font-bold text-foreground truncate">{user?.email}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide">
        <Accordion type="single" collapsible className="w-full space-y-3 border-none">
          
          {/* SEÇÃO: CADASTROS BÁSICOS */}
          <AccordionItem value="cadastros" className="border-none shadow-none">
            <AccordionTrigger className="hover:no-underline py-0 group [&>svg]:hidden rounded-2xl mb-2">
               <div className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-white dark:bg-zinc-900 transition-all duration-300 border-2 border-blue-500/20 group-data-[state=open]:border-blue-500 group-data-[state=open]:shadow-[0_0_20px_rgba(59,130,246,0.15)] group-hover:border-blue-500/50">
                 <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                   <Church className="h-5 w-5" />
                 </div>
                 <span className="flex-1 text-xs font-black text-foreground text-left uppercase tracking-[0.2em]">Cadastros Básicos</span>
                 <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-180 opacity-50" />
               </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 px-2 space-y-2">
              {cadastros.map((item) => (
                <button
                  key={item.path}
                  onClick={() => go(item.path)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color} shadow-sm border border-black/5`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-bold text-foreground/80">{item.label}</span>
                </button>
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* SEÇÃO: MÓDULOS GLOBAIS */}
          <AccordionItem value="modulos" className="border-none shadow-none">
            <AccordionTrigger className="hover:no-underline py-0 group [&>svg]:hidden rounded-2xl mb-2">
               <div className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-white dark:bg-zinc-900 transition-all duration-300 border-2 border-blue-500/20 group-data-[state=open]:border-blue-500 group-data-[state=open]:shadow-[0_0_20px_rgba(59,130,246,0.15)] group-hover:border-blue-500/50">
                 <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center shrink-0">
                   <Sparkles className="h-5 w-5" />
                 </div>
                 <span className="flex-1 text-xs font-black text-foreground text-left uppercase tracking-[0.2em]">Módulos Globais</span>
                 <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-180 opacity-50" />
               </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 px-2 space-y-2">
              {modulosGlobais.map((item) => (
                <button
                  key={item.path}
                  onClick={() => go(item.path)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color} shadow-sm border border-black/5`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-bold text-foreground/80">{item.label}</span>
                </button>
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* SEÇÃO: MINHA TURMA (DINÂMICA) */}
          <AccordionItem value="minha-turma" className="border-none shadow-none">
            <AccordionTrigger className="hover:no-underline py-0 group [&>svg]:hidden rounded-2xl mb-2">
               <div className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-white dark:bg-zinc-900 transition-all duration-300 border-2 border-blue-500/20 group-data-[state=open]:border-blue-500 group-data-[state=open]:shadow-[0_0_20px_rgba(59,130,246,0.15)] group-hover:border-blue-500/50">
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

          {/* SEÇÃO: CONTA */}
          <AccordionItem value="conta" className="border-none shadow-none">
            <AccordionTrigger className="hover:no-underline py-0 group [&>svg]:hidden rounded-2xl mb-2">
               <div className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-white dark:bg-zinc-900 transition-all duration-300 border-2 border-blue-500/20 group-data-[state=open]:border-blue-500 group-data-[state=open]:shadow-[0_0_20px_rgba(59,130,246,0.15)] group-hover:border-blue-500/50">
                 <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                   <Users className="h-5 w-5" />
                 </div>
                 <span className="flex-1 text-xs font-black text-foreground text-left uppercase tracking-[0.2em]">Minha Conta</span>
                 <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-180 opacity-50" />
               </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 px-2 space-y-2">
              <button onClick={() => setShowPasswordDialog(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm border border-black/5"><KeyRound className="h-5 w-5" /></div>
                <span className="text-sm font-bold text-foreground/80">Alterar Senha</span>
              </button>
              
              <button onClick={() => setShowNotificationDialog(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shadow-sm border border-black/5"><Bell className="h-5 w-5" /></div>
                <span className="text-sm font-bold text-foreground/80">Notificações</span>
              </button>

              <button onClick={() => setShowSuggestionDialog(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-sm border border-black/5"><MessageSquare className="h-5 w-5" /></div>
                <span className="text-sm font-bold text-foreground/80">Dar Sugestão</span>
              </button>

              <button onClick={() => setShowDeleteAccountDialog(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800 transition-colors text-destructive">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shadow-sm border border-black/5"><Trash className="h-5 w-5" /></div>
                <span className="text-sm font-black">Excluir Usuário</span>
              </button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Sobre o Aplicativo - Estilizado como Chip Premium */}
        <div className="pt-6">
           <button 
             onClick={() => {
               onClose();
               setTimeout(() => { if (onShowObjective) onShowObjective(); }, 150);
             }}
             className="w-full relative group overflow-hidden rounded-[24px] p-4 bg-primary/10 border border-primary/20 shadow-sm hover:shadow-md hover:border-primary/40 transition-all active:scale-[0.98] animate-float-up"
           >
             <div className="absolute top-0 right-0 p-2 opacity-20"><Sparkles className="h-10 w-10 text-primary rotate-12" /></div>
             <div className="flex items-start gap-3">
               <div className="w-10 h-10 rounded-xl bg-white border border-primary/20 flex items-center justify-center shadow-lg shrink-0 group-hover:scale-110 transition-transform overflow-hidden">
                 <img src="/app-logo.png" className="w-full h-full object-contain p-1" alt="i" />
               </div>
               <div className="flex-1 text-left min-w-0">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 mb-0.5">Clique para abrir</p>
                 <p className="text-[15px] font-black leading-none bg-gradient-to-r from-primary via-white to-primary bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent drop-shadow-sm pb-1">Sobre o iCatequese</p>
                 <p className="text-[11px] text-muted-foreground mt-1.5 truncate">Versão 1.0.0 • Rickson Amazonas</p>
               </div>
               <HelpCircle className="h-4 w-4 text-primary self-center" />
             </div>
           </button>
        </div>

        {/* LOGOUT - SEMPRE VISÍVEL NO MENU */}
        <div className="mt-8">
           <button
             onClick={handleSignOut}
             className="w-full float-card flex items-center gap-3 px-6 py-4 bg-white dark:bg-zinc-900 border-2 border-destructive/10 hover:border-destructive/30 shadow-md group active:scale-95 transition-all text-destructive"
           >
             <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center group-hover:bg-destructive group-hover:text-white transition-all">
               <LogOut className="h-5 w-5" strokeWidth={2.5} />
             </div>
             <span className="flex-1 text-base font-black uppercase tracking-widest text-left">Sair do App</span>
           </button>
        </div>
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
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nova Senha</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="rounded-2xl h-12 border-muted" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirmar Nova Senha</Label>
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
               <Switch checked={birthdaysEnabled} onCheckedChange={setBirthdaysEnabled} />
             </div>
             <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-muted">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center"><CalendarDays className="w-5 h-5"/></div>
                 <div><p className="text-sm font-bold leading-none">Aviso de Encontros</p><p className="text-[10px] text-muted-foreground mt-1">Lembretes no Celular</p></div>
               </div>
               <Switch checked={meetingsEnabled} onCheckedChange={setMeetingsEnabled} />
             </div>
             <Button onClick={() => { toast({title: "Preferências Salvas!"}); setShowNotificationDialog(false); }} className="w-full h-14 rounded-2xl font-black bg-orange-500 hover:bg-orange-600">Salvar Preferências</Button>
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
             
             <Textarea 
               placeholder="Ex: Não usei o app, achei difícil, etc..." 
               className="w-full rounded-2xl border-destructive/20 focus:border-destructive"
               value={exitReason}
               onChange={(e) => setExitReason(e.target.value)}
             />

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
