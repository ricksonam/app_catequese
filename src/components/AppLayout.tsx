import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Menu,
  Image,
  Dices,
  CalendarDays,
  Book,
  Map,
  FileText,
  Library,
  BarChart2,
  ChevronRight,
  X,
  BookHeart,
  Crown
} from "lucide-react";
import { PrayingHands } from "./icons/PrayingHands";
import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MenuContent } from "./MenuContent";
import { ObjectiveModal } from "./ObjectiveModal";
import { useTurmas } from "@/hooks/useSupabaseData";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getAppUrl } from "@/lib/utils";


const baseTabs = [
  { path: "/", icon: LayoutDashboard, label: "Início", color: "text-blue-600", dot: "bg-blue-600" },
  { path: "/modulos/mural", icon: Image, label: "Mural", color: "text-indigo-600", dot: "bg-indigo-600" },
  { path: "/turmas", icon: BookOpen, label: "Turmas", color: "text-purple-600", dot: "bg-purple-600" },
  { path: "/modulos/oracoes", icon: PrayingHands, label: "Orações", color: "text-amber-600", dot: "bg-amber-600" },
  { path: "__mais__", icon: Menu, label: "Módulos", color: "text-emerald-600", dot: "bg-emerald-600" },
];

export default function AppLayout({ children }: { children?: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showObjective, setShowObjective] = useState(false);

  const [maisOpen, setMaisOpen] = useState(false);
  const [turmaPickerOpen, setTurmaPickerOpen] = useState(false);
  const [pickerDestination, setPickerDestination] = useState<"relatorios" | "diario">("relatorios");
  const [suggestionText, setSuggestionText] = useState("");
  const [isSavingSuggestion, setIsSavingSuggestion] = useState(false);
  const { user } = useAuth();
  const { data: turmas = [] } = useTurmas();
  const { isPremium } = usePremiumStatus();

  const currentPath = location.pathname;

  const tabs = baseTabs;
  const isPresentationMode = currentPath.endsWith("/apresentacao");

  return (
    <div className="min-h-screen bg-background flex flex-col print:block print:min-h-0 print:bg-white">
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
                className="w-80 p-0 bg-background border-r border-black/5 h-full data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left transition-transform duration-300"
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

            {/* Botão Agenda / Chip Premium */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (currentPath === "/modulos/calendario") {
                    navigate("/");
                  } else {
                    navigate("/modulos/calendario");
                  }
                }}
                className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 active:scale-95 transition-all shadow-md shadow-emerald-500/30 border border-emerald-400 overflow-hidden"
              >
                {/* shimmer */}
                <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <CalendarDays className="h-3.5 w-3.5 text-white shrink-0" />
                <span className="text-[11px] font-black tracking-wide relative z-10">Agenda</span>
              </button>
            </div>
          </div>
          
          <ObjectiveModal 
            open={showObjective} 
            onOpenChange={setShowObjective} 
          />


        </header>
      )}

      {/* Content */}
      <main className={`flex-1 container ${isPresentationMode ? 'p-0 max-w-none' : 'px-4 py-5 pb-24 print:p-0 print:m-0 print:max-w-none'}`}>
        {children || <Outlet />}
      </main>

      {/* Tab Bar */}
      {!isPresentationMode && (
        <nav id="bottom-nav-bar" className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-black/10 dark:border-white/10 print:hidden transition-all duration-200 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="mx-auto w-full sm:max-w-md grid grid-cols-5 items-end h-[68px] px-2 pb-1.5 relative">
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
                  <div key={tab.path} className="relative flex flex-col items-center justify-end h-full w-full">
                    <button
                      onClick={() => navigate(tab.path)}
                      className="absolute -top-6 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 via-violet-500 to-indigo-500 text-white shadow-lg shadow-purple-500/30 border-4 border-white dark:border-zinc-900 transition-transform active:scale-90 hover:scale-105"
                    >
                      <Icon className="w-7 h-7" strokeWidth={2.5} />
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 dark:text-purple-400 mt-auto pb-0.5 text-center">
                      Turmas
                    </span>
                  </div>
                );
              }

              return (
                <button
                  key={tab.path}
                  onClick={() => {
                    if (isMais) setMaisOpen(true);
                    else navigate(tab.path);
                  }}
                  className={`group relative flex flex-col items-center justify-end h-full w-full px-1 pb-1.5 transition-all duration-300 active:scale-90 ${
                    isActive
                      ? tab.color
                      : "text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-400"
                  }`}
                >
                  <Icon className={`h-6 w-6 mb-1 transition-all duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`text-[10px] font-black uppercase tracking-[0.05em] text-center transition-all opacity-100`}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <div className={`absolute -bottom-1 w-1.5 h-1.5 rounded-full ${tab.dot}`} />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}
      {/* Modal Mais / Acesso Rápido */}
      <Dialog open={maisOpen} onOpenChange={setMaisOpen}>
        <DialogContent className="max-w-none w-screen h-[100dvh] max-h-screen p-0 overflow-y-auto border-none rounded-none shadow-none bg-background flex flex-col">
          <div className="flex flex-col p-6 space-y-6 flex-1 pb-24 relative">
            <button 
              onClick={() => setMaisOpen(false)} 
              className="absolute top-6 right-6 p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-3xl font-black text-center text-foreground tracking-tight pt-4">Módulos</h2>
            
            {/* SEÇÃO: MÓDULOS GERAIS */}
            <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-1.5 h-4 rounded-full bg-amber-500" />
                <h3 className="text-xs font-black uppercase text-foreground/75 tracking-wider">Módulos Gerais</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Diário do Catequista", path: "__diario__", icon: BookHeart, color: "bg-indigo-500/15 text-indigo-600", premium: true },
                  { label: "Jogos", path: "/jogos", icon: Dices, color: "bg-amber-500/15 text-amber-600", premium: true },
                  { label: "Agenda Catequética", path: "/modulos/calendario", icon: CalendarDays, color: "bg-destructive/15 text-destructive" },
                  { label: "Liturgia Diária", path: "/modulos/liturgia", icon: BookOpen, color: "bg-amber-500/15 text-amber-600" },
                  { label: "Orações", path: "/modulos/oracoes", icon: PrayingHands, color: "bg-liturgical/15 text-liturgical", premium: true },
                  { label: "Mural de Fotos", path: "/modulos/mural", icon: Image, color: "bg-rose-500/15 text-rose-500" },
                  { label: "Bíblia Online", path: "/modulos/biblia", icon: Book, color: "bg-blue-500/15 text-blue-500" },
                  { label: "Material de Apoio", path: "/modulos/material", icon: FileText, color: "bg-emerald-500/15 text-emerald-600", premium: true },
                  { label: "Biblioteca de Encontros", path: "/modulos/biblioteca", icon: Library, color: "bg-violet-500/15 text-violet-600", premium: true },
                  { label: "Mapa IVC", path: "/mapa-panoramico", icon: Map, color: "bg-pink-500/15 text-pink-600" },
                ].map((item, i) => {
                  const isLocked = item.premium && !isPremium;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setMaisOpen(false);
                        if (item.onClick) {
                          item.onClick();
                        } else if (item.path === "__diario__") {
                          const activeTurma = localStorage.getItem("ivc_selected_turma");
                          if (activeTurma && activeTurma !== "all" && turmas.find(t => t.id === activeTurma)) {
                            navigate(`/turmas/${activeTurma}/diario`);
                          } else if (turmas.length === 1) {
                            navigate(`/turmas/${turmas[0].id}/diario`);
                          } else if (turmas.length > 1) {
                            setPickerDestination("diario");
                            setTurmaPickerOpen(true);
                          } else {
                            toast.error("Crie uma turma primeiro.");
                          }
                        } else if (item.path) {
                          navigate(item.path);
                        }
                      }}
                      className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all hover:shadow-md text-center group min-h-[110px] w-full relative overflow-hidden ${isLocked ? "border border-amber-300/50 dark:border-amber-700/40" : "border border-black/5 dark:border-white/5 hover:border-primary/20"}`}
                    >
                      {/* Badge Premium */}
                      {isLocked && (
                        <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-amber-400/90 dark:bg-amber-500/80 text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full shadow-sm">
                          <Crown className="w-2.5 h-2.5" />
                          <span>Premium</span>
                        </div>
                      )}

                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform shadow-inner`}>
                        <item.icon className="h-7 w-7" />
                      </div>
                      <span className="text-[9px] font-black text-foreground/80 leading-tight uppercase tracking-wider group-hover:text-primary transition-colors break-words w-full px-0.5">
                        {item.label}
                      </span>

                      {/* Aviso textual embaixo */}
                      {isLocked && (
                        <p className="text-[8px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5 absolute bottom-1.5">
                          🔒 Apenas Premium
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>



            {/* SEÇÃO: CENTRAL DE RELATÓRIOS */}
            <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-1.5 h-4 rounded-full bg-violet-500" />
                <h3 className="text-xs font-black uppercase text-foreground/75 tracking-wider">Central de Relatórios</h3>
              </div>
              <button
                onClick={() => {
                  setMaisOpen(false);
                  const activeTurma = localStorage.getItem("ivc_selected_turma");
                  if (activeTurma && activeTurma !== "all" && turmas.find(t => t.id === activeTurma)) {
                    navigate(`/turmas/${activeTurma}/relatorios`);
                  } else if (turmas.length === 1) {
                    navigate(`/turmas/${turmas[0].id}/relatorios`);
                  } else if (turmas.length > 1) {
                    setPickerDestination("relatorios");
                    setTurmaPickerOpen(true);
                  } else {
                    toast.error("Crie uma turma primeiro.");
                  }
                }}
                className={`w-full group flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 transition-all shadow-md active:scale-[0.98] text-left overflow-hidden relative ${!isPremium ? "border border-amber-300/50 dark:border-amber-700/40" : "border-2 border-violet-500/40 dark:border-violet-400/20 hover:shadow-lg hover:border-violet-500"}`}
              >
                {/* Badge Premium */}
                {!isPremium && (
                  <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-amber-400/90 dark:bg-amber-500/80 text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full shadow-sm">
                    <Crown className="w-2.5 h-2.5" />
                    <span>Premium</span>
                  </div>
                )}

                <div className="w-12 h-12 rounded-xl bg-violet-500/15 text-violet-600 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <BarChart2 className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-black text-foreground uppercase tracking-wider">Acessar Relatórios</span>
                  {!isPremium ? (
                    <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-0.5 flex items-center gap-1">
                      🔒 Apenas Premium
                    </span>
                  ) : (
                    <span className="block text-[10px] text-muted-foreground font-bold mt-0.5 truncate">
                      {(() => {
                        const activeTurmaId = localStorage.getItem("ivc_selected_turma");
                        const found = turmas.find(t => t.id === activeTurmaId);
                        return found ? `Turma ativa: ${found.nome}` : "Selecione uma turma para ver relatórios";
                      })()}
                    </span>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-violet-400 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>

          </div>
        </DialogContent>
      </Dialog>
      {/* Removido o Dialog de Sugestão daqui pois agora fica no AtendimentoClienteModal */}
      {/* Turma picker dialog for Reports */}
      <Dialog open={turmaPickerOpen} onOpenChange={setTurmaPickerOpen}>
        <DialogContent className="max-w-sm mx-auto rounded-[32px] p-6 shadow-2xl border-none bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight text-center">Selecionar Turma</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {turmas.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTurmaPickerOpen(false);
                  navigate(`/turmas/${t.id}/${pickerDestination}`);
                }}
                className="w-full p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 flex items-center justify-between group hover:scale-[1.02] active:scale-[0.98] transition-all hover:shadow-md hover:border-violet-500/30"
              >
                <div className="text-left">
                  <span className="block text-sm font-black text-foreground group-hover:text-violet-600 transition-colors">
                    {t.nome}
                  </span>
                  {t.ano && (
                    <span className="text-[10px] font-bold text-muted-foreground">
                      Ano: {t.ano}
                    </span>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-violet-600 transition-colors" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
