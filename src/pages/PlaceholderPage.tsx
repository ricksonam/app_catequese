import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";

export default function PlaceholderPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const titles: Record<string, string> = {
    "/cadastros/paroquia": "Paróquia / Área / Escola",
    "/cadastros/comunidades": "Comunidades / Núcleos",
    "/cadastros/catequistas": "Catequistas",
    "/modulos/mural": "Mural de Fotos",
    "/modulos/biblia": "Bíblia",
    "/modulos/material": "Material de Apoio",
    "/modulos/biblioteca": "Biblioteca de Modelos",
  };

  const title = titles[location.pathname] || "Em Desenvolvimento";

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
      </div>

      <div className="ios-card p-8 text-center">
        <Construction className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-semibold text-foreground mb-1">Em breve</h3>
        <p className="text-sm text-muted-foreground">Este módulo está sendo desenvolvido.</p>
      </div>
    </div>
  );
}
