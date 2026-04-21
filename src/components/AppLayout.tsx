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

const baseTabs = [
  { path: "/", icon: LayoutDashboard, label: "Início", color: "text-primary" },
  { path: "/turmas", icon: BookOpen, label: "Turmas", color: "text-liturgical" },
  { path: "/jogos", icon: Dices, label: "Jogos", color: "text-gold" },
  { path: "/modulos/mural", icon: Image, label: "Mural", color: "text-success" },
  { path: "__familia__", icon: Heart, label: "Família", color: "text-rose-500" },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showObjective, setShowObjective] = useState(false);
  const [apoieOpen, setApoieOpen] = useState(false);
  const { data: turmas = [] } = useTurmas();

  const currentPath = location.pathname;

  // Resolve the família path dynamically based on first turma
  const familiaPath = useMemo(() => {
    if (turmas.length > 0) return `/turmas/${turmas[0].id}/familia`;
    return "/turmas";
  }, [turmas]);

  const tabs = useMemo(() => baseTabs.map(tab => 
    tab.path === "__familia__" ? { ...tab, path: familiaPath } : tab
  ), [familiaPath]);
  const isPresentationMode = currentPath.endsWith("/apresentacao");

  return (
    <div className="min-h-screen bg-[#FFF0EC] dark:bg-zinc-950 flex flex-col print:block print:min-h-0 print:bg-white">
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
                className="w-80 p-0 bg-[#FFF0EC] dark:bg-zinc-950 border-r border-black/5 h-full data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left transition-transform duration-300"
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
        <nav id="bottom-nav-bar" className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-3 pt-1 print:hidden transition-all duration-200">
          <div className="mx-auto max-w-md flex items-center justify-around h-[72px] px-2 rounded-full bg-amber-50/95 dark:bg-amber-900/30 backdrop-blur-xl border-2 border-amber-300 shadow-lg shadow-black/5 dark:shadow-none">
            {tabs.map((tab) => {
              const isActive =
                tab.path === "/"
                  ? currentPath === "/"
                  : currentPath.startsWith(tab.path) && tab.path !== "/";
              const Icon = tab.icon;

              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={`group relative flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-300 active:scale-90 ${
                    isActive
                      ? `${tab.color} bg-blue-500/10 dark:bg-blue-500/20 scale-110 shadow-sm shadow-blue-500/10`
                      : "text-gray-600 dark:text-gray-400 hover:bg-amber-100/50"
                  }`}
                >
                  <Icon className={`h-6 w-6 mb-0.5 transition-all duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                  <span className={`text-[8px] font-black uppercase tracking-[0.05em] text-center transition-all text-black dark:text-white ${isActive ? "opacity-100" : "opacity-70"}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}  );
}
