import { useState, useRef, useEffect } from "react";
import { ArrowLeft, RotateCcw, Trophy, ChevronDown, ChevronUp, PlayCircle, Minimize } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PerguntaResp {
  categoria: string;
  pergunta: string;
  resposta: string;
  dificuldade: "facil" | "medio" | "dificil";
}

const banco: PerguntaResp[] = [
  // Antigo Testamento
  { categoria: "Antigo Testamento", pergunta: "Quem foi o primeiro homem criado por Deus?", resposta: "Adão (Gn 2,7)", dificuldade: "facil" },
  { categoria: "Antigo Testamento", pergunta: "Quantos filhos Jacó teve?", resposta: "12 filhos, que deram origem às 12 tribos de Israel", dificuldade: "medio" },
  { categoria: "Antigo Testamento", pergunta: "Qual era a profissão de Amós?", resposta: "Boiadeiro e cultivador de sicômoros (Am 7,14)", dificuldade: "dificil" },
  { categoria: "Antigo Testamento", pergunta: "Quem foi jogado na cova dos leões?", resposta: "Daniel (Dn 6)", dificuldade: "facil" },
  { categoria: "Antigo Testamento", pergunta: "Qual o menor livro do Antigo Testamento?", resposta: "Abdias, com apenas 1 capítulo", dificuldade: "dificil" },
  { categoria: "Antigo Testamento", pergunta: "Quem liderou o povo hebreu na travessia do Mar Vermelho?", resposta: "Moisés (Ex 14)", dificuldade: "facil" },
  { categoria: "Antigo Testamento", pergunta: "Qual mulher foi juíza de Israel?", resposta: "Débora (Jz 4-5)", dificuldade: "medio" },
  { categoria: "Antigo Testamento", pergunta: "Quem derrotou o gigante Golias?", resposta: "Davi, com uma funda e uma pedra (1Sm 17)", dificuldade: "facil" },
  // Novo Testamento
  { categoria: "Novo Testamento", pergunta: "Quantos evangelhos existem?", resposta: "Quatro: Mateus, Marcos, Lucas e João", dificuldade: "facil" },
  { categoria: "Novo Testamento", pergunta: "Quem era o publicano que subiu na árvore?", resposta: "Zaqueu (Lc 19,1-10)", dificuldade: "facil" },
  { categoria: "Novo Testamento", pergunta: "Qual o primeiro milagre de Jesus?", resposta: "Transformar água em vinho nas bodas de Caná (Jo 2,1-11)", dificuldade: "facil" },
  { categoria: "Novo Testamento", pergunta: "Quantas bem-aventuranças Jesus proclamou?", resposta: "Oito (Mt 5,3-12)", dificuldade: "medio" },
  { categoria: "Novo Testamento", pergunta: "Quem traiu Jesus?", resposta: "Judas Iscariotes, por 30 moedas de prata (Mt 26,14-16)", dificuldade: "facil" },
  { categoria: "Novo Testamento", pergunta: "Qual apóstolo era médico?", resposta: "São Lucas, autor do terceiro Evangelho e dos Atos dos Apóstolos", dificuldade: "dificil" },
  { categoria: "Novo Testamento", pergunta: "O que aconteceu no dia de Pentecostes?", resposta: "O Espírito Santo desceu sobre os apóstolos em forma de línguas de fogo (At 2,1-4)", dificuldade: "medio" },
  { categoria: "Novo Testamento", pergunta: "Qual parábola fala de um filho que saiu de casa?", resposta: "A parábola do Filho Pródigo (Lc 15,11-32)", dificuldade: "facil" },
  // Sacramentos
  { categoria: "Sacramentos", pergunta: "Quantos sacramentos a Igreja Católica reconhece?", resposta: "Sete: Batismo, Confirmação, Eucaristia, Penitência, Unção dos Enfermos, Ordem e Matrimônio", dificuldade: "facil" },
  { categoria: "Sacramentos", pergunta: "Qual sacramento Jesus instituiu na Última Ceia?", resposta: "A Eucaristia (Lc 22,19-20)", dificuldade: "facil" },
  { categoria: "Sacramentos", pergunta: "O que é a Crisma?", resposta: "É o sacramento da Confirmação, que fortalece os dons do Espírito Santo recebidos no Batismo", dificuldade: "medio" },
  { categoria: "Sacramentos", pergunta: "Quais são os sacramentos de iniciação cristã?", resposta: "Batismo, Confirmação (Crisma) e Eucaristia", dificuldade: "medio" },
  { categoria: "Sacramentos", pergunta: "O que é a Unção dos Enfermos?", resposta: "Sacramento que dá graça e força espiritual aos doentes graves ou idosos", dificuldade: "medio" },
  // Igreja
  { categoria: "Igreja", pergunta: "Quem é considerado o primeiro Papa?", resposta: "São Pedro (Mt 16,18)", dificuldade: "facil" },
  { categoria: "Igreja", pergunta: "O que significa a palavra 'católica'?", resposta: "Universal – do grego 'katholikós'", dificuldade: "medio" },
  { categoria: "Igreja", pergunta: "Quais são os tempos litúrgicos?", resposta: "Advento, Natal, Quaresma, Tríduo Pascal, Tempo Pascal e Tempo Comum", dificuldade: "medio" },
  { categoria: "Igreja", pergunta: "Quais são as quatro notas da Igreja?", resposta: "Una, Santa, Católica e Apostólica", dificuldade: "dificil" },
  // Santos
  { categoria: "Santos", pergunta: "Quem é o padroeiro da ecologia?", resposta: "São Francisco de Assis", dificuldade: "facil" },
  { categoria: "Santos", pergunta: "Qual santa é padroeira das causas impossíveis?", resposta: "Santa Rita de Cássia", dificuldade: "medio" },
  { categoria: "Santos", pergunta: "Quem é a padroeira do Brasil?", resposta: "Nossa Senhora Aparecida", dificuldade: "facil" },
  { categoria: "Santos", pergunta: "Qual santo foi o primeiro mártir cristão?", resposta: "Santo Estêvão (At 7,54-60)", dificuldade: "medio" },
  { categoria: "Santos", pergunta: "Qual santa teve visões de Jesus Misericordioso?", resposta: "Santa Faustina Kowalska", dificuldade: "dificil" },
  // Liturgia
  { categoria: "Liturgia", pergunta: "O que significa a cor verde na liturgia?", resposta: "Esperança e crescimento na fé, usada no Tempo Comum", dificuldade: "facil" },
  { categoria: "Liturgia", pergunta: "Quando se usa a cor branca na liturgia?", resposta: "Natal, Páscoa, festas de santos não mártires, e celebrações do Senhor", dificuldade: "medio" },
  { categoria: "Liturgia", pergunta: "O que é o Círio Pascal?", resposta: "Grande vela acesa na Vigília Pascal, símbolo de Cristo Ressuscitado, Luz do mundo", dificuldade: "medio" },
  { categoria: "Liturgia", pergunta: "O que é a genuflexão?", resposta: "Gesto de dobrar o joelho direito ao chão em reverência à presença de Cristo na Eucaristia", dificuldade: "facil" },
  { categoria: "Liturgia", pergunta: "Quais as partes principais da Missa?", resposta: "Ritos Iniciais, Liturgia da Palavra, Liturgia Eucarística e Ritos Finais", dificuldade: "medio" },
  { categoria: "Liturgia", pergunta: "O que é o Aleluia na liturgia?", resposta: "Aclamação de louvor que significa 'Louvai o Senhor', cantada antes do Evangelho", dificuldade: "facil" },
  // Doutrina Social
  { categoria: "Doutrina Social", pergunta: "Qual é o princípio do bem comum?", resposta: "Conjunto de condições sociais que permitem a todos alcançar sua realização plena", dificuldade: "dificil" },
  { categoria: "Doutrina Social", pergunta: "O que ensina a Igreja sobre o trabalho?", resposta: "O trabalho é um direito e dever, e deve ser justo e dignificante (Laborem Exercens)", dificuldade: "dificil" },
  { categoria: "Doutrina Social", pergunta: "O que é solidariedade na Doutrina Social?", resposta: "Determinação firme de empenhar-se pelo bem comum, reconhecendo a interdependência entre todos", dificuldade: "dificil" },
  { categoria: "Doutrina Social", pergunta: "O que a Igreja ensina sobre a propriedade privada?", resposta: "É um direito, mas tem função social e deve servir ao bem comum", dificuldade: "medio" },
  // História da Igreja
  { categoria: "História da Igreja", pergunta: "Quem convocou o Concílio de Trento?", resposta: "Papa Paulo III em 1545, em resposta à Reforma Protestante", dificuldade: "dificil" },
  { categoria: "História da Igreja", pergunta: "O que foram as Cruzadas?", resposta: "Expedições militares entre os séculos XI e XIII para recuperar a Terra Santa", dificuldade: "medio" },
  { categoria: "História da Igreja", pergunta: "Qual a importância do Edito de Milão (313)?", resposta: "Concedeu liberdade de culto aos cristãos no Império Romano", dificuldade: "dificil" },
  { categoria: "História da Igreja", pergunta: "Quem foi São Tomás de Aquino?", resposta: "Teólogo e filósofo do séc. XIII, autor da Suma Teológica, Doutor da Igreja", dificuldade: "dificil" },
  { categoria: "História da Igreja", pergunta: "O que foi a Inquisição?", resposta: "Tribunal eclesiástico criado no séc. XIII para julgar heresias e preservar a fé", dificuldade: "dificil" },
];

const categorias = [...new Set(banco.map((p) => p.categoria))];

export default function PerguntasRespostas() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [catFiltro, setCatFiltro] = useState<string>("todas");
  const [modo, setModo] = useState<"lista" | "setup_jogo" | "jogo">("lista");
  const [abertas, setAbertas] = useState<Set<number>>(new Set());
  const [dificuldade, setDificuldade] = useState<"facil" | "medio" | "dificil">("facil");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Jogo mode
  const [jogoPergIdx, setJogoPergIdx] = useState(0);
  const [mostrarResposta, setMostrarResposta] = useState(false);
  const [pontuacao, setPontuacao] = useState({ acertou: 0, errou: 0 });
  const [jogoFinalizado, setJogoFinalizado] = useState(false);
  const [jogoPerguntas, setJogoPerguntas] = useState<PerguntaResp[]>([]);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const filtradas = catFiltro === "todas" ? banco : banco.filter((p) => p.categoria === catFiltro);

  const toggleAberta = (idx: number) => {
    const next = new Set(abertas);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setAbertas(next);
  };

  const iniciarSetupJogo = () => {
    setModo("setup_jogo");
  };

  const iniciarJogoGameplay = () => {
    const filteredByCat = catFiltro === "todas" ? banco : banco.filter((p) => p.categoria === catFiltro);
    const filteredAndDiff = filteredByCat.filter((p) => p.dificuldade === dificuldade);
    
    // Fallback if there are not enough questions for that difficulty on that category
    const finalSet = filteredAndDiff.length > 0 ? filteredAndDiff : filteredByCat;
    
    setJogoPerguntas([...finalSet].sort(() => Math.random() - 0.5).slice(0, 10));
    setModo("jogo");
    setJogoPergIdx(0);
    setMostrarResposta(false);
    setPontuacao({ acertou: 0, errou: 0 });
    setJogoFinalizado(false);

    if (!document.fullscreenElement && window.innerWidth < 1024) {
      containerRef.current?.requestFullscreen().catch(() => {});
    }
  };

  const sairFullscreenEVoltar = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setModo("lista");
  };

  const marcar = (acertou: boolean) => {
    setPontuacao((p) => ({
      acertou: p.acertou + (acertou ? 1 : 0),
      errou: p.errou + (acertou ? 0 : 1),
    }));
    if (jogoPergIdx + 1 >= jogoPerguntas.length) {
      setJogoFinalizado(true);
    } else {
      setJogoPergIdx((p) => p + 1);
      setMostrarResposta(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("space-y-5 flex flex-col min-h-full transition-all duration-500", isFullscreen ? "bg-background p-6" : "")}>
      <div className={cn("flex items-center gap-3 animate-fade-in", isFullscreen ? "hidden" : "flex")}>
        <button onClick={() => modo === "lista" ? navigate("/jogos") : setModo("lista")} className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1">Perguntas e Respostas</h1>
      </div>

      {isFullscreen && (
        <div className="absolute top-6 right-6 z-50">
          <Button variant="ghost" size="icon" onClick={() => document.exitFullscreen()} className="bg-background/50 backdrop-blur-sm rounded-full">
            <Minimize className="h-5 w-5" />
          </Button>
        </div>
      )}

      {modo === "lista" && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
            <button
              onClick={() => setCatFiltro("todas")}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all snap-start ${catFiltro === "todas" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              Todas
            </button>
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCatFiltro(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all snap-start ${catFiltro === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <Button onClick={iniciarSetupJogo} className="w-full gap-2 font-bold text-base h-14 rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90">
            🎮 Jogar com Perguntas
          </Button>

          <div className="space-y-2">
            {filtradas.map((p, i) => (
              <button
                key={i}
                onClick={() => toggleAberta(i)}
                className="w-full float-card p-4 text-left animate-float-up"
                style={{ animationDelay: `${i * 20}ms` }}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wide opacity-80">{p.categoria}</span>
                    <p className="text-sm font-bold text-foreground mt-0.5">{p.pergunta}</p>
                    {abertas.has(i) && (
                      <p className="text-sm text-success mt-2 font-medium animate-in slide-in-from-top-1 bg-success/5 p-3 rounded-xl border border-success/10">📖 {p.resposta}</p>
                    )}
                  </div>
                  {abertas.has(i) ? <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {modo === "setup_jogo" && (
        <div className="flex-1 flex flex-col justify-center">
          <div className="float-card p-6 space-y-6 animate-float-up max-w-sm mx-auto w-full mt-10">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎮</span>
              </div>
              <h2 className="text-xl font-black text-foreground mb-1">Configurar Partida</h2>
              <p className="text-xs text-muted-foreground">Escolha a dificuldade das perguntas. (Categoria: {catFiltro === "todas" ? "Todas" : catFiltro})</p>
            </div>

            <div className="space-y-3">
              {[
                { id: "facil", label: "Fácil", desc: "Perguntas de introdução", color: "bg-success/10 text-success border-success/30" },
                { id: "medio", label: "Médio", desc: "Testes intermediários", color: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
                { id: "dificil", label: "Difícil", desc: "Nível avançado", color: "bg-destructive/10 text-destructive border-destructive/30" },
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

            <Button onClick={iniciarJogoGameplay} className="w-full h-14 rounded-2xl text-base font-black gap-2 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90">
              <PlayCircle className="h-5 w-5" /> INICIAR JOGO
            </Button>
          </div>
        </div>
      )}

      {modo === "jogo" && !jogoFinalizado && (
        <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
          {!isFullscreen && (
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-6">
              <div className="h-full bg-success rounded-full transition-all duration-500" style={{ width: `${((jogoPergIdx + 1) / jogoPerguntas.length) * 100}%` }} />
            </div>
          )}

          <div className="float-card p-6 sm:p-8 space-y-6 animate-float-up shadow-xl shadow-black/5">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-md">{jogoPerguntas[jogoPergIdx].categoria}</span>
            <h2 className="text-xl font-bold text-foreground leading-relaxed mt-2">{jogoPerguntas[jogoPergIdx].pergunta}</h2>

            {!mostrarResposta ? (
              <Button onClick={() => setMostrarResposta(true)} variant="outline" className="w-full h-14 font-bold text-base gap-2 mt-4">
                👀 Revelar Resposta
              </Button>
            ) : (
              <div className="space-y-4 animate-in slide-in-from-bottom-2 pt-2">
                <div className="p-5 rounded-xl bg-success/10 border-2 border-success/30 shadow-inner">
                  <p className="text-sm font-bold text-foreground leading-relaxed">📖 {jogoPerguntas[jogoPergIdx].resposta}</p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => marcar(true)} className="flex-1 h-14 font-bold bg-success hover:bg-success/90 text-white shadow-lg shadow-success/20">
                    ✓ Acertou
                  </Button>
                  <Button onClick={() => marcar(false)} variant="destructive" className="flex-1 h-14 font-bold shadow-lg shadow-destructive/20">
                    ✗ Errou
                  </Button>
                </div>
              </div>
            )}

            <p className="text-xs text-center font-bold text-muted-foreground mt-4">{jogoPergIdx + 1}/{jogoPerguntas.length}</p>
          </div>
        </div>
      )}

      {modo === "jogo" && jogoFinalizado && (
        <div className="flex-1 flex items-center justify-center">
          <div className="float-card p-8 text-center space-y-6 animate-float-up max-w-sm w-full">
            <Trophy className="h-20 w-20 mx-auto text-gold animate-bounce" />
            <h2 className="text-2xl font-black text-foreground">Resultado</h2>
            <div className="flex justify-center gap-8 py-2">
              <div className="text-center font-black">
                <p className="text-5xl text-success drop-shadow-md">{pontuacao.acertou}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Acertos</p>
              </div>
              <div className="text-center font-black">
                <p className="text-5xl text-destructive drop-shadow-md">{pontuacao.errou}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Erros</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <Button onClick={iniciarJogoGameplay} className="w-full h-12 gap-2 font-bold"><RotateCcw className="h-4 w-4" /> Jogar Novamente</Button>
              <Button variant="outline" onClick={sairFullscreenEVoltar} className="w-full h-12 font-bold">Voltar ao Menu</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
