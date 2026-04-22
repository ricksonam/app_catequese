import { ArrowLeft, FileText, Link2, ExternalLink, FolderOpen, Download, BookOpen, Music, Flame, Cross } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// LISTA FIXA DE MATERIAIS
// Para adicionar um documento: inclua um novo objeto nesta lista.
// Campo "url": use um link direto do Google Drive, OneDrive, Dropbox ou
// outro serviço de hospedagem de arquivos.
// ─────────────────────────────────────────────────────────────────────────────
const MATERIAIS_FIXOS = [
  {
    id: "1",
    titulo: "Diretório Nacional da Catequese",
    descricao: "Documento oficial da CNBB que orienta a catequese no Brasil.",
    categoria: "Documentos da Igreja",
    tipo: "link" as const,
    url: "https://www.cnbb.org.br/diretorio-nacional-de-catequese/",
    icone: BookOpen,
    cor: "bg-liturgical/10 text-liturgical",
  },
  {
    id: "2",
    titulo: "Catecismo da Igreja Católica",
    descricao: "Texto completo do CIC disponível online pelo Vaticano.",
    categoria: "Documentos da Igreja",
    tipo: "link" as const,
    url: "https://www.vatican.va/archive/cathechism_po/index.htm",
    icone: BookOpen,
    cor: "bg-liturgical/10 text-liturgical",
  },
  {
    id: "3",
    titulo: "Guia de Dinâmicas para Catequese",
    descricao: "Coletânea de dinâmicas e atividades para grupos de catequese.",
    categoria: "Dinâmicas",
    tipo: "link" as const,
    url: "", // ← coloque aqui o link do seu arquivo
    icone: Flame,
    cor: "bg-amber-500/10 text-amber-600",
  },
  {
    id: "4",
    titulo: "Repertório de Cantos Litúrgicos",
    descricao: "Seleção de cantos para os momentos de celebração e oração.",
    categoria: "Cantos",
    tipo: "link" as const,
    url: "", // ← coloque aqui o link do seu arquivo
    icone: Music,
    cor: "bg-rose-500/10 text-rose-600",
  },
  {
    id: "5",
    titulo: "Calendário Catequético Anual",
    descricao: "Planejamento das etapas e datas do ano catequético.",
    categoria: "Planejamento",
    tipo: "link" as const,
    url: "", // ← coloque aqui o link do seu arquivo
    icone: FileText,
    cor: "bg-primary/10 text-primary",
  },
  {
    id: "6",
    titulo: "Ritual da Iniciação Cristã de Adultos (RICA)",
    descricao: "Referência litúrgica para o processo de iniciação cristã.",
    categoria: "Documentos da Igreja",
    tipo: "link" as const,
    url: "", // ← coloque aqui o link do seu arquivo
    icone: Cross,
    cor: "bg-liturgical/10 text-liturgical",
  },
];

const CATEGORIAS = [...new Set(MATERIAIS_FIXOS.map((m) => m.categoria))];

export default function MaterialApoio() {
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState("Todos");

  const filtered =
    filtro === "Todos"
      ? MATERIAIS_FIXOS
      : MATERIAIS_FIXOS.filter((m) => m.categoria === filtro);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 animate-fade-in">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Material de Apoio</h1>
          <p className="text-xs text-muted-foreground">
            {MATERIAIS_FIXOS.length} documentos disponíveis
          </p>
        </div>
      </div>

      {/* Filtros de categoria */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide animate-float-up">
        {["Todos", ...CATEGORIAS].map((c) => (
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
            const Icon = mat.icone;
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
    </div>
  );
}
