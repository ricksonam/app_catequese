import { Image, BookOpen, FileText, Library } from "lucide-react";
import { useNavigate } from "react-router-dom";

const modulos = [
  { label: "Mural de Fotos", desc: "Compartilhe momentos da catequese", icon: Image, color: "bg-gold/15 text-gold", path: "/modulos/mural" },
  { label: "Bíblia", desc: "Consulte passagens bíblicas", icon: BookOpen, color: "bg-primary/10 text-primary", path: "/modulos/biblia" },
  { label: "Material de Apoio", desc: "Recursos e documentos", icon: FileText, color: "bg-liturgical/10 text-liturgical", path: "/modulos/material" },
  { label: "Biblioteca de Modelos", desc: "Modelos de encontros prontos", icon: Library, color: "bg-success/10 text-success", path: "/modulos/biblioteca" },
];

export default function ModulosGlobais() {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-foreground animate-fade-in">Módulos</h1>
      <div className="grid grid-cols-2 gap-3">
        {modulos.map((mod, i) => {
          const Icon = mod.icon;
          return (
            <button
              key={mod.label}
              onClick={() => navigate(mod.path)}
              className="float-card p-5 text-left animate-float-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`icon-box w-13 h-13 rounded-2xl ${mod.color} mb-3`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">{mod.label}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{mod.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
