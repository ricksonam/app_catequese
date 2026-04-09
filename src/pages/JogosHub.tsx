import { Dices, Shuffle, HelpCircle, User, MessageCircleQuestion, Book } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
    label: "Sorteio da Citação",
    desc: "Mensagens bíblicas para os catequizandos",
    icon: Book,
    color: "bg-amber-500/10 text-amber-600",
    path: "/jogos/citacao",
  },
];

export default function JogosHub() {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 animate-fade-in">
        <div className="icon-box w-10 h-10 rounded-2xl bg-primary/10 text-primary">
          <Dices className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Jogos</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {jogos.map((jogo, i) => {
          const Icon = jogo.icon;
          return (
            <button
              key={jogo.path}
              onClick={() => navigate(jogo.path)}
              className="float-card p-5 text-left animate-float-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`icon-box w-13 h-13 rounded-2xl ${jogo.color} mb-3`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">{jogo.label}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{jogo.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
