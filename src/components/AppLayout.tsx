import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Menu,
  Image,
  Library,
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MenuContent } from "./MenuContent";

const tabs = [
  { path: "/", icon: LayoutDashboard, label: "Início", color: "text-primary" },
  { path: "/turmas", icon: BookOpen, label: "Turmas", color: "text-liturgical" },
  { path: "/modulos/mural", icon: Image, label: "Mural", color: "text-gold" },
  { path: "/modulos/biblioteca", icon: Library, label: "Modelos", color: "text-success" },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/30">
              <span className="text-xs font-black text-primary-foreground tracking-tight">IVC</span>
            </div>
            <span className="text-sm text-muted-foreground font-medium">Gestão de Catequese</span>
          </div>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button className="p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors active:scale-95">
                <Menu className="h-4.5 w-4.5 text-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0 glass-card rounded-l-3xl border-r-0">
              <MenuContent onClose={() => setMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container px-4 py-5 pb-24">
        <Outlet />
      </main>

      {/* Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-2 pt-0">
        <div className="mx-auto max-w-md flex items-center justify-around h-16 px-2 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/60 shadow-lg shadow-black/5">
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
                className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all active:scale-95 ${
                  isActive
                    ? `${tab.color} font-bold`
                    : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${!isActive ? "" : ""}`} />
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
