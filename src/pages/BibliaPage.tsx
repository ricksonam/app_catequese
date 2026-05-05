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

const TRADUCOES = [
  { id: "ave_maria", nome: "Ave Maria", file: "/biblia_ave_maria.json" },
  { id: "cnbb", nome: "CNBB (Nova)", file: "/biblia_cnbb.json" },
  { id: "jerusalem", nome: "Jerusalém", file: "/biblia_jerusalem.json" },
  { id: "pastoral", nome: "Ed. Pastoral", file: "/biblia_pastoral.json" },
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
  const [debouncedSearch, setDebouncedSearch] = useState(initialRef || "");
  const [tab, setTab] = useState<"livros" | "passagens" | "estudo">(initialRef ? "passagens" : "livros");
  const [translationId, setTranslationId] = useState("ave_maria");
  
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [readingMenuOpen, setReadingMenuOpen] = useState(false);
  const [showMetadataInfo, setShowMetadataInfo] = useState(false);

  const selectedTranslation = TRADUCOES.find(t => t.id === translationId) || TRADUCOES[0];

  const selectedTurmaId = localStorage.getItem("ivc_selected_turma") || "all";
  const { data: encontros } = useEncontros(selectedTurmaId === "all" ? undefined : selectedTurmaId);

  const encontrosComLeitura = useMemo(() => {
    if (!encontros) return [];
    return encontros
      .filter(e => e.leituraBiblica && e.leituraBiblica.trim() !== "")
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }, [encontros]);

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

  const resolveReference = (ref: string) => {
    if (!biblia) return null;
    const allBooks = [...biblia.antigoTestamento, ...biblia.novoTestamento];
    
    const cleanRef = ref
      .replace(/^(evangelho|leitura|salmo|epístola|atos|profeta|primeira leitura|segunda leitura|1ª leitura|2ª leitura)[:\s-]*/i, '')
      .trim();

    const match = cleanRef.match(/^((?:\d\s*|I+\s*)?[a-zA-Záéíóúâêîôûãõç.]+)\s+(\d+)(?:[,:]\s*(\d+))?/i);
    if (!match) return null;
    
    const [, bookName, chapterNum, verseNum] = match;
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
    
    const verse = verseNum ? chapter.versiculos.find(v => String(v.versiculo) === verseNum) : null;
    return { book, chapter, verse };
  };

  const autoOpenReference = (ref: string) => {
    const resolved = resolveReference(ref);
    if (resolved && resolved.book) {
      setSelectedBook(resolved.book);
      setShowMetadataInfo(true);
      if (resolved.chapter) {
        setSelectedChapter(resolved.chapter);
        setTab("livros");
        setSearch("");
        toast.success(`Leitura encontrada: ${ref}`);
      } else {
        toast.warning(`Livro encontrado, mas capítulo não disponível.`);
        setSearch(ref);
        setTab("passagens");
      }
    } else {
      toast.error(`Não conseguimos localizar "${ref}" automaticamente. Tente buscar pelo texto.`);
      setSearch(ref);
      setTab("passagens");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const copyText = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copiado!"); };

  const searchResults = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return { passagens: PASSAGENS_POPULARES, full: [], livros: [], directMatch: null };

    const directMatch = resolveReference(debouncedSearch.trim());

    const libroMatches: Book[] = [];
    if (biblia) {
      const allBooks = [...biblia.antigoTestamento, ...biblia.novoTestamento];
      allBooks.forEach(b => {
        if (b.nome.toLowerCase().includes(term)) {
          libroMatches.push(b);
        }
      });
    }

    const passagensMatches = PASSAGENS_POPULARES.filter((p) => 
      p.ref.toLowerCase().includes(term) || p.texto.toLowerCase().includes(term)
    );

    const fullMatches: { ref: string; texto: string }[] = [];
    if (biblia) {
      let count = 0;
      const searchInTestament = (testament: Book[]) => {
        for (const book of testament) {
          for (const chapter of book.capitulos) {
            for (const verse of chapter.versiculos) {
              if (verse.texto.toLowerCase().includes(term)) {
                fullMatches.push({
                  ref: `${book.nome} ${chapter.capitulo}, ${verse.versiculo}`,
                  texto: verse.texto
                });
                count++;
                if (count > 50) return;
              }
            }
          }
        }
      }
      searchInTestament(biblia.antigoTestamento);
      if (count <= 50) searchInTestament(biblia.novoTestamento);
    }

    return { passagens: passagensMatches, full: fullMatches, livros: libroMatches, directMatch };
  }, [debouncedSearch, biblia]);

  const renderBreadcrumbs = () => {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4 overflow-x-auto whitespace-nowrap pb-1">
        <button onClick={() => { setSelectedBook(null); setSelectedChapter(null); }} className="hover:text-primary transition-colors font-medium">
          Livros
        </button>
        {selectedBook && (
          <>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <button onClick={() => setSelectedChapter(null)} className={`transition-colors truncate max-w-[120px] ${!selectedChapter ? 'text-primary font-bold' : 'hover:text-primary font-medium'}`}>
              {selectedBook.nome}
            </button>
          </>
        )}
        {selectedChapter && (
          <>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-primary font-bold">Cap. {selectedChapter.capitulo}</span>
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
      return (
        <div className="space-y-4 animate-fade-in">
          {renderBreadcrumbs()}
          {renderBookMetadata()}
          <div className="float-card liturgical-border bg-liturgical-paper p-5 md:p-8 space-y-6 shadow-xl">
            <h2 className="text-2xl font-liturgical font-bold text-center text-foreground border-b border-border/50 pb-4">
              {selectedBook.nome} {selectedChapter.capitulo}
            </h2>
            <div className="space-y-4 font-liturgical">
              {selectedChapter.versiculos.map((v) => (
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
                onClick={() => setSelectedChapter(c)}
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
      <div className="space-y-4 animate-fade-in">
        <div className="grid grid-cols-2 gap-3">
          {testamentos.map((t) => {
            const isOpen = expandedSection === t.titulo;
            return (
              <button 
                key={t.titulo}
                onClick={() => setExpandedSection(isOpen ? null : t.titulo)} 
                className={cn(
                  "p-4 rounded-2xl flex flex-col items-center justify-center text-center transition-all border-2",
                  isOpen ? "border-primary shadow-md scale-[0.98]" : "border-transparent shadow-sm hover:-translate-y-1",
                  `bg-gradient-to-br ${t.gradient}`
                )}
              >
                <span className="text-2xl mb-1">{t.icon}</span>
                <span className="font-liturgical font-bold text-white text-sm sm:text-base leading-tight mb-1">{t.titulo}</span>
                <span className="text-[10px] uppercase font-bold text-white/80 bg-black/20 px-2 py-0.5 rounded-full">{t.livros.length} livros</span>
              </button>
            )
          })}
        </div>

        {testamentos.map((t) => {
          if (expandedSection !== t.titulo) return null;
          return (
            <div key={`${t.titulo}-books`} className="animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="p-4 float-card liturgical-border bg-liturgical-paper">
                <h3 className="text-lg font-liturgical font-bold text-foreground mb-3 flex items-center gap-2">
                  <span>{t.icon}</span> {t.titulo}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {t.livros.map((l) => (
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
          if (selectedChapter) setSelectedChapter(null);
          else if (selectedBook) setSelectedBook(null);
          else navigate(-1);
        }} className="back-btn">
          <ArrowLeft className="h-5 w-5 text-foreground" />
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
          onClick={() => setTab("passagens")} 
          className={cn(
            "flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all",
            tab === "passagens" ? "bg-white dark:bg-zinc-800 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Busca
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

      {/* ── SEÇÃO: LEITURAS DO ENCONTRO (LISTA SUSPENSA INTELIGENTE) ── */}
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
                  <h2 className="text-sm font-black uppercase tracking-tight text-primary">Agenda de Leituras</h2>
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
                  <div className="p-2 max-h-[300px] overflow-y-auto premium-scrollbar space-y-1">
                    {encontrosComLeitura.map((e) => {
                      const isProximo = e.id === proximoEncontro?.id;
                      return (
                         <button
                          key={e.id}
                          onClick={() => {
                            autoOpenReference(e.leituraBiblica!);
                            setReadingMenuOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group active:scale-[0.98]",
                            isProximo ? "bg-primary/5 border border-primary/10" : "hover:bg-muted/50"
                          )}
                        >
                          <div className={cn(
                            "w-9 h-9 rounded-lg flex flex-col items-center justify-center shrink-0 border",
                            isProximo ? "bg-primary text-white border-primary" : "bg-muted text-muted-foreground border-transparent"
                          )}>
                            <span className="text-[7px] font-black uppercase leading-none mb-0.5">
                              {new Date(e.data).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                            </span>
                            <span className="text-xs font-black leading-none">
                              {new Date(e.data).getDate()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-xs font-black truncate", isProximo ? "text-primary" : "text-foreground")}>
                              {e.leituraBiblica}
                            </p>
                            <p className="text-[9px] text-muted-foreground truncate opacity-70">
                              {e.tema}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-primary opacity-30 group-hover:opacity-100 transition-opacity" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "passagens" && (
        <div className="relative animate-float-up" style={{ animationDelay: '80ms' }}>
          {!search && <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30" />}
          <input 
            type="text" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Buscar por referência (Ex: Lucas 24, 35) ou texto" 
            className={cn(
              "form-input h-14 shadow-md border-2 focus:border-primary/50 transition-all text-sm sm:text-base font-medium",
              search ? "pl-5" : "pl-12"
            )}
          />
          {search && isLoading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40 animate-spin" />
          )}
        </div>
      )}

      {tab === "passagens" && search ? (
        <div className="space-y-4 animate-fade-in">
          {searchResults.directMatch && (
            <div className="animate-float-up">
              <p className="section-title mb-2 text-primary">Resultado Encontrado</p>
              <button 
                onClick={() => {
                  setSelectedBook(searchResults.directMatch.book);
                  if (searchResults.directMatch.chapter) {
                    setSelectedChapter(searchResults.directMatch.chapter);
                  }
                  setTab("livros");
                  setSearch("");
                }}
                className="w-full float-card p-4 flex items-center justify-between border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                    <BookIcon className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-lg font-black text-foreground">
                      {searchResults.directMatch.book.nome} {searchResults.directMatch.chapter?.capitulo || ""}
                    </h4>
                    <p className="text-xs text-muted-foreground font-medium">Toque para ler o capítulo</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
              </button>
              
              {searchResults.directMatch.verse && (
                <div className="mt-2 float-card p-4 border-l-4 border-l-primary bg-white shadow-sm font-liturgical">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1.5 font-sans">
                    Versículo {searchResults.directMatch.verse.versiculo}
                  </p>
                  <p className="text-sm text-foreground leading-relaxed italic">
                    "{searchResults.directMatch.verse.texto}"
                  </p>
                </div>
              )}
            </div>
          )}

          {searchResults.livros.length > 0 && (
            <div>
              <p className="section-title mb-2">Livros Encontrados</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {searchResults.livros.map((l) => (
                  <button
                    key={l.nome}
                    onClick={() => { setSelectedBook(l); setTab("livros"); setSearch(""); }}
                    className="float-card p-3 text-sm font-bold text-left hover:bg-primary/10 transition-colors flex items-center justify-between group"
                  >
                    <span className="group-hover:text-primary transition-colors">{l.nome}</span>
                    <ChevronRight className="h-4 w-4 text-primary" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchResults.passagens.length > 0 && (
            <div>
              <p className="section-title mb-2">Passagens Populares</p>
              <div className="space-y-2">
                {searchResults.passagens.map((p, i) => (
                  <div key={i} className="float-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-bold text-primary mb-1.5">{p.ref}</p>
                        <p className="text-sm text-foreground leading-relaxed font-liturgical">{p.texto}</p>
                      </div>
                      <button onClick={() => copyText(`${p.ref} - ${p.texto}`)} className="back-btn shrink-0">
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {debouncedSearch && searchResults.full.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <p className="section-title !mb-0">Resultados na Bíblia</p>
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {searchResults.full.length >= 50 ? 'Mais de 50' : searchResults.full.length}
                </span>
              </div>
              <div className="space-y-2">
                {searchResults.full.map((p, i) => (
                  <div key={i} className="float-card p-4 border-l-2 border-l-primary/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-bold text-primary mb-1.5">{p.ref}</p>
                        <p className="text-sm text-foreground leading-relaxed font-liturgical">
                          {p.texto.split(new RegExp(`(${debouncedSearch})`, 'gi')).map((part, index) => 
                            part.toLowerCase() === debouncedSearch.toLowerCase() ? (
                              <span key={index} className="bg-primary/20 font-semibold">{part}</span>
                            ) : (
                              <span key={index}>{part}</span>
                            )
                          )}
                        </p>
                      </div>
                      <button onClick={() => copyText(`${p.ref} - ${p.texto}`)} className="back-btn shrink-0">
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {debouncedSearch && searchResults.passagens.length === 0 && searchResults.full.length === 0 && searchResults.livros.length === 0 && (
            <div className="empty-state">
              <p className="text-sm text-muted-foreground">Nenhum resultado encontrado para "{debouncedSearch}"</p>
            </div>
          )}
        </div>
      ) : tab === "passagens" ? (
        <div className="space-y-2">
          {PASSAGENS_POPULARES.map((p, i) => (
            <div key={i} className="float-card p-4 animate-float-up" style={{ animationDelay: `${(i + 2) * 40}ms` }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs font-bold text-primary mb-1.5">{p.ref}</p>
                  <p className="text-sm text-foreground leading-relaxed font-liturgical">{p.texto}</p>
                </div>
                <button onClick={() => copyText(`${p.ref} - ${p.texto}`)} className="back-btn shrink-0">
                  <Copy className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : tab === "livros" ? (
        renderLivros()
      ) : null}
    </div>
  );
}
