import { useNavigate } from "react-router-dom";
import { Church, Users, UserCheck, Image, BookOpen, FileText, Library, ChevronRight } from "lucide-react";

interface MenuContentProps {
  onClose: () => void;
}

const cadastros = [
  { label: "Paróquia / Área / Escola", icon: Church, path: "/cadastros/paroquia", color: "bg-primary/10 text-primary" },
  { label: "Comunidades / Núcleos", icon: Users, path: "/cadastros/comunidades", color: "bg-accent/15 text-accent-foreground" },
  { label: "Catequistas", icon: UserCheck, path: "/cadastros/catequistas", color: "bg-success/10 text-success" },
];

const modulosGlobais = [
  { label: "Mural de Fotos", icon: Image, path: "/modulos/mural", color: "bg-gold/15 text-gold" },
  { label: "Bíblia", icon: BookOpen, path: "/modulos/biblia", color: "bg-primary/10 text-primary" },
  { label: "Material de Apoio", icon: FileText, path: "/modulos/material", color: "bg-liturgical/10 text-liturgical" },
  { label: "Biblioteca de Modelos", icon: Library, path: "/modulos/biblioteca", color: "bg-success/10 text-success" },
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

      <div className="flex-1 overflow-y-auto px-4 space-y-6">
        <div>
          <p className="section-title">Cadastros Obrigatórios</p>
          <div className="space-y-2">
            {cadastros.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => go(item.path)}
                  className="w-full float-card flex items-center gap-3 px-4 py-3.5 text-left animate-float-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className={`icon-box ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="section-title">Módulos Globais</p>
          <div className="space-y-2">
            {modulosGlobais.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => go(item.path)}
                  className="w-full float-card flex items-center gap-3 px-4 py-3.5 text-left animate-float-up"
                  style={{ animationDelay: `${(i + 3) * 60}ms` }}
                >
                  <div className={`icon-box ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
