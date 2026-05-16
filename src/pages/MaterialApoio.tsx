import { ArrowLeft, FileText, Link2, ExternalLink, FolderOpen, Download, BookOpen, Music, Flame, Cross, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PremiumGate } from "@/components/PremiumGate";

// Mapeamento de ícones do banco para componentes Lucide
const ICON_MAP: Record<string, any> = {
  BookOpen,
  Flame,
  Music,
  FileText,
  Cross
};

interface Material {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  tipo: "link";
  url: string;
  icone: string;
  cor: string;
}

export default function MaterialApoio() {
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState("Todos");
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMateriais() {
      try {
        const { data, error } = await supabase
          .from('material_apoio')
          .select('*')
          .order('ordem', { ascending: true });
        
        if (error) throw error;
        setMateriais(data || []);
      } catch (err) {
        console.error("Erro ao buscar materiais:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMateriais();
  }, []);

  const categorias = [...new Set(materiais.map((m) => m.categoria))];

  const filtered =
    filtro === "Todos"
      ? materiais
      : materiais.filter((m) => m.categoria === filtro);

  return (
    <PremiumGate feature="Material de Apoio" description="Acesse nossa biblioteca de materiais, documentos litúrgicos e recursos para catequistas.">
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 animate-fade-in">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Material de Apoio</h1>
          <p className="text-xs text-muted-foreground">
            {loading ? "Carregando..." : `${materiais.length} documentos disponíveis`}
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
          {/* Filtros de categoria */}
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

          {/* Lista de materiais */}
          {filtered.length === 0 ? (
            <div className="empty-state animate-float-up">
              <div className="icon-box bg-liturgical/10 text-liturgical mx-auto mb-3">
                <FolderOpen className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Nenhum material nesta categoria
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((mat, i) => {
                const Icon = ICON_MAP[mat.icone] || FileText;
                const hasUrl = mat.url && mat.url.trim() !== "";
                return (
                  <div
                    key={mat.id}
                    className="float-card p-4 animate-float-up"
                    style={{ animationDelay: `${(i + 1) * 60}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`icon-box shrink-0 ${mat.cor}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground leading-snug">
                          {mat.titulo}
                        </p>
                        {mat.descricao && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {mat.descricao}
                          </p>
                        )}
                        <span className="pill-btn pill-btn-inactive mt-2 inline-block text-[10px]">
                          {mat.categoria}
                        </span>

                        {hasUrl ? (
                          <a
                            href={mat.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 flex items-center gap-1.5 w-fit px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors active:scale-95"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Abrir / Baixar
                          </a>
                        ) : (
                          <span className="mt-3 flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-xl bg-muted text-muted-foreground text-[10px] font-bold">
                            Em breve
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
    </PremiumGate>
  );
}

