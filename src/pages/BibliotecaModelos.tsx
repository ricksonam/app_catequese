import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MODELOS_ENCONTROS, CATEGORIAS_MODELOS, type ModeloEncontro } from "@/lib/modelosEncontros";
import { type Encontro } from "@/lib/store";
import { upsertEncontro } from "@/lib/supabaseStore";
import { ArrowLeft, BookOpen, Clock, ChevronRight, Search, Check, Library, Crown } from "lucide-react";
import { toast } from "sonner";

export default function BibliotecaModelos() {
  const navigate = useNavigate();
  const { id: turmaId } = useParams();
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [expandido, setExpandido] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const modelosFiltrados = MODELOS_ENCONTROS.filter((m) => {
    const matchCategoria = !categoriaAtiva || m.categoria === categoriaAtiva;
    const matchBusca = !busca || m.tema.toLowerCase().includes(busca.toLowerCase()) || m.leituraBiblica.toLowerCase().includes(busca.toLowerCase());
    return matchCategoria && matchBusca;
  });

  const usarModelo = async (modelo: ModeloEncontro) => {
    if (!turmaId) { toast.error("Selecione uma turma primeiro."); return; }
    setSalvando(true);
    try {
      const novoEncontro: Encontro = {
        id: crypto.randomUUID(), turmaId, tema: modelo.tema,
        data: new Date().toISOString().split("T")[0], leituraBiblica: modelo.leituraBiblica,
        materialApoio: modelo.materialApoio,
        roteiro: modelo.roteiro.map((s) => ({ ...s, id: crypto.randomUUID() })),
        status: "pendente", presencas: [], criadoEm: new Date().toISOString(),
      };
      await upsertEncontro(novoEncontro);
      toast.success("Modelo aplicado! Encontro criado.");
      navigate(`/turmas/${turmaId}/encontros/${novoEncontro.id}`);
    } catch (err) {
      toast.error("Erro ao salvar o modelo. Tente novamente.");
      console.error("[BibliotecaModelos] Erro ao criar encontro:", err);
    } finally {
      setSalvando(false);
    }
  };

  const tempoTotal = (modelo: ModeloEncontro) => modelo.roteiro.reduce((acc, s) => acc + s.tempo, 0);
  const backPath = turmaId ? `/turmas/${turmaId}/encontros` : "/modulos";

  return (
    <div className="space-y-5">
      <div className="page-header animate-fade-in">
        <button onClick={() => navigate(backPath)} className="back-btn"><ArrowLeft className="h-5 w-5 text-black" /></button>
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            Biblioteca de Encontros
            <span className="flex items-center gap-1 text-[10px] font-black bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-0.5 rounded-full shadow-sm">
              <Crown className="w-3 h-3" />
              PREMIUM
            </span>
          </h1>
          <p className="text-xs text-muted-foreground">{MODELOS_ENCONTROS.length} modelos disponíveis</p>
        </div>
      </div>

      <div className="relative animate-float-up">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" placeholder="Buscar por tema ou leitura..." value={busca} onChange={(e) => setBusca(e.target.value)} className="form-input pl-10" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide animate-float-up" style={{ animationDelay: '60ms' }}>
        <button onClick={() => setCategoriaAtiva(null)} className={`shrink-0 pill-btn ${!categoriaAtiva ? "pill-btn-active" : "pill-btn-inactive"}`}>Todos</button>
        {CATEGORIAS_MODELOS.map((cat) => (
          <button key={cat} onClick={() => setCategoriaAtiva(cat === categoriaAtiva ? null : cat)} className={`shrink-0 pill-btn ${categoriaAtiva === cat ? "pill-btn-active" : "pill-btn-inactive"}`}>{cat}</button>
        ))}
      </div>

      {modelosFiltrados.length === 0 ? (
        <div className="empty-state animate-float-up" style={{ animationDelay: '120ms' }}>
          <div className="icon-box bg-success/10 text-success mx-auto mb-3"><Library className="h-6 w-6" /></div>
          <p className="text-sm font-medium text-muted-foreground">Nenhum modelo encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {modelosFiltrados.map((modelo, i) => (
            <div key={modelo.id} className="float-card overflow-hidden animate-float-up" style={{ animationDelay: `${(i + 2) * 40}ms` }}>
              <button onClick={() => setExpandido(expandido === modelo.id ? null : modelo.id)} className="w-full px-4 py-3.5 text-left flex items-center gap-3">
                <div className="icon-box bg-primary/10"><BookOpen className="h-5 w-5 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{modelo.tema}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{modelo.leituraBiblica.split(" - ")[0]}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="pill-btn bg-accent/15 text-accent-foreground">{modelo.categoria}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-3 w-3" /> {tempoTotal(modelo)}min</span>
                  </div>
                </div>
                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandido === modelo.id ? "rotate-90" : ""}`} />
              </button>

              {expandido === modelo.id && (
                <div className="px-4 pb-4 border-t border-border/30 pt-3 space-y-3">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Leitura Bíblica</p>
                    <p className="text-xs text-foreground mt-0.5">{modelo.leituraBiblica}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Material de Apoio</p>
                    <p className="text-xs text-foreground mt-0.5">{modelo.materialApoio}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Roteiro</p>
                    <div className="space-y-1">
                      {modelo.roteiro.map((s, si) => (
                        <div key={si} className="flex items-center gap-2 text-xs">
                          <span className="w-5 h-5 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">{si + 1}</span>
                          <span className="flex-1 text-foreground">{s.label}</span>
                          <span className="text-muted-foreground">{s.tempo}min</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {turmaId && (
                    <button
                      onClick={() => usarModelo(modelo)}
                      disabled={salvando}
                      className="w-full action-btn mt-2 disabled:opacity-60"
                    >
                      <Check className="h-4 w-4" />
                      {salvando ? "Salvando..." : "Usar este Modelo"}
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
