import { ArrowLeft, FolderOpen, Download, Eye, FileText, Image, Loader2, Sparkles, Search, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PremiumGate } from "@/components/PremiumGate";
import { cn } from "@/lib/utils";

interface MaterialCatalogo {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: string | null;
  arquivo_url: string | null;
  arquivo_tipo: string | null; // 'pdf' | 'image' | 'link'
  thumbnail_url: string | null;
  tamanho_bytes: number | null;
  publicado_em: string | null;
  ativo: boolean;
  url: string | null; // legacy link field
}

function isNovo(publicadoEm: string | null): boolean {
  if (!publicadoEm) return false;
  const sete = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(publicadoEm).getTime() < sete;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function PdfIcon({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center rounded-xl overflow-hidden bg-gradient-to-br from-red-500 to-red-700", className)}>
      {/* Fundo decorativo */}
      <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.15) 8px)" }}
      />
      <div className="relative z-10 flex flex-col items-center justify-center gap-0.5">
        <FileText className="w-8 h-8 text-white drop-shadow-md" strokeWidth={1.5} />
        <span className="text-[9px] font-black text-white tracking-widest bg-red-900/40 px-1.5 py-0.5 rounded-sm">PDF</span>
      </div>
    </div>
  );
}

function ImageIcon({ src, className }: { src?: string | null; className?: string }) {
  const [err, setErr] = useState(false);
  if (src && !err) {
    return (
      <div className={cn("overflow-hidden rounded-xl", className)}>
        <img
          src={src}
          alt="Thumbnail"
          className="w-full h-full object-cover"
          onError={() => setErr(true)}
        />
      </div>
    );
  }
  return (
    <div className={cn("flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-700", className)}>
      <Image className="w-8 h-8 text-white drop-shadow-md" strokeWidth={1.5} />
    </div>
  );
}

function MaterialCard({ mat, index }: { mat: MaterialCatalogo; index: number }) {
  const novo = isNovo(mat.publicado_em);
  const isPdf = mat.arquivo_tipo === "pdf" || mat.arquivo_url?.toLowerCase().includes(".pdf");
  const isImage = mat.arquivo_tipo === "image" || ["jpg","jpeg","png","webp","gif"].some(ext => mat.arquivo_url?.toLowerCase().includes(`.${ext}`));
  const fileUrl = mat.arquivo_url || mat.url || null;

  return (
    <div
      className="group relative bg-card rounded-[24px] border border-border/60 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 overflow-hidden animate-float-up flex flex-col"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Thumbnail area */}
      <div className="relative w-full aspect-[4/3] bg-muted/50 overflow-hidden rounded-t-[22px]">
        {isPdf ? (
          <PdfIcon className="w-full h-full" />
        ) : isImage && mat.arquivo_url ? (
          <ImageIcon src={mat.arquivo_url} className="w-full h-full" />
        ) : mat.thumbnail_url ? (
          <ImageIcon src={mat.thumbnail_url} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
            <BookOpen className="w-10 h-10 text-primary/40" strokeWidth={1.5} />
          </div>
        )}

        {/* Badge NOVO */}
        {novo && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-lg shadow-amber-500/40 animate-pulse">
            <Sparkles className="w-2.5 h-2.5" />
            NOVO
          </div>
        )}

        {/* Overlay de ações ao hover */}
        {fileUrl && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center text-white hover:bg-white/40 transition-colors"
              title="Visualizar"
            >
              <Eye className="w-4 w-4" />
            </a>
            <a
              href={fileUrl}
              download
              className="w-10 h-10 rounded-full bg-primary/80 backdrop-blur-sm border border-primary/40 flex items-center justify-center text-white hover:bg-primary transition-colors"
              title="Baixar"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        {/* Categoria */}
        {mat.categoria && (
          <span className="self-start text-[9px] font-black uppercase tracking-widest text-primary/70 bg-primary/8 px-2 py-0.5 rounded-full border border-primary/15">
            {mat.categoria}
          </span>
        )}

        {/* Título */}
        <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">{mat.titulo}</h3>

        {/* Descrição */}
        {mat.descricao && (
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{mat.descricao}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-1">
          {mat.publicado_em && (
            <span className="text-[10px] text-muted-foreground/60 font-medium">
              {new Date(mat.publicado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
            </span>
          )}
          {mat.tamanho_bytes && (
            <span className="text-[10px] text-muted-foreground/60 font-medium">{formatBytes(mat.tamanho_bytes)}</span>
          )}
        </div>

        {/* Botões de ação */}
        {fileUrl ? (
          <div className="flex gap-2 mt-1">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-muted hover:bg-primary/10 text-foreground hover:text-primary text-[11px] font-bold transition-colors border border-border/50 hover:border-primary/20"
            >
              <Eye className="w-3.5 h-3.5" />
              Visualizar
            </a>
            <a
              href={fileUrl}
              download
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary text-primary-foreground text-[11px] font-bold transition-all hover:bg-primary/90 active:scale-95 shadow-sm shadow-primary/20"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar
            </a>
          </div>
        ) : (
          <div className="flex items-center justify-center py-2 rounded-xl bg-muted text-muted-foreground text-[11px] font-bold mt-1">
            Em breve
          </div>
        )}
      </div>
    </div>
  );
}

export default function MaterialApoio() {
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [materiais, setMateriais] = useState<MaterialCatalogo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMateriais() {
      try {
        const { data, error } = await supabase
          .from("material_apoio")
          .select("*")
          .eq("ativo", true)
          .order("publicado_em", { ascending: false });

        if (error) throw error;
        setMateriais((data as MaterialCatalogo[]) || []);

        // Marca como visto
        localStorage.setItem("ivc_materiais_ultimo_visto", new Date().toISOString());
      } catch (err) {
        console.error("Erro ao buscar materiais:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMateriais();
  }, []);

  const categorias = [...new Set(materiais.map((m) => m.categoria).filter(Boolean))] as string[];

  const filtered = materiais.filter((m) => {
    const matchCategoria = filtro === "Todos" || m.categoria === filtro;
    const matchBusca =
      busca.trim() === "" ||
      m.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      (m.descricao || "").toLowerCase().includes(busca.toLowerCase());
    return matchCategoria && matchBusca;
  });

  const totalNovos = materiais.filter((m) => isNovo(m.publicado_em)).length;

  return (
    <PremiumGate
      feature="Catálogo de Material de Apoio"
      description="Acesse nossa biblioteca de documentos, PDFs e recursos exclusivos para catequistas."
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 animate-fade-in">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">Catálogo de Materiais</h1>
              {totalNovos > 0 && (
                <span className="flex items-center gap-1 text-[9px] font-black bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                  <Sparkles className="w-2.5 h-2.5" />
                  {totalNovos} NOVO{totalNovos > 1 ? "S" : ""}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? "Carregando..." : `${materiais.length} material${materiais.length !== 1 ? "is" : ""} disponível${materiais.length !== 1 ? "is" : ""}`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Buscando materiais...</p>
          </div>
        ) : (
          <>
            {/* Busca */}
            <div className="relative animate-float-up">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome ou descrição..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-2xl border border-border/60 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>

            {/* Filtros de categoria */}
            {categorias.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide animate-float-up">
                {["Todos", ...categorias].map((c) => (
                  <button
                    key={c}
                    onClick={() => setFiltro(c)}
                    className={`shrink-0 pill-btn ${filtro === c ? "pill-btn-active" : "pill-btn-inactive"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {/* Grid de catálogo */}
            {filtered.length === 0 ? (
              <div className="empty-state animate-float-up">
                <div className="icon-box bg-primary/10 text-primary mx-auto mb-3">
                  <FolderOpen className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-muted-foreground">
                  {busca || filtro !== "Todos" ? "Nenhum resultado encontrado" : "Nenhum material disponível ainda"}
                </p>
                {(busca || filtro !== "Todos") && (
                  <button
                    onClick={() => { setBusca(""); setFiltro("Todos"); }}
                    className="mt-3 text-xs font-bold text-primary hover:underline"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 animate-fade-in">
                {filtered.map((mat, i) => (
                  <MaterialCard key={mat.id} mat={mat} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PremiumGate>
  );
}
