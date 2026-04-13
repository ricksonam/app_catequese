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

  const currentPath = location.pathname;
  const isPresentationMode = currentPath.endsWith("/apresentacao");

  return (
    <div className="min-h-screen bg-background flex flex-col print:block print:min-h-0 print:bg-white">
      {/* Header */}
      {!isPresentationMode && (
        <header className="sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0 print:hidden">
          <div className="container flex items-center justify-between h-14 px-4">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button className="p-2.5 rounded-xl bg-primary/15 text-primary border border-primary/20 shadow-sm hover:bg-primary/25 hover:shadow-md transition-all active:scale-95">
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0 glass-card rounded-r-3xl border-l-0">
                <MenuContent onClose={() => setMenuOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-white/80 border border-primary/20 shadow-sm shadow-primary/10">
                <img src="/app-icon.png" alt="Logo" className="w-full h-full object-contain p-1" />
              </div>
              <span className="text-sm font-bold text-primary tracking-tight">Catequese Digital</span>
            </div>
            <BirthdayBell />
          </div>
        </header>
      )}

      {/* Content */}
      <main className={`flex-1 container ${isPresentationMode ? 'p-0 max-w-none' : 'px-4 py-5 pb-24 print:p-0 print:m-0 print:max-w-none'}`}>
        <Outlet />
      </main>

      {/* Tab Bar */}
      {!isPresentationMode && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-1 print:hidden">
          <div className="mx-auto max-w-md flex items-center justify-around h-20 px-1.5 rounded-3xl bg-amber-50/95 backdrop-blur-2xl border-2 border-blue-500/70 dark:border-blue-400/50 shadow-2xl shadow-blue-500/20">
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
                  className={`group relative flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-2xl transition-all duration-300 active:scale-90 ${
                    isActive
                      ? `${tab.color} bg-blue-100 dark:bg-blue-900/50 shadow-md border border-blue-300/50 dark:border-blue-700/50`
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className={`h-6 w-6 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                  <span className={`text-[10px] tracking-tight transition-all ${isActive ? "font-bold opacity-100" : "font-medium opacity-70"}`}>
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
}
