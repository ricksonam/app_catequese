import { ArrowLeft, Search, Copy, ChevronDown, ChevronRight, Loader2, BookOpen as BookIcon, Calendar, Info, History } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useEncontros, useTurmas } from "@/hooks/useSupabaseData";
import { historiaBiblia, getLivroMetadata } from "@/data/bibliaStudyData";

interface Verse {
  versiculo: number | string;
  texto: string;
}

interface Chapter {
  capitulo: number;
  versiculos: Verse[];
}

interface Book {
  nome: string;
  capitulos: Chapter[];
}

interface BibliaData {
  antigoTestamento: Book[];
  novoTestamento: Book[];
}

interface VerseRange {
  start: number;
  end: number;
}

const TRADUCOES = [
  { id: "ave_maria", nome: "Ave Maria", file: "/biblia_ave_maria.json" },
];

const PASSAGENS_POPULARES = [
  { ref: "Jo 3,16", texto: "Porque Deus amou tanto o mundo, que entregou o seu Filho único, para que todo aquele que nele crê não morra, mas tenha a vida eterna." },
  { ref: "Sl 23,1-4", texto: "O Senhor é o meu pastor, nada me faltará. Em verdes pastagens me faz repousar e me conduz a águas tranquilas. Restaura as minhas forças e me guia por caminhos certos, por amor do seu nome." },
  { ref: "Mt 28,19-20", texto: "Ide, pois, e fazei discípulos de todas as nações, batizando-os em nome do Pai, do Filho e do Espírito Santo; ensinando-os a observar tudo o que vos mandei." },
  { ref: "Fl 4,13", texto: "Tudo posso naquele que me fortalece." },
  { ref: "Rm 8,28", texto: "Sabemos que todas as coisas concorrem para o bem daqueles que amam a Deus." },
  { ref: "Is 41,10", texto: "Não tenhas medo, porque eu estou contigo; não te assustes, porque eu sou o teu Deus. Eu te fortaleço e te ajudo." },
  { ref: "1 Cor 13,4-7", texto: "O amor é paciente, o amor é bondoso. Não tem inveja. O amor não é orgulhoso. Não é grosseiro. Não procura os seus próprios interesses, não se irrita, não guarda rancor." },
  { ref: "Mt 5,14-16", texto: "Vós sois a luz do mundo. Não se pode esconder uma cidade construída sobre um monte. Assim brilhe a vossa luz diante dos homens." },
  { ref: "Pv 3,5-6", texto: "Confia no Senhor de todo o teu coração e não te apoies na tua própria inteligência. Reconhece-o em todos os teus caminhos e ele endireitará as tuas veredas." },
  { ref: "Ef 6,10-11", texto: "Fortalecei-vos no Senhor e na força do seu poder. Revesti-vos da armadura de Deus, para que possais resistir às ciladas do diabo." },
];

const ABREVIACOES: Record<string, string> = {
  "gn": "Gênesis", "ex": "Êxodo", "lv": "Levítico", "nm": "Números", "dt": "Deuteronômio",
  "jos": "Josué", "jz": "Juízes", "rt": "Rute", "1sm": "I Samuel", "2sm": "II Samuel",
  "1rs": "I Reis", "2rs": "II Reis", "1cr": "I Crônicas", "2cr": "II Crônicas",
  "ed": "Esdras", "ne": "Neemias", "tb": "Tobias", "jdt": "Judite", "est": "Ester",
  "1mc": "I Macabeus", "2mc": "II Macabeus", "jó": "Jó", "sl": "Salmos", "pv": "Provérbios",
  "ec": "Eclesiastes", "ct": "Cântico dos Cânticos", "sb": "Sabedoria", "eclo": "Eclesiástico",
  "is": "Isaías", "jr": "Jeremias", "lm": "Lamentações", "br": "Baruc", "ez": "Ezequiel",
  "dn": "Daniel", "os": "Oseias", "jl": "Joel", "am": "Amós", "abd": "Abdias",
  "jn": "Jonas", "mq": "Miqueias", "na": "Naum", "hab": "Habacuc", "so": "Sofonias",
  "ag": "Ageu", "zc": "Zacarias", "ml": "Malaquias",
  "mt": "Mateus", "mc": "Marcos", "lc": "Lucas", "jo": "João", "at": "Atos dos Apóstolos",
  "rm": "Romanos", "1cor": "I Coríntios", "2cor": "II Coríntios", "gl": "Gálatas",
  "ef": "Efésios", "fl": "Filipenses", "cl": "Colossenses", "1ts": "I Tessalonicenses",
  "2ts": "II Tessalonicenses", "1tim": "I Timóteo", "2tim": "II Timóteo", "tt": "Tito",
  "flm": "Filemon", "hb": "Hebreus", "tg": "Tiago", "1pe": "I Pedro", "2pe": "II Pedro",
  "1jo": "I João", "2jo": "II João", "3jo": "III João", "jd": "Judas", "ap": "Apocalipse"
};

const AT_GROUPS: Record<string, string[]> = {
  "Pentateuco": ["Gênesis", "Êxodo", "Levítico", "Números", "Deuteronômio"],
  "Históricos": ["Josué", "Juízes", "Rute", "I Samuel", "II Samuel", "I Reis", "II Reis", "I Crônicas", "II Crônicas", "Esdras", "Neemias", "Tobias", "Judite", "Ester", "I Macabeus", "II Macabeus"],
  "Sapienciais": ["Jó", "Salmos", "Provérbios", "Eclesiastes", "Cântico dos Cânticos", "Sabedoria", "Eclesiástico"],
  "Profetas": ["Isaías", "Jeremias", "Lamentações", "Baruc", "Ezequiel", "Daniel", "Oseias", "Joel", "Amós", "Abdias", "Jonas", "Miqueias", "Naum", "Habacuc", "Sofonias", "Ageu", "Zacarias", "Malaquias"]
};

const NT_GROUPS: Record<string, string[]> = {
  "Evangelhos": ["Mateus", "Marcos", "Lucas", "João"],
  "Atos": ["Atos dos Apóstolos"],
  "Cartas Paulinas": ["Romanos", "I Coríntios", "II Coríntios", "Gálatas", "Efésios", "Filipenses", "Colossenses", "I Tessalonicenses", "II Tessalonicenses", "I Timóteo", "II Timóteo", "Tito", "Filemon"],
  "Cartas Católicas": ["Hebreus", "Tiago", "I Pedro", "II Pedro", "I João", "II João", "III João", "Judas"],
  "Apocalipse": ["Apocalipse"]
};

const MESES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const fetchBiblia = async (translationFile: string): Promise<BibliaData> => {
  const response = await fetch(translationFile);
  if (!response.ok) throw new Error("FILE_NOT_FOUND");
  return response.json();
};

export default function BibliaPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRef = searchParams.get("ref");
  
  const [search, setSearch] = useState(initialRef || "");
  const [tab, setTab] = useState<"livros" | "estudo">("livros");
  
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  // Intervalo de versículos da citação (ex: v. 26 a 38)
  const [verseRange, setVerseRange] = useState<VerseRange | null>(null);
  const [readingMenuOpen, setReadingMenuOpen] = useState(false);
  const [showMetadataInfo, setShowMetadataInfo] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [translationId, setTranslationId] = useState("ave_maria");

  const selectedTranslation = TRADUCOES.find(t => t.id === translationId) || TRADUCOES[0];

  const selectedTurmaId = localStorage.getItem("ivc_selected_turma") || "all";
  const { data: encontros } = useEncontros(selectedTurmaId === "all" ? undefined : selectedTurmaId);

  const encontrosComLeitura = useMemo(() => {
    if (!encontros) return [];
    return encontros
      .filter(e => e.leituraBiblica && e.leituraBiblica.trim() !== "")
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }, [encontros]);

  // Agrupar encontros por mês
  const encontrosPorMes = useMemo(() => {
    const grupos: Record<string, typeof encontrosComLeitura> = {};
    encontrosComLeitura.forEach(e => {
      const d = new Date(e.data + (e.data.includes("T") ? "" : "T12:00:00"));
      const chave = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      if (!grupos[chave]) grupos[chave] = [];
      grupos[chave].push(e);
    });
    return grupos;
  }, [encontrosComLeitura]);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const proximoEncontro = useMemo(() => {
    return encontrosComLeitura.find(e => new Date(e.data) >= hoje);
  }, [encontrosComLeitura]);

  const { data: biblia, isLoading, isError, error } = useQuery({
    queryKey: ["biblia", translationId],
    queryFn: () => fetchBiblia(selectedTranslation.file),
    staleTime: Infinity,
    retry: false,
  });

  /**
   * Resolve uma referência bíblica como "Lc 1,26-38" ou "Jo 3,16" para
   * livro + capítulo + intervalo de versículos.
   */
  const resolveReference = (ref: string) => {
    if (!biblia) return null;
    const allBooks = [...biblia.antigoTestamento, ...biblia.novoTestamento];
    
    const cleanRef = ref
      .replace(/^(evangelho|leitura|salmo|epístola|atos|profeta|primeira leitura|segunda leitura|1ª leitura|2ª leitura)[:\s-]*/i, '')
      .trim();

    // Captura: Livro Capítulo[,: VersiculoInicio[-VersiculoFim]]
    const match = cleanRef.match(
      /^((?:\d\s*|I+\s*)?[a-zA-Záéíóúâêîôûãõç.]+)\s+(\d+)(?:[,:\s]\s*(\d+)(?:\s*[-–]\s*(\d+))?)?/i
    );
    if (!match) return null;
    
    const [, bookName, chapterNum, verseStart, verseEnd] = match;
    const searchKey = bookName.toLowerCase().replace(/\./g, '').trim();

    const resolvedBookName = ABREVIACOES[searchKey] || searchKey;
    const cleanSearchKey = resolvedBookName.toLowerCase().replace(/^(são|santo)\s+/i, '').trim();

    const book = allBooks.find(b => {
      const bNomeRaw = b.nome.toLowerCase();
      const bNomeClean = bNomeRaw.replace(/^(são|santo)\s+/i, '').trim();
      
      if (bNomeClean === cleanSearchKey) return true;
      if (bNomeRaw === resolvedBookName.toLowerCase()) return true;
      if (bNomeClean.startsWith(searchKey) && searchKey.length >= 3) return true;
      if (searchKey === "jo" && bNomeClean === "joão") return true;
      if (searchKey === "jos" && bNomeClean === "josué") return true;
      return false;
    });
    
    if (!book) return null;
    const chapter = book.capitulos.find(c => c.capitulo === parseInt(chapterNum));
    if (!chapter) return { book };
    
    // Determinar intervalo de versículos
    let range: VerseRange | null = null;
    if (verseStart) {
      const start = parseInt(verseStart);
      const end = verseEnd ? parseInt(verseEnd) : start;
      range = { start, end };
    }

    return { book, chapter, range };
  };

  const autoOpenReference = (ref: string) => {
    const resolved = resolveReference(ref);
    if (resolved && resolved.book) {
      setSelectedBook(resolved.book);
      setShowMetadataInfo(true);
      if (resolved.chapter) {
        setSelectedChapter(resolved.chapter);
        setVerseRange(resolved.range ?? null);
        setTab("livros");
        setSearch("");
        toast.success(`Leitura encontrada: ${ref}`);
      } else {
        toast.warning(`Livro encontrado, mas capítulo não disponível.`);
        setSearch(ref);
        setTab("livros");
      }
    } else {
      toast.error(`Não conseguimos localizar "${ref}" automaticamente.`);
      setSearch(ref);
      setTab("livros");
    }
  };

  const copyText = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copiado!"); };

  const renderBreadcrumbs = () => {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4 overflow-x-auto whitespace-nowrap pb-1">
        <button onClick={() => { setSelectedBook(null); setSelectedChapter(null); setVerseRange(null); }} className="hover:text-primary transition-colors font-medium">
          Livros
        </button>
        {selectedBook && (
          <>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <button onClick={() => { setSelectedChapter(null); setVerseRange(null); }} className={`transition-colors truncate max-w-[120px] ${!selectedChapter ? 'text-primary font-bold' : 'hover:text-primary font-medium'}`}>
              {selectedBook.nome}
            </button>
          </>
        )}
        {selectedChapter && (
          <>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-primary font-bold">
              Cap. {selectedChapter.capitulo}
              {verseRange && ` · v.${verseRange.start}${verseRange.end !== verseRange.start ? `–${verseRange.end}` : ''}`}
            </span>
          </>
        )}
      </div>
    );
  };

  const renderBookMetadata = () => {
    if (!selectedBook) return null;
    const meta = getLivroMetadata(selectedBook.nome);
    
    return (
      <div className="mb-4">
        <button 
          onClick={() => setShowMetadataInfo(!showMetadataInfo)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20 text-primary hover:bg-primary/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span className="text-sm font-bold">Introdução ao Livro</span>
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform", showMetadataInfo ? "rotate-180" : "")} />
        </button>
        
        {showMetadataInfo && (
          <div className="mt-2 p-4 float-card liturgical-border bg-liturgical-paper animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-liturgical font-bold text-foreground mb-3 border-b pb-2">{selectedBook.nome}</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-bold text-primary">Autor/Tradição:</span>
                <p className="text-foreground/80">{meta.autor}</p>
              </div>
              <div>
                <span className="font-bold text-primary">Época:</span>
                <p className="text-foreground/80">{meta.epoca}</p>
              </div>
              <div>
                <span className="font-bold text-primary">Tema Central:</span>
                <p className="text-foreground/80">{meta.temaCentral}</p>
              </div>
              <div className="mt-4 p-3 bg-white dark:bg-black/20 rounded-lg border border-primary/10">
                <span className="text-xs font-black uppercase text-primary mb-1 block tracking-wider">💡 Dica para a Catequese</span>
                <p className="italic text-foreground/90">{meta.dicaCatequese}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLivros = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Abrindo a Bíblia Sagrada...</p>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="empty-state border-2 border-dashed border-primary/30 bg-primary/5">
          <BookIcon className="h-10 w-10 text-primary/40 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-primary mb-2">Tradução Indisponível</h3>
          <p className="text-sm text-foreground/70 mb-4">
            O arquivo desta tradução ({selectedTranslation.nome}) não foi encontrado no sistema no momento.
          </p>
          <button 
            onClick={() => setTranslationId("ave_maria")}
            className="action-btn-sm mx-auto"
          >
            Retornar para a Ave Maria
          </button>
        </div>
      );
    }

    if (!biblia) return null;

    if (selectedChapter && selectedBook) {
      // Filtrar versículos pelo intervalo da citação (se houver)
      const versiculosExibidos = verseRange
        ? selectedChapter.versiculos.filter(v => {
            const num = parseInt(String(v.versiculo));
            return num >= verseRange.start && num <= verseRange.end;
          })
        : selectedChapter.versiculos;

      return (
        <div className="space-y-4 animate-fade-in">
          {renderBreadcrumbs()}
          {renderBookMetadata()}

          {/* Banner quando há filtro de versículos */}
          {verseRange && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
                <BookIcon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-primary uppercase tracking-wide">Leitura da Citação</p>
                <p className="text-[11px] text-muted-foreground">
                  Mostrando versículos {verseRange.start}
                  {verseRange.end !== verseRange.start ? ` ao ${verseRange.end}` : ""} de {selectedChapter.versiculos.length} total
                </p>
              </div>
              <button
                onClick={() => setVerseRange(null)}
                className="text-[10px] font-black text-primary/60 hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/10 border border-primary/20 whitespace-nowrap"
              >
                Ver capítulo completo
              </button>
            </div>
          )}

          <div className="float-card liturgical-border bg-liturgical-paper p-5 md:p-8 space-y-6 shadow-xl">
            <h2 className="text-2xl font-liturgical font-bold text-center text-foreground border-b border-border/50 pb-4">
              {selectedBook.nome} {selectedChapter.capitulo}
              {verseRange && (
                <span className="text-lg text-primary ml-2">
                  v.{verseRange.start}{verseRange.end !== verseRange.start ? `–${verseRange.end}` : ""}
                </span>
              )}
            </h2>
            <div className="space-y-4 font-liturgical">
              {versiculosExibidos.map((v) => (
                <div key={v.versiculo} className="flex gap-3 group relative pl-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg p-2 transition-colors">
                  <span className="text-xs font-bold text-liturgical-gold shrink-0 mt-1 w-5 text-right">{v.versiculo}</span>
                  <p className="text-base text-foreground leading-relaxed flex-1">{v.texto}</p>
                  <button 
                    onClick={() => copyText(`${selectedBook.nome} ${selectedChapter.capitulo}, ${v.versiculo} - ${v.texto}`)} 
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-background rounded-md absolute right-1 top-1 shadow-sm border border-border"
                  >
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (selectedBook) {
      return (
        <div className="space-y-4 animate-fade-in">
          {renderBreadcrumbs()}
          {renderBookMetadata()}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {selectedBook.capitulos.map((c) => (
              <button
                key={c.capitulo}
                onClick={() => { setSelectedChapter(c); setVerseRange(null); }}
                className="aspect-auto px-2 py-3 flex flex-col items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-border/50 hover:border-primary hover:bg-primary/5 transition-all shadow-sm group"
              >
                <span className="text-[9px] sm:text-[10px] font-normal uppercase opacity-60 mb-0.5 group-hover:text-primary transition-colors">Capítulo</span>
                <span className="text-lg font-bold group-hover:text-primary transition-colors">{c.capitulo}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    const testamentos = [
      { 
        titulo: "Antigo Testamento", 
        livros: biblia.antigoTestamento, 
        gradient: "from-blue-600 to-indigo-600",
        icon: "📜" 
      },
      { 
        titulo: "Novo Testamento", 
        livros: biblia.novoTestamento, 
        gradient: "from-rose-600 to-orange-600",
        icon: "✝️"
      }
    ];

    return (
      <div className="space-y-8 animate-fade-in pb-8">
        {testamentos.map((t) => {
          return (
            <div key={`${t.titulo}-books`} className="animate-in fade-in slide-in-from-top-4 duration-300 mb-2">
              <div className="p-4 float-card liturgical-border bg-liturgical-paper">
                <h3 className="text-xl font-liturgical font-bold text-foreground mb-4 flex items-center gap-2 border-b border-border/50 pb-3">
                  <span>{t.icon}</span> {t.titulo}
                </h3>

                {/* Filtros de Coleção */}
                <div className="flex gap-2 overflow-x-auto pb-3 mb-2 premium-scrollbar no-scrollbar">
                  <button
                    onClick={() => setActiveGroup(null)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                      !activeGroup ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary/30"
                    )}
                  >
                    Todos
                  </button>
                  {Object.keys(t.titulo === "Antigo Testamento" ? AT_GROUPS : NT_GROUPS).map((group) => (
                    <button
                      key={group}
                      onClick={() => setActiveGroup(activeGroup === group ? null : group)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                        activeGroup === group ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary/30"
                      )}
                    >
                      {group}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {t.livros
                    .filter(l => {
                      if (!activeGroup) return true;
                      const groupList = t.titulo === "Antigo Testamento" ? AT_GROUPS[activeGroup] : NT_GROUPS[activeGroup];
                      if (!groupList) return false;
                      
                      const normalizeName = (name: string) => {
                         return name.toLowerCase()
                                    .replace(/^(são|santo)\s+/i, '')
                                    .replace(/^(i|ii|iii)\s+(são|santo)\s+/i, '$1 ')
                                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                                    .trim();
                      };
                      
                      const normalizedLNome = normalizeName(l.nome);
                      return groupList.some(gn => normalizeName(gn) === normalizedLNome);
                    })
                    .map((l) => (
                      <button
                        key={l.nome}
                        onClick={() => { setSelectedBook(l); setShowMetadataInfo(false); }}
                        className="text-left px-3 py-3 rounded-lg text-sm font-medium bg-white dark:bg-zinc-900 border border-border/50 hover:border-primary/50 hover:shadow-md transition-all truncate group"
                      >
                        <span className="group-hover:text-primary transition-colors">{l.nome}</span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderEstudo = () => (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="float-card liturgical-border bg-liturgical-paper p-6 md:p-8 text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2 border-2 border-primary/20">
          <History className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-liturgical font-bold text-foreground">{historiaBiblia.titulo}</h2>
        <p className="text-sm text-foreground/80 font-liturgical leading-relaxed max-w-2xl mx-auto">
          {historiaBiblia.introducao}
        </p>
      </div>

      <div className="space-y-4">
        {historiaBiblia.topicos.map((topico, i) => (
          <div key={i} className="float-card p-5 border-l-4 border-l-primary hover:-translate-y-1 transition-transform">
            <h3 className="text-lg font-bold text-primary mb-2 font-liturgical">{topico.titulo}</h3>
            <p className="text-sm text-foreground/90 leading-relaxed font-liturgical">
              {topico.conteudo}
            </p>
          </div>
        ))}
      </div>
      
      <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 text-center">
        <p className="text-sm italic font-liturgical text-foreground/80">
          "A ignorância das Escrituras é a ignorância de Cristo." <br />
          <span className="font-bold text-primary not-italic text-xs mt-1 block">- São Jerônimo</span>
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 pb-20">
      <div className="page-header animate-fade-in">
        <button onClick={() => {
          if (selectedChapter) { setSelectedChapter(null); setVerseRange(null); }
          else if (selectedBook) setSelectedBook(null);
          else navigate(-1);
        }} className="back-btn">
          <ArrowLeft className="h-5 w-5 text-black" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground font-liturgical">Bíblia Online</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">Estudo e Leitura</p>
        </div>
      </div>

      {/* ── NAVEGAÇÃO POR TABS ── */}
      <div className="flex gap-1.5 animate-float-up bg-muted/30 p-1.5 rounded-2xl" style={{ animationDelay: '40ms' }}>
        <button 
          onClick={() => { setTab("livros"); setSearch(""); }} 
          className={cn(
            "flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all",
            tab === "livros" ? "bg-white dark:bg-zinc-800 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Leitura
        </button>
        <button 
          onClick={() => setTab("estudo")} 
          className={cn(
            "flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5",
            tab === "estudo" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BookIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">História &</span> Estudo
        </button>
      </div>

      {tab === "estudo" && renderEstudo()}

      {tab === "livros" && !selectedBook && (
        <div className="animate-float-up flex justify-end" style={{ animationDelay: '50ms' }}>
          <div className="relative inline-block w-full sm:w-auto">
            <select
              value={translationId}
              onChange={(e) => setTranslationId(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-white dark:bg-zinc-900 border border-border rounded-xl pl-4 pr-10 py-2.5 text-sm font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-all cursor-pointer"
            >
              {TRADUCOES.map(t => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none" />
          </div>
        </div>
      )}

      {/* ── SEÇÃO: LEITURA BÍBLICA DOS ENCONTROS ── */}
      {tab !== "estudo" && encontrosComLeitura.length > 0 && !selectedBook && (
        <div className="animate-float-up relative z-50" style={{ animationDelay: '60ms' }}>
          <div className="relative">
            <button
              onClick={() => setReadingMenuOpen(!readingMenuOpen)}
              className="w-full float-card p-4 flex items-center justify-between border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h2 className="text-sm font-black uppercase tracking-tight text-primary">Leitura Bíblica dos Encontros</h2>
                  <p className="text-[10px] text-muted-foreground font-medium">Toque para escolher o encontro</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                  {encontrosComLeitura.length}
                </span>
                <ChevronDown className={cn("h-5 w-5 text-primary transition-transform duration-300", readingMenuOpen ? "rotate-180" : "")} />
              </div>
            </button>

            {readingMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 z-[100] animate-in fade-in zoom-in-95 duration-200">
                <div className="float-card border-2 border-primary/10 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden rounded-[24px]">
                  <div className="p-3 max-h-[420px] overflow-y-auto premium-scrollbar space-y-4">
                    {Object.entries(encontrosPorMes).map(([chave, itens]) => {
                      const [ano, mesIdx] = chave.split("-").map(Number);
                      const nomeMes = MESES_PT[mesIdx];
                      return (
                        <div key={chave}>
                          {/* Cabeçalho do mês */}
                          <div className="flex items-center gap-2 px-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                              {nomeMes} {ano}
                            </span>
                            <div className="flex-1 h-px bg-primary/10" />
                          </div>

                          {/* Cards dos encontros do mês */}
                          <div className="space-y-1.5">
                            {itens.map((e) => {
                              const isProximo = e.id === proximoEncontro?.id;
                              const d = new Date(e.data + (e.data.includes("T") ? "" : "T12:00:00"));
                              const diaStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
                              const diaSemana = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");

                              return (
                                <button
                                  key={e.id}
                                  onClick={() => {
                                    autoOpenReference(e.leituraBiblica!);
                                    setReadingMenuOpen(false);
                                  }}
                                  className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left group active:scale-[0.98] border",
                                    isProximo
                                      ? "bg-primary/5 border-primary/20 shadow-sm"
                                      : "hover:bg-muted/50 border-transparent hover:border-muted"
                                  )}
                                >
                                  {/* Data */}
                                  <div className={cn(
                                    "w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border",
                                    isProximo
                                      ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                                      : "bg-muted text-muted-foreground border-muted"
                                  )}>
                                    <span className="text-[8px] font-black uppercase leading-none mb-0.5 opacity-80">{diaSemana}</span>
                                    <span className="text-base font-black leading-none">{d.getDate()}</span>
                                    <span className="text-[8px] font-black uppercase leading-none mt-0.5 opacity-80">
                                      {d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                                    </span>
                                  </div>

                                  {/* Tema e citação */}
                                  <div className="flex-1 min-w-0">
                                    <p className={cn(
                                      "text-sm font-black leading-tight truncate mb-1",
                                      isProximo ? "text-primary" : "text-foreground"
                                    )}>
                                      {e.tema}
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                      <span className={cn(
                                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border",
                                        isProximo
                                          ? "bg-primary/10 text-primary border-primary/20"
                                          : "bg-muted text-muted-foreground border-muted"
                                      )}>
                                        <BookIcon className="h-2.5 w-2.5" />
                                        {e.leituraBiblica}
                                      </span>
                                      {isProximo && (
                                        <span className="text-[9px] font-black text-primary/60 uppercase tracking-wide">Próximo</span>
                                      )}
                                    </div>
                                  </div>

                                  <ChevronRight className="h-4 w-4 text-primary opacity-30 group-hover:opacity-100 transition-opacity shrink-0" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "livros" ? renderLivros() : null}
    </div>
  );
}
