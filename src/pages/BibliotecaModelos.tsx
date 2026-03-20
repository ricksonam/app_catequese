import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MODELOS_ENCONTROS, CATEGORIAS_MODELOS, type ModeloEncontro } from "@/lib/modelosEncontros";
import { saveEncontro, type Encontro } from "@/lib/store";
import { ArrowLeft, BookOpen, Clock, ChevronRight, Search, Check, Library } from "lucide-react";
import { toast } from "sonner";

export default function BibliotecaModelos() {
  const navigate = useNavigate();
  const { id: turmaId } = useParams();
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [expandido, setExpandido] = useState<string | null>(null);

  const modelosFiltrados = MODELOS_ENCONTROS.filter((m) => {
    const matchCategoria = !categoriaAtiva || m.categoria === categoriaAtiva;
    const matchBusca = !busca || m.tema.toLowerCase().includes(busca.toLowerCase()) || m.leituraBiblica.toLowerCase().includes(busca.toLowerCase());
    return matchCategoria && matchBusca;
  });

  const usarModelo = (modelo: ModeloEncontro) => {
    if (!turmaId) {
      toast.error("Selecione uma turma primeiro.");
      return;
    }
    const novoEncontro: Encontro = {
      id: crypto.randomUUID(),
      turmaId,
      tema: modelo.tema,
      data: new Date().toISOString().split("T")[0],
      leituraBiblica: modelo.leituraBiblica,
      materialApoio: modelo.materialApoio,
      roteiro: modelo.roteiro.map((s) => ({ ...s, id: crypto.randomUUID() })),
      status: "pendente",
      presencas: [],
      criadoEm: new Date().toISOString(),
    };
    saveEncontro(novoEncontro);
    toast.success("Modelo aplicado! Encontro criado.");
    navigate(`/turmas/${turmaId}/encontros/${novoEncontro.id}`);
  };

  const tempoTotal = (modelo: ModeloEncontro) =>
    modelo.roteiro.reduce((acc, s) => acc + s.tempo, 0);

  const backPath = turmaId ? `/turmas/${turmaId}/encontros` : "/modulos";

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(backPath)} className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Biblioteca de Modelos</h1>
          <p className="text-xs text-muted-foreground">{MODELOS_ENCONTROS.length} modelos disponíveis</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por tema ou leitura..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setCategoriaAtiva(null)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !categoriaAtiva ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          Todos
        </button>
        {CATEGORIAS_MODELOS.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoriaAtiva(cat === categoriaAtiva ? null : cat)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              categoriaAtiva === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Models list */}
      {modelosFiltrados.length === 0 ? (
        <div className="ios-card p-8 text-center">
          <Library className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum modelo encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {modelosFiltrados.map((modelo) => (
            <div key={modelo.id} className="ios-card overflow-hidden">
              <button
                onClick={() => setExpandido(expandido === modelo.id ? null : modelo.id)}
                className="w-full px-4 py-3 text-left flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{modelo.tema}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{modelo.leituraBiblica.split(" - ")[0]}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground">{modelo.categoria}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="h-3 w-3" /> {tempoTotal(modelo)}min
                    </span>
                  </div>
                </div>
                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandido === modelo.id ? "rotate-90" : ""}`} />
              </button>

              {expandido === modelo.id && (
                <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Leitura Bíblica</p>
                    <p className="text-xs text-foreground mt-0.5">{modelo.leituraBiblica}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Material de Apoio</p>
                    <p className="text-xs text-foreground mt-0.5">{modelo.materialApoio}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Roteiro</p>
                    <div className="space-y-1">
                      {modelo.roteiro.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                          <span className="flex-1 text-foreground">{s.label}</span>
                          <span className="text-muted-foreground">{s.tempo}min</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {turmaId && (
                    <button
                      onClick={() => usarModelo(modelo)}
                      className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold mt-2"
                    >
                      <Check className="h-4 w-4" /> Usar este Modelo
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
