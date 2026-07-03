import { useParams, useNavigate } from "react-router-dom";
import { PartyPopper } from "lucide-react";
import { useCatequizandos, useEncontros, useTurmas } from "@/hooks/useSupabaseData";
import { upsertCatequizando, upsertTurma } from "@/lib/supabaseStore";
import { useState, useMemo, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft, Cross, CheckCircle2, Circle, ChevronDown, ChevronUp,
  AlertTriangle, Calendar, Users, FileText, BookOpen, Music,
  Heart, Baby, Star, Church, Plus, Trash2, Save, Share2,
  UserPlus, X, Check, Sparkles, TrendingUp, ShieldAlert, BarChart3
} from "lucide-react";
import type { Catequizando, TrilhaSacramental as TrilhaSacramentalType, Turma } from "@/lib/store";
import { cn, getAppUrl } from "@/lib/utils";
import { QRShareModal } from "@/components/QRShareModal";

type SacramentoType = 'batismo' | 'eucaristia' | 'crisma';

const ETAPAS_PARTICIPACAO = [
  { key: "participacao_encontros", label: "Participação nos Encontros", icon: Users },
  { key: "participacao_missas", label: "Participação nas Missas", icon: Church },
  { key: "participacao_eventos", label: "Participação nos Eventos", icon: Star },
  { key: "atividades_extras", label: "Atividades Extras", icon: Plus },
] as const;

const ETAPAS_RITO = [
  { key: "reuniao_pais", label: "Reunião com os pais", icon: Heart },
  { key: "confissao", label: "Celebração penitencial - Confissão", icon: BookOpen },
  { key: "retiro", label: "Retiro Espiritual", icon: Cross },
  { key: "ensaio", label: "Ensaio do Rito", icon: Music },
  { key: "confraternizacao", label: "Confraternização", icon: Star },
] as const;

const ETAPAS_RITO_BATISMO = [
  { key: "reuniao_pais", label: "Reunião com os pais", icon: Heart },
  { key: "reuniao_preparacao_padrinhos", label: "Reunião de preparação com os pais e padrinhos", icon: Users },
  { key: "celebracao_batismo", label: "Celebração do Batismo", icon: Baby },
  { key: "confraternizacao_batismo", label: "Confraternização", icon: PartyPopper },
] as const;

const DOCS_PADRAO = [
  { key: "documentos_rg", label: "RG (Documento de Identidade)" },
  { key: "documentos_batistério", label: "Certidão de Batismo" },
  { key: "documentos_residencia", label: "Comprovante de Residência" },
  { key: "contribuicao", label: "Contribuição / Taxas" },
] as const;

const SACRAMENTO_CONFIG = {
  batismo: {
    label: "Batismo",
    gradient: "from-sky-400 via-blue-500 to-indigo-600",
    gradientLight: "from-sky-50 via-blue-50 to-indigo-50",
    accent: "text-sky-600",
    accentBg: "bg-sky-500",
    border: "border-sky-200",
    ring: "ring-sky-400/30",
    icon: Baby,
    emoji: "🕊️",
  },
  eucaristia: {
    label: "Eucaristia",
    gradient: "from-amber-400 via-yellow-500 to-orange-500",
    gradientLight: "from-amber-50 via-yellow-50 to-orange-50",
    accent: "text-amber-600",
    accentBg: "bg-amber-500",
    border: "border-amber-200",
    ring: "ring-amber-400/30",
    icon: Star,
    emoji: "✨",
  },
  crisma: {
    label: "Crisma",
    gradient: "from-violet-500 via-purple-600 to-fuchsia-600",
    gradientLight: "from-violet-50 via-purple-50 to-fuchsia-50",
    accent: "text-violet-600",
    accentBg: "bg-violet-600",
    border: "border-violet-200",
    ring: "ring-violet-400/30",
    icon: Sparkles,
    emoji: "👑",
  },
} as const;

function defaultTrilha(): TrilhaSacramentalType {
  return {
    documentos_entregues: false,
    documentos_rg: false,
    "documentos_batistério": false,
    documentos_residencia: false,
    documentos_custom: [],
    contribuicao: false,
    participacao_missas: false,
    participacao_encontros: false,
    participacao_eventos: false,
    atividades_extras: false,
    observacoes: "",
  };
}

function calcFrequencia(cat: Catequizando, encontros: any[]): { percent: number; presencas: number; total: number } {
  const realizados = encontros.filter(e => e.status === "realizado");
  if (realizados.length === 0) return { percent: 0, presencas: 0, total: 0 };
  const presencas = realizados.filter(e => (e.presencas || []).includes(cat.id)).length;
  return { percent: Math.round((presencas / realizados.length) * 100), presencas, total: realizados.length };
}

function FrequenciaBar({ percent }: { percent: number }) {
  const color = percent >= 75 ? "bg-emerald-500" : percent >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${percent}%` }} />
      </div>
      <span className={cn("text-sm font-black w-12 text-right",
        percent >= 75 ? "text-emerald-600" : percent >= 50 ? "text-amber-600" : "text-red-600"
      )}>{percent}%</span>
    </div>
  );
}

function CheckItem({ checked, onToggle, label, disabled }: { checked: boolean; onToggle: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 w-full text-left rounded-xl px-3 py-3 border transition-all active:scale-95 font-semibold",
        checked
          ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-700"
          : "bg-white border-border/50 text-foreground/70 dark:bg-muted/30",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {checked
        ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
        : <Circle className="h-5 w-5 text-muted-foreground shrink-0" />}
      <span className="leading-tight text-sm md:text-base">{label}</span>
    </button>
  );
}

function ProgressRing({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  const color = pct === 100 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center justify-center">
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="16" fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle
          cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${100.53}`}
          strokeDashoffset={`${100.53 * (1 - pct / 100)}`}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
          style={{ transition: "stroke-dashoffset 0.7s ease" }}
        />
        <text x="20" y="24" textAnchor="middle" fontSize="9" fontWeight="800" fill={color}>{pct}%</text>
      </svg>
    </div>
  );
}

function getTrilhaState(cat: Catequizando, sacramento: SacramentoType): TrilhaSacramentalType {
  if (cat.trilhasPorSacramento && cat.trilhasPorSacramento[sacramento]) {
    return cat.trilhasPorSacramento[sacramento];
  }
  if (sacramento === 'eucaristia' && cat.trilhaSacramental) {
    return cat.trilhaSacramental;
  }
  return defaultTrilha();
}

// ===== PAINEL INTELIGENTE DE RESUMO (Compacto) =====
function PainelResumo({
  stats,
  sacramento,
  onClick
}: {
  stats: { total: number; etapasPercent: number; freqBaixa: number };
  sacramento: SacramentoType;
  onClick: () => void;
}) {
  const cfg = SACRAMENTO_CONFIG[sacramento];
  const SacIcon = cfg.icon;

  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-3xl overflow-hidden shadow-md border-2 border-transparent transition-all active:scale-95 group",
        "hover:shadow-lg hover:border-white/40"
      )}
    >
      <div className={cn("bg-gradient-to-br p-5 relative", cfg.gradient)}>
        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
           <BarChart3 className="h-4 w-4 text-white" />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shrink-0">
            <SacIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Resumo da Trilha</p>
            <h2 className="text-lg font-black text-white leading-tight">{cfg.label} {cfg.emoji}</h2>
          </div>
        </div>

        {/* Métricas principais */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20">
            <p className="text-2xl font-black text-white">{stats.total}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-white/70 mt-0.5">Na Trilha</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20">
            <p className="text-2xl font-black text-white">{stats.etapasPercent}%</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-white/70 mt-0.5">Progresso</p>
          </div>
          <div className={cn(
            "backdrop-blur-sm rounded-2xl p-3 text-center border",
            stats.freqBaixa > 0 ? "bg-red-500/40 border-red-300/40" : "bg-white/15 border-white/20"
          )}>
            <p className="text-2xl font-black text-white">{stats.freqBaixa}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-white/70 mt-0.5">Freq. Baixa</p>
          </div>
        </div>

        {/* Barra de progresso global */}
        <div className="bg-white/20 rounded-full h-2 overflow-hidden mb-1">
          <div
            className="h-full bg-white rounded-full transition-all duration-1000"
            style={{ width: `${stats.etapasPercent}%` }}
          />
        </div>
        <p className="text-[10px] text-white/80 font-bold text-center">
            Clique para ver os detalhes e comparativos
        </p>
      </div>
    </button>
  );
}

// ===== MODAL DE ESTATÍSTICAS E DETALHES =====
function ModalDetalhesTrilha({
  open,
  onClose,
  catequizandos,
  encontros,
  turma,
  selectedSacramento,
  onSelectSacramento
}: {
  open: boolean;
  onClose: () => void;
  catequizandos: Catequizando[];
  encontros: any[];
  turma: Turma | undefined;
  selectedSacramento: SacramentoType;
  onSelectSacramento: (s: SacramentoType) => void;
}) {
  const sacramentos: SacramentoType[] = ['batismo', 'eucaristia', 'crisma'];

  const statsPerSacramento = useMemo(() => {
    return sacramentos.map(sac => {
      const ids: string[] = turma?.trilhasConfig?.[sac]?.catequizandosTrilha ?? [];
      const cats = catequizandos.filter(c =>
        (c.status === "ativo" || c.status === "inscrito" || !c.status) && ids.includes(c.id)
      );
      const total = cats.length;
      let etapasConcluidas = 0;
      let freqBaixa = 0;
      cats.forEach(cat => {
        const t = getTrilhaState(cat, sac);
        etapasConcluidas += ETAPAS_PARTICIPACAO.filter(e => t[e.key as keyof TrilhaSacramentalType]).length;
        const freq = calcFrequencia(cat, encontros);
        if (freq.total > 0 && freq.percent < 75) freqBaixa++;
      });
      const maxEtapas = total * ETAPAS_PARTICIPACAO.length;
      const etapasPercent = maxEtapas === 0 ? 0 : Math.round((etapasConcluidas / maxEtapas) * 100);
      return { sac, total, etapasPercent, freqBaixa };
    });
  }, [catequizandos, encontros, turma]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4">
        <div className="bg-white dark:bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: "85vh" }} onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/30 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-black text-foreground uppercase tracking-wide">Estatísticas das Trilhas</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-muted transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Tabs de sacramentos + mini stats */}
            <div className="flex border-b border-border/30">
              {statsPerSacramento.map(({ sac, total, freqBaixa }) => {
                const c = SACRAMENTO_CONFIG[sac];
                const isActive = sac === selectedSacramento;
                return (
                  <button
                    key={sac}
                    onClick={() => onSelectSacramento(sac)}
                    className={cn(
                      "flex-1 flex flex-col items-center py-4 px-2 transition-all relative",
                      isActive ? "bg-white dark:bg-card" : "bg-muted/30 hover:bg-muted/50"
                    )}
                  >
                    {isActive && (
                      <div className={cn("absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r", c.gradient)} />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">{c.label}</span>
                    <span className={cn("text-lg font-black", isActive ? c.accent : "text-foreground")}>{total}</span>
                    <span className="text-[9px] text-muted-foreground font-medium">catequizandos</span>
                    {freqBaixa > 0 && (
                      <span className="mt-1 text-[8px] font-black text-red-500 uppercase tracking-wide flex items-center gap-0.5">
                        <ShieldAlert className="h-2.5 w-2.5" />{freqBaixa} alert
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Comparativo de progresso entre sacramentos */}
            <div className="p-5 space-y-3 bg-muted/10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5 mb-2">
                <TrendingUp className="h-3.5 w-3.5" /> Progresso Geral
              </p>
              {statsPerSacramento.map(({ sac, etapasPercent, total }) => {
                const c = SACRAMENTO_CONFIG[sac];
                const isActive = sac === selectedSacramento;
                return (
                  <button
                    key={sac}
                    onClick={() => onSelectSacramento(sac)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-2xl px-4 py-3 transition-all",
                      isActive ? cn("bg-gradient-to-r shadow-sm", c.gradientLight, "border", c.border) : "hover:bg-muted/30 border border-transparent"
                    )}
                  >
                    <span className="text-xs font-black w-20 text-left text-muted-foreground shrink-0">{c.label}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", c.gradient)}
                        style={{ width: total === 0 ? "0%" : `${etapasPercent}%` }}
                      />
                    </div>
                    <span className={cn("text-xs font-black w-10 text-right shrink-0", isActive ? c.accent : "text-muted-foreground")}>
                      {total === 0 ? "-" : `${etapasPercent}%`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="p-4 border-t border-border/30 bg-muted/30 shrink-0">
             <button onClick={onClose} className="w-full h-11 rounded-xl bg-white border border-border shadow-sm text-sm font-black text-foreground hover:bg-muted/50 transition-colors">
                Fechar
             </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ===== CARD DATA DE CELEBRAÇÃO PREMIUM =====
function CardDataCelebracao({
  sacramento,
  dataCelebracao,
  editandoData,
  dataValue,
  savingData,
  onSetEditando,
  onChangeData,
  onSave,
  onCancelar,
}: {
  sacramento: SacramentoType;
  dataCelebracao?: string;
  editandoData: boolean;
  dataValue: string;
  savingData: boolean;
  onSetEditando: () => void;
  onChangeData: (v: string) => void;
  onSave: () => void;
  onCancelar: () => void;
}) {
  const cfg = SACRAMENTO_CONFIG[sacramento];

  const diasRestantes = useMemo(() => {
    if (!dataCelebracao) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cele = new Date(dataCelebracao + "T00:00:00");
    const diff = Math.ceil((cele.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [dataCelebracao]);

  const urgente = diasRestantes !== null && diasRestantes <= 30 && diasRestantes >= 0;
  const passou = diasRestantes !== null && diasRestantes < 0;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-3xl border-2 transition-all duration-500",
      dataCelebracao
        ? urgente
          ? "border-orange-300 shadow-orange-100 shadow-lg"
          : passou
            ? "border-emerald-300 shadow-emerald-100 shadow-lg"
            : "border-violet-200 shadow-violet-100 shadow-md"
        : "border-dashed border-muted-foreground/20"
    )}>
      {/* Fundo animado com gradiente */}
      {dataCelebracao && (
        <div className={cn(
          "absolute inset-0 opacity-10 bg-gradient-to-br",
          urgente ? "from-orange-400 to-red-500" : passou ? "from-emerald-400 to-teal-500" : "from-violet-400 to-purple-600"
        )} />
      )}

      {/* Anel pulsante quando urgente */}
      {dataCelebracao && urgente && (
        <div className="absolute inset-0 rounded-3xl ring-2 ring-orange-400/50 animate-[sacred-pulse_2s_ease-in-out_infinite]" />
      )}

      <div className="relative p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Ícone animado */}
            <div className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm transition-all",
              dataCelebracao
                ? urgente
                  ? "bg-orange-500 animate-[heartbeat_1.5s_ease-in-out_infinite]"
                  : passou
                    ? "bg-emerald-500"
                    : "bg-violet-600"
                : "bg-muted"
            )}>
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Data da Celebração</p>
              <p className={cn("text-sm font-black", cfg.accent)}>{cfg.label} {cfg.emoji}</p>
            </div>
          </div>

          {!editandoData && (
            <button
              onClick={onSetEditando}
              className={cn(
                "text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl transition-all",
                dataCelebracao
                  ? "bg-violet-100 text-violet-700 hover:bg-violet-200"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
              )}
            >
              {dataCelebracao ? "Alterar" : "Definir Data"}
            </button>
          )}
        </div>

        {editandoData ? (
          <div className="flex gap-2 items-center mt-2">
            <input
              type="date"
              value={dataValue}
              onChange={e => onChangeData(e.target.value)}
              className="flex-1 h-10 px-3 rounded-xl text-sm border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
              autoFocus
            />
            <button
              onClick={onSave}
              disabled={savingData}
              className="px-4 h-10 rounded-xl bg-violet-600 text-white text-xs font-black uppercase hover:bg-violet-700 transition-colors disabled:opacity-60"
            >
              {savingData ? "..." : "Salvar"}
            </button>
            <button onClick={onCancelar} className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2">
              ✕
            </button>
          </div>
        ) : dataCelebracao ? (
          <div className="mt-1">
            <p className={cn("text-xl font-black leading-tight", urgente ? "text-orange-700" : passou ? "text-emerald-700" : "text-violet-800")}>
              {new Date(dataCelebracao + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
            {diasRestantes !== null && (
              <div className={cn(
                "inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-black",
                urgente
                  ? "bg-orange-100 text-orange-700"
                  : passou
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-violet-100 text-violet-700"
              )}>
                {passou ? (
                  <><CheckCircle2 className="h-3 w-3" /> Celebração realizada há {Math.abs(diasRestantes)} dias</>
                ) : diasRestantes === 0 ? (
                  <><Sparkles className="h-3 w-3" /> Hoje é o grande dia!</>
                ) : urgente ? (
                  <><AlertTriangle className="h-3 w-3" /> Faltam {diasRestantes} dias — é hoje!</>
                ) : (
                  <><Calendar className="h-3 w-3" /> Faltam {diasRestantes} dias</>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-1">
            <div className="w-full h-10 rounded-xl bg-muted/40 border border-dashed border-muted-foreground/20 flex items-center justify-center">
              <p className="text-xs text-muted-foreground italic">Nenhuma data definida</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== MODAL DE SELEÇÃO DE CATEQUIZANDOS (corrigido) =====
function ModalSelecaoCatequizandos({
  open,
  onClose,
  todosOsCatequizandos,
  selecionados,
  onSave,
  saving,
  sacramento,
}: {
  open: boolean;
  onClose: () => void;
  todosOsCatequizandos: Catequizando[];
  selecionados: string[];
  onSave: (ids: string[]) => void;
  saving: boolean;
  sacramento: SacramentoType;
}) {
  const [localSelecionados, setLocalSelecionados] = useState<string[]>(selecionados);
  const [busca, setBusca] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSelecionados(selecionados);
    setBusca("");
  }, [selecionados, open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  if (!open) return null;

  const filtrados = todosOsCatequizandos.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const toggleSelecao = (id: string) => {
    setLocalSelecionados(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => setLocalSelecionados(filtrados.map(c => c.id));
  const clearAll = () => setLocalSelecionados([]);

  const cfg = SACRAMENTO_CONFIG[sacramento];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer/Modal centralizado — position fixed, não relativo ao pai */}
      <div className="fixed inset-x-0 bottom-0 z-50 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4">
        <div
          className="bg-white dark:bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl flex flex-col"
          style={{ maxHeight: "85vh" }}
          onClick={e => e.stopPropagation()}
        >
          {/* Handle mobile */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
          </div>

          {/* Header */}
          <div className={cn("flex items-center justify-between px-5 py-4 border-b border-border/30")}>
            <div className="flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center", cfg.gradient)}>
                <UserPlus className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground uppercase tracking-wide">
                  Catequizandos da Trilha
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Selecione para <span className={cn("font-black", cfg.accent)}>{cfg.label} {cfg.emoji}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-muted transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search */}
          <div className="px-5 pt-4 pb-2 shrink-0">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar catequizando..."
                className="w-full h-10 pl-4 pr-10 rounded-xl text-sm border border-border/60 bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {busca && (
                <button onClick={() => setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between mt-2.5">
              <span className="text-xs text-muted-foreground font-medium">
                <span className="font-black text-foreground">{localSelecionados.length}</span> selecionado{localSelecionados.length !== 1 ? "s" : ""}
              </span>
              <div className="flex gap-3">
                <button onClick={selectAll} className="text-[10px] font-black uppercase text-primary hover:text-primary/80 transition-colors">
                  Todos
                </button>
                <span className="text-muted-foreground text-[10px]">·</span>
                <button onClick={clearAll} className="text-[10px] font-black uppercase text-muted-foreground hover:text-foreground transition-colors">
                  Limpar
                </button>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-1.5 min-h-0">
            {filtrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Users className="h-10 w-10 text-muted-foreground/20 mb-2" />
                <p className="text-sm text-muted-foreground italic">Nenhum catequizando encontrado</p>
              </div>
            ) : (
              filtrados.map(cat => {
                const isSel = localSelecionados.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleSelecao(cat.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left",
                      isSel
                        ? cn("border-2 bg-gradient-to-r", cfg.gradientLight, cfg.border)
                        : "bg-white dark:bg-muted/20 border-border/40 text-foreground hover:bg-muted/40"
                    )}
                  >
                    {cat.foto
                      ? <img src={cat.foto} alt={cat.nome} className="w-9 h-9 rounded-xl object-cover shrink-0 border-2 border-white shadow-sm" />
                      : <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-black border-2",
                          isSel
                            ? cn("bg-gradient-to-br text-white border-transparent", cfg.gradient)
                            : "bg-muted/50 border-muted text-muted-foreground"
                        )}>
                          {cat.nome.charAt(0).toUpperCase()}
                        </div>
                    }
                    <span className="flex-1 text-sm font-semibold truncate">{cat.nome}</span>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                      isSel ? cn("bg-gradient-to-br border-transparent", cfg.gradient) : "border-muted-foreground/30"
                    )}>
                      {isSel && <Check className="h-3 w-3 text-white" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-border/30 flex gap-3 shrink-0">
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-border text-sm font-black text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => onSave(localSelecionados)}
              disabled={saving}
              className={cn(
                "flex-1 h-11 rounded-xl text-white text-sm font-black uppercase tracking-wider active:scale-95 transition-all disabled:opacity-60 bg-gradient-to-r",
                cfg.gradient
              )}
            >
              {saving ? "Salvando..." : `Confirmar (${localSelecionados.length})`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ===== ROW DO CATEQUIZANDO =====
function CatequizandoRow({
  cat, encontros, selectedSacramento, isOpen, onToggle, onSave, saving
}: {
  cat: Catequizando;
  encontros: any[];
  selectedSacramento: SacramentoType;
  isOpen: boolean;
  onToggle: () => void;
  onSave: (updated: Catequizando) => void;
  saving: boolean;
}) {
  const [localTrilha, setLocalTrilha] = useState<TrilhaSacramentalType>(getTrilhaState(cat, selectedSacramento));
  const [newDocNome, setNewDocNome] = useState("");
  const freq = calcFrequencia(cat, encontros);

  useEffect(() => {
    setLocalTrilha(getTrilhaState(cat, selectedSacramento));
    setNewDocNome("");
  }, [cat, selectedSacramento]);

  const sacramentos = cat.dadosPastorais?.sacramentos ?? cat.sacramentos;
  const sacInfo = sacramentos?.[selectedSacramento];
  const sacramentoJaRecebido = sacInfo?.recebido === true;

  const totalEtapas = ETAPAS_PARTICIPACAO.length;
  const concluidas = ETAPAS_PARTICIPACAO.filter(e => localTrilha[e.key as keyof TrilhaSacramentalType]).length;
  const docsCustom = localTrilha.documentos_custom || [];
  const totalDocs = DOCS_PADRAO.length + docsCustom.length;
  const docsConcluidos = DOCS_PADRAO.filter(d => localTrilha[d.key as keyof TrilhaSacramentalType]).length
    + docsCustom.filter(d => d.entregue).length;

  const toggle = (key: keyof TrilhaSacramentalType) => {
    setLocalTrilha(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleDocCustom = (id: string) => {
    setLocalTrilha(prev => ({
      ...prev,
      documentos_custom: (prev.documentos_custom || []).map(d => d.id === id ? { ...d, entregue: !d.entregue } : d),
    }));
  };

  const addDocCustom = () => {
    if (!newDocNome.trim()) return;
    setLocalTrilha(prev => ({
      ...prev,
      documentos_custom: [...(prev.documentos_custom || []), { id: crypto.randomUUID(), nome: newDocNome.trim(), entregue: false }],
    }));
    setNewDocNome("");
  };

  const removeDocCustom = (id: string) => {
    setLocalTrilha(prev => ({
      ...prev,
      documentos_custom: (prev.documentos_custom || []).filter(d => d.id !== id),
    }));
  };

  const handleSave = () => {
    onSave({
      ...cat,
      trilhasPorSacramento: {
        ...(cat.trilhasPorSacramento || {}),
        [selectedSacramento]: localTrilha
      }
    });
  };

  const freqAlert = freq.total > 0 && freq.percent < 75;
  const sacramentoLabel = { batismo: "Batismo", eucaristia: "Eucaristia", crisma: "Crisma" }[selectedSacramento];

  return (
    <div className={cn("rounded-2xl border transition-all duration-300 overflow-hidden", isOpen ? "shadow-md" : "shadow-sm")}>
      <button
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
          isOpen ? "bg-primary/5" : "bg-white dark:bg-card",
          "hover:bg-primary/5"
        )}
        onClick={onToggle}
      >
        {cat.foto
          ? <img src={cat.foto} alt={cat.nome} className="w-9 h-9 rounded-xl object-cover shrink-0 border-2 border-white shadow" />
          : <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shrink-0 text-primary font-black text-sm border border-primary/20">
            {cat.nome.charAt(0).toUpperCase()}
          </div>
        }
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-foreground leading-tight truncate">{cat.nome}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {sacramentoJaRecebido ? (
              <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-wide">
                <CheckCircle2 className="h-2.5 w-2.5" /> Sacramento já recebido
              </span>
            ) : (
              <>
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  {concluidas}/{totalEtapas} etapas · {docsConcluidos}/{totalDocs} docs
                </span>
                {freqAlert && (
                  <span className="flex items-center gap-0.5 text-[9px] font-black text-red-600 uppercase tracking-wide">
                    <AlertTriangle className="h-2.5 w-2.5" /> Freq. baixa
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        {sacramentoJaRecebido
          ? <CheckCircle2 className="h-9 w-9 text-emerald-500 shrink-0" />
          : <ProgressRing value={concluidas} max={totalEtapas} />}
        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-2 space-y-5 bg-white dark:bg-card border-t border-border/30">
          {sacramentoJaRecebido ? (
            <div className="flex flex-col items-center justify-center gap-3 py-6 px-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-center">
              <PartyPopper className="h-10 w-10 text-emerald-500" />
              <div>
                <p className="text-base font-black text-black uppercase tracking-wide">Sacramento já recebido!</p>
                <p className="text-sm text-emerald-600 mt-1">
                  {selectedSacramento.charAt(0).toUpperCase() + selectedSacramento.slice(1)} registrado
                  {sacInfo?.data ? ` em ${new Date(sacInfo.data + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}` : " no cadastro"}
                  {sacInfo?.paroquia ? ` · ${sacInfo.paroquia}` : ""}
                </p>
              </div>
              <p className="text-xs text-emerald-600 italic">
                Caso o catequizando não tenha recebido o sacramento, remova o sacramento do cadastro do catequizando.
              </p>
            </div>
          ) : (
            <>
              <section>
                <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-primary mb-3 flex items-center gap-1.5">
                  <Cross className="h-4 w-4" /> Situação Sacramental (Cadastro)
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "batismo", label: "Batismo" },
                    { key: "eucaristia", label: "Eucaristia" },
                    { key: "crisma", label: "Crisma" },
                  ].map(s => {
                    const sacInfoGrid = sacramentos?.[s.key as "batismo" | "eucaristia" | "crisma"];
                    const recebido = sacInfoGrid?.recebido ?? false;
                    return (
                      <div key={s.key} className={cn("rounded-xl border p-2 text-center", recebido ? "bg-emerald-50 border-emerald-200" : "bg-muted/30 border-border/50")}>
                        {recebido
                          ? <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-1.5" />
                          : <Circle className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />}
                        <p className="text-xs font-black uppercase text-foreground">{s.label}</p>
                        {recebido && sacInfoGrid?.data && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(sacInfoGrid.data + "T00:00:00").toLocaleDateString("pt-BR")}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> Controle de Frequência
                </h4>
                {freq.total === 0 ? (
                  <p className="text-sm md:text-base text-muted-foreground italic">Nenhum encontro realizado ainda.</p>
                ) : (
                  <div className="space-y-2">
                    <FrequenciaBar percent={freq.percent} />
                    <p className="text-xs md:text-sm text-muted-foreground">{freq.presencas} presenças de {freq.total} encontros realizados</p>
                    {freqAlert && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                        <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-xs font-bold text-red-700 leading-snug">Frequência abaixo de 75%. Considere contato com o responsável.</p>
                      </div>
                    )}
                  </div>
                )}
              </section>

              <section>
                <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-amber-600 mb-3 flex items-center gap-1.5">
                  <Star className="h-4 w-4" /> Etapas de Participação ({sacramentoLabel})
                </h4>
                <div className="space-y-2">
                  {ETAPAS_PARTICIPACAO.map(etapa => (
                    <CheckItem
                      key={etapa.key}
                      checked={!!localTrilha[etapa.key as keyof TrilhaSacramentalType]}
                      onToggle={() => toggle(etapa.key as keyof TrilhaSacramentalType)}
                      label={etapa.label}
                    />
                  ))}
                </div>
              </section>

              <section>
                <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-violet-600 mb-3 flex items-center gap-1.5">
                  <FileText className="h-4 w-4" /> Documentos Necessários ({sacramentoLabel})
                </h4>
                <div className="space-y-2">
                  {DOCS_PADRAO.map(doc => (
                    <CheckItem
                      key={doc.key}
                      checked={!!localTrilha[doc.key as keyof TrilhaSacramentalType]}
                      onToggle={() => toggle(doc.key as keyof TrilhaSacramentalType)}
                      label={doc.label}
                    />
                  ))}
                  {(localTrilha.documentos_custom || []).map(doc => (
                    <div key={doc.id} className="flex items-center gap-2">
                      <div className="flex-1">
                        <CheckItem checked={doc.entregue} onToggle={() => toggleDocCustom(doc.id)} label={doc.nome} />
                      </div>
                      <button onClick={() => removeDocCustom(doc.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 border border-red-100 shrink-0 transition-colors">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={newDocNome}
                      onChange={e => setNewDocNome(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addDocCustom()}
                      placeholder="Adicionar documento..."
                      className="flex-1 h-10 px-3 rounded-xl text-sm border border-border/60 bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button onClick={addDocCustom} className="w-10 h-10 flex items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-700 shrink-0 transition-colors">
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-muted-foreground mb-2">Observações ({sacramentoLabel})</h4>
                <textarea
                  value={localTrilha.observacoes ?? ""}
                  onChange={e => setLocalTrilha(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Anotações adicionais sobre este catequizando nesta trilha..."
                  className="w-full h-20 px-3 py-3 rounded-xl text-sm border border-border/60 bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </section>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-primary text-white font-black text-sm uppercase tracking-widest hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60"
              >
                <Save className="h-5 w-5" />
                {saving ? "Salvando..." : "Salvar Trilha"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ===== COMPONENTE PRINCIPAL =====
export default function TrilhaSacramental() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: turmas = [] } = useTurmas();
  const { data: catequizandos = [], isLoading } = useCatequizandos(id);
  const { data: encontros = [] } = useEncontros(id);

  const turma = turmas.find(t => t.id === id);
  const [openId, setOpenId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [selectedSacramento, setSelectedSacramento] = useState<SacramentoType>('eucaristia');
  const [initializedSelection, setInitializedSelection] = useState(false);
  const [shareRitoOpen, setShareRitoOpen] = useState(false);
  const [modalSelecaoOpen, setModalSelecaoOpen] = useState(false);
  const [modalDetalhesOpen, setModalDetalhesOpen] = useState(false);
  const [savingSelecao, setSavingSelecao] = useState(false);

  const configAba = turma?.trilhasConfig?.[selectedSacramento] || {
    dataCelebracao: (selectedSacramento === 'eucaristia' && turma?.dataCelebracaoSacramento) ? turma.dataCelebracaoSacramento : undefined,
    etapasRito: (selectedSacramento === 'eucaristia' && turma?.etapasRito) ? turma.etapasRito : undefined
  };

  const [editandoData, setEditandoData] = useState(false);
  const [dataValue, setDataValue] = useState(configAba.dataCelebracao ?? "");
  const [savingData, setSavingData] = useState(false);
  const [busca, setBusca] = useState("");
  const [ritoOpen, setRitoOpen] = useState(false);

  const catequizandosTrilhaIds: string[] = configAba.catequizandosTrilha ?? [];

  const todosOsCatequizandos = useMemo(() =>
    catequizandos.filter(c => c.status === "ativo" || c.status === "inscrito" || !c.status),
    [catequizandos]
  );

  const catDaTrilha = useMemo(() => {
    if (catequizandosTrilhaIds.length === 0) return [];
    return todosOsCatequizandos.filter(c => catequizandosTrilhaIds.includes(c.id));
  }, [todosOsCatequizandos, catequizandosTrilhaIds]);

  const catFiltrados = useMemo(() =>
    catDaTrilha.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase())),
    [catDaTrilha, busca]
  );

  useEffect(() => {
    if (turma && !initializedSelection) {
      let nearest: SacramentoType = 'eucaristia';
      let nearestDiff = Infinity;
      const today = new Date().getTime();
      for (const sac of ['batismo', 'eucaristia', 'crisma'] as SacramentoType[]) {
        let dateStr = turma.trilhasConfig?.[sac]?.dataCelebracao;
        if (sac === 'eucaristia' && !dateStr && turma.dataCelebracaoSacramento) dateStr = turma.dataCelebracaoSacramento;
        if (dateStr) {
          const time = new Date(dateStr + "T00:00:00").getTime();
          const diff = time - today;
          if (diff >= 0 && diff < nearestDiff) { nearestDiff = diff; nearest = sac; }
          else if (nearestDiff === Infinity) nearest = sac;
        }
      }
      setSelectedSacramento(nearest);
      setInitializedSelection(true);
    }
  }, [turma, initializedSelection]);

  useEffect(() => {
    setDataValue(configAba.dataCelebracao ?? "");
    setEditandoData(false);
  }, [selectedSacramento, configAba.dataCelebracao]);

  const handleSaveCat = async (updated: Catequizando) => {
    setSavingId(updated.id);
    try {
      await upsertCatequizando(updated);
      queryClient.invalidateQueries({ queryKey: ["catequizandos", id] });
      toast.success("Trilha salva com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveData = async () => {
    if (!turma) return;
    setSavingData(true);
    try {
      const updatedConfig = {
        ...(turma.trilhasConfig || {}),
        [selectedSacramento]: {
          ...(turma.trilhasConfig?.[selectedSacramento] || {}),
          dataCelebracao: dataValue || undefined
        }
      };
      const payload: Turma = { ...turma, trilhasConfig: updatedConfig };
      if (selectedSacramento === 'eucaristia') payload.dataCelebracaoSacramento = dataValue || undefined;
      await upsertTurma(payload);
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      toast.success(`Data da celebração para ${selectedSacramento} salva!`);
      setEditandoData(false);
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
    } finally {
      setSavingData(false);
    }
  };

  const handleSaveEtapaRito = async (etapaKey: string, newVal: string) => {
    if (!turma) return;
    try {
      const sacConfig = turma.trilhasConfig?.[selectedSacramento] || {};
      const legacyEtapas = (selectedSacramento === 'eucaristia' ? turma.etapasRito : undefined) || {};
      const mergedEtapasRito = { ...(sacConfig.etapasRito || legacyEtapas), [etapaKey]: newVal };
      const updatedConfig = {
        ...(turma.trilhasConfig || {}),
        [selectedSacramento]: { ...sacConfig, etapasRito: mergedEtapasRito }
      };
      const payload: Turma = { ...turma, trilhasConfig: updatedConfig };
      if (selectedSacramento === 'eucaristia') payload.etapasRito = mergedEtapasRito;
      await upsertTurma(payload);
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      toast.success(`Etapa atualizada!`);
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    }
  };

  const handleSaveSelecaoCatequizandos = async (ids: string[]) => {
    if (!turma) return;
    setSavingSelecao(true);
    try {
      const updatedConfig = {
        ...(turma.trilhasConfig || {}),
        [selectedSacramento]: {
          ...(turma.trilhasConfig?.[selectedSacramento] || {}),
          catequizandosTrilha: ids,
        }
      };
      const payload: Turma = { ...turma, trilhasConfig: updatedConfig };
      await upsertTurma(payload);
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      setModalSelecaoOpen(false);
      toast.success(`Catequizandos da trilha de ${selectedSacramento} atualizados!`);
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
    } finally {
      setSavingSelecao(false);
    }
  };

  // Calcular estatísticas atuais
  const currentStats = useMemo(() => {
    const total = catDaTrilha.length;
    let totalEtapasConcluidas = 0;
    let freqBaixa = 0;
    catDaTrilha.forEach(cat => {
      const t = getTrilhaState(cat, selectedSacramento);
      totalEtapasConcluidas += ETAPAS_PARTICIPACAO.filter(e => t[e.key as keyof TrilhaSacramentalType]).length;
      const freq = calcFrequencia(cat, encontros);
      if (freq.total > 0 && freq.percent < 75) freqBaixa++;
    });
    const maxEtapas = total * ETAPAS_PARTICIPACAO.length;
    return {
      total,
      etapasPercent: maxEtapas === 0 ? 0 : Math.round((totalEtapasConcluidas / maxEtapas) * 100),
      freqBaixa
    };
  }, [catDaTrilha, encontros, selectedSacramento]);

  const etapasRitoAtual = selectedSacramento === 'batismo' ? ETAPAS_RITO_BATISMO : ETAPAS_RITO;
  const sacramentoLabel = SACRAMENTO_CONFIG[selectedSacramento].label;

  return (
    <div className="space-y-5 pb-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 pt-4">
        <button onClick={() => navigate(`/turmas/${id}`)} className="back-btn shrink-0">
          <ArrowLeft className="h-5 w-5 text-black" />
        </button>
        <div className="flex-1 text-center pr-10">
          <h1 className="text-lg font-black text-foreground tracking-tight uppercase leading-tight">
            Trilha Sacramental
          </h1>
          {turma && <p className="text-xs text-muted-foreground font-medium">{turma.nome} · {turma.ano}</p>}
        </div>
      </div>

      {/* Abas dos sacramentos no topo */}
      <div className="flex bg-muted/50 p-1.5 rounded-2xl gap-1 overflow-x-auto hide-scrollbar">
        {[
          { key: 'batismo', label: 'Batismo' },
          { key: 'eucaristia', label: 'Eucaristia' },
          { key: 'crisma', label: 'Crisma' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => { setSelectedSacramento(s.key as SacramentoType); setOpenId(null); setBusca(""); }}
            className={cn(
              "flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-xs md:text-sm font-black uppercase tracking-wider transition-all duration-300",
              selectedSacramento === s.key 
                ? "bg-white text-primary shadow-sm ring-1 ring-black/5" 
                : "text-muted-foreground hover:text-foreground hover:bg-white/50"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Botão de gerenciar catequizandos da trilha */}
      <button
        onClick={() => setModalSelecaoOpen(true)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <UserPlus className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-black text-primary">Gerenciar catequizandos da trilha</p>
            <p className="text-[10px] text-muted-foreground font-medium">
              {catequizandosTrilhaIds.length === 0
                ? `Nenhum selecionado para ${sacramentoLabel}`
                : `${catequizandosTrilhaIds.length} catequizando${catequizandosTrilhaIds.length !== 1 ? "s" : ""} em ${sacramentoLabel}`}
            </p>
          </div>
        </div>
        <ChevronDown className="h-4 w-4 text-primary/60 group-hover:text-primary transition-colors" />
      </button>

      {/* PAINEL INTELIGENTE — substitui os 3 cards, agora abre modal ao clicar */}
      <PainelResumo
        stats={currentStats}
        sacramento={selectedSacramento}
        onClick={() => setModalDetalhesOpen(true)}
      />

      {/* Modal de Detalhes do Painel */}
      <ModalDetalhesTrilha
        open={modalDetalhesOpen}
        onClose={() => setModalDetalhesOpen(false)}
        catequizandos={todosOsCatequizandos}
        encontros={encontros}
        turma={turma}
        selectedSacramento={selectedSacramento}
        onSelectSacramento={(s) => {
           setSelectedSacramento(s);
           setOpenId(null);
           setBusca("");
           setModalDetalhesOpen(false); // Fecha o modal ao selecionar para focar na aba
        }}
      />

      {/* CARD DATA DE CELEBRAÇÃO PREMIUM */}
      <CardDataCelebracao
        sacramento={selectedSacramento}
        dataCelebracao={configAba.dataCelebracao}
        editandoData={editandoData}
        dataValue={dataValue}
        savingData={savingData}
        onSetEditando={() => { setEditandoData(true); setDataValue(configAba.dataCelebracao ?? ""); }}
        onChangeData={setDataValue}
        onSave={handleSaveData}
        onCancelar={() => setEditandoData(false)}
      />

      {/* Etapas do Rito */}
      {turma && (
        <div className="float-card bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 overflow-hidden">
          <button
            onClick={() => setRitoOpen(!ritoOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-amber-100/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                <Star className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-sm md:text-base font-black uppercase tracking-wider text-amber-700 text-left">
                Etapas de Preparação do Rito ({sacramentoLabel})
              </h2>
            </div>
            {ritoOpen ? <ChevronUp className="h-5 w-5 text-amber-700 shrink-0" /> : <ChevronDown className="h-5 w-5 text-amber-700 shrink-0" />}
          </button>

          {ritoOpen && (
            <div className="p-4 pt-0 space-y-3">
              {selectedSacramento === 'batismo' && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 mb-2">
                  <Baby className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-blue-700 leading-snug">Etapas específicas para a preparação do Batismo</p>
                </div>
              )}
              {etapasRitoAtual.map(etapa => {
                const Icon = etapa.icon;
                const dateVal = configAba.etapasRito?.[etapa.key] || "";
                return (
                  <div key={etapa.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-card border border-amber-100">
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-5 w-5 text-amber-600 shrink-0" />
                      <span className="text-sm md:text-base font-semibold text-foreground">{etapa.label}</span>
                    </div>
                    <input
                      type="date"
                      value={dateVal}
                      onChange={(e) => handleSaveEtapaRito(etapa.key, e.target.value)}
                      className="h-10 px-3 w-full sm:w-auto rounded-lg text-sm border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-amber-50/30"
                    />
                  </div>
                );
              })}
              {turma.codigoAcesso && (
                <button
                  onClick={() => setShareRitoOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 text-white text-sm font-black hover:bg-amber-600 active:scale-95 transition-all mt-1"
                >
                  <Share2 className="h-4 w-4" />
                  Compartilhar Etapas com os Pais
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* QR Modal */}
      {turma?.codigoAcesso && (() => {
        const ritoUrl = `${getAppUrl()}/rito-sacramental/${turma.codigoAcesso}/${selectedSacramento}`;
        return (
          <QRShareModal
            open={shareRitoOpen}
            onClose={() => setShareRitoOpen(false)}
            url={ritoUrl}
            title="Compartilhar Etapas do Rito"
            description={<>Pais e responsáveis podem ver as datas de preparação para o rito de <strong className="text-amber-700 capitalize">{selectedSacramento}</strong>.</>}
            accentColor="bg-amber-500"
            shareTitle={`Preparação para ${selectedSacramento}`}
            shareText={`Confira as datas de preparação para o rito de ${selectedSacramento}:`}
          />
        );
      })()}

      {/* Lista de catequizandos */}
      {catequizandosTrilhaIds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-6 text-center rounded-3xl border-2 border-dashed border-muted-foreground/20 bg-muted/10">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-primary/50" />
          </div>
          <p className="text-base font-black text-foreground mb-1">Nenhum catequizando nesta trilha</p>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs">
            Selecione os catequizandos que estão se preparando para receber o <strong>{sacramentoLabel}</strong>.
          </p>
          <button
            onClick={() => setModalSelecaoOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-black hover:bg-primary/90 active:scale-95 transition-all"
          >
            <UserPlus className="h-4 w-4" />
            Selecionar Catequizandos
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder={`Buscar na trilha de ${sacramentoLabel}...`}
            className="w-full h-10 px-4 rounded-2xl text-sm border border-border/60 bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {isLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl bg-muted/50 animate-pulse" />)}</div>
          ) : catFiltrados.length === 0 ? (
            <div className="text-center py-10">
              <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-medium">Nenhum catequizando encontrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {catFiltrados.map(cat => (
                <CatequizandoRow
                  key={cat.id}
                  cat={cat}
                  encontros={encontros}
                  selectedSacramento={selectedSacramento}
                  isOpen={openId === cat.id}
                  onToggle={() => setOpenId(openId === cat.id ? null : cat.id)}
                  onSave={handleSaveCat}
                  saving={savingId === cat.id}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal de seleção */}
      <ModalSelecaoCatequizandos
        open={modalSelecaoOpen}
        onClose={() => setModalSelecaoOpen(false)}
        todosOsCatequizandos={todosOsCatequizandos}
        selecionados={catequizandosTrilhaIds}
        onSave={handleSaveSelecaoCatequizandos}
        saving={savingSelecao}
        sacramento={selectedSacramento}
      />
    </div>
  );
}
