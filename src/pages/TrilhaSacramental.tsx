import { useParams, useNavigate } from "react-router-dom";
import { useCatequizandos, useEncontros, useTurmas } from "@/hooks/useSupabaseData";
import { upsertCatequizando, upsertTurma } from "@/lib/supabaseStore";
import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle2, Circle, AlertTriangle,
  Calendar, Users, FileText, BookOpen, Music,
  Heart, Baby, Star, Plus, Trash2, Save, Share2,
  UserPlus, X, Check, Sparkles, Cross,
  ChevronDown, ChevronUp, Flag, Trophy,
  BarChart3, TrendingUp, ShieldAlert, PartyPopper,
} from "lucide-react";
import type { Catequizando, TrilhaSacramental as TrilhaSacramentalType, Turma } from "@/lib/store";
import { cn, getAppUrl } from "@/lib/utils";
import { QRShareModal } from "@/components/QRShareModal";

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────
type SacramentoType = "batismo" | "eucaristia" | "crisma";
type NodeStatus = "done" | "partial" | "pending" | "skipped";
type NodeTipo = "inicio" | "condicional" | "frequencia" | "rito" | "docs" | "celebracao";

interface EtapaCustom { id: string; label: string; ordem: number; }
interface NodeDef {
  id: string; label: string; tipo: NodeTipo; icon: any;
  emoji?: string; condicional?: "batismo" | "eucaristia";
  isCustom?: boolean; isDefault?: boolean;
}

// ─────────────────────────────────────────────────────────────
// CONFIG DOS SACRAMENTOS
// ─────────────────────────────────────────────────────────────
const SAC_CFG = {
  batismo: {
    label: "Batismo", gradient: "from-sky-400 to-indigo-500",
    gradientLight: "from-sky-50 to-indigo-50",
    accent: "text-sky-600", accentBg: "bg-sky-500", border: "border-sky-200",
    color: "#0284c7", emoji: "🕊️", icon: Baby,
  },
  eucaristia: {
    label: "Eucaristia", gradient: "from-amber-400 to-orange-500",
    gradientLight: "from-amber-50 to-orange-50",
    accent: "text-amber-600", accentBg: "bg-amber-500", border: "border-amber-200",
    color: "#d97706", emoji: "✨", icon: Star,
  },
  crisma: {
    label: "Crisma", gradient: "from-violet-500 to-fuchsia-600",
    gradientLight: "from-violet-50 to-fuchsia-50",
    accent: "text-violet-600", accentBg: "bg-violet-600", border: "border-violet-200",
    color: "#7c3aed", emoji: "👑", icon: Sparkles,
  },
} as const;

// ─────────────────────────────────────────────────────────────
// RITOS PADRÃO POR SACRAMENTO (removíveis pelo catequista)
// ─────────────────────────────────────────────────────────────
const DEFAULT_RITOS: Record<SacramentoType, NodeDef[]> = {
  eucaristia: [
    { id: "reuniao_pais",           label: "Reunião com os Pais",       tipo: "rito", icon: Heart,    isDefault: true },
    { id: "celebracao_penitencial", label: "Celebração Penitencial",    tipo: "rito", icon: Cross,    isDefault: true },
    { id: "ensaio",                 label: "Ensaio do Rito",            tipo: "rito", icon: Music,    isDefault: true },
    { id: "documentos",             label: "Entrega de Documentos",     tipo: "docs", icon: FileText, isDefault: false },
  ],
  crisma: [
    { id: "reuniao_pais",  label: "Reunião com os Pais",      tipo: "rito", icon: Heart,    isDefault: true },
    { id: "retiro",        label: "Retiro Espiritual",         tipo: "rito", icon: Cross,    isDefault: true },
    { id: "confissao",     label: "Confissão / Penitencial",  tipo: "rito", icon: BookOpen, isDefault: true },
    { id: "ensaio",        label: "Ensaio do Rito",           tipo: "rito", icon: Music,    isDefault: true },
    { id: "documentos",   label: "Entrega de Documentos",     tipo: "docs", icon: FileText, isDefault: false },
  ],
  batismo: [
    { id: "reuniao_pais", label: "Reunião com Pais/Padrinhos", tipo: "rito", icon: Heart,    isDefault: true },
    { id: "preparacao",   label: "Preparação Espiritual",      tipo: "rito", icon: Cross,    isDefault: true },
    { id: "documentos",  label: "Entrega de Documentos",       tipo: "docs", icon: FileText, isDefault: false },
  ],
};

function buildNodes(sac: SacramentoType, etapasCustom: EtapaCustom[], removidas: string[]): NodeDef[] {
  const inicio: NodeDef = { id: "inicio", label: "Início da Jornada", tipo: "inicio", icon: Flag };

  const condicionais: NodeDef[] = [];
  if (sac === "eucaristia" || sac === "crisma")
    condicionais.push({ id: "bat_check", label: "Batismo (verificar)", tipo: "condicional", icon: Baby, condicional: "batismo", emoji: "🕊️" });
  if (sac === "crisma")
    condicionais.push({ id: "euc_check", label: "Eucaristia (verificar)", tipo: "condicional", icon: Star, condicional: "eucaristia", emoji: "✨" });

  const freq: NodeDef = { id: "encontros", label: "Encontros de Catequese", tipo: "frequencia", icon: BookOpen };

  const defaultRitos = DEFAULT_RITOS[sac].filter(n => n.id === "documentos" || !removidas.includes(n.id));

  const customNodes: NodeDef[] = [...etapasCustom]
    .sort((a, b) => a.ordem - b.ordem)
    .map(e => ({ id: e.id, label: e.label, tipo: "rito" as NodeTipo, icon: Star, isCustom: true }));

  const celebLabel = sac === "batismo" ? "Celebração do Batismo" : sac === "eucaristia" ? "Celebração da Eucaristia" : "Celebração do Crisma";
  const celebEmoji = { batismo: "🕊️", eucaristia: "✨", crisma: "👑" }[sac];
  const celebracao: NodeDef = { id: "celebracao", label: celebLabel, tipo: "celebracao", icon: Trophy, emoji: celebEmoji };

  return [inicio, ...condicionais, freq, ...defaultRitos, ...customNodes, celebracao];
}

// ─────────────────────────────────────────────────────────────
// DOCS PADRÃO
// ─────────────────────────────────────────────────────────────
const DOCS_PADRAO = [
  { key: "documentos_rg",       label: "RG / Identidade" },
  { key: "documentos_batistério", label: "Certidão de Batismo" },
  { key: "documentos_residencia", label: "Comprovante de Residência" },
  { key: "contribuicao",        label: "Contribuição / Taxas" },
] as const;

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function defaultTrilha(): TrilhaSacramentalType {
  return {
    documentos_entregues: false, documentos_rg: false,
    "documentos_batistério": false, documentos_residencia: false,
    documentos_custom: [], contribuicao: false,
    participacao_missas: false, participacao_encontros: false,
    participacao_eventos: false, atividades_extras: false, observacoes: "",
  };
}

function getTrilhaState(cat: Catequizando, sac: SacramentoType): TrilhaSacramentalType {
  if (cat.trilhasPorSacramento?.[sac]) return cat.trilhasPorSacramento[sac];
  if (sac === "eucaristia" && cat.trilhaSacramental) return cat.trilhaSacramental;
  return defaultTrilha();
}

function calcFrequencia(cat: Catequizando, encontros: any[]) {
  const realizados = encontros.filter(e => e.status === "realizado");
  if (!realizados.length) return { percent: 0, presencas: 0, total: 0 };
  const presencas = realizados.filter(e => (e.presencas || []).includes(cat.id)).length;
  return { percent: Math.round((presencas / realizados.length) * 100), presencas, total: realizados.length };
}

function isDatePassed(dateStr?: string) {
  if (!dateStr) return false;
  return new Date(dateStr + "T23:59:59") < new Date();
}

function calcNodeStatuses(
  cat: Catequizando, nodes: NodeDef[],
  encontros: any[], etapasRito: Record<string, string>, sac: SacramentoType
): Record<string, NodeStatus> {
  const trilha = getTrilhaState(cat, sac);
  const sacramentos: any = cat.dadosPastorais?.sacramentos ?? cat.sacramentos ?? {};
  const freq = calcFrequencia(cat, encontros);
  const res: Record<string, NodeStatus> = {};

  for (const node of nodes) {
    switch (node.tipo) {
      case "inicio": res[node.id] = "done"; break;
      case "condicional": {
        const received = sacramentos[node.condicional!]?.recebido === true;
        res[node.id] = received ? "skipped" : "pending"; break;
      }
      case "frequencia":
        if (freq.total === 0) { res[node.id] = "pending"; break; }
        res[node.id] = freq.percent >= 75 ? "done" : freq.percent >= 40 ? "partial" : "pending"; break;
      case "rito": {
        const d = etapasRito[node.id];
        res[node.id] = !d ? "pending" : isDatePassed(d) ? "done" : "partial"; break;
      }
      case "docs": {
        const done = DOCS_PADRAO.filter(d => (trilha as any)[d.key]).length
          + (trilha.documentos_custom || []).filter(d => d.entregue).length;
        const total = DOCS_PADRAO.length + (trilha.documentos_custom || []).length;
        res[node.id] = total === 0 ? "pending" : done === total ? "done" : done > 0 ? "partial" : "pending"; break;
      }
      case "celebracao":
        res[node.id] = sacramentos[sac]?.recebido === true ? "done" : "pending"; break;
      default: res[node.id] = "pending";
    }
  }
  return res;
}

function calcProgress(statuses: Record<string, NodeStatus>, nodes: NodeDef[]) {
  const relevant = nodes.filter(n => statuses[n.id] !== "skipped");
  const done = relevant.filter(n => statuses[n.id] === "done").length;
  return relevant.length === 0 ? 0 : Math.round((done / relevant.length) * 100);
}

const NODE_STYLE: Record<NodeStatus, { bg: string; border: string; text: string; badge: string; dot: string }> = {
  done:    { bg: "bg-emerald-50",  border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  partial: { bg: "bg-amber-50",    border: "border-amber-200",   text: "text-amber-700",   badge: "bg-amber-100 text-amber-700",     dot: "bg-amber-400" },
  pending: { bg: "bg-white",       border: "border-muted/40",    text: "text-muted-foreground", badge: "bg-muted text-muted-foreground", dot: "bg-muted" },
  skipped: { bg: "bg-sky-50",      border: "border-sky-200",     text: "text-sky-600",     badge: "bg-sky-100 text-sky-600",         dot: "bg-sky-400" },
};

// ─────────────────────────────────────────────────────────────
// COMPONENTE: NÓ DA TRILHA
// ─────────────────────────────────────────────────────────────
function TrilhaNode({
  node, status, dateVal, catCount, totalCats, isLast, sac,
  onChangeDate, onRemove,
}: {
  node: NodeDef; status: NodeStatus; dateVal?: string;
  catCount: number; totalCats: number; isLast: boolean; sac: SacramentoType;
  onChangeDate?: (v: string) => void; onRemove?: () => void;
}) {
  const Icon = node.icon;
  const cfg = SAC_CFG[sac];
  const style = NODE_STYLE[status];

  const Connector = !isLast ? (
    <div className={cn("absolute left-[17px] top-full w-0.5 z-0 min-h-[24px]",
      status === "done" ? "bg-emerald-200" : "bg-border/50"
    )} style={{ height: "28px" }} />
  ) : null;

  // INÍCIO
  if (node.tipo === "inicio") {
    return (
      <div className="relative flex items-center gap-4 pb-7">
        <div className="relative flex flex-col items-center shrink-0">
          <div className={cn("w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg z-10", cfg.gradient)}>
            <Flag className="h-4 w-4 text-white" />
          </div>
          {Connector}
        </div>
        <div>
          <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", cfg.accent)}>INÍCIO DA JORNADA</p>
          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
            {totalCats} catequizando{totalCats !== 1 ? "s" : ""} nesta trilha
          </p>
        </div>
      </div>
    );
  }

  // CELEBRAÇÃO
  if (node.tipo === "celebracao") {
    return (
      <div className="relative flex items-center gap-4 pt-2">
        <div className="relative flex flex-col items-center shrink-0">
          <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shadow-lg z-10",
            status === "done" ? "bg-gradient-to-br from-emerald-400 to-emerald-600" : `bg-gradient-to-br ${cfg.gradient}`
          )}>
            <Trophy className="h-4 w-4 text-white" />
          </div>
        </div>
        <div className={cn("flex-1 rounded-2xl border-2 p-4", status === "done" ? "bg-emerald-50 border-emerald-300" : "border-dashed border-muted-foreground/30 bg-muted/10")}>
          <p className="text-sm font-black">{node.emoji} {node.label}</p>
          <p className={cn("text-xs font-bold mt-0.5", status === "done" ? "text-emerald-600" : "text-muted-foreground")}>
            {catCount} de {totalCats} com sacramento recebido
          </p>
          {totalCats > 0 && (
            <div className="mt-2 h-1.5 bg-muted/50 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.round((catCount / totalCats) * 100)}%` }} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // CONDICIONAL
  if (node.tipo === "condicional") {
    const allHave = catCount === totalCats;
    return (
      <div className="relative flex items-center gap-4 pb-7">
        <div className="relative flex flex-col items-center shrink-0">
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shadow-sm z-10",
            allHave ? "bg-sky-100 border border-sky-300" : "bg-amber-100 border border-amber-300"
          )}>
            <Icon className={cn("h-4 w-4", allHave ? "text-sky-600" : "text-amber-600")} />
          </div>
          {Connector}
        </div>
        <div className={cn("flex-1 rounded-xl border px-3 py-2.5", allHave ? "bg-sky-50 border-sky-200" : "bg-amber-50 border-amber-200")}>
          <p className="text-xs font-black">{node.emoji} {node.label}</p>
          <p className={cn("text-[10px] font-bold mt-0.5", allHave ? "text-sky-600" : "text-amber-600")}>
            {allHave
              ? `✓ Todos os ${totalCats} já possuem`
              : `${totalCats - catCount} ainda não possuem — precisam cumprir primeiro`}
          </p>
        </div>
      </div>
    );
  }

  // FREQUÊNCIA
  if (node.tipo === "frequencia") {
    const pct = totalCats > 0 ? Math.round((catCount / totalCats) * 100) : 0;
    return (
      <div className="relative flex items-start gap-4 pb-7">
        <div className="relative flex flex-col items-center shrink-0">
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shadow-sm z-10", style.badge)}>
            <BookOpen className="h-4 w-4" />
          </div>
          {Connector}
        </div>
        <div className={cn("flex-1 rounded-xl border px-3 py-2.5", style.bg, style.border)}>
          <p className={cn("text-xs font-black mb-2", style.text)}>{node.label}</p>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 h-2 bg-muted/40 rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-700",
                pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400"
              )} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] font-black text-muted-foreground shrink-0">{catCount}/{totalCats} ≥75%</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Frequência mínima exigida: 75%</p>
        </div>
      </div>
    );
  }

  // RITO / DOCS
  const pct = totalCats > 0 ? Math.round((catCount / totalCats) * 100) : 0;

  return (
    <div className="relative flex items-start gap-4 pb-7">
      <div className="relative flex flex-col items-center shrink-0">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shadow-sm z-10", style.badge)}>
          <Icon className="h-4 w-4" />
        </div>
        {Connector}
      </div>
      <div className={cn("flex-1 rounded-xl border px-3 py-2.5 space-y-2", style.bg, style.border)}>
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-xs font-black leading-tight flex-1", style.text)}>{node.label}</p>
          <div className="flex items-center gap-1 shrink-0">
            {status === "done" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
            {status === "partial" && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
            {(node.isDefault || node.isCustom) && onRemove && node.id !== "documentos" && (
              <button onClick={onRemove}
                className="w-6 h-6 flex items-center justify-center rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {node.tipo === "rito" && onChangeDate && (
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              type="date" value={dateVal || ""}
              onChange={e => onChangeDate(e.target.value)}
              className="flex-1 h-8 px-2 text-xs rounded-lg border border-border/60 bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {dateVal && (
              <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full shrink-0",
                isDatePassed(dateVal) ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              )}>
                {isDatePassed(dateVal) ? "Realizado ✓" : "Agendado"}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-700",
              pct === 100 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-muted-foreground/30"
            )} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] font-bold text-muted-foreground shrink-0">{catCount}/{totalCats}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AVATAR CARD
// ─────────────────────────────────────────────────────────────
function AvatarCard({ cat, progress, hasAlert, sacRecebido, onClick }: {
  cat: Catequizando; progress: number; hasAlert: boolean; sacRecebido: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-2xl border-2 border-transparent bg-white hover:border-primary/30 hover:shadow-md transition-all min-w-[72px] max-w-[80px] active:scale-95">
      <div className="relative">
        <div className={cn("w-12 h-12 rounded-full overflow-hidden border-2 shadow flex items-center justify-center bg-primary/10",
          sacRecebido ? "border-emerald-400" : hasAlert ? "border-red-400" : "border-muted"
        )}>
          {cat.foto
            ? <img src={cat.foto} alt={cat.nome} className="w-full h-full object-cover" />
            : <span className="text-base font-black text-primary/70">{cat.nome.charAt(0)}</span>}
        </div>
        <div className={cn("absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center",
          sacRecebido ? "bg-emerald-500" : hasAlert ? "bg-red-500" : progress >= 75 ? "bg-amber-400" : "bg-slate-300"
        )}>
          {sacRecebido && <Check className="h-2.5 w-2.5 text-white" />}
          {!sacRecebido && hasAlert && <AlertTriangle className="h-2 w-2 text-white" />}
        </div>
      </div>
      <p className="text-[9px] font-black uppercase text-center leading-tight line-clamp-2 w-full px-0.5">
        {cat.nome.split(" ")[0]}
      </p>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all",
          progress === 100 ? "bg-emerald-500" : progress >= 50 ? "bg-amber-400" : "bg-primary/60"
        )} style={{ width: `${progress}%` }} />
      </div>
      <span className="text-[8px] font-bold text-muted-foreground">{progress}%</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// DRAWER INDIVIDUAL DO CATEQUIZANDO
// ─────────────────────────────────────────────────────────────
function DrawerCatequizando({ cat, sac, encontros, open, onClose, onSave, saving }: {
  cat: Catequizando; sac: SacramentoType; encontros: any[];
  open: boolean; onClose: () => void;
  onSave: (updated: Catequizando) => void; saving: boolean;
}) {
  const [localTrilha, setLocalTrilha] = useState<TrilhaSacramentalType>(getTrilhaState(cat, sac));
  const [localSac, setLocalSac] = useState<any>(cat.dadosPastorais?.sacramentos ?? cat.sacramentos ?? {});
  const [newDocNome, setNewDocNome] = useState("");
  const freq = calcFrequencia(cat, encontros);
  const freqAlert = freq.total > 0 && freq.percent < 75;
  const cfg = SAC_CFG[sac];
  const docsCustom = localTrilha.documentos_custom || [];
  const sacRecebido = localSac?.[sac]?.recebido === true;

  useEffect(() => {
    if (!open) return;
    setLocalTrilha(getTrilhaState(cat, sac));
    setLocalSac(cat.dadosPastorais?.sacramentos ?? cat.sacramentos ?? {});
    setNewDocNome("");
  }, [cat, sac, open]);

  const toggle = (key: keyof TrilhaSacramentalType) => setLocalTrilha(p => ({ ...p, [key]: !p[key] }));
  const toggleSac = (key: "batismo" | "eucaristia" | "crisma") =>
    setLocalSac((p: any) => ({ ...p, [key]: { ...(p[key] || {}), recebido: !p[key]?.recebido } }));
  const toggleDocCustom = (id: string) => setLocalTrilha(p => ({
    ...p, documentos_custom: (p.documentos_custom || []).map(d => d.id === id ? { ...d, entregue: !d.entregue } : d)
  }));
  const addDoc = () => {
    if (!newDocNome.trim()) return;
    setLocalTrilha(p => ({ ...p, documentos_custom: [...(p.documentos_custom || []), { id: crypto.randomUUID(), nome: newDocNome.trim(), entregue: false }] }));
    setNewDocNome("");
  };
  const removeDoc = (id: string) => setLocalTrilha(p => ({
    ...p, documentos_custom: (p.documentos_custom || []).filter(d => d.id !== id)
  }));
  const handleSave = () => onSave({
    ...cat,
    dadosPastorais: { ...(cat.dadosPastorais || {}), sacramentos: localSac },
    trilhasPorSacramento: { ...(cat.trilhasPorSacramento || {}), [sac]: localTrilha },
  });

  if (!open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[9999] sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4">
        <div className="bg-white dark:bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: "90vh" }}
          onClick={e => e.stopPropagation()}>

          {/* Handle mobile */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
          </div>

          {/* Header */}
          <div className={cn("px-5 py-4 bg-gradient-to-r text-white flex items-center gap-3 justify-between", cfg.gradient)}>
            <div className="flex items-center gap-3 min-w-0">
              {cat.foto
                ? <img src={cat.foto} className="w-10 h-10 rounded-xl object-cover border-2 border-white/30 shrink-0" alt="" />
                : <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black text-base shrink-0">{cat.nome.charAt(0)}</div>}
              <div className="min-w-0">
                <p className="font-black text-sm leading-tight truncate">{cat.nome}</p>
                <p className="text-[10px] text-white/70 font-semibold">{cfg.emoji} Trilha {cfg.label}</p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Situação Sacramental */}
            <section>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                <Cross className="h-3.5 w-3.5" /> Situação Sacramental
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {(["batismo", "eucaristia", "crisma"] as const).map(s => {
                  const r = localSac?.[s]?.recebido ?? false;
                  return (
                    <button key={s} onClick={() => toggleSac(s)}
                      className={cn("rounded-xl border p-2.5 text-center transition-all active:scale-95",
                        r ? "bg-emerald-50 border-emerald-200" : "bg-muted/20 border-muted/50"
                      )}>
                      {r
                        ? <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                        : <Circle className="h-5 w-5 text-muted-foreground mx-auto mb-1" />}
                      <p className="text-[10px] font-black uppercase">{s}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {sacRecebido ? (
              <div className="flex flex-col items-center justify-center gap-3 py-6 px-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-center">
                <PartyPopper className="h-10 w-10 text-emerald-500" />
                <div>
                  <p className="text-base font-black text-emerald-800 uppercase">Sacramento já recebido! {cfg.emoji}</p>
                  <p className="text-sm text-emerald-600 mt-1">Para editar a trilha, desmarque o sacramento acima.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Frequência */}
                <section>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Frequência nos Encontros
                  </h4>
                  {freq.total === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Nenhum encontro realizado ainda.</p>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all",
                            freq.percent >= 75 ? "bg-emerald-500" : freq.percent >= 50 ? "bg-amber-500" : "bg-red-400"
                          )} style={{ width: `${freq.percent}%` }} />
                        </div>
                        <span className={cn("text-sm font-black w-12 text-right",
                          freq.percent >= 75 ? "text-emerald-600" : freq.percent >= 50 ? "text-amber-600" : "text-red-500"
                        )}>{freq.percent}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{freq.presencas} de {freq.total} encontros realizados</p>
                      {freqAlert && (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200">
                          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                          <p className="text-xs text-red-600 font-semibold">Frequência abaixo de 75% — atenção necessária</p>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* Documentos */}
                <section>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-violet-600 mb-3 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Entrega de Documentos
                  </h4>
                  <div className="space-y-1.5">
                    {DOCS_PADRAO.map(doc => {
                      const checked = !!(localTrilha as any)[doc.key];
                      return (
                        <button key={doc.key} onClick={() => toggle(doc.key as any)}
                          className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-left",
                            checked ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-white border-border/50 text-foreground/70"
                          )}>
                          {checked ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                          <span className="text-sm font-semibold">{doc.label}</span>
                        </button>
                      );
                    })}
                    {docsCustom.map(doc => (
                      <div key={doc.id} className="flex items-center gap-1.5">
                        <button onClick={() => toggleDocCustom(doc.id)}
                          className={cn("flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-left",
                            doc.entregue ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-white border-border/50 text-foreground/70"
                          )}>
                          {doc.entregue ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                          <span className="text-sm font-semibold">{doc.nome}</span>
                        </button>
                        <button onClick={() => removeDoc(doc.id)}
                          className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-red-100 transition-colors shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <input
                        value={newDocNome} onChange={e => setNewDocNome(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addDoc()}
                        placeholder="Adicionar documento extra..."
                        className="flex-1 h-9 px-3 text-sm rounded-xl border border-border/60 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button onClick={addDoc}
                        className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 transition-colors shrink-0">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </section>

                {/* Observações */}
                <section>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Observações</h4>
                  <textarea
                    value={localTrilha.observacoes ?? ""}
                    onChange={e => setLocalTrilha(p => ({ ...p, observacoes: e.target.value }))}
                    placeholder="Anotações sobre este catequizando..."
                    className="w-full h-20 px-3 py-2 text-sm rounded-xl border border-border/60 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </section>
              </>
            )}
          </div>

          <div className="p-4 border-t border-border/30 bg-muted/10 shrink-0">
            <button onClick={handleSave} disabled={saving}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-primary text-white font-black text-sm uppercase tracking-widest hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60">
              <Save className="h-4 w-4" />
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL SELECIONAR CATEQUIZANDOS
// ─────────────────────────────────────────────────────────────
function ModalSelecaoCatequizandos({
  open, onClose, todos, selecionados, onSave, saving, sac,
}: {
  open: boolean; onClose: () => void;
  todos: Catequizando[]; selecionados: string[];
  onSave: (ids: string[]) => void; saving: boolean; sac: SacramentoType;
}) {
  const [local, setLocal] = useState<string[]>(selecionados);
  const [busca, setBusca] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLocal(selecionados); setBusca(""); }, [selecionados, open]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);

  if (!open) return null;

  const filtrados = todos.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()));
  const toggle = (id: string) => setLocal(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
  const cfg = SAC_CFG[sac];

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[9999] sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4">
        <div className="bg-white dark:bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl flex flex-col"
          style={{ maxHeight: "85vh" }} onClick={e => e.stopPropagation()}>
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
          </div>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br", cfg.gradient)}>
                <UserPlus className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wide">Catequizandos da Trilha</h3>
                <p className="text-[10px] text-muted-foreground">{cfg.emoji} {cfg.label}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-5 pt-4 pb-2 shrink-0">
            <input ref={inputRef} type="text" value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar catequizando..."
              className="w-full h-10 pl-4 rounded-xl text-sm border border-border/60 bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <div className="flex items-center justify-between mt-2.5">
              <span className="text-xs text-muted-foreground"><span className="font-black text-foreground">{local.length}</span> selecionados</span>
              <div className="flex gap-3">
                <button onClick={() => setLocal(filtrados.map(c => c.id))} className="text-[10px] font-black uppercase text-primary hover:text-primary/80">Todos</button>
                <span className="text-muted-foreground text-[10px]">·</span>
                <button onClick={() => setLocal([])} className="text-[10px] font-black uppercase text-muted-foreground hover:text-foreground">Limpar</button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-1.5 min-h-0">
            {filtrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Users className="h-10 w-10 text-muted-foreground/20 mb-2" />
                <p className="text-sm text-muted-foreground italic">Nenhum catequizando encontrado</p>
              </div>
            ) : filtrados.map(cat => {
              const isSel = local.includes(cat.id);
              return (
                <button key={cat.id} onClick={() => toggle(cat.id)}
                  className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left",
                    isSel ? cn("border-2", cfg.border, "bg-gradient-to-r", cfg.gradientLight) : "bg-white border-border/40 hover:bg-muted/30"
                  )}>
                  {cat.foto
                    ? <img src={cat.foto} alt={cat.nome} className="w-9 h-9 rounded-xl object-cover shrink-0 border-2 border-white shadow-sm" />
                    : <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-black",
                        isSel ? cn("bg-gradient-to-br text-white", cfg.gradient) : "bg-muted/50 text-muted-foreground"
                      )}>{cat.nome.charAt(0)}</div>}
                  <span className="flex-1 text-sm font-semibold truncate">{cat.nome}</span>
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                    isSel ? cn("bg-gradient-to-br border-transparent", cfg.gradient) : "border-muted-foreground/30"
                  )}>
                    {isSel && <Check className="h-3 w-3 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="p-5 border-t border-border/30 flex gap-3 shrink-0">
            <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-border text-sm font-black text-muted-foreground hover:bg-muted/50 transition-colors">
              Cancelar
            </button>
            <button onClick={() => onSave(local)} disabled={saving}
              className={cn("flex-1 h-11 rounded-xl text-white text-sm font-black uppercase tracking-wider active:scale-95 transition-all disabled:opacity-60 bg-gradient-to-r", cfg.gradient)}>
              {saving ? "Salvando..." : `Confirmar (${local.length})`}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function TrilhaSacramental() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: turmas = [] } = useTurmas();
  const { data: catequizandos = [], isLoading } = useCatequizandos(id);
  const { data: encontros = [] } = useEncontros(id);

  const turma = turmas.find(t => t.id === id);

  const [selectedSacramento, setSelectedSacramento] = useState<SacramentoType>("eucaristia");
  const [initializedSelection, setInitializedSelection] = useState(false);
  const [shareRitoOpen, setShareRitoOpen] = useState(false);
  const [modalSelecaoOpen, setModalSelecaoOpen] = useState(false);
  const [savingSelecao, setSavingSelecao] = useState(false);
  const [selectedCat, setSelectedCat] = useState<Catequizando | null>(null);
  const [savingCat, setSavingCat] = useState(false);
  const [novaEtapaLabel, setNovaEtapaLabel] = useState("");
  const [addingEtapa, setAddingEtapa] = useState(false);
  const [busca, setBusca] = useState("");
  const [mostrarTrilha, setMostrarTrilha] = useState(true);
  const [editandoData, setEditandoData] = useState(false);
  const [dataValue, setDataValue] = useState("");
  const [savingData, setSavingData] = useState(false);

  const configAba: any = turma?.trilhasConfig?.[selectedSacramento] || {
    dataCelebracao: selectedSacramento === "eucaristia" ? turma?.dataCelebracaoSacramento : undefined,
    etapasRito: selectedSacramento === "eucaristia" ? turma?.etapasRito : undefined,
  };

  const etapasCustom: EtapaCustom[] = configAba?.etapasCustom || [];
  const etapasRemovidas: string[] = configAba?.etapasRitoRemovidas || [];
  const etapasRito: Record<string, string> = configAba?.etapasRito || {};
  const catequizandosTrilhaIds: string[] = configAba?.catequizandosTrilha || [];
  const dataCelebracao: string | undefined = configAba?.dataCelebracao;

  const nodes = useMemo(() => buildNodes(selectedSacramento, etapasCustom, etapasRemovidas),
    [selectedSacramento, etapasCustom, etapasRemovidas]);

  const todosOsCatequizandos = useMemo(() =>
    catequizandos.filter(c => c.status === "ativo" || c.status === "inscrito" || !c.status),
    [catequizandos]);

  const catDaTrilha = useMemo(() =>
    catequizandosTrilhaIds.length === 0 ? [] : todosOsCatequizandos.filter(c => catequizandosTrilhaIds.includes(c.id)),
    [todosOsCatequizandos, catequizandosTrilhaIds]);

  const catFiltrados = useMemo(() =>
    catDaTrilha.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase())),
    [catDaTrilha, busca]);

  // Selecionar sacramento mais próximo ao iniciar
  useEffect(() => {
    if (turma && !initializedSelection) {
      let nearest: SacramentoType = "eucaristia";
      let nearestDiff = Infinity;
      const today = new Date().getTime();
      for (const sac of ["batismo", "eucaristia", "crisma"] as SacramentoType[]) {
        let dateStr = turma.trilhasConfig?.[sac]?.dataCelebracao;
        if (sac === "eucaristia" && !dateStr && turma.dataCelebracaoSacramento) dateStr = turma.dataCelebracaoSacramento;
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
    setDataValue(dataCelebracao ?? "");
    setEditandoData(false);
  }, [selectedSacramento, dataCelebracao]);

  // Estatísticas por nó
  const nodeStats = useMemo(() => {
    const stats: Record<string, { catCount: number }> = {};
    for (const node of nodes) {
      let count = 0;
      if (node.tipo === "inicio") { stats[node.id] = { catCount: catDaTrilha.length }; continue; }

      for (const cat of catDaTrilha) {
        const statuses = calcNodeStatuses(cat, nodes, encontros, etapasRito, selectedSacramento);
        const s = statuses[node.id];
        if (s === "done" || s === "skipped") count++;
      }
      stats[node.id] = { catCount: count };
    }
    return stats;
  }, [nodes, catDaTrilha, encontros, etapasRito, selectedSacramento]);

  // Dados de progresso por catequizando
  const catProgressMap = useMemo(() => {
    const map: Record<string, { progress: number; hasAlert: boolean; sacRecebido: boolean }> = {};
    for (const cat of catDaTrilha) {
      const statuses = calcNodeStatuses(cat, nodes, encontros, etapasRito, selectedSacramento);
      const progress = calcProgress(statuses, nodes);
      const freq = calcFrequencia(cat, encontros);
      const sacramentos: any = cat.dadosPastorais?.sacramentos ?? cat.sacramentos ?? {};
      map[cat.id] = {
        progress,
        hasAlert: freq.total > 0 && freq.percent < 75,
        sacRecebido: sacramentos[selectedSacramento]?.recebido === true,
      };
    }
    return map;
  }, [catDaTrilha, nodes, encontros, etapasRito, selectedSacramento]);

  // Salvar data da celebração
  const handleSaveData = async () => {
    if (!turma) return;
    setSavingData(true);
    try {
      const updatedConfig = {
        ...(turma.trilhasConfig || {}),
        [selectedSacramento]: { ...(turma.trilhasConfig?.[selectedSacramento] || {}), dataCelebracao: dataValue || undefined },
      };
      const payload: Turma = { ...turma, trilhasConfig: updatedConfig };
      if (selectedSacramento === "eucaristia") payload.dataCelebracaoSacramento = dataValue || undefined;
      await upsertTurma(payload);
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      toast.success("Data da celebração salva!");
      setEditandoData(false);
    } catch (e: any) { toast.error("Erro: " + e.message); }
    finally { setSavingData(false); }
  };

  // Salvar data de um rito
  const handleSaveEtapaRito = async (etapaKey: string, newVal: string) => {
    if (!turma) return;
    try {
      const sacConfig = turma.trilhasConfig?.[selectedSacramento] || {};
      const legacyEtapas = (selectedSacramento === "eucaristia" ? turma.etapasRito : undefined) || {};
      const mergedEtapasRito = { ...(sacConfig.etapasRito || legacyEtapas), [etapaKey]: newVal };
      const updatedConfig = {
        ...(turma.trilhasConfig || {}),
        [selectedSacramento]: { ...sacConfig, etapasRito: mergedEtapasRito },
      };
      const payload: Turma = { ...turma, trilhasConfig: updatedConfig };
      if (selectedSacramento === "eucaristia") payload.etapasRito = mergedEtapasRito;
      await upsertTurma(payload);
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
    } catch (err: any) { toast.error("Erro ao salvar: " + err.message); }
  };

  // Adicionar etapa customizada
  const handleAddEtapa = async () => {
    if (!novaEtapaLabel.trim() || !turma) return;
    setAddingEtapa(true);
    try {
      const sacConfig = turma.trilhasConfig?.[selectedSacramento] || {};
      const current: EtapaCustom[] = sacConfig.etapasCustom || [];
      const nova: EtapaCustom = { id: crypto.randomUUID(), label: novaEtapaLabel.trim(), ordem: current.length };
      const updatedConfig = {
        ...(turma.trilhasConfig || {}),
        [selectedSacramento]: { ...sacConfig, etapasCustom: [...current, nova] },
      };
      await upsertTurma({ ...turma, trilhasConfig: updatedConfig });
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      setNovaEtapaLabel("");
      toast.success("Etapa adicionada!");
    } catch (e: any) { toast.error("Erro: " + e.message); }
    finally { setAddingEtapa(false); }
  };

  // Remover etapa (default ou custom)
  const handleRemoveEtapa = async (nodeId: string, isCustom?: boolean) => {
    if (!turma) return;
    try {
      const sacConfig = turma.trilhasConfig?.[selectedSacramento] || {};
      let updatedSacConfig: any = { ...sacConfig };
      if (isCustom) {
        updatedSacConfig.etapasCustom = (sacConfig.etapasCustom || []).filter((e: EtapaCustom) => e.id !== nodeId);
      } else {
        updatedSacConfig.etapasRitoRemovidas = [...(sacConfig.etapasRitoRemovidas || []), nodeId];
      }
      const updatedConfig = { ...(turma.trilhasConfig || {}), [selectedSacramento]: updatedSacConfig };
      await upsertTurma({ ...turma, trilhasConfig: updatedConfig });
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      toast.success("Etapa removida!");
    } catch (e: any) { toast.error("Erro: " + e.message); }
  };

  // Restaurar etapa padrão removida
  const handleRestoreDefaultEtapas = async () => {
    if (!turma) return;
    try {
      const sacConfig = turma.trilhasConfig?.[selectedSacramento] || {};
      const updatedConfig = {
        ...(turma.trilhasConfig || {}),
        [selectedSacramento]: { ...sacConfig, etapasRitoRemovidas: [] },
      };
      await upsertTurma({ ...turma, trilhasConfig: updatedConfig });
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      toast.success("Etapas padrão restauradas!");
    } catch (e: any) { toast.error("Erro: " + e.message); }
  };

  // Salvar catequizando individual
  const handleSaveCat = async (updated: Catequizando) => {
    setSavingCat(true);
    try {
      await upsertCatequizando(updated);
      queryClient.invalidateQueries({ queryKey: ["catequizandos", id] });
      toast.success("Trilha salva com sucesso!");
    } catch (e: any) { toast.error("Erro: " + e.message); }
    finally { setSavingCat(false); }
  };

  // Salvar seleção de catequizandos
  const handleSaveSelecao = async (ids: string[]) => {
    if (!turma) return;
    setSavingSelecao(true);
    try {
      const updatedConfig = {
        ...(turma.trilhasConfig || {}),
        [selectedSacramento]: { ...(turma.trilhasConfig?.[selectedSacramento] || {}), catequizandosTrilha: ids },
      };
      await upsertTurma({ ...turma, trilhasConfig: updatedConfig });
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      setModalSelecaoOpen(false);
      toast.success("Catequizandos atualizados!");
    } catch (e: any) { toast.error("Erro: " + e.message); }
    finally { setSavingSelecao(false); }
  };

  const cfg = SAC_CFG[selectedSacramento];
  const diasRestantes = useMemo(() => {
    if (!dataCelebracao) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const cele = new Date(dataCelebracao + "T00:00:00");
    return Math.ceil((cele.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }, [dataCelebracao]);

  const prontos = catDaTrilha.filter(c => catProgressMap[c.id]?.progress === 100 || catProgressMap[c.id]?.sacRecebido).length;
  const alertas = catDaTrilha.filter(c => catProgressMap[c.id]?.hasAlert).length;
  const removidasCount = etapasRemovidas.length;

  return (
    <div className="space-y-4 pb-10 animate-fade-in">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-3 pt-4">
        <button onClick={() => navigate(`/turmas/${id}`)} className="back-btn shrink-0">
          <ArrowLeft className="h-5 w-5 text-black" />
        </button>
        <div className="flex-1 text-center pr-10">
          {turma?.nome && <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-[-2px]">{turma.nome}</p>}
          <h1 className="text-lg font-black text-foreground tracking-tight uppercase leading-tight">Trilha Sacramental</h1>
        </div>
      </div>

      {/* ── ABAS DOS SACRAMENTOS ── */}
      <div className="flex bg-muted/50 p-1.5 rounded-2xl gap-1">
        {(["batismo", "eucaristia", "crisma"] as SacramentoType[]).map(s => (
          <button key={s}
            onClick={() => { setSelectedSacramento(s); setBusca(""); }}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300",
              selectedSacramento === s ? "bg-white text-primary shadow-sm ring-1 ring-black/5" : "text-muted-foreground hover:text-foreground hover:bg-white/50"
            )}>
            {SAC_CFG[s].emoji} {SAC_CFG[s].label}
          </button>
        ))}
      </div>

      {/* ── CARD MINI STATS ── */}
      <div className={cn("rounded-2xl bg-gradient-to-r p-4 text-white", cfg.gradient)}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Trilha Sacramental</p>
            <p className="text-xl font-black">{cfg.emoji} {cfg.label}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black">{catDaTrilha.length}</p>
            <p className="text-[10px] opacity-80 font-bold uppercase">catequizandos</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/20 rounded-xl p-2 text-center">
            <p className="text-lg font-black">{prontos}</p>
            <p className="text-[9px] font-bold uppercase opacity-80">prontos</p>
          </div>
          <div className="bg-white/20 rounded-xl p-2 text-center">
            <p className={cn("text-lg font-black", alertas > 0 ? "text-red-200" : "")}>{alertas}</p>
            <p className="text-[9px] font-bold uppercase opacity-80">alertas</p>
          </div>
          <div className="bg-white/20 rounded-xl p-2 text-center cursor-pointer" onClick={() => setEditandoData(true)}>
            <p className="text-lg font-black">
              {diasRestantes === null ? "—" : diasRestantes < 0 ? "✓" : diasRestantes}
            </p>
            <p className="text-[9px] font-bold uppercase opacity-80">
              {diasRestantes === null ? "sem data" : diasRestantes < 0 ? "realizado" : "dias"}
            </p>
          </div>
        </div>

        {/* Data celebração inline */}
        {editandoData && (
          <div className="mt-3 flex gap-2 items-center">
            <input type="date" value={dataValue} onChange={e => setDataValue(e.target.value)}
              className="flex-1 h-9 px-3 text-sm rounded-xl border border-white/30 bg-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40"
              autoFocus />
            <button onClick={handleSaveData} disabled={savingData}
              className="h-9 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-black transition-colors">
              {savingData ? "..." : "Salvar"}
            </button>
            <button onClick={() => setEditandoData(false)} className="h-9 px-2 text-white/70 hover:text-white text-xs">✕</button>
          </div>
        )}
        {!editandoData && (
          <button onClick={() => setEditandoData(true)} className="mt-3 w-full text-[10px] font-bold text-white/60 hover:text-white/90 transition-colors flex items-center justify-center gap-1">
            <Calendar className="h-3 w-3" />
            {dataCelebracao
              ? `Celebração: ${new Date(dataCelebracao + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}`
              : "Definir data da celebração..."}
          </button>
        )}
      </div>

      {/* ── TRILHA VISUAL ── */}
      <div className="rounded-2xl border bg-white dark:bg-card overflow-hidden shadow-sm">
        <button
          onClick={() => setMostrarTrilha(!mostrarTrilha)}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br shrink-0", cfg.gradient)}>
              <Flag className="h-4 w-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-black uppercase tracking-wider">Trilha — {cfg.label}</p>
              <p className="text-[10px] text-muted-foreground font-semibold">{nodes.length} etapas configuradas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {removidasCount > 0 && (
              <span className="text-[9px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">{removidasCount} ocultas</span>
            )}
            {mostrarTrilha ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>

        {mostrarTrilha && (
          <div className="px-4 pb-4 pt-1">
            {/* Nós da trilha */}
            <div className="relative">
              {nodes.map((node, i) => (
                <TrilhaNode
                  key={node.id}
                  node={node}
                  status={
                    catDaTrilha.length === 0 ? "pending"
                    : (() => {
                        const cnt = nodeStats[node.id]?.catCount ?? 0;
                        if (node.tipo === "inicio") return "done";
                        if (cnt === catDaTrilha.length) return node.tipo === "condicional" ? "skipped" : "done";
                        if (cnt > 0) return "partial";
                        return "pending";
                      })()
                  }
                  dateVal={etapasRito[node.id]}
                  catCount={nodeStats[node.id]?.catCount ?? 0}
                  totalCats={catDaTrilha.length}
                  isLast={i === nodes.length - 1}
                  sac={selectedSacramento}
                  onChangeDate={node.tipo === "rito" ? (v) => handleSaveEtapaRito(node.id, v) : undefined}
                  onRemove={(node.isDefault || node.isCustom) && node.id !== "documentos"
                    ? () => handleRemoveEtapa(node.id, !!node.isCustom)
                    : undefined}
                />
              ))}
            </div>

            {/* Botão de compartilhar rito */}
            {turma?.codigoAcesso && (
              <button onClick={() => setShareRitoOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-black hover:bg-amber-600 active:scale-95 transition-all mb-3">
                <Share2 className="h-4 w-4" />
                Compartilhar Etapas com os Pais
              </button>
            )}

            {/* Adicionar nova etapa de rito */}
            <div className="border-t border-dashed border-muted pt-3 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Adicionar Etapa de Rito</p>
              <div className="flex gap-2">
                <input
                  value={novaEtapaLabel}
                  onChange={e => setNovaEtapaLabel(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddEtapa()}
                  placeholder="Ex: Encontro com o Pároco..."
                  className="flex-1 h-9 px-3 text-sm rounded-xl border border-border/60 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button onClick={handleAddEtapa} disabled={addingEtapa || !novaEtapaLabel.trim()}
                  className={cn("h-9 px-3 rounded-xl text-white text-xs font-black flex items-center gap-1 transition-all shrink-0 disabled:opacity-50 bg-gradient-to-r", cfg.gradient)}>
                  <Plus className="h-4 w-4" />
                  {addingEtapa ? "..." : "Adicionar"}
                </button>
              </div>
              {removidasCount > 0 && (
                <button onClick={handleRestoreDefaultEtapas}
                  className="text-[10px] font-black text-amber-600 hover:text-amber-700 underline">
                  ↺ Restaurar {removidasCount} etapa{removidasCount > 1 ? "s" : ""} padrão removida{removidasCount > 1 ? "s" : ""}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── CATEQUIZANDOS NA TRILHA ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-black uppercase tracking-wider text-foreground">
            Catequizandos na Trilha
          </p>
          <button onClick={() => setModalSelecaoOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-black hover:bg-primary/20 transition-colors">
            <UserPlus className="h-3.5 w-3.5" />
            {catequizandosTrilhaIds.length === 0 ? "Selecionar" : "Gerenciar"}
          </button>
        </div>

        {catequizandosTrilhaIds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center rounded-3xl border-2 border-dashed border-muted-foreground/20 bg-muted/10">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <Users className="h-7 w-7 text-primary/50" />
            </div>
            <p className="text-base font-black text-foreground mb-1">Nenhum catequizando nesta trilha</p>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Selecione os catequizandos que estão se preparando para o <strong>{cfg.label}</strong>.
            </p>
            <button onClick={() => setModalSelecaoOpen(true)}
              className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-black active:scale-95 transition-all bg-gradient-to-r", cfg.gradient)}>
              <UserPlus className="h-4 w-4" />
              Selecionar Catequizandos
            </button>
          </div>
        ) : (
          <>
            {/* Barra de busca */}
            <input
              type="text" value={busca} onChange={e => setBusca(e.target.value)}
              placeholder={`Buscar na trilha de ${cfg.label}...`}
              className="w-full h-10 px-4 rounded-2xl text-sm border border-border/60 bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
            />

            {/* Grid de avatares */}
            {isLoading ? (
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="min-w-[72px] h-24 rounded-2xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : catFiltrados.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Nenhum catequizando encontrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {catFiltrados.map(cat => {
                  const p = catProgressMap[cat.id] ?? { progress: 0, hasAlert: false, sacRecebido: false };
                  return (
                    <AvatarCard
                      key={cat.id}
                      cat={cat}
                      progress={p.progress}
                      hasAlert={p.hasAlert}
                      sacRecebido={p.sacRecebido}
                      onClick={() => setSelectedCat(cat)}
                    />
                  );
                })}
              </div>
            )}

            {/* Legenda */}
            <div className="flex items-center gap-4 px-1">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-muted-foreground font-semibold">Pronto</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-[10px] text-muted-foreground font-semibold">Em andamento</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-[10px] text-muted-foreground font-semibold">Freq. baixa</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <span className="text-[10px] text-muted-foreground font-semibold">Iniciando</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── DRAWER DO CATEQUIZANDO ── */}
      {selectedCat && (
        <DrawerCatequizando
          cat={selectedCat}
          sac={selectedSacramento}
          encontros={encontros}
          open={!!selectedCat}
          onClose={() => setSelectedCat(null)}
          onSave={handleSaveCat}
          saving={savingCat}
        />
      )}

      {/* ── MODAL SELECIONAR CATEQUIZANDOS ── */}
      <ModalSelecaoCatequizandos
        open={modalSelecaoOpen}
        onClose={() => setModalSelecaoOpen(false)}
        todos={todosOsCatequizandos}
        selecionados={catequizandosTrilhaIds}
        onSave={handleSaveSelecao}
        saving={savingSelecao}
        sac={selectedSacramento}
      />

      {/* ── QR SHARE ── */}
      {turma?.codigoAcesso && (() => {
        const ritoUrl = `${getAppUrl()}/rito-sacramental/${turma.codigoAcesso}/${selectedSacramento}`;
        return (
          <QRShareModal
            open={shareRitoOpen}
            onClose={() => setShareRitoOpen(false)}
            url={ritoUrl}
            title="Compartilhar Etapas do Rito"
            description={<>Pais e responsáveis podem ver as datas de preparação para o rito de <strong className={cfg.accent}>{selectedSacramento}</strong>.</>}
            accentColor={cfg.accentBg}
            shareTitle={`Preparação para ${cfg.label}`}
            shareText={`Confira as datas de preparação para o ${selectedSacramento}:`}
          />
        );
      })()}
    </div>
  );
}
