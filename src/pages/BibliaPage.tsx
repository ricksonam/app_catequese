import { ArrowLeft, Search, Copy, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

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

const fetchBiblia = async (): Promise<BibliaData> => {
  const response = await fetch('/biblia_ave_maria.json');
  if (!response.ok) throw new Error("Erro ao carregar a Bíblia");
  return response.json();
};

export default function BibliaPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tab, setTab] = useState<"passagens" | "livros">("livros");
  
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const { data: biblia, isLoading } = useQuery({
    queryKey: ["biblia_ave_maria"],
    queryFn: fetchBiblia,
    staleTime: Infinity,
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const copyText = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copiado!"); };

  const searchResults = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return { passagens: PASSAGENS_POPULARES, full: [], livros: [] };

    // Busca por Livros
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
                if (count > 50) return; // Limitar para não travar a tela
              }
            }
          }
        }
      }
      searchInTestament(biblia.antigoTestamento);
      if (count <= 50) searchInTestament(biblia.novoTestamento);
    }

    return { passagens: passagensMatches, full: fullMatches, livros: libroMatches };
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

  const renderLivros = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Carregando Bíblia Sagrada...</p>
        </div>
      );
    }

    if (!biblia) {
      return (
        <div className="empty-state">
          <p className="text-sm text-muted-foreground">Não foi possível carregar a Bíblia.</p>
        </div>
      );
    }

    if (selectedChapter && selectedBook) {
      return (
        <div className="space-y-4 animate-fade-in">
          {renderBreadcrumbs()}
          <div className="float-card p-4 space-y-4">
            <h2 className="text-lg font-bold text-center text-primary border-b border-border pb-3">
              {selectedBook.nome} {selectedChapter.capitulo}
            </h2>
            <div className="space-y-3">
              {selectedChapter.versiculos.map((v) => (
                <div key={v.versiculo} className="flex gap-3 group relative pl-2 hover:bg-muted/50 rounded-lg p-2 transition-colors">
                  <span className="text-xs font-bold text-primary/70 shrink-0 mt-0.5 w-5 text-right">{v.versiculo}</span>
                  <p className="text-sm text-foreground leading-relaxed flex-1">{v.texto}</p>
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
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
            {selectedBook.capitulos.map((c) => (
              <button
                key={c.capitulo}
                onClick={() => setSelectedChapter(c)}
                className="aspect-square flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-border/50 hover:border-primary hover:text-primary transition-all text-sm font-bold shadow-sm"
              >
                {c.capitulo}
              </button>
            ))}
          </div>
        </div>
      );
    }

    const testamentos = [
      { titulo: "Antigo Testamento", livros: biblia.antigoTestamento },
      { titulo: "Novo Testamento", livros: biblia.novoTestamento }
    ];

    return (
      <div className="space-y-4 animate-fade-in">
        {testamentos.map((t) => {
          const isOpen = expandedSection === t.titulo;
          return (
            <div key={t.titulo} className="float-card overflow-hidden">
              <button onClick={() => setExpandedSection(isOpen ? null : t.titulo)} className="w-full flex items-center justify-between px-4 py-4 text-left">
                <span className="font-bold text-foreground">{t.titulo}</span>
                <div className="flex items-center gap-2">
                  <span className="pill-btn pill-btn-inactive text-[10px]">{t.livros.length} livros</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isOpen && (
                <div className="px-3 pb-3 pt-1 border-t border-border/50 bg-muted/20">
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    {t.livros.map((l) => (
                      <button
                        key={l.nome}
                        onClick={() => setSelectedBook(l)}
                        className="text-left px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors truncate"
                      >
                        {l.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

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
          <h1 className="text-xl font-bold text-foreground">Bíblia Online</h1>
          <p className="text-xs text-muted-foreground">Tradução Ave Maria</p>
        </div>
      </div>

      <div className="flex justify-center gap-2 animate-float-up" style={{ animationDelay: '40ms' }}>
        <button 
          onClick={() => { setTab("livros"); setSearch(""); }} 
          className={cn(
            "px-8 py-2.5 rounded-xl text-sm font-bold transition-all border-2",
            tab === "livros" ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-white text-muted-foreground border-border/50"
          )}
        >
          Livros
        </button>
        <button 
          onClick={() => setTab("passagens")} 
          className={cn(
            "px-8 py-2.5 rounded-xl text-sm font-bold transition-all border-2",
            tab === "passagens" ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-white text-muted-foreground border-border/50"
          )}
        >
          Passagens
        </button>
      </div>

      {tab === "passagens" && (
        <div className="relative animate-float-up" style={{ animationDelay: '80ms' }}>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Buscar por livro, nome ou passagem..." 
            className="form-input pl-10 h-12 shadow-sm" 
          />
          {search && isLoading && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>
      )}

      {tab === "passagens" && search ? (
        <div className="space-y-4 animate-fade-in">
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
                        <p className="text-sm text-foreground leading-relaxed">{p.texto}</p>
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
                        <p className="text-sm text-foreground leading-relaxed">
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
                  <p className="text-sm text-foreground leading-relaxed">{p.texto}</p>
                </div>
                <button onClick={() => copyText(`${p.ref} - ${p.texto}`)} className="back-btn shrink-0">
                  <Copy className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        renderLivros()
      )}
    </div>
  );
}
