import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Play, RotateCcw, Maximize, Minimize, ChevronRight, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CartaMimica {
  titulo: string;
  dica?: string;
}

const BANCO_MIMICA: Record<string, CartaMimica[]> = {
  personagens: [
    { titulo: "Adão", dica: "O primeiro homem" },
    { titulo: "Eva", dica: "A primeira mulher" },
    { titulo: "Noé", dica: "Construiu uma arca enorme" },
    { titulo: "Abraão", dica: "Pai da fé" },
    { titulo: "José", dica: "Filho de Jacó, tinha um manto colorido" },
    { titulo: "Moisés", dica: "Abriu o Mar Vermelho" },
    { titulo: "Davi", dica: "Venceu um gigante com uma pedra" },
    { titulo: "Salomão", dica: "O rei mais sábio" },
    { titulo: "Elias", dica: "Profeta que subiu ao céu num carro de fogo" },
    { titulo: "Jonas", dica: "Foi engolido por um grande peixe" },
    { titulo: "Daniel", dica: "Sobreviveu na cova dos leões" },
    { titulo: "Maria", dica: "Mãe de Jesus" },
    { titulo: "José (pai adotivo)", dica: "Carpinteiro, esposo de Maria" },
    { titulo: "João Batista", dica: "Batizou Jesus no rio" },
    { titulo: "Pedro", dica: "Pescador, chefe dos apóstolos" },
    { titulo: "Paulo", dica: "Escreveu muitas cartas do NT" },
    { titulo: "Maria Madalena", dica: "Primeira a ver Jesus ressuscitado" },
    { titulo: "Zaqueu", dica: "Subiu numa árvore para ver Jesus" },
    { titulo: "Lázaro", dica: "Jesus o ressuscitou" },
    { titulo: "Santo Inácio de Loyola", dica: "Fundou os Jesuítas" },
    { titulo: "São Francisco de Assis", dica: "Amigo dos animais e da natureza" },
    { titulo: "Santa Teresinha", dica: "A pequena flor" },
    { titulo: "Papa Francisco", dica: "Papa argentino atual" },
  ],
  liturgicos: [
    { titulo: "Cálice", dica: "Copa usada na Eucaristia" },
    { titulo: "Patena", dica: "Prato onde fica a hóstia" },
    { titulo: "Hóstia", dica: "Pão consagrado" },
    { titulo: "Casula", dica: "Veste que o padre usa na missa" },
    { titulo: "Estola", dica: "Faixa que o sacerdote usa ao pescoço" },
    { titulo: "Incenso", dica: "Fumaça sagrada que sobe ao céu" },
    { titulo: "Turíbulo", dica: "Recipiente para queimar incenso" },
    { titulo: "Aspersório", dica: "Usado para borrifar água benta" },
    { titulo: "Altar", dica: "Mesa sagrada da missa" },
    { titulo: "Ambão", dica: "Púlpito de leitura da Palavra" },
    { titulo: "Sacrário / Tabernáculo", dica: "Onde fica Jesus Eucaristia" },
    { titulo: "Vela Pascal", dica: "Grande vela da Vigília Pascal" },
    { titulo: "Bíblia / Livro do Evangelho", dica: "Livro Sagrado" },
    { titulo: "Terço / Rosário", dica: "Objeto de oração mariana" },
    { titulo: "Cruz / Crucifixo", dica: "Símbolo da fé cristã" },
    { titulo: "Pia Batismal", dica: "Onde acontece o Batismo" },
    { titulo: "Óleo dos Santos", dica: "Usado nas unções sacramentais" },
    { titulo: "Batina", dica: "Veste preta do sacerdote" },
    { titulo: "Sino da Igreja", dica: "Chama os fiéis para a missa" },
    { titulo: "Água Benta", dica: "Água sagrada para benzição" },
  ],
  oracoes: [
    { titulo: "Pai-Nosso", dica: "A oração que Jesus ensinou" },
    { titulo: "Ave-Maria", dica: "Saudação ao Anjo Gabriel a Maria" },
    { titulo: "Glória ao Pai", dica: "Oração trinitária curta" },
    { titulo: "Creio em Deus Pai", dica: "O Credo dos Apóstolos" },
    { titulo: "Salve Rainha", dica: "Oração mariana medieval" },
    { titulo: "Ato de Contrição", dica: "Pedido de perdão a Deus" },
    { titulo: "Angelus", dica: "Oração do meio-dia" },
    { titulo: "Oração de São Francisco", dica: "Senhor, fazei-me instrumento da vossa paz" },
    { titulo: "Magnificat", dica: "Cântico de Maria" },
    { titulo: "Ofício Divino / Liturgia das Horas", dica: "Oração da Igreja ao longo do dia" },
    { titulo: "Chaplet (Coroa de Misericórdia)", dica: "Oração revelada à Santa Faustina" },
    { titulo: "Estações da Via-Sacra", dica: "14 paradas do caminho da Paixão" },
    { titulo: "Oração do Terço", dica: "Meditação nos mistérios de Cristo com Maria" },
    { titulo: "Te Deum", dica: "Hino de louvor e gratidão" },
    { titulo: "Oração pela unidade dos cristãos", dica: "Que todos sejam um" },
  ],
};

const CATEGORIAS = [
  { id: "personagens", label: "Personagens Bíblicos", emoji: "👤", color: "from-violet-500 to-purple-600", bg: "bg-violet-50 border-violet-200 text-violet-900" },
  { id: "liturgicos", label: "Objetos Litúrgicos", emoji: "⛪", color: "from-amber-500 to-orange-600", bg: "bg-amber-50 border-amber-200 text-amber-900" },
  { id: "oracoes", label: "Orações", emoji: "🙏", color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50 border-emerald-200 text-emerald-900" },
];

export default function Mimica() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [categorias, setCategorias] = useState<string[]>(["personagens"]);
  const [tempoPorRodada, setTempoPorRodada] = useState(60);
  const [isSetup, setIsSetup] = useState(true);

  const [pool, setPool] = useState<CartaMimica[]>([]);
  const [cartaAtual, setCartaAtual] = useState<CartaMimica | null>(null);
  const [cartasRestantes, setCartasRestantes] = useState<CartaMimica[]>([]);
  const [acertos, setAcertos] = useState(0);
  const [puladas, setPuladas] = useState(0);
  const [tempoRestante, setTempoRestante] = useState(tempoPorRodada);
  const [rodandoTimer, setRodandoTimer] = useState(false);
  const [rodadaFinalizada, setRodadaFinalizada] = useState(false);
  const [mostrarDica, setMostrarDica] = useState(false);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const toggleCategoria = (id: string) => {
    setCategorias(prev =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter(c => c !== id) : prev) : [...prev, id]
    );
  };

  const iniciarJogo = () => {
    let poolCompleto: CartaMimica[] = [];
    categorias.forEach(cat => {
      poolCompleto = [...poolCompleto, ...BANCO_MIMICA[cat]];
    });
    const embaralhado = poolCompleto.sort(() => Math.random() - 0.5);
    setPool(embaralhado);
    setCartasRestantes(embaralhado.slice(1));
    setCartaAtual(embaralhado[0]);
    setAcertos(0);
    setPuladas(0);
    setTempoRestante(tempoPorRodada);
    setRodandoTimer(false);
    setRodadaFinalizada(false);
    setMostrarDica(false);
    setIsSetup(false);

    if (!document.fullscreenElement && window.innerWidth < 1024) {
      containerRef.current?.requestFullscreen().catch(() => {});
    }
  };

  const iniciarTimer = useCallback(() => {
    if (rodandoTimer) return;
    setRodandoTimer(true);
    timerRef.current = setInterval(() => {
      setTempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setRodandoTimer(false);
          setRodadaFinalizada(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [rodandoTimer]);

  const acertou = () => {
    setAcertos(a => a + 1);
    setMostrarDica(false);
    if (cartasRestantes.length === 0) {
      setRodadaFinalizada(true);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setCartaAtual(cartasRestantes[0]);
    setCartasRestantes(prev => prev.slice(1));
  };

  const pulou = () => {
    setPuladas(p => p + 1);
    setMostrarDica(false);
    if (cartasRestantes.length === 0) {
      setRodadaFinalizada(true);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setCartaAtual(cartasRestantes[0]);
    setCartasRestantes(prev => prev.slice(1));
  };

  const reiniciar = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsSetup(true);
    setRodadaFinalizada(false);
    setRodandoTimer(false);
  };

  const porcentagemTempo = (tempoRestante / tempoPorRodada) * 100;
  const corTimer = porcentagemTempo > 50 ? "text-emerald-500" : porcentagemTempo > 25 ? "text-amber-500" : "text-red-500";
  const corBarra = porcentagemTempo > 50 ? "bg-emerald-500" : porcentagemTempo > 25 ? "bg-amber-500" : "bg-red-500";

  return (
    <div ref={containerRef} className={cn(
      "min-h-full flex flex-col transition-all duration-500",
      isFullscreen ? "bg-gradient-to-br from-indigo-950 via-purple-950 to-violet-950 min-h-screen p-6" : "space-y-5"
    )}>
      {/* Header */}
      <div className={cn("flex items-center gap-3 animate-fade-in", isFullscreen ? "hidden" : "flex")}>
        <button onClick={() => navigate("/jogos")} className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-foreground">Mímica Bíblica</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Teatro e Expressão</p>
        </div>
        {!isSetup && (
          <Button variant="outline" size="icon" onClick={() => !document.fullscreenElement ? containerRef.current?.requestFullscreen().catch(() => {}) : document.exitFullscreen()} className="rounded-xl border-2">
            <Maximize className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isFullscreen && (
        <div className="absolute top-6 right-6 z-50">
          <Button variant="ghost" size="icon" onClick={() => document.exitFullscreen()} className="bg-white/10 text-white border border-white/20 rounded-full">
            <Minimize className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* SETUP */}
      {isSetup && (
        <div className="float-card p-6 space-y-6 animate-float-up border-t-4 border-t-purple-500">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-3 text-3xl">🎭</div>
            <h2 className="text-xl font-black text-foreground mb-1">Configurar Mímica</h2>
            <p className="text-xs text-muted-foreground">Escolha as categorias e o tempo por rodada</p>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Categorias</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CATEGORIAS.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategoria(cat.id)}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left transition-all flex flex-col gap-2",
                    categorias.includes(cat.id) ? cat.bg + " border-2 shadow-md" : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-sm font-black">{cat.label}</span>
                  <span className="text-[10px] text-muted-foreground">{BANCO_MIMICA[cat.id].length} cartas</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Tempo por Rodada</label>
            <div className="flex flex-wrap gap-2">
              {[30, 45, 60, 90, 120].map(t => (
                <button
                  key={t}
                  onClick={() => setTempoPorRodada(t)}
                  className={cn(
                    "px-4 h-11 rounded-xl border-2 font-black text-sm transition-all",
                    tempoPorRodada === t ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-card border-border hover:border-primary/40"
                  )}
                >
                  {t >= 60 ? `${t / 60}min` : `${t}s`}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={iniciarJogo} className="w-full h-14 rounded-2xl font-black text-lg gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-all bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
            <Play className="h-6 w-6" /> COMEÇAR MÍMICA!
          </Button>
        </div>
      )}

      {/* JOGO EM CURSO */}
      {!isSetup && !rodadaFinalizada && cartaAtual && (
        <div className={cn("flex-1 flex flex-col items-center justify-between", isFullscreen ? "py-8" : "py-4 min-h-[500px]")}>
          {/* Timer */}
          <div className="w-full max-w-lg space-y-2">
            <div className="flex items-center justify-between px-2">
              <span className={cn("text-3xl font-black tabular-nums", isFullscreen ? "text-white" : corTimer)}>
                {String(Math.floor(tempoRestante / 60)).padStart(2, "0")}:{String(tempoRestante % 60).padStart(2, "0")}
              </span>
              <div className="flex gap-3">
                <span className={cn("text-sm font-black", isFullscreen ? "text-emerald-400" : "text-emerald-600")}>✓ {acertos}</span>
                <span className={cn("text-sm font-black", isFullscreen ? "text-red-400" : "text-red-600")}>✗ {puladas}</span>
              </div>
            </div>
            <div className={cn("w-full h-2.5 rounded-full", isFullscreen ? "bg-white/10" : "bg-muted")}>
              <div
                className={cn("h-full rounded-full transition-all duration-1000", isFullscreen ? "bg-white/80" : corBarra)}
                style={{ width: `${porcentagemTempo}%` }}
              />
            </div>
          </div>

          {/* Carta Principal */}
          <div className={cn(
            "flex-1 flex flex-col items-center justify-center w-full max-w-lg my-6",
          )}>
            <div className={cn(
              "w-full rounded-[2.5rem] overflow-hidden shadow-2xl transition-all",
              isFullscreen ? "border border-white/10" : "border-2 border-border"
            )}>
              {/* Categoria da carta */}
              <div className={cn(
                "py-3 px-6 text-center text-xs font-black uppercase tracking-[0.2em]",
                isFullscreen
                  ? "bg-white/10 text-white/70"
                  : CATEGORIAS.find(c => categorias.length === 1 && categorias[0] === c.id)?.bg || "bg-muted text-muted-foreground"
              )}>
                🎭 FAÇA A MÍMICA!
              </div>

              {/* Título da carta */}
              <div className={cn(
                "flex items-center justify-center min-h-52 p-8 text-center",
                isFullscreen ? "bg-white/5" : "bg-card"
              )}>
                <p className={cn(
                  "font-black leading-tight",
                  cartaAtual.titulo.length > 20 ? "text-3xl md:text-4xl" : "text-4xl md:text-6xl",
                  isFullscreen ? "text-white" : "text-foreground"
                )}>
                  {cartaAtual.titulo}
                </p>
              </div>

              {/* Dica */}
              {cartaAtual.dica && (
                <div className={cn("px-6 pb-4 text-center", isFullscreen ? "bg-white/5" : "bg-card")}>
                  {mostrarDica ? (
                    <p className={cn("text-sm italic font-medium animate-in fade-in", isFullscreen ? "text-white/60" : "text-muted-foreground")}>
                      💡 {cartaAtual.dica}
                    </p>
                  ) : (
                    <button
                      onClick={() => setMostrarDica(true)}
                      className={cn("text-xs font-bold underline underline-offset-4 opacity-60 hover:opacity-100 transition-opacity", isFullscreen ? "text-white" : "text-foreground")}
                    >
                      Ver dica
                    </button>
                  )}
                </div>
              )}
            </div>

            <p className={cn("text-xs font-bold mt-3 opacity-50 uppercase tracking-[0.2em]", isFullscreen ? "text-white" : "text-foreground")}>
              {cartasRestantes.length + 1} carta(s) restante(s)
            </p>
          </div>

          {/* Ações */}
          <div className="w-full max-w-lg space-y-4">
            {!rodandoTimer && (
              <Button
                onClick={iniciarTimer}
                className={cn("w-full h-16 rounded-2xl font-black text-xl gap-3 shadow-2xl active:scale-95 transition-all", isFullscreen ? "bg-white text-purple-900 hover:bg-white/90" : "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700")}
              >
                <Timer className="h-7 w-7" /> INICIAR TIMER
              </Button>
            )}

            {rodandoTimer && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={pulou}
                  className={cn(
                    "h-20 rounded-2xl font-black text-base flex flex-col items-center justify-center gap-1 border-2 active:scale-95 transition-all",
                    isFullscreen ? "bg-white/10 text-white border-white/20 hover:bg-white/20" : "bg-card border-destructive/30 text-destructive hover:bg-destructive/10"
                  )}
                >
                  <ChevronRight className="h-6 w-6" />
                  PULAR
                </button>
                <button
                  onClick={acertou}
                  className={cn(
                    "h-20 rounded-2xl font-black text-base flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-xl",
                    isFullscreen ? "bg-emerald-500 text-white hover:bg-emerald-400" : "bg-emerald-600 text-white hover:bg-emerald-700"
                  )}
                >
                  <span className="text-2xl">✓</span>
                  ACERTOU!
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RODADA FINALIZADA */}
      {rodadaFinalizada && (
        <div className={cn("flex-1 flex items-center justify-center", isFullscreen ? "" : "min-h-[400px]")}>
          <div className={cn(
            "max-w-sm w-full text-center space-y-6 p-8 rounded-3xl",
            isFullscreen ? "bg-white/10 backdrop-blur-sm border border-white/20" : "float-card"
          )}>
            <div className="text-6xl">{acertos > puladas ? "🎉" : "👏"}</div>
            <div>
              <h2 className={cn("text-2xl font-black mb-2", isFullscreen ? "text-white" : "text-foreground")}>
                Fim da Rodada!
              </h2>
              <p className={cn("text-sm font-medium", isFullscreen ? "text-white/70" : "text-muted-foreground")}>
                {tempoRestante === 0 ? "⏱️ Tempo esgotado!" : "📋 Todas as cartas usadas!"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className={cn("p-4 rounded-2xl", isFullscreen ? "bg-emerald-500/20" : "bg-emerald-50 border border-emerald-200")}>
                <p className={cn("text-3xl font-black", isFullscreen ? "text-emerald-400" : "text-emerald-600")}>{acertos}</p>
                <p className={cn("text-xs font-bold uppercase tracking-wider", isFullscreen ? "text-emerald-400/70" : "text-emerald-700/70")}>Acertos</p>
              </div>
              <div className={cn("p-4 rounded-2xl", isFullscreen ? "bg-red-500/20" : "bg-red-50 border border-red-200")}>
                <p className={cn("text-3xl font-black", isFullscreen ? "text-red-400" : "text-red-600")}>{puladas}</p>
                <p className={cn("text-xs font-bold uppercase tracking-wider", isFullscreen ? "text-red-400/70" : "text-red-700/70")}>Puladas</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={iniciarJogo}
                className={cn(
                  "h-12 rounded-xl font-black gap-2",
                  isFullscreen ? "bg-white text-purple-900 hover:bg-white/90" : "bg-gradient-to-r from-violet-600 to-purple-600 text-white"
                )}
              >
                <RotateCcw className="h-4 w-4" /> Nova Rodada
              </Button>
              <Button
                onClick={reiniciar}
                variant="outline"
                className={cn("h-12 rounded-xl font-bold", isFullscreen ? "border-white/30 text-white hover:bg-white/10" : "")}
              >
                Mudar Configurações
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
