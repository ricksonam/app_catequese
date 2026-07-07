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
  Trophy, Map, CalendarDays, PartyPopper, Flag, Ban
} from "lucide-react";
import type { Catequizando, TrilhaSacramental as TrilhaSacramentalType, Turma, EtapaCustom } from "@/lib/store";
import { cn, getAppUrl } from "@/lib/utils";
import { QRShareModal } from "@/components/QRShareModal";

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────
type SacramentoType = "batismo" | "eucaristia" | "crisma";
type NodeStatus = "done" | "partial" | "pending" | "skipped";
type NodeTipo = "inicio" | "condicional" | "frequencia" | "rito" | "docs" | "celebracao" | "comum";


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
// RITOS PADRÃO
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
  const inicio: NodeDef = { id: "inicio", label: "Início da Jornada", tipo: "inicio", icon: Map, emoji: "📍" };

  const condicionais: NodeDef[] = [];
  if (sac === "eucaristia" || sac === "crisma")
    condicionais.push({ id: "bat_check", label: "Batismo Prévio", tipo: "condicional", icon: Baby, condicional: "batismo", emoji: "🕊️" });
  if (sac === "crisma")
    condicionais.push({ id: "euc_check", label: "Eucaristia Prévia", tipo: "condicional", icon: Star, condicional: "eucaristia", emoji: "✨" });

  const freq: NodeDef = { id: "encontros", label: "Frequência nos Encontros", tipo: "frequencia", icon: BookOpen, emoji: "📖" };

  const defaultRitos = DEFAULT_RITOS[sac].filter(n => n.id === "documentos" || !removidas.includes(n.id));

  const customNodes: NodeDef[] = [...etapasCustom]
    .sort((a, b) => a.ordem - b.ordem)
    .map(e => ({ id: e.id, label: e.label, tipo: (e.incluirCatequizandos ? "comum" : "rito") as NodeTipo, icon: Star, isCustom: true, emoji: "⭐", dataAgendada: e.incluirData ? e.dataAgendada : undefined }));

  const celebLabel = sac === "batismo" ? "Celebração do Batismo" : sac === "eucaristia" ? "Celebração da Eucaristia" : "Celebração do Crisma";
  const celebEmoji = { batismo: "🕊️", eucaristia: "✨", crisma: "👑" }[sac];
  const celebracao: NodeDef = { id: "celebracao", label: celebLabel, tipo: "celebracao", icon: Trophy, emoji: celebEmoji };

  return [inicio, ...condicionais, freq, ...defaultRitos, ...customNodes, celebracao];
}

const DOCS_PADRAO = [
  { key: "documentos_rg",       label: "RG / Identidade" },
  { key: "documentos_batistério", label: "Certidão de Batismo" },
  { key: "documentos_residencia", label: "Comprovante de Residência" },
  { key: "contribuicao",        label: "Contribuição / Taxas" },
] as const;

// ─────────────────────────────────────────────────────────────
// HELPERS DE STATUS
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
        res[node.id] = received ? "done" : "pending"; break;
      }
      case "frequencia":
        if (freq.total === 0) { res[node.id] = "pending"; break; }
        res[node.id] = freq.percent >= 75 ? "done" : freq.percent >= 40 ? "partial" : "pending"; break;
      case "comum": {
        const concluidas = trilha.etapasCustomConcluidas || [];
        res[node.id] = concluidas.includes(node.id) ? "done" : "pending";
        break;
      }
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
        if (sacramentos[sac]?.recebido === true) {
          res[node.id] = "done";
        } else if (trilha.apto === true) {
          res[node.id] = "done"; // Apto para celebrar
        } else if (trilha.apto === false) {
          res[node.id] = "skipped"; // Marcado como Não Apto -> Usaremos 'skipped' como map para vermelho
        } else {
          res[node.id] = "pending";
        }
        break;
      default: res[node.id] = "pending";
    }
  }
  return res;
}

const NODE_STYLE: Record<NodeStatus, { bg: string; border: string; text: string; badge: string; dot: string; light: string }> = {
  done:    { bg: "bg-emerald-50",  border: "border-emerald-400", text: "text-emerald-700", badge: "bg-emerald-500 text-white", dot: "bg-emerald-500", light: "bg-emerald-100" },
  partial: { bg: "bg-amber-50",    border: "border-amber-400",   text: "text-amber-700",   badge: "bg-amber-400 text-white",     dot: "bg-amber-400", light: "bg-amber-100" },
  pending: { bg: "bg-white",       border: "border-muted-foreground/30", text: "text-muted-foreground", badge: "bg-muted-foreground/20 text-muted-foreground", dot: "bg-muted-foreground", light: "bg-muted" },
  skipped: { bg: "bg-red-50",      border: "border-red-400",     text: "text-red-700",     badge: "bg-red-500 text-white",       dot: "bg-red-400", light: "bg-red-100" }, // Skipped is mapped to NOT APTO for celebration or missing condicional
};

// ─────────────────────────────────────────────────────────────
// COMPONENTES DA UI DO MAPA
// ─────────────────────────────────────────────────────────────
function BonecoCatequizando({ cat, status, onClick, isCondicional }: { cat: Catequizando, status: NodeStatus, onClick: () => void, isCondicional?: boolean }) {
  const ok = status === "done";
  const partial = status === "partial";
  const bad = status === "skipped" || status === "pending"; 
  // Na celebração, skipped = não apto. No condicional, pending = falta.
  
  return (
    <button onClick={onClick} className="relative flex flex-col items-center gap-1.5 group active:scale-95 transition-all w-[76px] sm:w-[84px]">
       <div className={cn("w-14 h-14 sm:w-16 sm:h-16 rounded-full border-[3px] shadow-sm overflow-hidden group-hover:shadow-lg transition-all group-hover:-translate-y-1 z-10",
         ok ? "border-emerald-400 bg-emerald-50" 
         : partial ? "border-amber-400 bg-amber-50" 
         : "border-red-300 bg-red-50"
       )}>
          {cat.foto 
             ? <img src={cat.foto} className="w-full h-full object-cover"/> 
             : <span className={cn("font-black text-xl flex items-center justify-center w-full h-full", 
                 ok ? "text-emerald-600" : partial ? "text-amber-600" : "text-red-500"
               )}>{cat.nome.charAt(0)}</span>
          }
       </div>
       
       {ok && <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm z-20"><CheckCircle2 className="h-5 w-5 text-emerald-500" /></div>}
       {!ok && partial && <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm z-20"><AlertTriangle className="h-5 w-5 text-amber-500" /></div>}
       {!ok && !partial && <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm z-20"><Ban className="h-5 w-5 text-red-500" /></div>}
       
       <span className="text-[10px] sm:text-[11px] font-black uppercase text-center leading-tight line-clamp-2 w-full px-0.5 text-foreground/80 mt-1 group-hover:text-primary transition-colors">
         {cat.nome.split(" ")[0]}
       </span>
    </button>
  );
}

function TrilhaNode({
  node, globalStatus, dateVal, expanded, onToggle,
  catsConcluidos, catsPendentes,
  onChangeDate, onRemove, onClickCat,
  isLast, isFirst, totalCats, sacLabel, dataCelebracao, onManageCondicional
}: {
  node: NodeDef; globalStatus: NodeStatus; dateVal?: string; expanded: boolean;
  onToggle: () => void;
  catsConcluidos: {cat: Catequizando, status: NodeStatus}[]; 
  catsPendentes: {cat: Catequizando, status: NodeStatus}[];
  onChangeDate?: (v: string) => void; onRemove?: () => void; onClickCat: (cat: Catequizando) => void;
  isLast: boolean; isFirst: boolean; totalCats: number; sacLabel: string; dataCelebracao?: string;
  onManageCondicional?: () => void;
}) {
  const Icon = node.icon;
  const style = NODE_STYLE[globalStatus];
  
  // Ritos específicos não mostram catequizandos
  const isRitoSemAvatares = node.tipo === "rito"; 
  const showDateOnly = isRitoSemAvatares;

  return (
    <div className="relative flex flex-col items-center w-full mb-2 animate-fade-in">
      {!isLast && (
        <div className={cn("absolute top-12 bottom-[-24px] w-2 sm:w-3 z-0 rounded-full", expanded ? style.light : style.light)} />
      )}

      <button onClick={onToggle}
        className={cn(
          "relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 shadow-lg flex flex-col items-center justify-center transition-all duration-300 group hover:scale-105 active:scale-95",
          style.bg, style.border, expanded ? "scale-110 shadow-xl ring-4 ring-primary/20 border-primary" : ""
        )}>
        {node.emoji ? (
          <span className="text-2xl sm:text-3xl filter drop-shadow-sm group-hover:scale-110 transition-transform">{node.emoji}</span>
        ) : (
          <Icon className={cn("w-7 h-7 sm:w-9 sm:h-9", style.text, "group-hover:scale-110 transition-transform")} />
        )}
      </button>

      <div className={cn(
        "relative w-full max-w-xl mx-auto mt-4 rounded-3xl border-2 shadow-sm transition-all duration-300 overflow-hidden",
        expanded ? cn(style.border, "shadow-lg") : "border-transparent bg-transparent"
      )}>
        
        <div 
          onClick={!expanded ? onToggle : undefined}
          className={cn(
            "p-3 sm:p-4 text-center cursor-pointer transition-colors",
            expanded ? style.bg : "hover:bg-muted/30 rounded-3xl"
          )}>
          <p className={cn("text-sm sm:text-base font-black uppercase tracking-wider", expanded ? style.text : "text-foreground")}>
            {node.label}
          </p>
          
          {!expanded && !showDateOnly && (
             <div className="flex items-center justify-center gap-2 mt-2 max-w-[200px] mx-auto">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full transition-all", catsConcluidos.length === totalCats ? "bg-emerald-500" : "bg-primary")} 
                       style={{width: totalCats === 0 ? "0%" : `${(catsConcluidos.length / totalCats) * 100}%`}} />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground">{catsConcluidos.length}/{totalCats}</span>
             </div>
          )}
          {!expanded && showDateOnly && (
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">
               {dateVal ? new Date(dateVal + "T12:00:00").toLocaleDateString('pt-BR') : "Data a definir"}
            </p>
          )}
        </div>

        {expanded && (
          <div className="p-4 sm:p-5 bg-white dark:bg-card border-t border-border/50 animate-in slide-in-from-top-4 duration-300">
            
            {/* CONDICIONAL: Gerenciar manualmente */}
            {node.tipo === "condicional" && onManageCondicional && (
              <div className="mb-5 flex justify-center">
                 <button onClick={onManageCondicional} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all">
                   Gerenciar Status Manualmente
                 </button>
              </div>
            )}

            {/* CELEBRACAO: Data premium destacada */}
            {node.tipo === "celebracao" && (
               <div className="mb-6 bg-gradient-to-br from-amber-100 to-orange-100 border-2 border-amber-300 p-6 rounded-3xl text-center shadow-inner">
                  <Trophy className="h-10 w-10 text-amber-600 mx-auto mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-800 mb-1">Grande Dia</p>
                  <p className="text-3xl font-black text-amber-900 leading-none">
                     {dataCelebracao ? new Date(dataCelebracao + "T12:00:00").toLocaleDateString('pt-BR') : "Data Não Definida"}
                  </p>
               </div>
            )}

            {/* RITO SEM AVATARES: Apenas data premium */}
            {showDateOnly && (
               <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl border-2 border-slate-200 shadow-inner">
                  <CalendarDays className="h-12 w-12 text-primary/40 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Data Agendada</p>
                  {onChangeDate ? (
                     <input type="date" value={dateVal || ""} onChange={e => onChangeDate(e.target.value)} 
                            className="text-2xl sm:text-3xl font-black text-center bg-transparent border-b-2 border-primary/50 focus:border-primary focus:outline-none w-full max-w-[200px]" />
                  ) : (
                     <p className="text-2xl font-black">{dateVal ? new Date(dateVal + "T12:00:00").toLocaleDateString('pt-BR') : "A Definir"}</p>
                  )}
               </div>
            )}

            {/* CONTROLES REMOVER (Apenas para custom e rito) */}
            {!showDateOnly && node.tipo === "rito" && onChangeDate && (
               <div className="flex justify-center mb-5">
                 <input type="date" value={dateVal || ""} onChange={e => onChangeDate(e.target.value)} className="h-10 px-4 rounded-xl border border-border/60" />
               </div>
            )}

            {(node.isDefault || node.isCustom) && onRemove && node.id !== "documentos" && (
              <div className="flex justify-end mt-4">
                <button onClick={onRemove} className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="h-3 w-3" /> <span className="text-[10px] font-black uppercase">Remover Etapa</span>
                </button>
              </div>
            )}

            {/* PRATELEIRAS DE BONECOS (Se não for rito exclusivo de data) */}
            {!showDateOnly && (
               <div className="space-y-6 mt-2">
                 {totalCats === 0 ? (
                   <div className="text-center py-6">
                      <Users className="h-8 w-8 text-muted/50 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-muted-foreground">Nenhum catequizando aqui.</p>
                   </div>
                 ) : (
                   <>
                     {catsConcluidos.length > 0 && (
                       <div className="animate-fade-in">
                         <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3 flex items-center gap-1.5 border-b border-emerald-100 pb-1">
                           <CheckCircle2 className="h-3.5 w-3.5" /> 
                           {node.tipo === "celebracao" ? "Aptos para Celebrar" : node.tipo === "condicional" ? "Possuem o Sacramento" : "Concluídos"} ({catsConcluidos.length})
                         </p>
                         <div className="flex flex-wrap gap-4 sm:gap-5 justify-center sm:justify-start">
                           {catsConcluidos.map(({cat, status}) => <BonecoCatequizando key={cat.id} cat={cat} status={status} onClick={() => onClickCat(cat)} />)}
                         </div>
                       </div>
                     )}

                     {catsPendentes.length > 0 && (
                       <div className="animate-fade-in">
                         <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-3 flex items-center gap-1.5 border-b border-red-100 pb-1 mt-4">
                           <AlertTriangle className="h-3.5 w-3.5" /> 
                           {node.tipo === "celebracao" ? "Não Aptos / Pendentes" : node.tipo === "condicional" ? "Não Possuem (Pendência)" : "Pendentes"} ({catsPendentes.length})
                         </p>
                         <div className="flex flex-wrap gap-4 sm:gap-5 opacity-90 justify-center sm:justify-start">
                           {catsPendentes.map(({cat, status}) => <BonecoCatequizando key={cat.id} cat={cat} status={status} onClick={() => onClickCat(cat)} />)}
                         </div>
                       </div>
                     )}
                   </>
                 )}
               </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DRAWER INDIVIDUAL DO CATEQUIZANDO
// ─────────────────────────────────────────────────────────────
function DrawerCatequizando({ cat, sac, encontros, etapasCustom, open, onClose, onSave, saving }: {
  cat: Catequizando; sac: SacramentoType; encontros: any[]; etapasCustom: EtapaCustom[];
  open: boolean; onClose: () => void;
  onSave: (updated: Catequizando) => void; saving: boolean;
}) {
  const [localTrilha, setLocalTrilha] = useState<TrilhaSacramentalType>(getTrilhaState(cat, sac));
  const [localSac, setLocalSac] = useState<any>(cat.dadosPastorais?.sacramentos ?? cat.sacramentos ?? {});
  const [newDocNome, setNewDocNome] = useState("");
  const freq = calcFrequencia(cat, encontros);
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
  const updateSacDate = (key: "batismo" | "eucaristia" | "crisma", dateStr: string) =>
    setLocalSac((p: any) => ({ ...p, [key]: { ...(p[key] || {}), data: dateStr } }));
  
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
    sacramentos: localSac,
    dadosPastorais: { ...(cat.dadosPastorais || {}), sacramentos: localSac },
    trilhasPorSacramento: { ...(cat.trilhasPorSacramento || {}), [sac]: localTrilha },
  });

  if (!open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[9999] sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4">
        <div className="bg-white dark:bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl flex flex-col overflow-hidden max-h-[90vh] sm:max-h-[85vh]"
          onClick={e => e.stopPropagation()}>
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1.5 rounded-full bg-muted-foreground/20" />
          </div>

          <div className={cn("px-5 py-4 bg-gradient-to-r text-white flex items-center gap-3 justify-between shrink-0", cfg.gradient)}>
            <div className="flex items-center gap-3 min-w-0">
              {cat.foto
                ? <img src={cat.foto} className="w-10 h-10 rounded-full object-cover border-2 border-white/30 shrink-0 shadow-sm" alt="" />
                : <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-black text-base shrink-0 shadow-sm">{cat.nome.charAt(0)}</div>}
              <div className="min-w-0">
                <p className="font-black text-sm leading-tight truncate">{cat.nome}</p>
                <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">{cfg.emoji} Edição Individual</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
            
            {/* APTIDAO FINAL */}
            <section className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-2xl border-2 shadow-sm">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5" /> Aptidão para a Celebração
              </h4>
              <div className="flex gap-2 mb-2">
                <button onClick={() => setLocalTrilha(p => ({...p, apto: true, motivoNaoApto: ''}))}
                  className={cn("flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all", 
                    localTrilha.apto === true ? "bg-emerald-500 text-white shadow-md ring-2 ring-emerald-200" : "bg-white border text-muted-foreground hover:bg-slate-50")}>
                  Apto
                </button>
                <button onClick={() => setLocalTrilha(p => ({...p, apto: false}))}
                  className={cn("flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all", 
                    localTrilha.apto === false ? "bg-red-500 text-white shadow-md ring-2 ring-red-200" : "bg-white border text-muted-foreground hover:bg-slate-50")}>
                  Não Apto
                </button>
              </div>
              {localTrilha.apto === false && (
                 <div className="mt-3 animate-fade-in">
                    <textarea value={localTrilha.motivoNaoApto || ""} onChange={e => setLocalTrilha(p => ({...p, motivoNaoApto: e.target.value}))}
                      placeholder="Descreva o motivo da não aptidão..."
                      className="w-full h-20 p-3 text-sm rounded-xl border border-red-200 bg-red-50/50 focus:outline-none focus:ring-2 focus:ring-red-200 resize-none text-red-900 placeholder-red-300"
                    />
                 </div>
              )}
            </section>

            <section>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                <Cross className="h-3.5 w-3.5" /> Situação Sacramental (Prévios e Atual)
              </h4>
              <div className="space-y-3">
                {(["batismo", "eucaristia", "crisma"] as const).map(s => {
                  const r = localSac?.[s]?.recebido ?? false;
                  return (
                    <div key={s} className="flex flex-col gap-1.5">
                      <button onClick={() => toggleSac(s)}
                        className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all active:scale-95",
                          r ? "bg-emerald-50 border-emerald-200" : "bg-white border-border/50"
                        )}>
                        {r ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> : <Circle className="h-5 w-5 text-muted-foreground shrink-0" />}
                        <p className={cn("text-sm font-black uppercase flex-1 text-left", r ? "text-emerald-800" : "text-muted-foreground")}>{s}</p>
                      </button>
                      {r && (
                        <div className="flex items-center gap-2 pl-10 pr-2 animate-fade-in">
                          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                          <input type="date" value={localSac?.[s]?.data || ""} onChange={e => updateSacDate(s, e.target.value)}
                            className="flex-1 h-8 px-2 text-xs rounded-lg border border-border/50 bg-slate-50 focus:outline-none" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {sacRecebido ? (
              <div className="flex flex-col items-center justify-center gap-3 py-6 px-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-center animate-fade-in">
                <PartyPopper className="h-10 w-10 text-emerald-500" />
                <div>
                  <p className="text-base font-black text-emerald-800 uppercase">Sacramento já recebido! {cfg.emoji}</p>
                  <p className="text-sm text-emerald-600 mt-1">Este catequizando completou a jornada.</p>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in space-y-6">
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
                    </div>
                  )}
                </section>

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
                      <div key={doc.id} className="flex items-center gap-1.5 animate-fade-in">
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
                
                {etapasCustom.length > 0 && (
                  <section>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Etapas Adicionais</h4>
                    <div className="space-y-2 mb-4">
                      {etapasCustom.map(e => {
                        const checked = (localTrilha.etapasCustomConcluidas || []).includes(e.id);
                        return (
                          <label key={e.id} className="flex items-center gap-3 bg-muted/20 p-2.5 rounded-xl border cursor-pointer hover:bg-muted/40 transition-colors">
                            <input type="checkbox" checked={checked} onChange={ev => {
                               const arr = localTrilha.etapasCustomConcluidas || [];
                               const nextArr = ev.target.checked ? [...arr, e.id] : arr.filter(id => id !== e.id);
                               setLocalTrilha(p => ({ ...p, etapasCustomConcluidas: nextArr }));
                            }} className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" />
                            <span className="text-sm font-bold text-foreground">{e.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </section>
                )}

                <section>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Observações Livres</h4>
                  <textarea
                    value={localTrilha.observacoes ?? ""}
                    onChange={e => setLocalTrilha(p => ({ ...p, observacoes: e.target.value }))}
                    placeholder="Anotações sobre este catequizando..."
                    className="w-full h-20 px-3 py-2 text-sm rounded-xl border border-border/60 bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </section>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border/30 bg-muted/10 shrink-0">
            <button onClick={handleSave} disabled={saving}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-primary text-white font-black text-sm uppercase tracking-widest hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60 shadow-lg">
              <Save className="h-4 w-4" />
              {saving ? "Salvando..." : "Salvar Edições"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL NOVO TÓPICO
// ─────────────────────────────────────────────────────────────
function ModalNovoTopico({ open, onClose, onSave, saving }: any) {
  const [label, setLabel] = useState("");
  const [incData, setIncData] = useState(false);
  const [dataVal, setDataVal] = useState("");
  const [incCats, setIncCats] = useState(false);

  useEffect(() => {
    if (open) { setLabel(""); setIncData(false); setDataVal(""); setIncCats(false); }
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative bg-background rounded-3xl shadow-2xl w-full max-w-sm flex flex-col gap-5 p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <h3 className="font-black text-lg text-foreground">Criar Novo Tópico</h3>
        <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Nome do tópico..." className="h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary/20 bg-muted/50 text-sm" />
        
        <div className="space-y-3">
          <label className="flex items-center gap-3 bg-muted/30 p-3 rounded-xl border cursor-pointer hover:bg-muted/50 transition-colors">
            <input type="checkbox" checked={incData} onChange={e => setIncData(e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" />
            <span className="text-sm font-bold text-foreground">Incluir Data</span>
          </label>
          {incData && (
            <input type="date" value={dataVal} onChange={e => setDataVal(e.target.value)} className="w-full h-12 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-primary/20 bg-muted/50 text-sm" />
          )}
          
          <label className="flex items-center gap-3 bg-muted/30 p-3 rounded-xl border cursor-pointer hover:bg-muted/50 transition-colors">
            <input type="checkbox" checked={incCats} onChange={e => setIncCats(e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" />
            <span className="text-sm font-bold text-foreground">Mostrar Catequizandos</span>
          </label>
        </div>

        <div className="flex gap-3 mt-2">
          <button onClick={onClose} className="flex-1 h-12 rounded-xl text-muted-foreground font-bold hover:bg-muted transition-colors text-sm">Cancelar</button>
          <button onClick={() => onSave({ label: label.trim(), incluirData: incData, dataAgendada: dataVal, incluirCatequizandos: incCats })} disabled={saving || !label.trim()} className="flex-1 h-12 rounded-xl bg-primary text-white font-black hover:opacity-90 transition-opacity disabled:opacity-50 text-sm">
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL SELECIONAR CATEQUIZANDOS (USADO PARA TRILHA E CONDICIONAIS)
// ─────────────────────────────────────────────────────────────
function ModalSelecaoCatequizandos({
  open, onClose, todos, selecionados, onSave, saving, sac, titulo, descricao
}: {
  open: boolean; onClose: () => void;
  todos: Catequizando[]; selecionados: string[];
  onSave: (ids: string[]) => void; saving: boolean; sac: SacramentoType;
  titulo: string; descricao: string;
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
        <div className="bg-white dark:bg-card rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh]"
          onClick={e => e.stopPropagation()}>
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1.5 rounded-full bg-muted-foreground/20" />
          </div>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/30 shrink-0">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-sm", cfg.gradient)}>
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wide">{titulo}</h3>
                <p className="text-[10px] text-muted-foreground">{descricao}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-5 pt-4 pb-2 shrink-0">
            <input ref={inputRef} type="text" value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar catequizando..."
              className="w-full h-11 pl-4 rounded-xl text-sm border border-border/60 bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground"><span className="font-black text-foreground">{local.length}</span> marcados</span>
              <div className="flex gap-3">
                <button onClick={() => setLocal(filtrados.map(c => c.id))} className="text-[10px] font-black uppercase text-primary hover:text-primary/80">Selecionar Todos</button>
                <span className="text-muted-foreground text-[10px]">·</span>
                <button onClick={() => setLocal([])} className="text-[10px] font-black uppercase text-muted-foreground hover:text-foreground">Limpar</button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-1.5 min-h-0">
            {filtrados.map(cat => {
              const isSel = local.includes(cat.id);
              return (
                <button key={cat.id} onClick={() => toggle(cat.id)}
                  className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left",
                    isSel ? cn("border-2", cfg.border, "bg-gradient-to-r", cfg.gradientLight) : "bg-white border-border/40 hover:bg-muted/30"
                  )}>
                  {cat.foto
                    ? <img src={cat.foto} alt={cat.nome} className="w-9 h-9 rounded-full object-cover shrink-0 border-2 border-white shadow-sm" />
                    : <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-black shadow-sm border border-white",
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
          <div className="p-5 border-t border-border/30 shrink-0">
            <button onClick={() => onSave(local)} disabled={saving}
              className={cn("w-full h-12 rounded-xl text-white text-sm font-black uppercase tracking-wider active:scale-95 transition-all disabled:opacity-60 bg-gradient-to-r shadow-lg", cfg.gradient)}>
              {saving ? "Salvando..." : `Confirmar Seleção`}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL (PÁGINA)
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
  
  // Modals de seleção
  const [modalTrilhaOpen, setModalTrilhaOpen] = useState(false);
  const [modalCondicionalOpen, setModalCondicionalOpen] = useState<{sac: "batismo"|"eucaristia", title: string}|null>(null);
  
  const [savingSelecao, setSavingSelecao] = useState(false);
  const [selectedCat, setSelectedCat] = useState<Catequizando | null>(null);
  const [savingCat, setSavingCat] = useState(false);
  const [novaEtapaLabel, setNovaEtapaLabel] = useState("");
  const [addingEtapa, setAddingEtapa] = useState(false);
  const [modalNovoTopicoOpen, setModalNovoTopicoOpen] = useState(false);
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
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

  const catNodeStatusMap = useMemo(() => {
    const map: Record<string, Record<string, NodeStatus>> = {};
    for (const cat of todosOsCatequizandos) {
      map[cat.id] = calcNodeStatuses(cat, nodes, encontros, etapasRito, selectedSacramento);
    }
    return map;
  }, [todosOsCatequizandos, nodes, encontros, etapasRito, selectedSacramento]);

  const nodeStats = useMemo(() => {
    const stats: Record<string, { catCount: number, status: NodeStatus }> = {};
    for (const node of nodes) {
      let doneCount = 0;
      let refList = node.tipo === "inicio" ? todosOsCatequizandos : catDaTrilha;
      
      for (const cat of refList) {
        const s = catNodeStatusMap[cat.id]?.[node.id];
        if (s === "done" || s === "skipped") doneCount++;
      }
      
      let status: NodeStatus = "pending";
      if (refList.length > 0) {
        if (doneCount === refList.length) status = node.tipo === "condicional" ? "skipped" : "done";
        else if (doneCount > 0) status = "partial";
      } else if (node.tipo === "inicio") {
        status = "done";
      }
      stats[node.id] = { catCount: doneCount, status };
    }
    return stats;
  }, [nodes, catDaTrilha, todosOsCatequizandos, catNodeStatusMap]);

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
      toast.success("Data da celebração salva com sucesso!");
      setEditandoData(false);
    } catch (e: any) { toast.error("Erro: " + e.message); }
    finally { setSavingData(false); }
  };

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

  const handleAddEtapa = async (data: any) => {
    if (!data.label.trim() || !turma) return;
    setAddingEtapa(true);
    try {
      const sacConfig = turma.trilhasConfig?.[selectedSacramento] || {};
      const current: EtapaCustom[] = sacConfig.etapasCustom || [];
      const nova: EtapaCustom = { 
        id: crypto.randomUUID(), 
        label: data.label, 
        ordem: current.length,
        incluirData: data.incluirData,
        dataAgendada: data.dataAgendada,
        incluirCatequizandos: data.incluirCatequizandos
      };
      
      const updatedSacConfig = { ...sacConfig, etapasCustom: [...current, nova] };
      // Se incluir data e não tiver catequizandos (Rito), podemos salvar a data diretamente em etapasRito também!
      if (data.incluirData && data.dataAgendada && !data.incluirCatequizandos) {
        updatedSacConfig.etapasRito = { ...(sacConfig.etapasRito || {}), [nova.id]: data.dataAgendada };
      }
      
      const updatedConfig = {
        ...(turma.trilhasConfig || {}),
        [selectedSacramento]: updatedSacConfig,
      };
      await upsertTurma({ ...turma, trilhasConfig: updatedConfig });
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      setModalNovoTopicoOpen(false);
      toast.success("Nova parada adicionada ao mapa!");
      setExpandedNode(nova.id);
    } catch (e: any) { toast.error("Erro: " + e.message); }
    finally { setAddingEtapa(false); }
  };
      await upsertTurma({ ...turma, trilhasConfig: updatedConfig });
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      setNovaEtapaLabel("");
      toast.success("Nova parada adicionada ao mapa!");
      setExpandedNode(nova.id);
    } catch (e: any) { toast.error("Erro: " + e.message); }
    finally { setAddingEtapa(false); }
  };

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
      setExpandedNode(null);
      toast.success("Parada removida do mapa!");
    } catch (e: any) { toast.error("Erro: " + e.message); }
  };

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
      toast.success("Etapas originais restauradas!");
    } catch (e: any) { toast.error("Erro: " + e.message); }
  };

  const handleSaveCat = async (updated: Catequizando) => {
    setSavingCat(true);
    try {
      await upsertCatequizando(updated);
      await queryClient.invalidateQueries({ queryKey: ["catequizandos"] });
      toast.success("Anotações salvas com sucesso!");
    } catch (e: any) { toast.error("Erro: " + e.message); }
    finally { 
      setSavingCat(false); 
      setSelectedCat(null); // Fecha a gaveta após salvar com sucesso
    }
  };

  const handleSaveSelecaoTrilha = async (ids: string[]) => {
    if (!turma) return;
    setSavingSelecao(true);
    try {
      const updatedConfig = {
        ...(turma.trilhasConfig || {}),
        [selectedSacramento]: { ...(turma.trilhasConfig?.[selectedSacramento] || {}), catequizandosTrilha: ids },
      };
      await upsertTurma({ ...turma, trilhasConfig: updatedConfig });
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      setModalTrilhaOpen(false);
      toast.success("Participantes do mapa atualizados!");
    } catch (e: any) { toast.error("Erro: " + e.message); }
    finally { setSavingSelecao(false); }
  };

  const handleSaveCondicional = async (ids: string[]) => {
    if (!modalCondicionalOpen) return;
    setSavingSelecao(true);
    try {
      const sacAlvo = modalCondicionalOpen.sac;
      for (const cat of catDaTrilha) {
        const hasIt = ids.includes(cat.id);
        const sacramentos = cat.dadosPastorais?.sacramentos ?? cat.sacramentos ?? {};
        const currentSac = sacramentos[sacAlvo] ?? { recebido: false };
        if (currentSac.recebido !== hasIt) {
          const updated = {
            ...cat,
            dadosPastorais: {
               ...(cat.dadosPastorais || {}),
               sacramentos: { ...sacramentos, [sacAlvo]: { ...currentSac, recebido: hasIt } }
            }
          };
          await upsertCatequizando(updated);
        }
      }
      await queryClient.invalidateQueries({ queryKey: ["catequizandos"] });
      setModalCondicionalOpen(null);
      toast.success("Status sacramentais atualizados!");
    } catch (e: any) { toast.error("Erro ao salvar sacramentos: " + e.message); }
    finally { setSavingSelecao(false); }
  };

  const cfg = SAC_CFG[selectedSacramento];
  const removidasCount = etapasRemovidas.length;

  return (
    <>
    <div className="space-y-6 pb-20 animate-fade-in bg-slate-50/50 min-h-screen overflow-x-hidden">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-3 pt-4 px-4">
        <button onClick={() => navigate(`/turmas/${id}`)} className="back-btn shrink-0">
          <ArrowLeft className="h-5 w-5 text-black" />
        </button>
        <div className="flex-1 text-center pr-10">
          {turma?.nome && <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-[-2px]">{turma.nome}</p>}
          <h1 className="text-xl font-black text-foreground tracking-tight uppercase leading-tight">Mapa Panorâmico</h1>
        </div>
      </div>

      {/* ── ABAS DOS SACRAMENTOS ── */}
      <div className="px-4">
        <div className="flex bg-white shadow-sm border border-border/50 p-1.5 rounded-2xl gap-1">
          {(["batismo", "eucaristia", "crisma"] as SacramentoType[]).map(s => (
            <button key={s}
              onClick={() => { setSelectedSacramento(s); setExpandedNode(null); }}
              className={cn(
                "flex-1 py-3 px-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2",
                selectedSacramento === s ? cn("text-white shadow-md bg-gradient-to-r", SAC_CFG[s].gradient) : "text-muted-foreground hover:bg-muted"
              )}>
              <span className="text-sm sm:text-base">{SAC_CFG[s].emoji}</span> <span>{SAC_CFG[s].label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── INFO HEADER / CONFIG ── */}
      <div className="px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white rounded-3xl p-5 shadow-sm border border-border/50 gap-4">
           <div className="text-center sm:text-left flex-1 cursor-pointer" onClick={() => setEditandoData(true)}>
              <p className="text-2xl font-black uppercase leading-none mb-1">{cfg.emoji} {cfg.label}</p>
              <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-semibold bg-muted/30 px-3 py-1 rounded-lg">
                <CalendarDays className="h-3.5 w-3.5 text-primary" /> 
                {dataCelebracao ? new Date(dataCelebracao + "T12:00:00").toLocaleDateString('pt-BR') : "Data a definir (Clique)"}
              </div>
           </div>
           
           <div className="flex gap-3 w-full sm:w-auto">
              <button onClick={() => setModalTrilhaOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider transition-colors shadow-md">
                <Users className="h-4 w-4" />
                {catDaTrilha.length} na Trilha
              </button>
           </div>
        </div>

        {editandoData && (
          <div className="mt-3 flex gap-2 items-center bg-white p-3 rounded-2xl border shadow-sm animate-fade-in">
            <input type="date" value={dataValue} onChange={e => setDataValue(e.target.value)}
              className="flex-1 h-10 px-3 text-sm rounded-xl border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20" />
            <button onClick={handleSaveData} disabled={savingData}
              className="h-10 px-4 rounded-xl bg-primary text-white text-xs font-black transition-colors">
              Salvar Data
            </button>
            <button onClick={() => setEditandoData(false)} className="h-10 px-3 text-muted-foreground hover:text-foreground">✕</button>
          </div>
        )}
      </div>

      {/* ── O MAPA (TRILHA EM ZIGUEZAGUE / SPINE) ── */}
      <div className="relative px-4 sm:px-6 md:max-w-3xl md:mx-auto pt-6">
         
         {nodes.map((node, i) => {
           let refList = catDaTrilha;
           if (node.tipo === "inicio") refList = todosOsCatequizandos;
           
           const concluidos = refList
             .filter(c => {
               const s = catNodeStatusMap[c.id]?.[node.id];
               return s === "done" || s === "skipped";
             })
             .map(cat => ({ cat, status: catNodeStatusMap[cat.id]?.[node.id] || "done" }));
             
           const pendentes = refList
             .filter(c => {
               const s = catNodeStatusMap[c.id]?.[node.id];
               return s !== "done" && s !== "skipped";
             })
             .map(cat => ({ cat, status: catNodeStatusMap[cat.id]?.[node.id] || "pending" }));
           
           return (
             <TrilhaNode
               key={node.id}
               node={node}
               globalStatus={nodeStats[node.id].status}
               expanded={expandedNode === node.id}
               onToggle={() => setExpandedNode(prev => prev === node.id ? null : node.id)}
               catsConcluidos={concluidos}
               catsPendentes={pendentes}
               dateVal={etapasRito[node.id]}
               onChangeDate={node.tipo === "rito" ? (v) => handleSaveEtapaRito(node.id, v) : undefined}
               onRemove={(node.isDefault || node.isCustom) && node.id !== "documentos" ? () => handleRemoveEtapa(node.id, !!node.isCustom) : undefined}
               onClickCat={setSelectedCat}
               isLast={i === nodes.length - 1}
               isFirst={i === 0}
               totalCats={refList.length}
               sacLabel={cfg.label}
               dataCelebracao={dataCelebracao}
               onManageCondicional={node.tipo === "condicional" ? () => setModalCondicionalOpen({ sac: node.condicional as "batismo"|"eucaristia", title: node.label }) : undefined}
             />
           );
         })}

         {/* BOTÕES EXTRAS NO FIM DO MAPA */}
         <div className="mt-12 flex flex-col items-center gap-3 w-full max-w-md mx-auto animate-fade-in pb-10">
            <button onClick={() => setModalNovoTopicoOpen(true)}
              className="w-full h-14 rounded-2xl bg-white border-2 border-dashed border-primary text-primary text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/5 active:scale-95 transition-all shadow-sm">
              <Plus className="h-5 w-5" />
              Adicionar Tópico
            </button>
            
            {removidasCount > 0 && (
              <button onClick={handleRestoreDefaultEtapas}
                className="text-xs font-black text-amber-600 hover:text-amber-700 underline mt-2">
                ↺ Restaurar {removidasCount} parada{removidasCount > 1 ? "s" : ""} originais ocultadas
              </button>
            )}

            {turma?.codigoAcesso && (
              <button onClick={() => setShareRitoOpen(true)}
                className="w-full mt-4 flex items-center justify-center gap-2 py-4 rounded-2xl bg-white text-primary border-2 border-primary text-sm font-black hover:bg-primary/5 active:scale-95 transition-all shadow-sm">
                <Share2 className="h-5 w-5" />
                Compartilhar Mapa Público
              </button>
            )}
         </div>

      </div>
    </div>

      {/* ── DRAWER DO CATEQUIZANDO ── */}
      {selectedCat && (
        <DrawerCatequizando
          cat={selectedCat}
          sac={selectedSacramento}
          encontros={encontros}
          etapasCustom={turma?.trilhasConfig?.[selectedSacramento]?.etapasCustom?.filter(e => e.incluirCatequizandos) || []}
          open={!!selectedCat}
          onClose={() => setSelectedCat(null)}
          onSave={handleSaveCat}
          saving={savingCat}
        />
      )}

      <ModalNovoTopico open={modalNovoTopicoOpen} onClose={() => setModalNovoTopicoOpen(false)} onSave={handleAddEtapa} saving={addingEtapa} />
      {/* ── MODAL SELECIONAR CATEQUIZANDOS (TRILHA PRINCIPAL) ── */}
      <ModalSelecaoCatequizandos
        open={modalTrilhaOpen}
        onClose={() => setModalTrilhaOpen(false)}
        todos={todosOsCatequizandos}
        selecionados={catequizandosTrilhaIds}
        onSave={handleSaveSelecaoTrilha}
        saving={savingSelecao}
        sac={selectedSacramento}
        titulo="Participantes da Trilha"
        descricao={`Selecione quem se prepara para a ${cfg.label}`}
      />

      {/* ── MODAL SELECIONAR CATEQUIZANDOS (CONDICIONAL PREVIO) ── */}
      {modalCondicionalOpen && (
        <ModalSelecaoCatequizandos
          open={true}
          onClose={() => setModalCondicionalOpen(null)}
          todos={catDaTrilha}
          selecionados={catDaTrilha.filter(c => {
            const s = c.dadosPastorais?.sacramentos ?? c.sacramentos ?? {};
            return s[modalCondicionalOpen.sac]?.recebido === true;
          }).map(c => c.id)}
          onSave={handleSaveCondicional}
          saving={savingSelecao}
          sac={modalCondicionalOpen.sac}
          titulo={modalCondicionalOpen.title}
          descricao={`Marque quem já possui este sacramento`}
        />
      )}

      {/* ── QR SHARE ── */}
      {turma?.codigoAcesso && (() => {
        const ritoUrl = `${getAppUrl()}/rito-sacramental/${turma.codigoAcesso}/${selectedSacramento}`;
        return (
          <QRShareModal
            open={shareRitoOpen}
            onClose={() => setShareRitoOpen(false)}
            url={ritoUrl}
            title="Compartilhar Mapa Sacramental"
            description={<>Pais e responsáveis podem ver o mapa visual e as datas de preparação para a <strong className={cfg.accent}>{selectedSacramento}</strong>.</>}
            accentColor={cfg.accentBg}
            shareTitle={`Mapa Sacramental - ${cfg.label}`}
            shareText={`Confira o mapa de preparação para a ${selectedSacramento}:`}
          />
        );
      })()}

    </>
  );
}
