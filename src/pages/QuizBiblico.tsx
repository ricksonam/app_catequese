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
];

export default function QuizBiblico() {
  const navigate = useNavigate();
  const [perguntaIdx, setPerguntaIdx] = useState(0);
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [acertos, setAcertos] = useState(0);
  const [respondidas, setRespondidas] = useState(0);
  const [finalizado, setFinalizado] = useState(false);
  const [shuffled] = useState(() => [...perguntas].sort(() => Math.random() - 0.5).slice(0, 10));

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
          {/* Progress */}
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
