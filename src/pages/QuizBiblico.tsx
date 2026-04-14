import { useState, useRef, useEffect } from "react";
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, Trophy, PlayCircle, Minimize } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GameTimerButton } from "@/components/GameTimerButton";

interface Pergunta {
  pergunta: string;
  opcoes: string[];
  correta: number;
  explicacao: string;
  dificuldade: "facil" | "medio" | "dificil";
}

const perguntas: Pergunta[] = [
  // Bíblia Geral
  { pergunta: "Quantos livros tem a Bíblia?", opcoes: ["66", "72", "73", "70"], correta: 2, explicacao: "A Bíblia Católica possui 73 livros: 46 no AT e 27 no NT.", dificuldade: "facil" },
  { pergunta: "Quem construiu a arca?", opcoes: ["Abraão", "Moisés", "Noé", "Davi"], correta: 2, explicacao: "Noé construiu a arca por ordem de Deus (Gn 6-9).", dificuldade: "facil" },
  { pergunta: "Qual o primeiro livro da Bíblia?", opcoes: ["Êxodo", "Gênesis", "Levítico", "Salmos"], correta: 1, explicacao: "Gênesis narra a criação do mundo.", dificuldade: "facil" },
  { pergunta: "Quem foi vendido pelos irmãos como escravo?", opcoes: ["Moisés", "José", "Jacó", "Benjamim"], correta: 1, explicacao: "José foi vendido por seus irmãos e levado ao Egito (Gn 37).", dificuldade: "medio" },
  { pergunta: "Quantos apóstolos Jesus escolheu?", opcoes: ["7", "10", "12", "15"], correta: 2, explicacao: "Jesus escolheu 12 apóstolos (Mc 3,13-19).", dificuldade: "facil" },
  { pergunta: "Quem batizou Jesus?", opcoes: ["Pedro", "João Batista", "Paulo", "Tiago"], correta: 1, explicacao: "João Batista batizou Jesus no rio Jordão (Mt 3,13-17).", dificuldade: "facil" },
  { pergunta: "Qual é o maior mandamento segundo Jesus?", opcoes: ["Não matarás", "Amar a Deus sobre todas as coisas", "Honrar pai e mãe", "Não roubar"], correta: 1, explicacao: "Amar a Deus de todo o coração (Mt 22,37-38).", dificuldade: "facil" },
  { pergunta: "Em que cidade Jesus nasceu?", opcoes: ["Nazaré", "Jerusalém", "Belém", "Cafarnaum"], correta: 2, explicacao: "Jesus nasceu em Belém da Judeia (Mt 2,1).", dificuldade: "facil" },
  { pergunta: "Quantos dias Jesus ficou no deserto?", opcoes: ["7", "30", "40", "50"], correta: 2, explicacao: "Jesus jejuou 40 dias no deserto (Mt 4,1-2).", dificuldade: "facil" },
  { pergunta: "Quem negou Jesus três vezes?", opcoes: ["Judas", "Pedro", "Tomé", "João"], correta: 1, explicacao: "Pedro negou Jesus três vezes antes do galo cantar (Mt 26,69-75).", dificuldade: "facil" },
  { pergunta: "Qual sacramento Jesus instituiu na Última Ceia?", opcoes: ["Batismo", "Crisma", "Eucaristia", "Confissão"], correta: 2, explicacao: "Na Última Ceia Jesus instituiu a Eucaristia (Lc 22,19-20).", dificuldade: "medio" },
  { pergunta: "Quem foi o primeiro rei de Israel?", opcoes: ["Davi", "Saul", "Salomão", "Samuel"], correta: 1, explicacao: "Saul foi ungido por Samuel como primeiro rei (1Sm 10).", dificuldade: "medio" },
  { pergunta: "Quantos mandamentos Deus deu a Moisés?", opcoes: ["5", "7", "10", "12"], correta: 2, explicacao: "Os Dez Mandamentos foram dados no Monte Sinai (Ex 20).", dificuldade: "facil" },
  { pergunta: "Quem escreveu a maioria das cartas do NT?", opcoes: ["Pedro", "Paulo", "João", "Tiago"], correta: 1, explicacao: "São Paulo escreveu 13 cartas do Novo Testamento.", dificuldade: "medio" },
  { pergunta: "Qual a última palavra de Jesus na cruz segundo João?", opcoes: ["Eli, Eli", "Está consumado", "Pai, perdoa-lhes", "Tenho sede"], correta: 1, explicacao: "\"Está consumado\" (Jo 19,30).", dificuldade: "dificil" },
  // Liturgia
  { pergunta: "Qual cor litúrgica é usada no Advento e na Quaresma?", opcoes: ["Branco", "Verde", "Roxo", "Vermelho"], correta: 2, explicacao: "O roxo simboliza penitência, preparação e conversão.", dificuldade: "medio" },
  { pergunta: "Quantos tempos litúrgicos existem na Igreja Católica?", opcoes: ["4", "5", "6", "7"], correta: 2, explicacao: "Advento, Natal, Quaresma, Tríduo Pascal, Tempo Pascal e Tempo Comum.", dificuldade: "dificil" },
  { pergunta: "Qual cor litúrgica é usada em Pentecostes?", opcoes: ["Branco", "Verde", "Roxo", "Vermelho"], correta: 3, explicacao: "O vermelho representa o fogo do Espírito Santo e o martírio.", dificuldade: "medio" },
  { pergunta: "Quando começa o Ano Litúrgico?", opcoes: ["1º de janeiro", "Domingo de Ramos", "1º Domingo do Advento", "Sábado Santo"], correta: 2, explicacao: "O Ano Litúrgico inicia no 1º Domingo do Advento.", dificuldade: "medio" },
  { pergunta: "O que celebramos na Solenidade de Corpus Christi?", opcoes: ["A Paixão de Cristo", "O Corpo e Sangue de Cristo", "A Ascensão", "Pentecostes"], correta: 1, explicacao: "Corpus Christi celebra a presença real de Jesus na Eucaristia.", dificuldade: "facil" },
  { pergunta: "Qual parte da Missa inclui o 'Santo, Santo, Santo'?", opcoes: ["Rito Inicial", "Liturgia da Palavra", "Liturgia Eucarística", "Rito Final"], correta: 2, explicacao: "O Sanctus faz parte da Oração Eucarística na Liturgia Eucarística.", dificuldade: "dificil" },
  { pergunta: "O que é o Tríduo Pascal?", opcoes: ["Os 3 dias antes da Quaresma", "Quinta, Sexta e Sábado Santos", "Os 3 primeiros dias da Páscoa", "Natal, Ano Novo e Epifania"], correta: 1, explicacao: "O Tríduo Pascal vai da Missa da Ceia do Senhor até a Vigília Pascal.", dificuldade: "medio" },
  { pergunta: "Qual cor litúrgica é usada no Tempo Comum?", opcoes: ["Branco", "Verde", "Roxo", "Vermelho"], correta: 1, explicacao: "O verde simboliza a esperança e o crescimento na fé.", dificuldade: "facil" },
  // Doutrina Social
  { pergunta: "Qual encíclica do Papa Leão XIII é marco da Doutrina Social?", opcoes: ["Laudato Si'", "Rerum Novarum", "Evangelii Gaudium", "Fratelli Tutti"], correta: 1, explicacao: "Rerum Novarum (1891) trata da condição dos operários e justiça social.", dificuldade: "dificil" },
  { pergunta: "Qual é o princípio central da Doutrina Social da Igreja?", opcoes: ["Lucro máximo", "Dignidade da pessoa humana", "Livre mercado", "Propriedade absoluta"], correta: 1, explicacao: "A dignidade da pessoa humana é o fundamento de toda a Doutrina Social.", dificuldade: "medio" },
  { pergunta: "O que significa o princípio da subsidiariedade?", opcoes: ["O Estado faz tudo", "Comunidades maiores ajudam as menores quando necessário", "Cada um por si", "Abolição do Estado"], correta: 1, explicacao: "A subsidiariedade defende que decisões sejam tomadas no nível mais próximo das pessoas.", dificuldade: "dificil" },
  { pergunta: "Qual encíclica do Papa Francisco trata da ecologia integral?", opcoes: ["Fratelli Tutti", "Laudato Si'", "Lumen Fidei", "Amoris Laetitia"], correta: 1, explicacao: "Laudato Si' (2015) convoca ao cuidado da 'casa comum'.", dificuldade: "medio" },
  { pergunta: "O que é a opção preferencial pelos pobres?", opcoes: ["Dar esmola", "Priorizar os mais vulneráveis nas ações da Igreja", "Voto de pobreza", "Socialismo"], correta: 1, explicacao: "É um princípio que orienta a Igreja a colocar os pobres no centro de sua ação pastoral.", dificuldade: "medio" },
  // História da Igreja
  { pergunta: "Em que ano ocorreu o Concílio Vaticano II?", opcoes: ["1870", "1945", "1962-1965", "2000"], correta: 2, explicacao: "O Concílio Vaticano II (1962-1965) modernizou a liturgia e a relação da Igreja com o mundo.", dificuldade: "dificil" },
  { pergunta: "Quem convocou o Concílio Vaticano II?", opcoes: ["Papa Pio XII", "Papa João XXIII", "Papa Paulo VI", "Papa João Paulo II"], correta: 1, explicacao: "São João XXIII convocou o Concílio em 1959.", dificuldade: "dificil" },
  { pergunta: "Em que século surgiu o monaquismo cristão?", opcoes: ["Século I", "Século III-IV", "Século VIII", "Século XII"], correta: 1, explicacao: "O monaquismo surgiu nos séculos III-IV com os Padres do Deserto no Egito.", dificuldade: "dificil" },
  { pergunta: "Qual cidade foi sede do primeiro Concílio Ecumênico?", opcoes: ["Roma", "Jerusalém", "Niceia", "Constantinopla"], correta: 2, explicacao: "O Concílio de Niceia (325) definiu o Credo e combateu o arianismo.", dificuldade: "dificil" },
  { pergunta: "Quem foi o primeiro Papa não europeu em 1.300 anos?", opcoes: ["Bento XVI", "João Paulo I", "Francisco", "João Paulo II"], correta: 2, explicacao: "Papa Francisco, argentino, eleito em 2013.", dificuldade: "facil" },
  { pergunta: "Qual santo fundou a Companhia de Jesus (Jesuítas)?", opcoes: ["São Francisco", "Santo Inácio de Loyola", "São Bento", "São Domingos"], correta: 1, explicacao: "Santo Inácio de Loyola fundou os Jesuítas em 1534.", dificuldade: "medio" },
  { pergunta: "O que foi o Grande Cisma do Oriente (1054)?", opcoes: ["Divisão entre católicos e protestantes", "Separação entre Roma e Constantinopla", "Fim do Império Romano", "Início das Cruzadas"], correta: 1, explicacao: "O Cisma separou a Igreja Católica Romana da Igreja Ortodoxa Oriental.", dificuldade: "dificil" },
  { pergunta: "Qual é o documento mais importante do Vaticano II sobre a liturgia?", opcoes: ["Gaudium et Spes", "Sacrosanctum Concilium", "Lumen Gentium", "Dei Verbum"], correta: 1, explicacao: "Sacrosanctum Concilium reformou a liturgia, permitindo a missa em línguas vernáculas.", dificuldade: "dificil" },
];

export default function QuizBiblico() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSetup, setIsSetup] = useState(true);
  const [dificuldade, setDificuldade] = useState<"facil" | "medio" | "dificil">("facil");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [shuffled, setShuffled] = useState<Pergunta[]>([]);
  const [perguntaIdx, setPerguntaIdx] = useState(0);
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [acertos, setAcertos] = useState(0);
  const [respondidas, setRespondidas] = useState(0);
  const [finalizado, setFinalizado] = useState(false);
  const [timeoutActive, setTimeoutActive] = useState(false);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const iniciarJogo = () => {
    const filtered = perguntas.filter((p) => p.dificuldade === dificuldade);
    setShuffled([...filtered].sort(() => Math.random() - 0.5).slice(0, 10)); // Jogar 10 perguntas por vez
    setIsSetup(false);
    setPerguntaIdx(0);
    setSelecionada(null);
    setAcertos(0);
    setRespondidas(0);
    setFinalizado(false);
    setTimeoutActive(false);

    if (!document.fullscreenElement && window.innerWidth < 1024) {
      containerRef.current?.requestFullscreen().catch(() => {});
    }
  };

  const sairFullscreenEVoltar = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setIsSetup(true);
  };

  const atual = shuffled[perguntaIdx];
  const respondeu = selecionada !== null;

  const responder = (idx: number) => {
    if (respondeu || timeoutActive) return;
    setSelecionada(idx);
    setRespondidas((p) => p + 1);
    if (idx === atual?.correta) setAcertos((p) => p + 1);
  };

  const proxima = () => {
    if (perguntaIdx + 1 >= shuffled.length) {
      setFinalizado(true);
    } else {
      setPerguntaIdx((p) => p + 1);
      setSelecionada(null);
      setTimeoutActive(false);
    }
  };

  const handleTimeUp = () => {
    if (respondeu) return;
    setTimeoutActive(true);
  };

  const reiniciar = () => {
    iniciarJogo();
  };

  return (
    <div ref={containerRef} className={cn("space-y-5 flex flex-col min-h-full transition-all duration-500", isFullscreen ? "bg-background p-6" : "")}>
      <div className={cn("flex items-center gap-3 animate-fade-in", isFullscreen ? "hidden" : "flex")}>
        <button onClick={() => navigate("/jogos")} className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1">Quiz Bíblico</h1>
        {!isSetup && (
          <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            {perguntaIdx + 1}/{shuffled.length}
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
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📖</span>
            </div>
            <h2 className="text-xl font-black text-foreground mb-1">Configurar Partida</h2>
            <p className="text-xs text-muted-foreground">Escolha a dificuldade das perguntas do quiz.</p>
          </div>

          <div className="space-y-3">
            {[
              { id: "facil", label: "Fácil", desc: "Perguntas básicas da catequese", color: "bg-success/10 text-success border-success/30" },
              { id: "medio", label: "Médio", desc: "Desafios intermediários", color: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
              { id: "dificil", label: "Difícil", desc: "Perguntas profundas e complexas", color: "bg-destructive/10 text-destructive border-destructive/30" },
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

          <Button onClick={iniciarJogo} className="w-full h-14 rounded-2xl text-base font-black gap-2 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90">
            <PlayCircle className="h-5 w-5" /> INICIAR JOGO
          </Button>
        </div>
      ) : finalizado ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="float-card p-8 text-center space-y-6 animate-float-up max-w-sm w-full">
            <Trophy className="h-20 w-20 mx-auto text-gold animate-bounce" />
            <div>
              <h2 className="text-2xl font-black text-foreground mb-2">Resultado Final</h2>
              <p className="text-6xl font-black text-primary drop-shadow-md">{acertos}<span className="text-3xl text-muted-foreground">/{respondidas}</span></p>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              {acertos === respondidas ? "Parabéns! Você é um mestre da Bíblia! 🎉" : acertos >= respondidas * 0.7 ? "Muito bom! Continue estudando! 📖" : "Continue praticando! A Bíblia tem muito a ensinar! ✝️"}
            </p>
            <div className="flex flex-col gap-3 pt-4">
              <Button onClick={reiniciar} className="w-full h-12 gap-2 text-sm font-bold rounded-xl">
                <RotateCcw className="h-4 w-4" /> Jogar Novamente
              </Button>
              <Button onClick={sairFullscreenEVoltar} variant="outline" className="w-full h-12 rounded-xl text-sm font-bold">
                Voltar ao Menu
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col max-w-lg mx-auto w-full relative pt-10">
          {!isFullscreen && (
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-6 absolute top-0">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${((perguntaIdx + 1) / shuffled.length) * 100}%` }} />
            </div>
          )}

          <div className="float-card p-6 sm:p-8 space-y-6 animate-float-up shadow-xl shadow-black/5 relative overflow-hidden">
            {timeoutActive && !respondeu && (
                <div className="absolute inset-0 bg-destructive/5 pointer-events-none animate-pulse z-0" />
            )}

            <div className="flex items-start justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black shrink-0">
                  {perguntaIdx + 1}
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground leading-relaxed">{atual?.pergunta}</h2>
              </div>
              <GameTimerButton 
                key={perguntaIdx} 
                onTimeUp={handleTimeUp} 
                disabled={respondeu} 
                duration={10} 
              />
            </div>

            <div className="space-y-3 pt-4 relative z-10">
              {atual?.opcoes.map((opcao, i) => {
                let cls = "w-full text-left px-5 py-4 rounded-xl border-2 transition-all font-medium text-sm sm:text-base flex items-center gap-4 group ";
                if (!respondeu && !timeoutActive) {
                  cls += "border-border hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]";
                } else if (respondeu) {
                  if (i === atual.correta) {
                    cls += "border-success bg-success/10 text-success shadow-lg shadow-success/10 scale-[1.02] z-10";
                  } else if (i === selecionada) {
                    cls += "border-destructive bg-destructive/10 text-destructive";
                  } else {
                    cls += "border-border opacity-30 grayscale";
                  }
                } else if (timeoutActive) {
                   cls += "border-border opacity-50 grayscale cursor-not-allowed";
                }

                return (
                  <button key={i} onClick={() => responder(i)} className={cls} disabled={respondeu || timeoutActive}>
                    <span className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-colors",
                      !respondeu && !timeoutActive ? "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary" :
                      respondeu && i === atual.correta ? "bg-success text-success-foreground" :
                      respondeu && i === selecionada ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{opcao}</span>
                    {respondeu && i === atual.correta && <CheckCircle2 className="h-6 w-6 text-success shrink-0" />}
                    {respondeu && i === selecionada && i !== atual.correta && <XCircle className="h-6 w-6 text-destructive shrink-0" />}
                  </button>
                );
              })}
            </div>

            {timeoutActive && !respondeu && (
              <div className="text-center mt-6 animate-fade-in slide-in-from-bottom-2 relative z-10">
                  <span className="inline-flex items-center px-4 py-2 bg-destructive/10 text-destructive rounded-full text-xs font-black uppercase tracking-widest gap-2">
                      ⏱️ Tempo Esgotado!
                  </span>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">Revele a resposta ou pule.</p>
              </div>
            )}

            {respondeu && (
              <div className="p-4 rounded-xl bg-muted/50 animate-fade-in border border-border/50 relative z-10 mx-auto">
                <p className="text-sm text-foreground/80 leading-relaxed font-medium">💡 <span className="font-bold">Explicação:</span> {atual.explicacao}</p>
              </div>
            )}

            {(respondeu || timeoutActive) && (
              <Button onClick={proxima} variant={timeoutActive && !respondeu ? "outline" : "default"} className="w-full h-14 rounded-xl font-bold text-base shadow-lg hover:opacity-90 mt-4 animate-in slide-in-from-bottom-4 relative z-10 mx-auto bg-primary text-primary-foreground">
                {perguntaIdx + 1 >= shuffled.length ? "Ver Resultado Final" : (timeoutActive && !respondeu ? "Pular Pergunta" : "Próxima Pergunta")}
              </Button>
            )}
          </div>

          <div className="flex justify-center gap-6 mt-6">
            <span className="text-sm font-black text-success px-4 py-2 rounded-full bg-success/10">✓ {acertos} Acertos</span>
            <span className="text-sm font-black text-destructive px-4 py-2 rounded-full bg-destructive/10">✗ {respondidas - acertos} Erros</span>
          </div>
        </div>
      )}
    </div>
  );
}
