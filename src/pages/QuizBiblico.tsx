import { useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Pergunta {
  pergunta: string;
  opcoes: string[];
  correta: number;
  explicacao: string;
}

const perguntas: Pergunta[] = [
  // Bíblia Geral
  { pergunta: "Quantos livros tem a Bíblia?", opcoes: ["66", "72", "73", "70"], correta: 2, explicacao: "A Bíblia Católica possui 73 livros: 46 no AT e 27 no NT." },
  { pergunta: "Quem construiu a arca?", opcoes: ["Abraão", "Moisés", "Noé", "Davi"], correta: 2, explicacao: "Noé construiu a arca por ordem de Deus (Gn 6-9)." },
  { pergunta: "Qual o primeiro livro da Bíblia?", opcoes: ["Êxodo", "Gênesis", "Levítico", "Salmos"], correta: 1, explicacao: "Gênesis narra a criação do mundo." },
  { pergunta: "Quem foi vendido pelos irmãos como escravo?", opcoes: ["Moisés", "José", "Jacó", "Benjamim"], correta: 1, explicacao: "José foi vendido por seus irmãos e levado ao Egito (Gn 37)." },
  { pergunta: "Quantos apóstolos Jesus escolheu?", opcoes: ["7", "10", "12", "15"], correta: 2, explicacao: "Jesus escolheu 12 apóstolos (Mc 3,13-19)." },
  { pergunta: "Quem batizou Jesus?", opcoes: ["Pedro", "João Batista", "Paulo", "Tiago"], correta: 1, explicacao: "João Batista batizou Jesus no rio Jordão (Mt 3,13-17)." },
  { pergunta: "Qual é o maior mandamento segundo Jesus?", opcoes: ["Não matarás", "Amar a Deus sobre todas as coisas", "Honrar pai e mãe", "Não roubar"], correta: 1, explicacao: "Amar a Deus de todo o coração (Mt 22,37-38)." },
  { pergunta: "Em que cidade Jesus nasceu?", opcoes: ["Nazaré", "Jerusalém", "Belém", "Cafarnaum"], correta: 2, explicacao: "Jesus nasceu em Belém da Judeia (Mt 2,1)." },
  { pergunta: "Quantos dias Jesus ficou no deserto?", opcoes: ["7", "30", "40", "50"], correta: 2, explicacao: "Jesus jejuou 40 dias no deserto (Mt 4,1-2)." },
  { pergunta: "Quem negou Jesus três vezes?", opcoes: ["Judas", "Pedro", "Tomé", "João"], correta: 1, explicacao: "Pedro negou Jesus três vezes antes do galo cantar (Mt 26,69-75)." },
  { pergunta: "Qual sacramento Jesus instituiu na Última Ceia?", opcoes: ["Batismo", "Crisma", "Eucaristia", "Confissão"], correta: 2, explicacao: "Na Última Ceia Jesus instituiu a Eucaristia (Lc 22,19-20)." },
  { pergunta: "Quem foi o primeiro rei de Israel?", opcoes: ["Davi", "Saul", "Salomão", "Samuel"], correta: 1, explicacao: "Saul foi ungido por Samuel como primeiro rei (1Sm 10)." },
  { pergunta: "Quantos mandamentos Deus deu a Moisés?", opcoes: ["5", "7", "10", "12"], correta: 2, explicacao: "Os Dez Mandamentos foram dados no Monte Sinai (Ex 20)." },
  { pergunta: "Quem escreveu a maioria das cartas do NT?", opcoes: ["Pedro", "Paulo", "João", "Tiago"], correta: 1, explicacao: "São Paulo escreveu 13 cartas do Novo Testamento." },
  { pergunta: "Qual a última palavra de Jesus na cruz segundo João?", opcoes: ["Eli, Eli", "Está consumado", "Pai, perdoa-lhes", "Tenho sede"], correta: 1, explicacao: "\"Está consumado\" (Jo 19,30)." },
  // Liturgia
  { pergunta: "Qual cor litúrgica é usada no Advento e na Quaresma?", opcoes: ["Branco", "Verde", "Roxo", "Vermelho"], correta: 2, explicacao: "O roxo simboliza penitência, preparação e conversão." },
  { pergunta: "Quantos tempos litúrgicos existem na Igreja Católica?", opcoes: ["4", "5", "6", "7"], correta: 2, explicacao: "Advento, Natal, Quaresma, Tríduo Pascal, Tempo Pascal e Tempo Comum." },
  { pergunta: "Qual cor litúrgica é usada em Pentecostes?", opcoes: ["Branco", "Verde", "Roxo", "Vermelho"], correta: 3, explicacao: "O vermelho representa o fogo do Espírito Santo e o martírio." },
  { pergunta: "Quando começa o Ano Litúrgico?", opcoes: ["1º de janeiro", "Domingo de Ramos", "1º Domingo do Advento", "Sábado Santo"], correta: 2, explicacao: "O Ano Litúrgico inicia no 1º Domingo do Advento." },
  { pergunta: "O que celebramos na Solenidade de Corpus Christi?", opcoes: ["A Paixão de Cristo", "O Corpo e Sangue de Cristo", "A Ascensão", "Pentecostes"], correta: 1, explicacao: "Corpus Christi celebra a presença real de Jesus na Eucaristia." },
  { pergunta: "Qual parte da Missa inclui o 'Santo, Santo, Santo'?", opcoes: ["Rito Inicial", "Liturgia da Palavra", "Liturgia Eucarística", "Rito Final"], correta: 2, explicacao: "O Sanctus faz parte da Oração Eucarística na Liturgia Eucarística." },
  { pergunta: "O que é o Tríduo Pascal?", opcoes: ["Os 3 dias antes da Quaresma", "Quinta, Sexta e Sábado Santos", "Os 3 primeiros dias da Páscoa", "Natal, Ano Novo e Epifania"], correta: 1, explicacao: "O Tríduo Pascal vai da Missa da Ceia do Senhor até a Vigília Pascal." },
  { pergunta: "Qual cor litúrgica é usada no Tempo Comum?", opcoes: ["Branco", "Verde", "Roxo", "Vermelho"], correta: 1, explicacao: "O verde simboliza a esperança e o crescimento na fé." },
  // Doutrina Social
  { pergunta: "Qual encíclica do Papa Leão XIII é marco da Doutrina Social?", opcoes: ["Laudato Si'", "Rerum Novarum", "Evangelii Gaudium", "Fratelli Tutti"], correta: 1, explicacao: "Rerum Novarum (1891) trata da condição dos operários e justiça social." },
  { pergunta: "Qual é o princípio central da Doutrina Social da Igreja?", opcoes: ["Lucro máximo", "Dignidade da pessoa humana", "Livre mercado", "Propriedade absoluta"], correta: 1, explicacao: "A dignidade da pessoa humana é o fundamento de toda a Doutrina Social." },
  { pergunta: "O que significa o princípio da subsidiariedade?", opcoes: ["O Estado faz tudo", "Comunidades maiores ajudam as menores quando necessário", "Cada um por si", "Abolição do Estado"], correta: 1, explicacao: "A subsidiariedade defende que decisões sejam tomadas no nível mais próximo das pessoas." },
  { pergunta: "Qual encíclica do Papa Francisco trata da ecologia integral?", opcoes: ["Fratelli Tutti", "Laudato Si'", "Lumen Fidei", "Amoris Laetitia"], correta: 1, explicacao: "Laudato Si' (2015) convoca ao cuidado da 'casa comum'." },
  { pergunta: "O que é a opção preferencial pelos pobres?", opcoes: ["Dar esmola", "Priorizar os mais vulneráveis nas ações da Igreja", "Voto de pobreza", "Socialismo"], correta: 1, explicacao: "É um princípio que orienta a Igreja a colocar os pobres no centro de sua ação pastoral." },
  // História da Igreja
  { pergunta: "Em que ano ocorreu o Concílio Vaticano II?", opcoes: ["1870", "1945", "1962-1965", "2000"], correta: 2, explicacao: "O Concílio Vaticano II (1962-1965) modernizou a liturgia e a relação da Igreja com o mundo." },
  { pergunta: "Quem convocou o Concílio Vaticano II?", opcoes: ["Papa Pio XII", "Papa João XXIII", "Papa Paulo VI", "Papa João Paulo II"], correta: 1, explicacao: "São João XXIII convocou o Concílio em 1959." },
  { pergunta: "Em que século surgiu o monaquismo cristão?", opcoes: ["Século I", "Século III-IV", "Século VIII", "Século XII"], correta: 1, explicacao: "O monaquismo surgiu nos séculos III-IV com os Padres do Deserto no Egito." },
  { pergunta: "Qual cidade foi sede do primeiro Concílio Ecumênico?", opcoes: ["Roma", "Jerusalém", "Niceia", "Constantinopla"], correta: 2, explicacao: "O Concílio de Niceia (325) definiu o Credo e combateu o arianismo." },
  { pergunta: "Quem foi o primeiro Papa não europeu em 1.300 anos?", opcoes: ["Bento XVI", "João Paulo I", "Francisco", "João Paulo II"], correta: 2, explicacao: "Papa Francisco, argentino, eleito em 2013." },
  { pergunta: "Qual santo fundou a Companhia de Jesus (Jesuítas)?", opcoes: ["São Francisco", "Santo Inácio de Loyola", "São Bento", "São Domingos"], correta: 1, explicacao: "Santo Inácio de Loyola fundou os Jesuítas em 1534." },
  { pergunta: "O que foi o Grande Cisma do Oriente (1054)?", opcoes: ["Divisão entre católicos e protestantes", "Separação entre Roma e Constantinopla", "Fim do Império Romano", "Início das Cruzadas"], correta: 1, explicacao: "O Cisma separou a Igreja Católica Romana da Igreja Ortodoxa Oriental." },
  { pergunta: "Qual é o documento mais importante do Vaticano II sobre a liturgia?", opcoes: ["Gaudium et Spes", "Sacrosanctum Concilium", "Lumen Gentium", "Dei Verbum"], correta: 1, explicacao: "Sacrosanctum Concilium reformou a liturgia, permitindo a missa em línguas vernáculas." },
];

export default function QuizBiblico() {
  const navigate = useNavigate();
  const [perguntaIdx, setPerguntaIdx] = useState(0);
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [acertos, setAcertos] = useState(0);
  const [respondidas, setRespondidas] = useState(0);
  const [finalizado, setFinalizado] = useState(false);
  const [shuffled] = useState(() => [...perguntas].sort(() => Math.random() - 0.5).slice(0, 15));

  const atual = shuffled[perguntaIdx];
  const respondeu = selecionada !== null;

  const responder = (idx: number) => {
    if (respondeu) return;
    setSelecionada(idx);
    setRespondidas((p) => p + 1);
    if (idx === atual.correta) setAcertos((p) => p + 1);
  };

  const proxima = () => {
    if (perguntaIdx + 1 >= shuffled.length) {
      setFinalizado(true);
    } else {
      setPerguntaIdx((p) => p + 1);
      setSelecionada(null);
    }
  };

  const reiniciar = () => {
    setPerguntaIdx(0);
    setSelecionada(null);
    setAcertos(0);
    setRespondidas(0);
    setFinalizado(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 animate-fade-in">
        <button onClick={() => navigate("/jogos")} className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1">Quiz Bíblico</h1>
        <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
          {perguntaIdx + 1}/{shuffled.length}
        </span>
      </div>

      {finalizado ? (
        <div className="float-card p-8 text-center space-y-4 animate-float-up">
          <Trophy className="h-16 w-16 mx-auto text-gold" />
          <h2 className="text-2xl font-black text-foreground">Resultado</h2>
          <p className="text-4xl font-black text-primary">{acertos}/{respondidas}</p>
          <p className="text-sm text-muted-foreground">
            {acertos === respondidas ? "Parabéns! Acertou tudo! 🎉" : acertos >= respondidas * 0.7 ? "Muito bom! Continue estudando! 📖" : "Continue praticando! A Bíblia tem muito a ensinar! ✝️"}
          </p>
          <Button onClick={reiniciar} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Jogar Novamente
          </Button>
        </div>
      ) : (
        <>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${((perguntaIdx + 1) / shuffled.length) * 100}%` }} />
          </div>

          <div className="float-card p-5 space-y-5 animate-float-up">
            <h2 className="text-base font-bold text-foreground leading-relaxed">{atual.pergunta}</h2>

            <div className="space-y-2.5">
              {atual.opcoes.map((opcao, i) => {
                let cls = "w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all text-sm font-medium ";
                if (!respondeu) {
                  cls += "border-border hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]";
                } else if (i === atual.correta) {
                  cls += "border-success bg-success/10 text-success";
                } else if (i === selecionada) {
                  cls += "border-destructive bg-destructive/10 text-destructive";
                } else {
                  cls += "border-border opacity-50";
                }

                return (
                  <button key={i} onClick={() => responder(i)} className={cls}>
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{opcao}</span>
                      {respondeu && i === atual.correta && <CheckCircle2 className="h-5 w-5 text-success shrink-0" />}
                      {respondeu && i === selecionada && i !== atual.correta && <XCircle className="h-5 w-5 text-destructive shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {respondeu && (
              <div className="p-3 rounded-xl bg-muted/50 animate-fade-in">
                <p className="text-xs text-muted-foreground leading-relaxed">{atual.explicacao}</p>
              </div>
            )}

            {respondeu && (
              <Button onClick={proxima} className="w-full">
                {perguntaIdx + 1 >= shuffled.length ? "Ver Resultado" : "Próxima Pergunta"}
              </Button>
            )}
          </div>

          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <span className="text-success font-bold">✓ {acertos}</span>
            <span className="text-destructive font-bold">✗ {respondidas - acertos}</span>
          </div>
        </>
      )}
    </div>
  );
}
