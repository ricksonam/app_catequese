import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Cross, Heart } from "lucide-react";
import { oracoesBase, categoriasOracao, CategoriaOracao } from "@/data/oracoes";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { PremiumPaywall } from "@/components/PremiumPaywall";

export default function OracoesList() {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaOracao | "Todas">("Todas");
  const { isPremium, isLoading } = usePremiumStatus();

  // Filtra as orações baseadas na busca e na categoria selecionada
  const oracoesFiltradas = oracoesBase.filter((oracao) => {
    const matchCategoria = categoriaAtiva === "Todas" || oracao.categoria === categoriaAtiva;
    const termo = busca.toLowerCase();
    const matchBusca = 
      oracao.titulo.toLowerCase().includes(termo) || 
      oracao.texto.toLowerCase().includes(termo) ||
      oracao.tags.some(tag => tag.toLowerCase().includes(termo));
      
    return matchCategoria && matchBusca;
  });

  if (isLoading) {
    return <div className="p-8 text-center animate-pulse text-muted-foreground">Verificando acesso...</div>;
  }

  if (!isPremium) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center min-h-[44px] relative pt-4">
          <button onClick={() => navigate(-1)} className="back-btn absolute left-0">
            <ArrowLeft className="h-5 w-5 text-black" />
          </button>
          <h1 className="text-xl font-black text-liturgical tracking-tight uppercase">
            Orações
          </h1>
        </div>
        <PremiumPaywall 
          title="Módulo de Orações Bloqueado" 
          description="Assine o Premium para acessar nossa biblioteca completa de orações, dinâmicas e roteiros para catequese."
          icon={<Heart className="h-10 w-10 text-primary" />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-center min-h-[44px] relative pt-4">
        <button onClick={() => navigate(-1)} className="back-btn absolute left-0">
          <ArrowLeft className="h-5 w-5 text-black" />
        </button>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-xl font-black text-liturgical tracking-tight uppercase">
            Orações
          </h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
            {oracoesFiltradas.length} orações
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <input
          type="text"
          placeholder="Pesquisar oração..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full h-14 pl-11 pr-4 rounded-2xl border border-black/10 bg-white dark:bg-zinc-900 shadow-sm focus:border-liturgical focus:ring-2 focus:ring-liturgical/20 outline-none transition-all text-sm font-medium"
        />
      </div>

      {/* Categorias (Pills) */}
      <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        <button
          onClick={() => setCategoriaAtiva("Todas")}
          className={`shrink-0 h-9 px-4 rounded-full text-xs font-bold transition-all border ${
            categoriaAtiva === "Todas" 
              ? "bg-liturgical text-white border-liturgical shadow-md" 
              : "bg-white text-muted-foreground border-black/10 hover:bg-zinc-50"
          }`}
        >
          Todas
        </button>
        {categoriasOracao.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoriaAtiva(cat)}
            className={`shrink-0 h-9 px-4 rounded-full text-xs font-bold transition-all border ${
              categoriaAtiva === cat 
                ? "bg-liturgical text-white border-liturgical shadow-md" 
                : "bg-white text-muted-foreground border-black/10 hover:bg-zinc-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {oracoesFiltradas.length === 0 ? (
          <div className="col-span-full py-10 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-black/5 flex items-center justify-center mb-3">
              <Search className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-bold text-foreground">Nenhuma oração encontrada</p>
            <p className="text-xs text-muted-foreground mt-1">Tente pesquisar por outro termo ou mude a categoria.</p>
          </div>
        ) : (
          oracoesFiltradas.map((oracao, index) => (
            <button
              key={oracao.id}
              onClick={() => navigate(`/modulos/oracoes/${oracao.id}`)}
              className="text-left group animate-float-up bg-white dark:bg-zinc-900 border-2 border-liturgical/30 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-liturgical transition-all active:scale-[0.98]"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-liturgical/10 text-liturgical flex flex-col items-center justify-center shrink-0">
                  <span className="font-serif text-2xl font-bold leading-none">
                    {oracao.titulo.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-100 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                    {oracao.categoria}
                  </div>
                  <h3 className="text-base font-black text-foreground group-hover:text-liturgical transition-colors leading-tight mb-1">
                    {oracao.titulo}
                  </h3>
                  {oracao.descricao ? (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {oracao.descricao}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground line-clamp-2 font-serif italic">
                      "{oracao.texto.split('\n')[0]}..."
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
