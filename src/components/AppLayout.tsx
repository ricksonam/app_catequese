import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Menu,
  Image,
  Dices,
  Heart,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MenuContent } from "./MenuContent";
import { ObjectiveModal } from "./ObjectiveModal";
import { useTurmas } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";


const baseTabs = [
  { path: "/", icon: LayoutDashboard, label: "Início" },
  { path: "/jogos", icon: Dices, label: "Jogos" },
  { path: "/turmas", icon: BookOpen, label: "Turmas" },
  { path: "/modulos/mural", icon: Image, label: "Mural" },
  { path: "__mais__", icon: Menu, label: "Menu" },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showObjective, setShowObjective] = useState(false);
  const [apoieOpen, setApoieOpen] = useState(false);
  const [maisOpen, setMaisOpen] = useState(false);
  const [sugestaoOpen, setSugestaoOpen] = useState(false);
  const [suggestionText, setSuggestionText] = useState("");
  const [isSavingSuggestion, setIsSavingSuggestion] = useState(false);
  const { user } = useAuth();
  const { data: turmas = [] } = useTurmas();

  const currentPath = location.pathname;

  const tabs = baseTabs;
  const isPresentationMode = currentPath.endsWith("/apresentacao");

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex flex-col print:block print:min-h-0 print:bg-white">
      {/* Header */}
      {!isPresentationMode && (
        <header className="sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0 print:hidden">
          <div className="container flex items-center justify-between h-14 px-4 relative">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button className="p-2.5 rounded-xl bg-primary/15 text-primary border border-primary/20 shadow-sm hover:bg-primary/25 hover:shadow-md transition-all active:scale-95">
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent 
                side="left" 
                className="w-80 p-0 bg-slate-100 dark:bg-zinc-950 border-r border-black/5 h-full data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left transition-transform duration-300"
              >
                <MenuContent 
                  onClose={() => setMenuOpen(false)} 
                  onShowObjective={() => setShowObjective(true)} 
                />
              </SheetContent>
            </Sheet>
            
            <button 
              onClick={() => setShowObjective(true)}
              className="absolute left-1/2 -translate-x-1/2 flex items-center group hover:opacity-80 transition-all active:scale-[0.98]"
            >
              <span className="text-xl sm:text-2xl font-black tracking-tighter leading-none bg-gradient-to-r from-primary via-white to-primary bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent drop-shadow-md">iCatequese</span>
            </button>

            {/* Chip Apoie! */}
            <button
              onClick={() => setApoieOpen(true)}
              className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-br from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 active:scale-95 transition-all shadow-md shadow-red-500/30 border border-red-400 overflow-hidden"
            >
              {/* shimmer */}
              <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <Heart className="h-3.5 w-3.5 fill-white text-white animate-heartbeat shrink-0" />
              <span className="text-[11px] font-black tracking-wide relative z-10">Apoie!</span>
            </button>
          </div>
          
          <ObjectiveModal 
            open={showObjective} 
            onOpenChange={setShowObjective} 
          />

          {/* Dialog Apoie o iCatequese */}
          <Dialog open={apoieOpen} onOpenChange={setApoieOpen}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-2 border-black/5 p-0 overflow-hidden rounded-[32px]">
              <div className="bg-gradient-to-br from-red-500 to-rose-600 p-8 text-white text-center relative overflow-hidden">
                <div className="absolute -top-10 -right-10 p-4 opacity-20">
                  <Heart className="w-48 h-48 fill-white" />
                </div>
                <Heart className="w-16 h-16 fill-white text-white mx-auto mb-4 animate-heartbeat relative z-10" />
                <h2 className="text-2xl font-black relative z-10">Apoie o iCatequese!</h2>
              </div>
              <div className="p-4 sm:p-6 text-center space-y-4 max-h-[60vh] overflow-y-auto premium-scrollbar">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  O iCatequese é um projeto independente, mantido com recursos próprios do desenvolvedor para cobrir os custos de servidor e de hospedagem da plataforma.
                </p>
                <p className="text-sm text-foreground font-medium leading-relaxed">
                  Sua doação generosa nos ajuda a manter esta ferramenta no ar, <strong>gratuita para todos</strong>.
                </p>
                <div className="mt-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Chave PIX (E-mail)</p>
                  <div className="flex flex-col items-center justify-center gap-3">
                    <span className="font-bold text-base sm:text-lg text-foreground tracking-wide select-all break-all">
                      ricksonam@hotmail.com
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("ricksonam@hotmail.com");
                        toast.success("Chave PIX copiada!");
                      }}
                      className="px-6 py-2 rounded-full bg-primary text-white hover:bg-primary/90 hover:-translate-y-0.5 shadow-md active:scale-95 transition-all text-[11px] font-black uppercase tracking-widest"
                    >
                      Copiar Chave
                    </button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </header>
      )}

      {/* Content */}
      <main className={`flex-1 container ${isPresentationMode ? 'p-0 max-w-none' : 'px-4 py-5 pb-24 print:p-0 print:m-0 print:max-w-none'}`}>
        <Outlet />
      </main>

      {/* Tab Bar */}
      {!isPresentationMode && currentPath !== "/modulos/mural" && (
        <nav id="bottom-nav-bar" className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-1 print:hidden transition-all duration-200">
          <div className="mx-auto w-full sm:max-w-md flex items-end justify-between h-[68px] px-4 rounded-[32px] sm:rounded-full bg-white/95 dark:bg-zinc-900 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] pb-2 relative">
            {tabs.map((tab) => {
              const isMais = tab.path === "__mais__";
              const isTurmas = tab.path === "/turmas";
              const isActive =
                tab.path === "/"
                  ? currentPath === "/"
                  : !isMais && currentPath.startsWith(tab.path);
              const Icon = tab.icon;

              if (isTurmas) {
                return (
                  <div key={tab.path} className="relative flex flex-col items-center justify-end h-full px-2">
                    <button
                      onClick={() => navigate(tab.path)}
                      className="absolute -top-6 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 via-violet-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30 border-4 border-white dark:border-zinc-900 transition-transform active:scale-90 hover:scale-105"
                    >
                      <Icon className="w-7 h-7" strokeWidth={2.5} />
                    </button>
                    <span className="text-[9px] font-black uppercase tracking-widest text-purple-700 dark:text-purple-400 mt-auto">
                      Turmas
                    </span>
                  </div>
                );
              }

              return (
                <button
                  key={tab.path}
                  onClick={() => isMais ? setMaisOpen(true) : navigate(tab.path)}
                  className={`group relative flex flex-col items-center justify-end h-full px-3 pb-0.5 transition-all duration-300 active:scale-90 ${
                    isActive
                      ? "text-zinc-900 dark:text-white"
                      : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400"
                  }`}
                >
                  <Icon className={`h-6 w-6 mb-1 transition-all duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`text-[8px] font-black uppercase tracking-[0.05em] text-center transition-all ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <div className="absolute -bottom-2 w-1 h-1 rounded-full bg-zinc-900 dark:bg-white" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Modal Mais / Acesso Rápido */}
      <Dialog open={maisOpen} onOpenChange={setMaisOpen}>
        <DialogContent className="max-w-md w-[95vw] p-0 overflow-hidden border-2 border-black/5 dark:border-white/5 rounded-[40px] shadow-2xl bg-zinc-50 dark:bg-zinc-950">
          <div className="flex flex-col p-8">
            <h2 className="text-2xl font-black text-center text-foreground mb-8 tracking-tight">Acesso Rápido</h2>
            
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: "Nova Turma", path: "/turmas/nova", img: "/acesso_nova_turma.jpg" },
                { label: "Cadastros", path: "/cadastros/paroquia-comunidade", img: "/acesso_cadastros.jpg" },
                { label: "Encontro", path: turmas.length > 0 ? `/turmas/${turmas[0].id}/encontros/novo` : "/turmas", img: "/mais_1.png" },
                { label: "Catequizando", path: turmas.length > 0 ? `/turmas/${turmas[0].id}/catequizandos` : "/turmas", img: "/acesso_catequizando.jpg" },
                { label: "Atividade", path: turmas.length > 0 ? `/turmas/${turmas[0].id}/atividades` : "/turmas", img: "/acesso_atividades.jpg" },
                { label: "Agenda", path: "/modulos/calendario", img: "/acesso_agenda.jpg" },
                { label: "Bíblia Online", path: "/modulos/biblia", img: "/acesso_biblia.jpg" },
                { label: "Jogos", path: "/jogos", img: "/acesso_jogos.jpg" },
                { label: "Relatórios", path: turmas.length > 0 ? `/turmas/${turmas[0].id}/relatorios` : "/turmas", img: "/acesso_relatorios.jpg" },
                { label: "Conecta", path: "/comunicacao", img: "/acesso_conecta.jpg" },
                { label: "Sugestões", onClick: () => setSugestaoOpen(true), img: "/acesso_sugestoes.jpg" },
                { 
                  label: "Compartilhe", 
                  onClick: async () => {
                    const shareData = {
                      title: 'iCatequese',
                      text: 'Conheça o iCatequese, o aplicativo que organiza sua catequese!',
                      url: window.location.origin
                    };
                    try {
                      if (navigator.share) {
                        await navigator.share(shareData);
                      } else {
                        await navigator.clipboard.writeText(window.location.origin);
                        toast.success("Link copiado!");
                      }
                    } catch (err) {
                      // Usuário cancelou ou falhou
                    }
                  }, 
                  img: "/acesso_compartilhar.jpg" 
                },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setMaisOpen(false);
                    if (item.onClick) {
                      item.onClick();
                    } else if (item.path) {
                      navigate(item.path);
                    }
                  }}
                  className="flex flex-col items-center gap-2 group animate-scale-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="w-24 h-24 rounded-[32px] bg-white dark:bg-zinc-900 shadow-sm border border-black/5 dark:border-white/5 flex items-center justify-center overflow-hidden group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 group-hover:shadow-lg group-active:scale-95 group-hover:border-primary/30">
                    <img src={item.img} alt={item.label} loading="eager" className="w-18 h-18 object-contain animate-bounce-subtle" style={{ animationDelay: `${i * 100}ms` }} />
                  </div>
                  <span className="text-[11px] font-black text-center text-muted-foreground uppercase tracking-wider leading-tight group-hover:text-primary transition-colors">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Sugestões */}
      <Dialog open={sugestaoOpen} onOpenChange={setSugestaoOpen}>
        <DialogContent className="max-w-sm rounded-[32px] border-none shadow-2xl p-6 bg-white dark:bg-zinc-950">
          <div className="h-2 w-full bg-emerald-500 absolute top-0 left-0" />
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground">Tem uma ideia?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
             <Textarea 
               placeholder="Escreva sua sugestão ou reclamação aqui..." 
               className="rounded-2xl min-h-[140px] bg-muted/20 border-muted p-4 text-sm font-medium focus:ring-emerald-500"
               value={suggestionText}
               onChange={(e) => setSuggestionText(e.target.value)}
             />
             <p className="text-[10px] text-muted-foreground text-center italic">Sua opinião nos ajuda a crescer!</p>
             <Button 
               onClick={async () => {
                 if (!suggestionText.trim()) return;
                 setIsSavingSuggestion(true);
                 try {
                   const { error } = await supabase.from('sugestoes').insert({
                     usuario_id: user?.id,
                     email_usuario: user?.email,
                     texto: suggestionText,
                     tipo: 'sugestao'
                   });
                   if (error) throw error;
                   
                   toast.success("Sugestão enviada com sucesso!");
                   setSugestaoOpen(false);
                   setSuggestionText("");
                 } catch (error: any) {
                   toast.error("Erro ao enviar: " + error.message);
                 } finally {
                   setIsSavingSuggestion(false);
                 }
               }} 
               disabled={isSavingSuggestion || !suggestionText.trim()} 
               className="w-full h-14 rounded-2xl font-black bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 text-lg text-white"
             >
                {isSavingSuggestion ? "Enviando..." : "Enviar Sugestão"}
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
