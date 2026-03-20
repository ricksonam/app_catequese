import { useNavigate } from "react-router-dom";
import { Church, Users, UserCheck, Image, BookOpen, FileText, Library } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface MenuContentProps {
  onClose: () => void;
}

const cadastros = [
  { label: "Paróquia / Área / Escola", icon: Church, path: "/cadastros/paroquia" },
  { label: "Comunidades / Núcleos", icon: Users, path: "/cadastros/comunidades" },
  { label: "Catequistas", icon: UserCheck, path: "/cadastros/catequistas" },
];

const modulosGlobais = [
  { label: "Mural de Fotos", icon: Image, path: "/modulos/mural" },
  { label: "Bíblia", icon: BookOpen, path: "/modulos/biblia" },
  { label: "Material de Apoio", icon: FileText, path: "/modulos/material" },
  { label: "Biblioteca de Modelos", icon: Library, path: "/modulos/biblioteca" },
];

export function MenuContent({ onClose }: MenuContentProps) {
  const navigate = useNavigate();

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-4">
        <h2 className="text-lg font-bold text-foreground">Menu</h2>
        <p className="text-sm text-muted-foreground">Cadastros e recursos</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        <p className="ios-section-title">Cadastros Obrigatórios</p>
        <div className="ios-card overflow-hidden mb-6">
          {cadastros.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left ${
                  i < cadastros.length - 1 ? "border-b border-border/50" : ""
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </button>
            );
          })}
        </div>

        <p className="ios-section-title">Módulos Globais</p>
        <div className="ios-card overflow-hidden mb-6">
          {modulosGlobais.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => go(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left ${
                  i < modulosGlobais.length - 1 ? "border-b border-border/50" : ""
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-accent-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
