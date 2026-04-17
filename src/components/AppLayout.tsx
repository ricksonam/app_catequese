import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Menu,
  Image,
  Library,
  Dices,
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MenuContent } from "./MenuContent";
import BirthdayBell from "./BirthdayBell";
import { ObjectiveModal } from "./ObjectiveModal";

const tabs = [
  { path: "/", icon: LayoutDashboard, label: "Início", color: "text-primary" },
  { path: "/turmas", icon: BookOpen, label: "Turmas", color: "text-liturgical" },
  { path: "/jogos", icon: Dices, label: "Jogos", color: "text-gold" },
  { path: "/modulos/mural", icon: Image, label: "Mural", color: "text-success" },
  { path: "/modulos/biblioteca", icon: Library, label: "Modelos", color: "text-liturgical" },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showObjective, setShowObjective] = useState(false);

  const currentPath = location.pathname;
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
              <SheetContent side="left" className="w-80 p-0 glass-card rounded-r-3xl border-l-0">
                <MenuContent 
                  onClose={() => setMenuOpen(false)} 
                  onShowObjective={() => setShowObjective(true)} 
                />
              </SheetContent>
            </Sheet>
            
            <button 
              onClick={() => setShowObjective(true)}
              className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 group hover:opacity-80 transition-all active:scale-[0.98]"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center overflow-hidden bg-white border border-primary/20 shadow-sm shadow-primary/10 group-hover:shadow-md group-hover:border-primary/40 transition-all">
                <img src="/app-logo.png" alt="Logo" className="w-full h-full object-contain p-0.5 sm:p-1" />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-xl sm:text-2xl font-black tracking-tighter leading-none bg-gradient-to-r from-primary via-white to-primary bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent drop-shadow-md pb-0.5">iCatequese</span>
              </div>
            </button>

            <BirthdayBell />
          </div>
          
          <ObjectiveModal open={showObjective} onOpenChange={setShowObjective} />
        </header>
      )}

      {/* Content */}
      <main className={`flex-1 container ${isPresentationMode ? 'p-0 max-w-none' : 'px-4 py-5 pb-24 print:p-0 print:m-0 print:max-w-none'}`}>
        <Outlet />
      </main>

      {/* Tab Bar */}
      {!isPresentationMode && currentPath !== "/modulos/mural" && (
        <nav id="bottom-nav-bar" className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-3 pt-1 print:hidden transition-all duration-200">
          <div className="mx-auto max-w-md flex items-center justify-around h-16 px-1 rounded-[24px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-zinc-800/20 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
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
                  className={`group relative flex flex-col items-center justify-center gap-0.5 w-13 h-13 rounded-2xl transition-all duration-300 active:scale-90 ${
                    isActive
                      ? `${tab.color} bg-blue-50 dark:bg-blue-900/30 font-black`
                      : "text-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                  <span className={`text-[9px] tracking-tight transition-all ${isActive ? "opacity-100" : "opacity-60"}`}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
