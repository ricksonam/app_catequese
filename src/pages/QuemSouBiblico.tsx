import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Eye, RotateCcw, Trophy, Lightbulb, PlayCircle, Minimize } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Personagem {
  nome: string;
  dicas: string[];
  dificuldade: "facil" | "medio" | "dificil";
}

const personagens: Personagem[] = [
  { nome: "Moisés", dicas: ["Fui salvo das águas quando bebê", "Guiei meu povo pelo deserto por 40 anos", "Recebi os Dez Mandamentos no Monte Sinai", "Abri o Mar Vermelho com o poder de Deus"], dificuldade: "facil" },
  { nome: "Davi", dicas: ["Fui pastor de ovelhas na minha juventude", "Venci um gigante com uma pedra e uma funda", "Fui rei de Israel e escritor de salmos", "Meu descendente mais famoso é Jesus"], dificuldade: "facil" },
  { nome: "Maria", dicas: ["Um anjo me visitou com uma grande notícia", "Disse 'sim' ao plano de Deus", "Sou a mãe do Salvador", "Estive aos pés da cruz"], dificuldade: "facil" },
  { nome: "Abraão", dicas: ["Deus me pediu para deixar minha terra", "Tive um filho na velhice", "Sou chamado de pai da fé", "Deus prometeu que meus descendentes seriam como estrelas"], dificuldade: "facil" },
  { nome: "Noé", dicas: ["Construí algo enorme por ordem de Deus", "Reuni animais de todas as espécies", "Sobrevivi a um grande dilúvio", "Vi um arco-íris como sinal da aliança"], dificuldade: "facil" },
  { nome: "Pedro", dicas: ["Era pescador antes de seguir Jesus", "Andei sobre as águas por um momento", "Neguei Jesus três vezes", "Sou considerado a pedra sobre a qual a Igreja foi edificada"], dificuldade: "facil" },
  { nome: "Paulo", dicas: ["Persegui cristãos antes da minha conversão", "Tive uma experiência no caminho de Damasco", "Escrevi muitas cartas do Novo Testamento", "Fui apóstolo dos gentios"], dificuldade: "medio" },
  { nome: "Jonas", dicas: ["Tentei fugir de uma missão de Deus", "Fui engolido por um grande peixe", "Fiquei três dias no ventre do animal", "Preguei para a cidade de Nínive"], dificuldade: "medio" },
  { nome: "Salomão", dicas: ["Pedi sabedoria a Deus em vez de riquezas", "Construí o primeiro Templo em Jerusalém", "Julguei um caso famoso entre duas mães", "Sou filho do rei Davi"], dificuldade: "medio" },
  { nome: "José do Egito", dicas: ["Meu pai me deu uma túnica colorida", "Fui vendido pelos meus irmãos", "Interpretei sonhos na prisão e no palácio", "Tornei-me governador do Egito"], dificuldade: "medio" },
  { nome: "Elias", dicas: ["Desafiei profetas de Baal no Monte Carmelo", "Fui alimentado por corvos", "Atravessei o rio Jordão com meu manto", "Subi ao céu num carro de fogo"], dificuldade: "dificil" },
  { nome: "Daniel", dicas: ["Fui levado cativo para a Babilônia", "Recusei comer a comida do rei", "Interpretei sonhos do rei Nabucodonosor", "Sobrevivi na cova dos leões"], dificuldade: "dificil" },
];

export default function QuemSouBiblico() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isSetup, setIsSetup] = useState(true);
  const [dificuldade, setDificuldade] = useState<"facil" | "medio" | "dificil">("facil");
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [shuffled, setShuffled] = useState<Personagem[]>([]);
  const [personagemIdx, setPersonagemIdx] = useState(0);
  const [dicaIdx, setDicaIdx] = useState(0);
  const [palpite, setPalpite] = useState("");
  const [revelado, setRevelado] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [total, setTotal] = useState(0);
  const [finalizado, setFinalizado] = useState(false);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const iniciarJogo = () => {
    const filtered = personagens.filter(p => p.dificuldade === dificuldade);
    setShuffled([...filtered].sort(() => Math.random() - 0.5));
    setIsSetup(false);
    setPersonagemIdx(0);
    setDicaIdx(0);
    setPalpite("");
    setRevelado(false);
    setAcertos(0);
    setTotal(0);
    setFinalizado(false);

    if (!document.fullscreenElement && window.innerWidth < 1024) {
      containerRef.current?.requestFullscreen().catch(() => {});
    }
  };

  const sairFullscreenEVoltar = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setIsSetup(true);
  };

  const atual = shuffled[personagemIdx];

  const verificar = () => {
    setTotal((p) => p + 1);
    if (palpite.trim().toLowerCase() === atual?.nome.toLowerCase()) {
      setAcertos((p) => p + 1);
    }
    setRevelado(true);
  };

  const proximaDica = () => {
    if (dicaIdx < atual?.dicas.length - 1) {
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

  return (
    <div ref={containerRef} className={cn("space-y-5 flex flex-col min-h-full transition-all duration-500", isFullscreen ? "bg-background p-6" : "")}>
      <div className={cn("flex items-center gap-3 animate-fade-in", isFullscreen ? "hidden" : "flex")}>
        <button onClick={() => navigate("/jogos")} className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1">Quem Sou Bíblico</h1>
        {!isSetup && shuffled.length > 0 && (
          <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            {personagemIdx + 1}/{shuffled.length}
          </span>
        )}
      </div>

      {isFullscreen && (
        <div className="absolute top-6 right-6 z-50">
          <Button variant="ghost" size="icon" onClick={() => document.exitFullscreen()} className="bg-background/50 backdrop-blur-sm rounded-full">
            <Minimize className="h-5 w-5" />
          </Button>
        </div>
      )}

      {isSetup ? (
        <div className="float-card p-6 space-y-6 animate-float-up max-w-sm mx-auto w-full mt-10">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-liturgical/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👥</span>
            </div>
            <h2 className="text-xl font-black text-foreground mb-1">Configurar Partida</h2>
            <p className="text-xs text-muted-foreground">Escolha a dificuldade dos personagens.</p>
          </div>

          <div className="space-y-3">
            {[
              { id: "facil", label: "Fácil", desc: "Personagens muito conhecidos", color: "bg-success/10 text-success border-success/30" },
              { id: "medio", label: "Médio", desc: "Desafios com personagens intermediários", color: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
              { id: "dificil", label: "Difícil", desc: "Verdadeiros quebra-cabeças", color: "bg-destructive/10 text-destructive border-destructive/30" },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDificuldade(d.id as any)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border-2 transition-all flex flex-col gap-1",
                  dificuldade === d.id ? d.color : "border-border bg-card opacity-60 hover:opacity-100"
                )}
              >
                <span className="text-sm font-bold uppercase tracking-wider">{d.label}</span>
                <span className="text-xs opacity-80">{d.desc}</span>
              </button>
            ))}
          </div>

          <Button onClick={iniciarJogo} className="w-full h-14 rounded-2xl text-base font-black gap-2 shadow-xl shadow-liturgical/20 bg-liturgical hover:bg-liturgical/90 text-white">
            <PlayCircle className="h-5 w-5" /> INICIAR JOGO
          </Button>
        </div>
      ) : finalizado ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="float-card p-8 text-center space-y-6 animate-float-up max-w-sm w-full">
            <Trophy className="h-20 w-20 mx-auto text-gold animate-bounce" />
            <div>
              <h2 className="text-2xl font-black text-foreground mb-2">Resultado</h2>
              <p className="text-6xl font-black text-primary drop-shadow-md">{acertos}<span className="text-3xl text-muted-foreground">/{total}</span></p>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <Button onClick={iniciarJogo} className="w-full h-12 gap-2 text-sm font-bold rounded-xl bg-liturgical hover:bg-liturgical/90 text-white">
                <RotateCcw className="h-4 w-4" /> Jogar Novamente
              </Button>
              <Button onClick={sairFullscreenEVoltar} variant="outline" className="w-full h-12 rounded-xl text-sm font-bold">
                Voltar ao Menu
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
          {!isFullscreen && (
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-6">
              <div className="h-full bg-liturgical rounded-full transition-all duration-500" style={{ width: `${((personagemIdx + 1) / shuffled.length) * 100}%` }} />
            </div>
          )}

          <div className="float-card p-6 sm:p-8 space-y-6 animate-float-up shadow-xl shadow-black/5">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-liturgical/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">❓</span>
              </div>
              <h2 className="text-lg font-black text-foreground">Quem sou eu?</h2>
            </div>

            <div className="space-y-3">
              {atual?.dicas.slice(0, dicaIdx + 1).map((dica, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/50 animate-in slide-in-from-left-4">
                  <Lightbulb className="h-5 w-5 text-gold mt-0.5 shrink-0" />
                  <p className="text-sm font-medium text-foreground leading-relaxed">{dica}</p>
                </div>
              ))}
            </div>

            {!revelado && dicaIdx < atual?.dicas.length - 1 && (
              <Button variant="outline" onClick={proximaDica} className="w-full h-12 gap-2 font-bold mt-2">
                <Eye className="h-4 w-4" /> Mais uma dica ({dicaIdx + 1}/{atual.dicas.length})
              </Button>
            )}

            {!revelado ? (
              <div className="space-y-3 pt-4 border-t border-border/50">
                <Input
                  value={palpite}
                  onChange={(e) => setPalpite(e.target.value)}
                  placeholder="Digite seu palpite aqui..."
                  onKeyDown={(e) => e.key === "Enter" && palpite.trim() && verificar()}
                  className="h-14 text-center font-bold text-lg rounded-xl bg-background shadow-inner"
                  autoFocus
                />
                <Button onClick={verificar} disabled={!palpite.trim()} className="w-full h-14 rounded-xl font-bold text-base shadow-lg bg-liturgical hover:bg-liturgical/90 text-white">
                  Confirmar Resposta
                </Button>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in pt-4 border-t border-border/50">
                <div className={cn(
                  "p-6 rounded-2xl text-center shadow-inner",
                  palpite.trim().toLowerCase() === atual?.nome.toLowerCase() ? "bg-success/10 border-2 border-success/30" : "bg-destructive/10 border-2 border-destructive/30"
                )}>
                  <p className="text-sm font-bold uppercase tracking-wider mb-2 opacity-80 text-foreground">
                    {palpite.trim().toLowerCase() === atual?.nome.toLowerCase() ? "🎉 Você Acertou!" : `❌ Incorreto. Era:`}
                  </p>
                  <p className="text-3xl font-black text-foreground">{atual?.nome}</p>
                </div>
                <Button onClick={proximo} className="w-full h-14 rounded-xl font-bold text-base shadow-lg bg-liturgical hover:bg-liturgical/90 text-white">
                  {personagemIdx + 1 >= shuffled.length ? "Ver Resultado Final" : "Próximo Personagem"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
