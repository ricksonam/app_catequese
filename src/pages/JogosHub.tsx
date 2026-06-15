import { Dices, Shuffle, HelpCircle, User, MessageCircleQuestion, Book, UsersRound, Theater, ArrowLeft, Gamepad2, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { PremiumModal } from "@/components/PremiumModal";

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

export default function JogosHub() {
  const navigate = useNavigate();
  const { isPremium, isLoading } = usePremiumStatus();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  if (isLoading) {
    return <div className="p-8 text-center animate-pulse text-muted-foreground">Verificando acesso...</div>;
  }

  const handleGameClick = (path: string, label: string) => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    navigate(path);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 animate-fade-in">
        <div className="icon-box w-10 h-10 rounded-2xl bg-primary/10 text-primary">
          <Dices className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground font-liturgical">Jogos e Dinâmicas</h1>
          <p className="text-xs text-muted-foreground font-medium">Aprender brincando!</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {jogos.map((jogo, i) => {
          const Icon = jogo.icon;
          return (
            <button
              key={jogo.path}
              onClick={() => handleGameClick(jogo.path, jogo.label)}
              className={`float-card p-5 text-center animate-float-up group relative overflow-hidden transition-all ${!isPremium ? 'border border-amber-300/50 dark:border-amber-700/40' : ''}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Badge Premium */}
              {!isPremium && (
                <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-amber-400/90 dark:bg-amber-500/80 text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full shadow-sm">
                  <Crown className="w-2.5 h-2.5" />
                  <span>Premium</span>
                </div>
              )}

              <div
                className={`icon-box w-13 h-13 rounded-2xl ${jogo.color} mb-3 mx-auto group-hover:scale-110 transition-transform duration-500 shadow-sm`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-black transition-colors text-foreground group-hover:text-primary">
                {jogo.label}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight font-medium opacity-80">
                {jogo.desc}
              </p>
              {!isPremium && (
                <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold mt-1 flex items-center justify-center gap-0.5">
                  🔒 Apenas Premium
                </p>
              )}
            </button>
          );
        })}
      </div>

      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)}
        title="Módulo de Jogos Bloqueado" 
        description="Assine o Premium para acessar nossa biblioteca completa de jogos bíblicos, quiz e dinâmicas."
        icon={<Gamepad2 className="h-10 w-10 text-primary" />}
      />
    </div>
  );
}
