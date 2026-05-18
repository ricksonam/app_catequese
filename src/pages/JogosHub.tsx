import { Dices, Shuffle, HelpCircle, User, MessageCircleQuestion, Book, UsersRound, Theater, Sparkles, Lock, Star, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePremium } from "@/hooks/usePremium";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const jogos = [
  {
    label: "Sorteio de Nomes",
    desc: "Sorteie nomes aleatoriamente sem repetir",
    icon: Shuffle,
    color: "bg-primary/10 text-primary",
    path: "/jogos/sorteio",
  },
  {
    label: "Quiz Bíblico",
    desc: "Teste seus conhecimentos bíblicos",
    icon: HelpCircle,
    color: "bg-gold/15 text-gold",
    path: "/jogos/quiz",
  },
  {
    label: "Quem Sou Bíblico",
    desc: "Adivinhe o personagem bíblico pelas dicas",
    icon: User,
    color: "bg-liturgical/10 text-liturgical",
    path: "/jogos/quem-sou",
  },
  {
    label: "Perguntas e Respostas",
    desc: "Perguntas e respostas bíblicas em grupo",
    icon: MessageCircleQuestion,
    color: "bg-success/10 text-success",
    path: "/jogos/perguntas",
  },
  {
    label: "Sorteio Bíblico",
    desc: "Mensagens bíblicas para os catequizandos",
    icon: Book,
    color: "bg-amber-500/10 text-amber-600",
    path: "/jogos/citacao",
  },
  {
    label: "Sorteio de Grupos",
    desc: "Divida a turma em grupos de forma aleatória",
    icon: UsersRound,
    color: "bg-purple-500/10 text-purple-600",
    path: "/jogos/grupos",
  },
  {
    label: "Mímica Bíblica",
    desc: "Personagens, objetos e orações em mímica",
    icon: Theater,
    color: "bg-pink-500/10 text-pink-600",
    path: "/jogos/mimica",
  },
  {
    label: "Cartas da Fé",
    desc: "Organize as cartas sagradas",
    icon: Book,
    color: "bg-blue-500/10 text-blue-600",
    path: "/jogos/paciencia",
  },
];

const PREMIUM_BENEFITS = [
  "Módulo completo de Jogos Interativos",
  "Múltiplas turmas de catequese",
  "Central de Relatórios completa",
  "Catequese em Família + Missões",
  "Material de Apoio ao Catequista",
  "Conecta Famílias e Formulários",
];

export default function JogosHub() {
  const navigate = useNavigate();
  const { isPremium, loading, redirectToPayment } = usePremium();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const handleGameClick = (path: string, label: string) => {
    if (isPremium) {
      navigate(path);
    } else {
      setSelectedGame(label);
      setModalOpen(true);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 animate-fade-in">
        <div className="icon-box w-10 h-10 rounded-2xl bg-primary/10 text-primary">
          <Dices className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Jogos</h1>
          {!loading && !isPremium && (
            <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1 mt-0.5">
              <Sparkles className="h-3 w-3" />
              Recurso Premium — toque em qualquer jogo para assinar
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {jogos.map((jogo, i) => {
          const Icon = jogo.icon;
          const locked = !loading && !isPremium;
          return (
            <button
              key={jogo.path}
              onClick={() => handleGameClick(jogo.path, jogo.label)}
              className="float-card p-5 text-center animate-float-up group relative overflow-hidden"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Lock badge */}
              {locked && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
                  <Lock className="h-2.5 w-2.5 text-white" />
                </div>
              )}

              <div
                className={`icon-box w-13 h-13 rounded-2xl ${jogo.color} mb-3 mx-auto group-hover:scale-110 transition-transform duration-500 shadow-sm ${locked ? "opacity-75" : ""}`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3 className={`text-sm font-black transition-colors ${locked ? "text-muted-foreground" : "text-foreground group-hover:text-primary"}`}>
                {jogo.label}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight font-medium opacity-80">
                {jogo.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Premium upgrade modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm w-[95vw] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
          {/* Top gradient bar */}
          <div className="h-2 w-full bg-gradient-to-r from-amber-400 to-orange-500" />

          <div className="p-8 text-center">
            {/* Icon */}
            <div className="w-20 h-20 rounded-3xl bg-amber-100 flex items-center justify-center mx-auto mb-5 border-2 border-amber-200 shadow-inner">
              <Sparkles className="h-10 w-10 text-amber-500" />
            </div>

            <h2 className="text-2xl font-black text-foreground tracking-tight mb-1">
              iCatequese Premium
            </h2>
            {selectedGame && (
              <p className="text-xs font-bold text-amber-600 mb-2">
                🎮 {selectedGame} é um recurso Premium
              </p>
            )}
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Desbloqueie todos os jogos e muito mais para dinamizar sua catequese!
            </p>

            {/* Benefits */}
            <div className="text-left space-y-2.5 mb-6 bg-muted/30 rounded-2xl p-4 border border-border/50">
              {PREMIUM_BENEFITS.map((b, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                    <Zap className="w-3 h-3 text-amber-600" />
                  </div>
                  <span className="text-xs font-bold text-foreground">{b}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setModalOpen(false);
                  redirectToPayment();
                }}
                className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
                style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
              >
                <Star className="h-4 w-4" />
                Assinar Premium – Plano Anual
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="w-full text-xs text-muted-foreground font-bold hover:text-foreground transition-colors py-2"
              >
                Continuar com o plano básico
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
