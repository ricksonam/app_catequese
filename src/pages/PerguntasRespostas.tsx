import { useState } from "react";
import { ArrowLeft, RotateCcw, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface PerguntaResp {
  categoria: string;
  pergunta: string;
  resposta: string;
}

const banco: PerguntaResp[] = [
  { categoria: "Antigo Testamento", pergunta: "Quem foi o primeiro homem criado por Deus?", resposta: "Adão (Gn 2,7)" },
  { categoria: "Antigo Testamento", pergunta: "Quantos filhos Jacó teve?", resposta: "12 filhos, que deram origem às 12 tribos de Israel" },
  { categoria: "Antigo Testamento", pergunta: "Qual era a profissão de Amós?", resposta: "Boiadeiro e cultivador de sicômoros (Am 7,14)" },
  { categoria: "Antigo Testamento", pergunta: "Quem foi jogado na cova dos leões?", resposta: "Daniel (Dn 6)" },
  { categoria: "Antigo Testamento", pergunta: "Qual o menor livro do Antigo Testamento?", resposta: "Abdias, com apenas 1 capítulo" },
  { categoria: "Novo Testamento", pergunta: "Quantos evangelhos existem?", resposta: "Quatro: Mateus, Marcos, Lucas e João" },
  { categoria: "Novo Testamento", pergunta: "Quem era o publicano que subiu na árvore?", resposta: "Zaqueu (Lc 19,1-10)" },
  { categoria: "Novo Testamento", pergunta: "Qual o primeiro milagre de Jesus?", resposta: "Transformar água em vinho nas bodas de Caná (Jo 2,1-11)" },
  { categoria: "Novo Testamento", pergunta: "Quantas bem-aventuranças Jesus proclamou?", resposta: "Oito (Mt 5,3-12)" },
  { categoria: "Novo Testamento", pergunta: "Quem traiu Jesus?", resposta: "Judas Iscariotes, por 30 moedas de prata (Mt 26,14-16)" },
  { categoria: "Sacramentos", pergunta: "Quantos sacramentos a Igreja Católica reconhece?", resposta: "Sete: Batismo, Confirmação, Eucaristia, Penitência, Unção dos Enfermos, Ordem e Matrimônio" },
  { categoria: "Sacramentos", pergunta: "Qual sacramento Jesus instituiu na Última Ceia?", resposta: "A Eucaristia (Lc 22,19-20)" },
  { categoria: "Sacramentos", pergunta: "O que é a Crisma?", resposta: "É o sacramento da Confirmação, que fortalece os dons do Espírito Santo recebidos no Batismo" },
  { categoria: "Igreja", pergunta: "Quem é considerado o primeiro Papa?", resposta: "São Pedro (Mt 16,18)" },
  { categoria: "Igreja", pergunta: "O que significa a palavra 'católica'?", resposta: "Universal – do grego 'katholikós'" },
  { categoria: "Igreja", pergunta: "Quais são os tempos litúrgicos?", resposta: "Advento, Natal, Quaresma, Tríduo Pascal, Tempo Pascal e Tempo Comum" },
  { categoria: "Santos", pergunta: "Quem é o padroeiro da ecologia?", resposta: "São Francisco de Assis" },
  { categoria: "Santos", pergunta: "Qual santa é padroeira das causas impossíveis?", resposta: "Santa Rita de Cássia" },
  { categoria: "Santos", pergunta: "Quem é a padroeira do Brasil?", resposta: "Nossa Senhora Aparecida" },
  { categoria: "Santos", pergunta: "Qual santo foi o primeiro mártir cristão?", resposta: "Santo Estêvão (At 7,54-60)" },
];

const categorias = [...new Set(banco.map((p) => p.categoria))];

export default function PerguntasRespostas() {
  const navigate = useNavigate();
  const [catFiltro, setCatFiltro] = useState<string>("todas");
  const [modo, setModo] = useState<"lista" | "jogo">("lista");
  const [abertas, setAbertas] = useState<Set<number>>(new Set());

  // Jogo mode
  const [jogoPergIdx, setJogoPergIdx] = useState(0);
  const [mostrarResposta, setMostrarResposta] = useState(false);
  const [pontuacao, setPontuacao] = useState({ acertou: 0, errou: 0 });
  const [jogoFinalizado, setJogoFinalizado] = useState(false);
  const [jogoPerguntas] = useState(() => {
    const filtered = catFiltro === "todas" ? banco : banco.filter((p) => p.categoria === catFiltro);
    return [...filtered].sort(() => Math.random() - 0.5).slice(0, 10);
  });

  const filtradas = catFiltro === "todas" ? banco : banco.filter((p) => p.categoria === catFiltro);

  const toggleAberta = (idx: number) => {
    const next = new Set(abertas);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setAbertas(next);
  };

  const iniciarJogo = () => {
    setModo("jogo");
    setJogoPergIdx(0);
    setMostrarResposta(false);
    setPontuacao({ acertou: 0, errou: 0 });
    setJogoFinalizado(false);
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
    <div className="space-y-5">
      <div className="flex items-center gap-3 animate-fade-in">
        <button onClick={() => navigate("/jogos")} className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1">Perguntas e Respostas</h1>
      </div>

      {/* Filtro e modo */}
      {modo === "lista" && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setCatFiltro("todas")}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${catFiltro === "todas" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              Todas
            </button>
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCatFiltro(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${catFiltro === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <Button onClick={iniciarJogo} className="w-full gap-2">
            🎮 Jogar com Perguntas
          </Button>

          <div className="space-y-2">
            {filtradas.map((p, i) => (
              <button
                key={i}
                onClick={() => toggleAberta(i)}
                className="w-full float-card p-4 text-left animate-float-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wide">{p.categoria}</span>
                    <p className="text-sm font-medium text-foreground mt-0.5">{p.pergunta}</p>
                    {abertas.has(i) && (
                      <p className="text-sm text-success mt-2 font-medium animate-fade-in">📖 {p.resposta}</p>
                    )}
                  </div>
                  {abertas.has(i) ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {modo === "jogo" && !jogoFinalizado && (
        <>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-success rounded-full transition-all duration-500" style={{ width: `${((jogoPergIdx + 1) / jogoPerguntas.length) * 100}%` }} />
          </div>

          <div className="float-card p-6 space-y-5 animate-float-up">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wide">{jogoPerguntas[jogoPergIdx].categoria}</span>
            <h2 className="text-lg font-bold text-foreground">{jogoPerguntas[jogoPergIdx].pergunta}</h2>

            {!mostrarResposta ? (
              <Button onClick={() => setMostrarResposta(true)} variant="outline" className="w-full gap-2">
                👀 Revelar Resposta
              </Button>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 rounded-xl bg-success/10 border border-success/30">
                  <p className="text-sm font-medium text-foreground">📖 {jogoPerguntas[jogoPergIdx].resposta}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => marcar(true)} className="flex-1 bg-success hover:bg-success/90 text-white">
                    ✓ Acertou
                  </Button>
                  <Button onClick={() => marcar(false)} variant="destructive" className="flex-1">
                    ✗ Errou
                  </Button>
                </div>
              </div>
            )}

            <p className="text-xs text-center text-muted-foreground">{jogoPergIdx + 1}/{jogoPerguntas.length}</p>
          </div>
        </>
      )}

      {modo === "jogo" && jogoFinalizado && (
        <div className="float-card p-8 text-center space-y-4 animate-float-up">
          <Trophy className="h-16 w-16 mx-auto text-gold" />
          <h2 className="text-2xl font-black text-foreground">Resultado</h2>
          <div className="flex justify-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-black text-success">{pontuacao.acertou}</p>
              <p className="text-xs text-muted-foreground">Acertos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-destructive">{pontuacao.errou}</p>
              <p className="text-xs text-muted-foreground">Erros</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={iniciarJogo} className="flex-1 gap-2"><RotateCcw className="h-4 w-4" /> Jogar Novamente</Button>
            <Button variant="outline" onClick={() => setModo("lista")} className="flex-1">Ver Lista</Button>
          </div>
        </div>
      )}
    </div>
  );
}
