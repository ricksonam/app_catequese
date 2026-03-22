import { ArrowLeft, BookOpen, Search, Copy, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

const LIVROS_BIBLIA = {
  "Antigo Testamento": {
    "Pentateuco": ["Gênesis", "Êxodo", "Levítico", "Números", "Deuteronômio"],
    "Históricos": ["Josué", "Juízes", "Rute", "1 Samuel", "2 Samuel", "1 Reis", "2 Reis", "1 Crônicas", "2 Crônicas", "Esdras", "Neemias", "Tobias", "Judite", "Ester", "1 Macabeus", "2 Macabeus"],
    "Sapienciais": ["Jó", "Salmos", "Provérbios", "Eclesiastes", "Cântico dos Cânticos", "Sabedoria", "Eclesiástico"],
    "Proféticos": ["Isaías", "Jeremias", "Lamentações", "Baruc", "Ezequiel", "Daniel", "Oseias", "Joel", "Amós", "Abdias", "Jonas", "Miqueias", "Naum", "Habacuc", "Sofonias", "Ageu", "Zacarias", "Malaquias"],
  },
  "Novo Testamento": {
    "Evangelhos": ["Mateus", "Marcos", "Lucas", "João"],
    "Histórico": ["Atos dos Apóstolos"],
    "Cartas Paulinas": ["Romanos", "1 Coríntios", "2 Coríntios", "Gálatas", "Efésios", "Filipenses", "Colossenses", "1 Tessalonicenses", "2 Tessalonicenses", "1 Timóteo", "2 Timóteo", "Tito", "Filêmon", "Hebreus"],
    "Cartas Católicas": ["Tiago", "1 Pedro", "2 Pedro", "1 João", "2 João", "3 João", "Judas"],
    "Profético": ["Apocalipse"],
  },
};

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

export default function BibliaPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [tab, setTab] = useState<"livros" | "passagens">("passagens");

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const filteredPassagens = search
    ? PASSAGENS_POPULARES.filter(
        (p) =>
          p.ref.toLowerCase().includes(search.toLowerCase()) ||
          p.texto.toLowerCase().includes(search.toLowerCase())
      )
    : PASSAGENS_POPULARES;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Bíblia</h1>
          <p className="text-xs text-muted-foreground">Consulte passagens bíblicas</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar passagem..."
          className="w-full bg-muted rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab("passagens")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === "passagens" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          Passagens
        </button>
        <button
          onClick={() => setTab("livros")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === "livros" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          Livros
        </button>
      </div>

      {tab === "passagens" ? (
        <div className="space-y-2">
          {filteredPassagens.length === 0 ? (
            <div className="ios-card p-6 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma passagem encontrada</p>
            </div>
          ) : (
            filteredPassagens.map((p, i) => (
              <div key={i} className="ios-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-primary mb-1">{p.ref}</p>
                    <p className="text-sm text-foreground leading-relaxed">{p.texto}</p>
                  </div>
                  <button onClick={() => copyText(`${p.ref} - ${p.texto}`)} className="p-2 rounded-lg hover:bg-muted shrink-0">
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(LIVROS_BIBLIA).map(([testamento, categorias]) => (
            <div key={testamento}>
              <p className="ios-section-title">{testamento}</p>
              <div className="ios-card overflow-hidden">
                {Object.entries(categorias).map(([cat, livros], ci) => {
                  const key = `${testamento}-${cat}`;
                  const isOpen = expandedSection === key;
                  return (
                    <div key={cat} className={ci > 0 ? "border-t border-border/50" : ""}>
                      <button
                        onClick={() => setExpandedSection(isOpen ? null : key)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left"
                      >
                        <span className="text-sm font-medium text-foreground">{cat}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{livros.length}</span>
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </div>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                          {livros.map((l) => (
                            <span key={l} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-lg font-medium">
                              {l}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
