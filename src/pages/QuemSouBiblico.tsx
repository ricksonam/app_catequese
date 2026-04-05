import { useState } from "react";
import { ArrowLeft, Eye, RotateCcw, Trophy, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Personagem {
  nome: string;
  dicas: string[];
}

const personagens: Personagem[] = [
  { nome: "Moisés", dicas: ["Fui salvo das águas quando bebê", "Guiei meu povo pelo deserto por 40 anos", "Recebi os Dez Mandamentos no Monte Sinai", "Abri o Mar Vermelho com o poder de Deus"] },
  { nome: "Davi", dicas: ["Fui pastor de ovelhas na minha juventude", "Venci um gigante com uma pedra e uma funda", "Fui rei de Israel e escritor de salmos", "Meu descendente mais famoso é Jesus"] },
  { nome: "Maria", dicas: ["Um anjo me visitou com uma grande notícia", "Disse 'sim' ao plano de Deus", "Sou a mãe do Salvador", "Estive aos pés da cruz"] },
  { nome: "Abraão", dicas: ["Deus me pediu para deixar minha terra", "Tive um filho na velhice", "Sou chamado de pai da fé", "Deus prometeu que meus descendentes seriam como estrelas"] },
  { nome: "Noé", dicas: ["Construí algo enorme por ordem de Deus", "Reuni animais de todas as espécies", "Sobrevivi a um grande dilúvio", "Vi um arco-íris como sinal da aliança"] },
  { nome: "Pedro", dicas: ["Era pescador antes de seguir Jesus", "Andei sobre as águas por um momento", "Neguei Jesus três vezes", "Sou considerado a pedra sobre a qual a Igreja foi edificada"] },
  { nome: "Paulo", dicas: ["Persegui cristãos antes da minha conversão", "Tive uma experiência no caminho de Damasco", "Escrevi muitas cartas do Novo Testamento", "Fui apóstolo dos gentios"] },
  { nome: "Jonas", dicas: ["Tentei fugir de uma missão de Deus", "Fui engolido por um grande peixe", "Fiquei três dias no ventre do animal", "Preguei para a cidade de Nínive"] },
  { nome: "Salomão", dicas: ["Pedi sabedoria a Deus em vez de riquezas", "Construí o primeiro Templo em Jerusalém", "Julguei um caso famoso entre duas mães", "Sou filho do rei Davi"] },
  { nome: "José do Egito", dicas: ["Meu pai me deu uma túnica colorida", "Fui vendido pelos meus irmãos", "Interpretei sonhos na prisão e no palácio", "Tornei-me governador do Egito"] },
  { nome: "Elias", dicas: ["Desafiei profetas de Baal no Monte Carmelo", "Fui alimentado por corvos", "Atravessei o rio Jordão com meu manto", "Subi ao céu num carro de fogo"] },
  { nome: "Daniel", dicas: ["Fui levado cativo para a Babilônia", "Recusei comer a comida do rei", "Interpretei sonhos do rei Nabucodonosor", "Sobrevivi na cova dos leões"] },
];

export default function QuemSouBiblico() {
  const navigate = useNavigate();
  const [shuffled] = useState(() => [...personagens].sort(() => Math.random() - 0.5));
  const [personagemIdx, setPersonagemIdx] = useState(0);
  const [dicaIdx, setDicaIdx] = useState(0);
  const [palpite, setPalpite] = useState("");
  const [revelado, setRevelado] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [total, setTotal] = useState(0);
  const [finalizado, setFinalizado] = useState(false);

  const atual = shuffled[personagemIdx];

  const verificar = () => {
    setTotal((p) => p + 1);
    if (palpite.trim().toLowerCase() === atual.nome.toLowerCase()) {
      setAcertos((p) => p + 1);
    }
    setRevelado(true);
  };

  const proximaDica = () => {
    if (dicaIdx < atual.dicas.length - 1) {
      setDicaIdx((p) => p + 1);
    }
  };

  const proximo = () => {
    if (personagemIdx + 1 >= shuffled.length) {
      setFinalizado(true);
    } else {
      setPersonagemIdx((p) => p + 1);
      setDicaIdx(0);
      setPalpite("");
      setRevelado(false);
    }
  };

  const reiniciar = () => {
    setPersonagemIdx(0);
    setDicaIdx(0);
    setPalpite("");
    setRevelado(false);
    setAcertos(0);
    setTotal(0);
    setFinalizado(false);
  };

  if (finalizado) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 animate-fade-in">
          <button onClick={() => navigate("/jogos")} className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Quem Sou Bíblico</h1>
        </div>
        <div className="float-card p-8 text-center space-y-4 animate-float-up">
          <Trophy className="h-16 w-16 mx-auto text-gold" />
          <h2 className="text-2xl font-black text-foreground">Resultado</h2>
          <p className="text-4xl font-black text-primary">{acertos}/{total}</p>
          <Button onClick={reiniciar} className="gap-2"><RotateCcw className="h-4 w-4" /> Jogar Novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 animate-fade-in">
        <button onClick={() => navigate("/jogos")} className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1">Quem Sou Bíblico</h1>
        <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
          {personagemIdx + 1}/{shuffled.length}
        </span>
      </div>

      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-liturgical rounded-full transition-all duration-500" style={{ width: `${((personagemIdx + 1) / shuffled.length) * 100}%` }} />
      </div>

      <div className="float-card p-5 space-y-4 animate-float-up">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-liturgical/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">❓</span>
          </div>
          <h2 className="text-lg font-black text-foreground">Quem sou eu?</h2>
        </div>

        <div className="space-y-2">
          {atual.dicas.slice(0, dicaIdx + 1).map((dica, i) => (
            <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/50 animate-fade-in">
              <Lightbulb className="h-4 w-4 text-gold mt-0.5 shrink-0" />
              <p className="text-sm text-foreground leading-relaxed">{dica}</p>
            </div>
          ))}
        </div>

        {!revelado && dicaIdx < atual.dicas.length - 1 && (
          <Button variant="outline" onClick={proximaDica} className="w-full gap-2">
            <Eye className="h-4 w-4" /> Mais uma dica ({dicaIdx + 1}/{atual.dicas.length})
          </Button>
        )}

        {!revelado ? (
          <div className="space-y-3">
            <Input
              value={palpite}
              onChange={(e) => setPalpite(e.target.value)}
              placeholder="Digite seu palpite..."
              onKeyDown={(e) => e.key === "Enter" && palpite.trim() && verificar()}
            />
            <Button onClick={verificar} disabled={!palpite.trim()} className="w-full">
              Confirmar Resposta
            </Button>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            <div className={`p-4 rounded-xl text-center ${palpite.trim().toLowerCase() === atual.nome.toLowerCase() ? "bg-success/10 border border-success/30" : "bg-destructive/10 border border-destructive/30"}`}>
              <p className="text-sm font-medium mb-1">
                {palpite.trim().toLowerCase() === atual.nome.toLowerCase() ? "🎉 Acertou!" : `❌ Era: ${atual.nome}`}
              </p>
              <p className="text-2xl font-black text-foreground">{atual.nome}</p>
            </div>
            <Button onClick={proximo} className="w-full">
              {personagemIdx + 1 >= shuffled.length ? "Ver Resultado" : "Próximo Personagem"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
