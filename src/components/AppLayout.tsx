import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Menu,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MenuContent } from "./MenuContent";

const tabs = [
  { path: "/", icon: LayoutDashboard, label: "Início" },
  { path: "/turmas", icon: BookOpen, label: "Turmas" },
  { path: "/turmas/nova", icon: Plus, label: "Nova" },
  { path: "/modulos", icon: Users, label: "Módulos" },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">IVC</span>
            <span className="text-sm text-muted-foreground font-medium">Gestão de Catequese</span>
          </div>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button className="p-2 rounded-xl hover:bg-muted transition-colors">
                <Menu className="h-5 w-5 text-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <MenuContent onClose={() => setMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container px-4 py-4 pb-24">
        <Outlet />
      </main>

      {/* iOS Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border/50 safe-area-inset-bottom">
        <div className="container flex items-center justify-around h-16 px-2">
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
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                } ${tab.path === "/turmas/nova" ? "bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center shadow-lg -mt-4" : ""}`}
              >
                <Icon className={tab.path === "/turmas/nova" ? "h-6 w-6" : "h-5 w-5"} />
                {tab.path !== "/turmas/nova" && (
                  <span className="text-[10px] font-medium">{tab.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
