import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Music,
  Cross,
  Flame,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Leitura {
  referencia: string;
  texto: string;
}

interface Salmo {
  referencia: string;
  refrao: string;
  texto: string;
}

interface LiturgiaData {
  liturgia?: string;
  cor?: string;
  primeiraLeitura?: Leitura | string;
  salmo?: Salmo | string;
  segundaLeitura?: Leitura | string;
  evangelho?: Leitura | string;
}

type AbaId = "primeira" | "salmo" | "segunda" | "evangelho";

interface Aba {
  id: AbaId;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COR_CONFIG: Record<string, { bg: string; text: string; badge: string; accent: string; label: string }> = {
  verde:    { bg: "from-blue-50 to-blue-200/80",   text: "text-blue-800",  badge: "bg-blue-500/15 text-blue-800 border-blue-500/30",  accent: "bg-blue-600",  label: "Tempo Comum" },
  branco:   { bg: "from-amber-50 to-amber-100/80",     text: "text-amber-800",    badge: "bg-amber-400/15 text-amber-800 border-amber-400/30",          accent: "bg-amber-400",    label: "Tempo de Luz" },
  vermelho: { bg: "from-red-50 to-red-100/80",       text: "text-red-800",      badge: "bg-red-500/15 text-red-800 border-red-500/30",                accent: "bg-red-500",      label: "Espírito e Mártires" },
  roxo:     { bg: "from-purple-50 to-purple-100/80",    text: "text-purple-800",   badge: "bg-purple-500/15 text-purple-800 border-purple-500/30",        accent: "bg-purple-500",   label: "Advento / Quaresma" },
  rosa:     { bg: "from-pink-50 to-pink-100/80",      text: "text-pink-800",     badge: "bg-pink-500/15 text-pink-800 border-pink-500/30",              accent: "bg-pink-500",     label: "Alegria no Caminho" },
};

const COR_DEFAULT = COR_CONFIG.verde;

function getCor(cor?: string) {
  if (!cor) return COR_DEFAULT;
  const normalized = cor.toLowerCase().trim();
  return COR_CONFIG[normalized] || COR_DEFAULT;
}

function padDate(n: number) {
  return String(n).padStart(2, "0");
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function isLeitura(v: unknown): v is Leitura {
  return typeof v === "object" && v !== null && "referencia" in v && "texto" in v;
}

function isSalmo(v: unknown): v is Salmo {
  return typeof v === "object" && v !== null && "referencia" in v && "texto" in v;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ReadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4 pt-2">
      <div className="h-5 bg-black/10 rounded-xl w-1/3" />
      <div className="h-4 bg-black/5 rounded-xl w-full" />
      <div className="h-4 bg-black/5 rounded-xl w-5/6" />
      <div className="h-4 bg-black/5 rounded-xl w-full" />
      <div className="h-4 bg-black/5 rounded-xl w-4/5" />
      <div className="h-4 bg-black/5 rounded-xl w-full" />
      <div className="h-4 bg-black/5 rounded-xl w-3/4" />
      <div className="h-4 bg-black/5 rounded-xl w-full" />
      <div className="h-4 bg-black/5 rounded-xl w-5/6" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LiturgiaDiaria() {
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [liturgia, setLiturgia] = useState<LiturgiaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [abaAtiva, setAbaAtiva] = useState<AbaId>("primeira");
  const [fontSize, setFontSize] = useState(18);
  const [fullScreen, setFullScreen] = useState(false);

  // ── Fullscreen ──────────────────────────────────────────────────────────────

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setFullScreen(true);
    } else {
      document.exitFullscreen?.();
      setFullScreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => setFullScreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ── Fetch Liturgy ───────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchLiturgia = async () => {
      setLoading(true);
      setError(false);
      try {
        const d = padDate(currentDate.getDate());
        const m = padDate(currentDate.getMonth() + 1);
        const res = await fetch(`https://liturgia.up.railway.app/?dia=${d}&mes=${m}`);
        if (!res.ok) throw new Error("HTTP error");
        const data: LiturgiaData = await res.json();
        setLiturgia(data);
        // Selecionar a primeira aba disponível
        if (isLeitura(data.primeiraLeitura)) setAbaAtiva("primeira");
        else if (isSalmo(data.salmo)) setAbaAtiva("salmo");
        else if (isLeitura(data.evangelho)) setAbaAtiva("evangelho");
      } catch {
        setError(true);
        setLiturgia(null);
      } finally {
        setLoading(false);
      }
    };
    fetchLiturgia();
  }, [currentDate]);

  // ── Date navigation ─────────────────────────────────────────────────────────

  const changeDate = (days: number) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + days);
      return d;
    });
  };

  // ── Build tabs dynamically ──────────────────────────────────────────────────

  const ABAS_BASE: Aba[] = [
    { id: "primeira",  label: "1ª Leitura",      shortLabel: "1ª Leit.",  icon: BookOpen },
    { id: "salmo",     label: "Salmo",           shortLabel: "Salmo",     icon: Music },
    { id: "segunda",   label: "2ª Leitura",      shortLabel: "2ª Leit.",  icon: BookOpen },
    { id: "evangelho", label: "Evangelho",       shortLabel: "Evang.",    icon: Cross },
  ];

  const abasVisiveis = ABAS_BASE.filter((aba) => {
    if (!liturgia) return true; // mostra todas durante loading
    if (aba.id === "primeira")  return isLeitura(liturgia.primeiraLeitura);
    if (aba.id === "salmo")     return isSalmo(liturgia.salmo);
    if (aba.id === "segunda")   return isLeitura(liturgia.segundaLeitura);
    if (aba.id === "evangelho") return isLeitura(liturgia.evangelho);
    return false;
  });

  const cor = getCor(liturgia?.cor);

  // ── Render current reading ──────────────────────────────────────────────────

  function renderContent() {
    if (loading) return <ReadingSkeleton />;
    if (error || !liturgia) return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-black/5 flex items-center justify-center">
          <Flame className="w-8 h-8 text-zinc-400" />
        </div>
        <p className="text-zinc-500 font-medium text-sm">Não foi possível carregar a liturgia deste dia.</p>
        <button
          onClick={() => setCurrentDate(new Date())}
          className="px-4 py-2 rounded-xl bg-black/10 text-zinc-700 text-xs font-bold hover:bg-white/90 transition-all"
        >
          Ir para hoje
        </button>
      </div>
    );

    const textStyle = { fontSize: `${fontSize}px`, lineHeight: "1.85" };

    if (abaAtiva === "primeira" && isLeitura(liturgia.primeiraLeitura)) {
      const leitura = liturgia.primeiraLeitura;
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className={`w-1 self-stretch rounded-full ${cor.accent} opacity-60`} />
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5">Primeira Leitura</p>
              <p className={`text-lg font-bold ${cor.text}`}>{leitura.referencia}</p>
            </div>
          </div>
          <div
            className="font-serif text-zinc-900 whitespace-pre-wrap leading-relaxed transition-all duration-200"
            style={textStyle}
          >
            {leitura.texto}
          </div>
          <div className="pt-4 border-t border-black/5">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest text-center">
              Palavra do Senhor
            </p>
          </div>
        </div>
      );
    }

    if (abaAtiva === "salmo" && isSalmo(liturgia.salmo)) {
      const salmo = liturgia.salmo;
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className={`w-1 self-stretch rounded-full ${cor.accent} opacity-60`} />
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5">Salmo Responsorial</p>
              <p className={`text-lg font-bold ${cor.text}`}>{salmo.referencia}</p>
            </div>
          </div>
          {salmo.refrao && (
            <div className={`rounded-2xl border p-4 ${cor.badge} backdrop-blur-sm`}>
              <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Refrão</p>
              <p
                className="font-serif font-bold italic leading-relaxed"
                style={{ fontSize: `${Math.min(fontSize, 20)}px` }}
              >
                {salmo.refrao}
              </p>
            </div>
          )}
          <div
            className="font-serif text-zinc-900 whitespace-pre-wrap leading-relaxed transition-all duration-200"
            style={textStyle}
          >
            {salmo.texto}
          </div>
          <div className="pt-4 border-t border-black/5">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest text-center">
              — {salmo.refrao ? salmo.refrao.substring(0, 60) + (salmo.refrao.length > 60 ? "..." : "") : "Louvai o Senhor"}
            </p>
          </div>
        </div>
      );
    }

    if (abaAtiva === "segunda" && isLeitura(liturgia.segundaLeitura)) {
      const leitura = liturgia.segundaLeitura;
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className={`w-1 self-stretch rounded-full ${cor.accent} opacity-60`} />
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5">Segunda Leitura</p>
              <p className={`text-lg font-bold ${cor.text}`}>{leitura.referencia}</p>
            </div>
          </div>
          <div
            className="font-serif text-zinc-900 whitespace-pre-wrap leading-relaxed transition-all duration-200"
            style={textStyle}
          >
            {leitura.texto}
          </div>
          <div className="pt-4 border-t border-black/5">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest text-center">
              Palavra do Senhor
            </p>
          </div>
        </div>
      );
    }

    if (abaAtiva === "evangelho" && isLeitura(liturgia.evangelho)) {
      const evang = liturgia.evangelho;
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className={`w-1 self-stretch rounded-full ${cor.accent} opacity-60`} />
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5">Santo Evangelho</p>
              <p className={`text-lg font-bold ${cor.text}`}>{evang.referencia}</p>
            </div>
          </div>
          <div
            className="font-serif text-zinc-900 whitespace-pre-wrap leading-relaxed transition-all duration-200"
            style={textStyle}
          >
            {evang.texto}
          </div>
          <div className="pt-4 border-t border-black/5">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest text-center">
              Palavra da Salvação
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center py-16 text-zinc-400 text-sm font-medium">
        Leitura não disponível para este dia.
      </div>
    );
  }

  // ── JSX ─────────────────────────────────────────────────────────────────────

  return (
    <div
      className={`min-h-screen bg-slate-50 transition-all duration-500 ${
        fullScreen ? "fixed inset-0 z-50 overflow-y-auto" : "pb-24"
      }`}
    >
      {/* ── Ambient gradient ── */}
      <div
        className={`fixed inset-0 pointer-events-none transition-all duration-700 bg-gradient-to-b ${cor.bg} opacity-80`}
        aria-hidden
      />

      {/* ── Top Bar ── */}
      <div
        className={`sticky top-0 z-40 transition-all duration-300 ${
          fullScreen ? "opacity-0 hover:opacity-100" : ""
        }`}
      >
        <div className="bg-white/90 backdrop-blur-xl border-b border-black/5">
          <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
            {/* Voltar */}
            <button
              onClick={() => (fullScreen ? toggleFullScreen() : navigate(-1))}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-orange-500 hover:bg-orange-600 border border-orange-600/30 shadow-md shadow-orange-500/20 active:scale-90 transition-all shrink-0"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>

            {/* Espaço vazio onde ficava o título */}
            <div className="flex-1" />

            {/* Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setFontSize((p) => Math.max(14, p - 2))}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-black/10 border border-black/10 text-zinc-700 hover:bg-black/5 active:scale-90 transition-all"
                aria-label="Diminuir fonte"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={() => setFontSize((p) => Math.min(32, p + 2))}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-black/10 border border-black/10 text-zinc-700 hover:bg-black/5 active:scale-90 transition-all"
                aria-label="Aumentar fonte"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <div className="w-px h-5 bg-black/10 mx-0.5" />
              <button
                onClick={toggleFullScreen}
                className={`w-9 h-9 flex items-center justify-center rounded-xl border active:scale-90 transition-all ${
                  fullScreen
                    ? `${cor.badge} border-current`
                    : "bg-black/10 border-black/10 text-zinc-700 hover:bg-black/5"
                }`}
                aria-label={fullScreen ? "Sair do fullscreen" : "Fullscreen"}
              >
                {fullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-6 space-y-5">

        {/* ── Novo Card de Informações ── */}
        <div className="bg-white/80 border border-black/5 rounded-3xl p-5 backdrop-blur-sm flex flex-col items-center text-center shadow-sm">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.25em] mb-4">
            Liturgia Diária
          </span>
          <div className="flex items-center justify-between w-full">
            <button
              onClick={() => changeDate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-black/5 active:scale-90 transition-all text-zinc-600 shrink-0"
              aria-label="Dia anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 px-2 relative">
              <input
                type="date"
                value={
                  currentDate.getFullYear() +
                  "-" +
                  padDate(currentDate.getMonth() + 1) +
                  "-" +
                  padDate(currentDate.getDate())
                }
                onChange={(e) => {
                  if (e.target.value) {
                    const [y, m, d] = e.target.value.split("-");
                    setCurrentDate(new Date(Number(y), Number(m) - 1, Number(d)));
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <p className={`text-base font-bold capitalize ${cor.text} pointer-events-none`}>
                {formatDateLabel(currentDate)}
              </p>
            </div>
            <button
              onClick={() => changeDate(1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-black/5 active:scale-90 transition-all text-zinc-600 shrink-0"
              aria-label="Próximo dia"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          {!loading && liturgia && (
            <div className="flex flex-col items-center gap-3 mt-4 animate-fade-in">
              {liturgia.liturgia && (
                <span className="text-zinc-600 text-sm font-medium">
                  {liturgia.liturgia}
                </span>
              )}
              {liturgia.cor && (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] ${cor.badge}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${cor.accent}`} />
                  {cor.label}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Reading Tabs ── */}
        <div className="flex gap-1 bg-white/60 border border-black/5 rounded-2xl p-1.5 overflow-x-auto scrollbar-hide shadow-sm">
          {(loading ? ABAS_BASE : abasVisiveis).map((aba) => {
            const Icon = aba.icon;
            const isActive = abaAtiva === aba.id;
            return (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id)}
                disabled={loading}
                className={`flex-1 min-w-[70px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 whitespace-nowrap ${
                  isActive
                    ? `bg-white/90 border border-black/20 ${cor.text} shadow-lg shadow-black/5`
                    : "text-zinc-500 hover:text-zinc-600 hover:bg-black/5"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{aba.label}</span>
                <span className="sm:hidden">{aba.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* ── Reading Content Card ── */}
        <div className="bg-white/80 border border-black/5 rounded-3xl p-6 backdrop-blur-sm min-h-[300px] animate-fade-in shadow-sm">
          {renderContent()}
        </div>

        {/* ── Footer ── */}
        {!loading && !error && (
          <div className="flex items-center justify-center gap-3 py-4">
            <div className={`w-8 h-px ${cor.accent} opacity-40`} />
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">
              Palavra da Salvação
            </span>
            <div className={`w-8 h-px ${cor.accent} opacity-40`} />
          </div>
        )}
      </div>
    </div>
  );
}
