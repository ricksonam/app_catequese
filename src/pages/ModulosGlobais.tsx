import { Image, BookOpen, FileText, Library, Dices, CalendarDays, Heart, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";

const modulos = [
  { label: "Agenda catequética", desc: "Acompanhe e anote nas datas", icon: CalendarDays, color: "bg-destructive/10 text-destructive", path: "/modulos/calendario", premium: false },
  { label: "Liturgia Diária", desc: "Leituras diárias completas", icon: BookOpen, color: "bg-amber-500/10 text-amber-500", path: "/modulos/liturgia", premium: false },
  { label: "Jogos", desc: "Sorteios, quiz e jogos bíblicos", icon: Dices, color: "bg-gold/15 text-gold", path: "/jogos", premium: true },
  { label: "Mural de Fotos", desc: "Compartilhe momentos da catequese", icon: Image, color: "bg-primary/10 text-primary", path: "/modulos/mural", premium: false },
  { label: "Bíblia", desc: "Consulte passagens bíblicas", icon: BookOpen, color: "bg-primary/10 text-primary", path: "/modulos/biblia", premium: false },
  { label: "Material de Apoio", desc: "Recursos e documentos", icon: FileText, color: "bg-liturgical/10 text-liturgical", path: "/modulos/material", premium: true },
  { label: "Biblioteca de Encontros", desc: "Modelos de encontros prontos", icon: Library, color: "bg-success/10 text-success", path: "/modulos/biblioteca", premium: true },
  { label: "Orações", desc: "Devocionário católico completo", icon: Heart, color: "bg-liturgical/10 text-liturgical", path: "/modulos/oracoes", premium: true },
];

export default function ModulosGlobais() {
  const navigate = useNavigate();
  const { isPremium } = usePremiumStatus();

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-foreground animate-fade-in">Módulos</h1>
      <div className="grid grid-cols-2 gap-3">
        {modulos.map((mod, i) => {
          const Icon = mod.icon;
          const isLocked = mod.premium && !isPremium;
          return (
            <button
              key={mod.label}
              onClick={() => navigate(mod.path)}
              className={`float-card p-5 text-left animate-float-up relative overflow-hidden transition-all ${isLocked ? "border border-amber-300/50 dark:border-amber-700/40" : ""}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Badge Premium — só aparece quando bloqueado */}
              {isLocked && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-400/90 dark:bg-amber-500/80 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm">
                  <Crown className="w-2.5 h-2.5" />
                  Premium
                </div>
              )}

              <div className={`icon-box w-13 h-13 rounded-2xl ${mod.color} mb-3`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">{mod.label}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{mod.desc}</p>

              {/* Aviso textual embaixo — só quando bloqueado */}
              {isLocked && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1.5 flex items-center gap-1">
                  🔒 Apenas Premium
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
