import { useParams, useNavigate, Link } from "react-router-dom";
import { useTurmas, useCatequizandos, useEncontros, useAtividades, useReunioes } from "@/hooks/useSupabaseData";
import { useState, useMemo, useCallback } from "react";
import { 
  ArrowLeft, Share2, AlertTriangle, CheckCircle2, Calendar, ChevronRight, 
  BookOpen, Users, TrendingUp, MapPin, Gift, Sparkles,
  Route, ListTodo, LineChart, RefreshCw, Compass, AlertCircle, BarChart3, Info, Eye, Clock, Heart, Flame, Send, Star, Flag, BookHeart, Cross, Award, Zap
} from "lucide-react";
import { cn, getAppUrl } from "@/lib/utils";
import { toast } from "sonner";
import type { Turma, Atividade } from "@/lib/store";
import { SIMBOLOS_IVC } from "@/lib/store";
import { QRShareModal } from "@/components/QRShareModal";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
type ModeloIVC = 'sementinhas' | 'eucaristia_crisma' | 'adultos';
type RiscoNivel = 'em_dia' | 'atencao' | 'atrasado';
type EtapaStatus = 'concluido' | 'em_andamento' | 'pendente' | 'agendado';

interface EtapaJornada {
  id: string;
  label: string;
  sublabel?: string;
  emoji: string;
  tipo: 'inicio' | 'tempo' | 'passagem' | 'simbolo' | 'sacramento' | 'fim';
  tempoId?: string;
  status: EtapaStatus;
  dataEvento?: string;
  percentual?: number;
  simboloId?: string;
}

// ─────────────────────────────────────────────────────────────
// MODEL DETECTION
// ─────────────────────────────────────────────────────────────
function detectarModelo(etapa: string): ModeloIVC {
  const e = etapa?.toLowerCase() ?? '';
  if (e.includes('sement') || e.includes('pré-cat') || e.includes('pre-cat') || e.includes('pre cat')) {
    return 'sementinhas';
  }
  if (e.includes('adult')) {
    return 'adultos';
  }
  return 'eucaristia_crisma';
}

const MODELO_INFO: Record<ModeloIVC, { label: string; emoji: string; cor: string; descricao: string; sacTipo: string }> = {
  sementinhas: {
    label: 'Sementinhas / Pré-Catequese',
    emoji: '🌱',
    cor: 'from-emerald-500 to-green-600',
    descricao: 'Processo de iniciação para crianças de 5 a 8 anos, focado em acolhida lúdica e primeiros passos na fé.',
    sacTipo: 'Iniciação',
  },
  eucaristia_crisma: {
    label: 'Eucaristia / Crisma / Perseverança',
    emoji: '✨',
    cor: 'from-violet-500 to-purple-600',
    descricao: 'Processo completo dos 4 Tempos do IVC para crianças, adolescentes e jovens.',
    sacTipo: 'Eucaristia / Crisma',
  },
  adultos: {
    label: 'Adultos (RICA)',
    emoji: '🕊️',
    cor: 'from-sky-500 to-blue-600',
    descricao: 'Rito de Iniciação Cristã de Adultos — processo próprio com escrutínios e eleição.',
    sacTipo: 'Batismo / Crisma / Eucaristia',
  },
};

// ─────────────────────────────────────────────────────────────
// IVC JOURNEY DEFINITIONS (per model)
// ─────────────────────────────────────────────────────────────
const ETAPAS_SEMENTINHAS: Omit<EtapaJornada, 'status' | 'dataEvento' | 'percentual'>[] = [
  { id: 'acolhida',          label: 'Acolhida e Inscrição',           emoji: '🌱',  tipo: 'inicio' },
  { id: 'pre_cat',           label: 'Pré-Catecumenato',               sublabel: 'Tempo de Iniciação Lúdica', emoji: '🎈', tipo: 'tempo', tempoId: 'tempo1' },
  { id: 'encontros_seed',    label: 'Encontros Formativos',           emoji: '📚',  tipo: 'simbolo' },
  { id: 'pass_catec',        label: 'Celebração de Acolhida',         emoji: '🎉',  tipo: 'passagem' },
  { id: 'catec_seed',        label: 'Catecumenato Infantil',          sublabel: 'Aprofundamento da Fé', emoji: '📖', tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'entrega_biblia',    label: 'Bíblia das Crianças',            emoji: '📖',  tipo: 'simbolo', simboloId: 'biblia' },
  { id: 'pass_ilum_seed',    label: 'Celebração da Família',          emoji: '🎊',  tipo: 'passagem' },
  { id: 'ilum_seed',         label: 'Purificação e Alegria',          sublabel: 'Preparação Final', emoji: '✨', tipo: 'tempo', tempoId: 'tempo3' },
  { id: 'mis_seed',          label: 'Missão das Sementinhas',         sublabel: 'Mistagogia', emoji: '🌿', tipo: 'fim' },
];

const ETAPAS_EUC_CRISMA: Omit<EtapaJornada, 'status' | 'dataEvento' | 'percentual'>[] = [
  { id: 'preparacao',        label: 'Preparação / Convite',           emoji: '📣',  tipo: 'inicio' },
  { id: 'pass_entrada',      label: 'Celebração de Entrada',          emoji: '🎉',  tipo: 'passagem' },
  { id: 'pre_cat',           label: 'Pré-Catecumenato',               sublabel: '1º Tempo — Querigma (mín. 3 meses)', emoji: '🔥', tipo: 'tempo', tempoId: 'tempo1' },
  { id: 'pass_cat',          label: 'Celebração de Entrada p/ Catecumenato', emoji: '✨', tipo: 'passagem' },
  { id: 'cat_biblia',        label: 'Catecumenato — Palavra de Deus', sublabel: '2º Tempo — Fase 1', emoji: '📖', tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'entrega_biblia',    label: 'Entrega da Bíblia',              emoji: '📖',  tipo: 'simbolo', simboloId: 'biblia' },
  { id: 'cat_pessoa',        label: 'Catecumenato — Pessoa Humana',   sublabel: 'Fase 2', emoji: '👤', tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'celebracao_vida',   label: 'Celebração da Vida',             emoji: '🎊',  tipo: 'passagem' },
  { id: 'cat_jesus',         label: 'Catecumenato — Jesus Cristo',    sublabel: 'Fase 3', emoji: '✝️', tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'jornada_disc',      label: 'Jornada do Discipulado',         emoji: '🤝',  tipo: 'passagem' },
  { id: 'cat_oracao',        label: 'Catecumenato — Vida de Oração',  sublabel: 'Fase 4', emoji: '🙏', tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'entrega_pai_nosso', label: 'Entrega do Pai-Nosso',           emoji: '🙏',  tipo: 'simbolo', simboloId: 'pai_nosso' },
  { id: 'cat_comunidade',    label: 'Catecumenato — Comunidade de Fé',sublabel: 'Fase 5', emoji: '⛪', tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'entrega_creio',     label: 'Entrega do Símbolo da Fé',       emoji: '✝️',  tipo: 'simbolo', simboloId: 'creio' },
  { id: 'cat_sacramental',   label: 'Catecumenato — Vida Sacramental',sublabel: 'Fase 6', emoji: '💧', tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'eleicao',           label: 'Eleição / Jornada da Eleição',   emoji: '🗳️',  tipo: 'passagem' },
  { id: 'purificacao',       label: 'Purificação e Iluminação',       sublabel: '3º Tempo — Quaresma', emoji: '💜', tipo: 'tempo', tempoId: 'tempo3' },
  { id: 'sacramento',        label: 'Celebração do Sacramento',       emoji: '👑',  tipo: 'sacramento' },
  { id: 'mistagogia',        label: 'Mistagogia',                     sublabel: '4º Tempo — Envio Missionário', emoji: '🕊️', tipo: 'fim', tempoId: 'tempo4' },
];

const ETAPAS_ADULTOS: Omit<EtapaJornada, 'status' | 'dataEvento' | 'percentual'>[] = [
  { id: 'pre_cat',           label: 'Pré-Catecumenato',               sublabel: '1º Tempo — Querigma', emoji: '🔥', tipo: 'inicio' },
  { id: 'pass_entrada',      label: 'Admissão ao Catecumenato',       emoji: '✨',  tipo: 'passagem' },
  { id: 'catecumenato',      label: 'Catecumenato',                   sublabel: '2º Tempo — Aprofundamento', emoji: '📖', tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'entrega_biblia',    label: 'Entrega da Bíblia',              emoji: '📖',  tipo: 'simbolo', simboloId: 'biblia' },
  { id: 'entrega_creio',     label: 'Entrega do Símbolo da Fé',       emoji: '✝️',  tipo: 'simbolo', simboloId: 'creio' },
  { id: 'entrega_pai_nosso', label: 'Entrega do Pai-Nosso',           emoji: '🙏',  tipo: 'simbolo', simboloId: 'pai_nosso' },
  { id: 'eleicao',           label: 'Eleição',                        sublabel: '1º Dom. da Quaresma', emoji: '🗳️', tipo: 'passagem' },
  { id: 'escrutinios',       label: 'Purificação / Escrutínios',      sublabel: '3º Tempo — Quaresma', emoji: '💜', tipo: 'tempo', tempoId: 'tempo3' },
  { id: 'sacramentos',       label: 'Sacramentos da Iniciação',       emoji: '🕊️',  tipo: 'sacramento' },
  { id: 'mistagogia',        label: 'Mistagogia',                     sublabel: '4º Tempo — Envio Missionário', emoji: '🌿', tipo: 'fim', tempoId: 'tempo4' },
];

const ETAPAS_POR_MODELO: Record<ModeloIVC, Omit<EtapaJornada, 'status' | 'dataEvento' | 'percentual'>[]> = {
  sementinhas: ETAPAS_SEMENTINHAS,
  eucaristia_crisma: ETAPAS_EUC_CRISMA,
  adultos: ETAPAS_ADULTOS,
};

// ─────────────────────────────────────────────────────────────
// CALCULATION ENGINE
// ─────────────────────────────────────────────────────────────
function calcularProgressoJornada(
  etapasBase: Omit<EtapaJornada, 'status' | 'dataEvento' | 'percentual'>[],
  encontros: any[],
  atividades: Atividade[],
  modoManual: boolean,
  overrideEtapaIdx?: number
): { etapas: EtapaJornada[]; posicaoAtual: number; percentualGeral: number } {
  const hoje = new Date();

  // Get IVC events
  const eventosIVC = atividades.filter(a =>
    a.tipo === 'Entrega de Símbolos' || a.tipo === 'Celebração de Passagem'
  );

  // Encontros realizados
  const encontrosRealizados = encontros.filter(e => e.status === 'realizado');
  const totalEncontros = encontros.length;
  const percFreq = totalEncontros > 0 ? encontrosRealizados.length / totalEncontros : 0;

  const etapas: EtapaJornada[] = etapasBase.map((base, idx) => {
    let status: EtapaStatus = 'pendente';
    let dataEvento: string | undefined;

    if (modoManual && overrideEtapaIdx !== undefined) {
      status = idx < overrideEtapaIdx ? 'concluido' : idx === overrideEtapaIdx ? 'em_andamento' : 'pendente';
    } else {
      // Auto mode: calculate from data
      if (base.tipo === 'simbolo' && base.simboloId) {
        const evSim = eventosIVC.find(a =>
          a.simboloIVC === base.simboloId || a.etapaIVC === base.id
        );
        if (evSim) {
          dataEvento = evSim.data;
          const dataEv = new Date(evSim.data + 'T23:59:59');
          if (dataEv < hoje) status = 'concluido';
          else status = 'agendado';
        }
      } else if (base.tipo === 'passagem') {
        const evPass = eventosIVC.find(a =>
          a.tipo === 'Celebração de Passagem' && (a.etapaIVC === base.id || a.nome.toLowerCase().includes(base.label.toLowerCase().slice(0, 8)))
        );
        if (evPass) {
          dataEvento = evPass.data;
          const dataEv = new Date(evPass.data + 'T23:59:59');
          if (dataEv < hoje) status = 'concluido';
          else status = 'agendado';
        }
      } else if (base.tipo === 'tempo') {
        // Progress based on encounter frequency
        if (percFreq >= 0.75) status = 'concluido';
        else if (percFreq >= 0.25) status = 'em_andamento';
        else status = 'pendente';
      } else if (base.tipo === 'inicio') {
        status = totalEncontros > 0 ? 'concluido' : 'em_andamento';
      } else if (base.tipo === 'sacramento') {
        // Check if any catequizando received the sacrament
        status = 'pendente';
      } else if (base.tipo === 'fim') {
        status = percFreq >= 0.9 && encontrosRealizados.length > 0 ? 'concluido' : 'pendente';
      }
    }

    return { ...base, status, dataEvento };
  });

  // Find current position (last completed or first in-progress)
  let posicaoAtual = 0;
  for (let i = etapas.length - 1; i >= 0; i--) {
    if (etapas[i].status === 'concluido' || etapas[i].status === 'em_andamento') {
      posicaoAtual = i;
      break;
    }
  }

  const concluidas = etapas.filter(e => e.status === 'concluido').length;
  const percentualGeral = Math.round((concluidas / etapas.length) * 100);

  return { etapas, posicaoAtual, percentualGeral };
}

function calcularRisco(
  encontros: any[],
  atividades: Atividade[],
  percentual: number
): { nivel: RiscoNivel; mensagem: string; detalhes: string } {
  const hoje = new Date();
  const eventosIVC = atividades.filter(a => a.tipo === 'Entrega de Símbolos' || a.tipo === 'Celebração de Passagem');

  // Check for overdue IVC events
  const eventosAtrasados = eventosIVC.filter(a => {
    if (!a.data) return false;
    const dataEv = new Date(a.data + 'T23:59:59');
    return dataEv < hoje && !a.realizado;
  });

  // Calculate encounter gap
  const realizados = encontros.filter(e => e.status === 'realizado');
  const pendentes = encontros.filter(e => e.status === 'pendente' && new Date(e.data) < hoje);

  if (eventosAtrasados.length > 0 || pendentes.length > 2) {
    return {
      nivel: 'atrasado',
      mensagem: 'Caminhada atrasada',
      detalhes: `${eventosAtrasados.length} evento(s) IVC atrasado(s) e ${pendentes.length} encontro(s) pendente(s) passados.`,
    };
  }
  if (pendentes.length > 0 || percentual < 30 && realizados.length > 5) {
    return {
      nivel: 'atencao',
      mensagem: 'Requer atenção',
      detalhes: `${pendentes.length} encontro(s) com data passada ainda pendente(s). Verifique o calendário.`,
    };
  }
  return {
    nivel: 'em_dia',
    mensagem: 'Em dia',
    detalhes: 'A caminhada está dentro do ritmo esperado.',
  };
}

function estimarDataConclusao(encontros: any[], percentual: number): string | null {
  if (percentual >= 100) return null;
  const realizados = encontros.filter(e => e.status === 'realizado');
  if (realizados.length < 2) return null;

  const futuros = encontros.filter(e => e.status === 'pendente' && e.data);
  if (futuros.length === 0) return null;

  const lastFuturo = futuros[futuros.length - 1];
  const d = new Date(lastFuturo.data + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

// ─────────────────────────────────────────────────────────────
// RISK BADGE COMPONENT
// ─────────────────────────────────────────────────────────────
function RiscoBadge({ nivel, mensagem }: { nivel: RiscoNivel; mensagem: string }) {
  const cfg = {
    em_dia: { dot: 'bg-emerald-400', bg: 'bg-emerald-500/10 border-emerald-400/30', text: 'text-emerald-600', icon: CheckCircle2 },
    atencao: { dot: 'bg-amber-400 animate-pulse', bg: 'bg-amber-500/10 border-amber-400/30', text: 'text-amber-600', icon: AlertTriangle },
    atrasado: { dot: 'bg-red-500 animate-pulse', bg: 'bg-red-500/10 border-red-400/30', text: 'text-red-600', icon: AlertTriangle },
  }[nivel];

  const Icon = cfg.icon;

  return (
    <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full border-2 text-sm font-bold", cfg.bg, cfg.text)}>
      <div className={cn("w-2 h-2 rounded-full", cfg.dot)} />
      <Icon className="h-4 w-4" />
      <span>{mensagem}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STAT CARD COMPONENT
// ─────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl p-4 border-2", color)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">{label}</p>
          <p className="text-3xl font-black leading-none">{value}</p>
          {sub && <p className="text-xs mt-1 opacity-70 font-semibold">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// JOURNEY MAP COMPONENT
// ─────────────────────────────────────────────────────────────
function JornadaMap({
  etapas,
  posicaoAtual,
  modelo,
}: {
  etapas: EtapaJornada[];
  posicaoAtual: number;
  modelo: ModeloIVC;
}) {
  const [expandida, setExpandida] = useState<string | null>(null);

  const statusStyle: Record<EtapaStatus, { ring: string; bg: string; text: string; connector: string }> = {
    concluido:    { ring: 'ring-4 ring-emerald-400/40', bg: 'bg-emerald-500', text: 'text-white', connector: 'bg-emerald-400' },
    em_andamento: { ring: 'ring-4 ring-primary/30', bg: 'bg-primary', text: 'text-white', connector: 'bg-primary/40' },
    agendado:     { ring: 'ring-4 ring-amber-400/30', bg: 'bg-amber-400', text: 'text-white', connector: 'bg-amber-200' },
    pendente:     { ring: '', bg: 'bg-muted/50 border-2 border-muted-foreground/20', text: 'text-muted-foreground/50', connector: 'bg-muted/40' },
  };

  const tipoStyle: Record<EtapaJornada['tipo'], { size: string; nodeSize: string }> = {
    inicio:    { size: 'text-3xl', nodeSize: 'w-16 h-16' },
    tempo:     { size: 'text-2xl', nodeSize: 'w-14 h-14' },
    passagem:  { size: 'text-3xl', nodeSize: 'w-16 h-16' },
    simbolo:   { size: 'text-2xl', nodeSize: 'w-12 h-12' },
    sacramento:{ size: 'text-4xl', nodeSize: 'w-20 h-20' },
    fim:       { size: 'text-3xl', nodeSize: 'w-16 h-16' },
  };

  return (
    <div className="relative py-4">
      {/* Central spine */}
      <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 bg-gradient-to-b from-emerald-500/30 via-violet-500/30 to-rose-500/30 rounded-full" />

      <div className="space-y-4">
        {etapas.map((etapa, idx) => {
          const st = statusStyle[etapa.status];
          const ts = tipoStyle[etapa.tipo];
          const isLeft = idx % 2 === 0;
          const isActive = posicaoAtual === idx;
          const isExpanded = expandida === etapa.id;

          return (
            <div key={etapa.id} className="relative flex items-center justify-center">
              {/* Node */}
              <button
                onClick={() => setExpandida(isExpanded ? null : etapa.id)}
                className={cn(
                  "relative z-10 flex items-center justify-center rounded-full shadow-lg transition-all duration-300",
                  ts.nodeSize,
                  st.bg, st.ring,
                  isActive && "scale-110 shadow-2xl shadow-primary/30",
                  "hover:scale-105 active:scale-95"
                )}
              >
                <span className={cn(ts.size, "filter drop-shadow-sm")}>{etapa.emoji}</span>
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full shadow flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  </div>
                )}
                {etapa.status === 'concluido' && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full shadow flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                )}
              </button>

              {/* Label card — alternates left/right */}
              <div
                className={cn(
                  "absolute max-w-[120px] sm:max-w-[150px]",
                  isLeft ? "right-[calc(50%+44px)]" : "left-[calc(50%+44px)]"
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-3 py-2 shadow-sm border-2 transition-all duration-200 cursor-pointer",
                    isExpanded
                      ? "bg-white dark:bg-card border-primary/50 shadow-lg"
                      : "bg-white/90 dark:bg-card/90 border-border hover:border-primary/40"
                  )}
                  onClick={() => setExpandida(isExpanded ? null : etapa.id)}
                >
                  <p className={cn(
                    "text-xs sm:text-sm font-black leading-tight uppercase tracking-wide",
                    etapa.status === 'concluido' ? "text-emerald-700" :
                    etapa.status === 'em_andamento' ? "text-primary" :
                    etapa.status === 'agendado' ? "text-amber-700" :
                    "text-muted-foreground"
                  )}>
                    {etapa.label}
                  </p>
                  {etapa.sublabel && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-bold leading-tight">
                      {etapa.sublabel}
                    </p>
                  )}
                  {etapa.dataEvento && (
                    <p className="text-[10px] font-black text-amber-600 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(etapa.dataEvento + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </p>
                  )}
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="mt-2 bg-white dark:bg-card rounded-xl p-3 border border-primary/10 shadow-lg text-[10px] space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        etapa.status === 'concluido' ? 'bg-emerald-500' :
                        etapa.status === 'em_andamento' ? 'bg-primary' :
                        etapa.status === 'agendado' ? 'bg-amber-400' : 'bg-muted-foreground/30'
                      )} />
                      <span className="font-black uppercase tracking-widest text-[8px]">
                        {etapa.status === 'concluido' ? 'Concluído' :
                         etapa.status === 'em_andamento' ? 'Em andamento' :
                         etapa.status === 'agendado' ? 'Agendado' : 'Pendente'}
                      </span>
                    </div>
                    {etapa.tipo === 'simbolo' && (
                      <p className="text-muted-foreground font-medium">
                        Entrega registrada via evento no módulo de Eventos.
                      </p>
                    )}
                    {etapa.tipo === 'passagem' && (
                      <p className="text-muted-foreground font-medium">
                        Celebração de passagem entre os Tempos do IVC.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Connector to next */}
              {idx < etapas.length - 1 && (
                <div className={cn(
                  "absolute top-full left-1/2 -translate-x-1/2 w-1 h-4 rounded-full",
                  etapa.status === 'concluido' ? 'bg-emerald-400' : 'bg-muted/40'
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PENDENCIAS PANEL COMPONENT
// ─────────────────────────────────────────────────────────────
function PendenciasPanel({
  etapas,
  turmaId,
  atividades,
  encontros,
}: {
  etapas: EtapaJornada[];
  turmaId: string;
  atividades: Atividade[];
  encontros: any[];
}) {
  const navigate = useNavigate();
  const pendentes = etapas.filter(e => e.status === 'pendente' || e.status === 'agendado');
  const eventosIVC = atividades.filter(a => a.tipo === 'Entrega de Símbolos' || a.tipo === 'Celebração de Passagem');
  const encontrosPendentes = encontros.filter(e => e.status === 'pendente');

  if (pendentes.length === 0 && eventosIVC.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <p className="font-black text-emerald-700">Todas as etapas concluídas!</p>
        <p className="text-sm text-muted-foreground">A turma completou toda a jornada do IVC.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Missing IVC events */}
      {pendentes.filter(e => e.tipo === 'simbolo').length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
            <Gift className="w-4 h-4" /> Entregas de Símbolos Pendentes
          </p>
          {pendentes.filter(e => e.tipo === 'simbolo').map(etapa => {
            const simbolo = SIMBOLOS_IVC.find(s => s.id === etapa.simboloId);
            return (
              <button
                key={etapa.id}
                onClick={() => navigate(`/turmas/${turmaId}/eventos`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-50 border-2 border-amber-200 hover:bg-amber-100 transition-colors text-left group"
              >
                <span className="text-3xl">{simbolo?.emoji ?? '📦'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-amber-900 truncate">{etapa.label}</p>
                  <p className="text-xs font-bold text-amber-600">Criar evento "Entrega de Símbolos" para registrar</p>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            );
          })}
        </div>
      )}

      {/* Missing celebrations */}
      {pendentes.filter(e => e.tipo === 'passagem').length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-violet-600 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Celebrações de Passagem Pendentes
          </p>
          {pendentes.filter(e => e.tipo === 'passagem').map(etapa => (
            <button
              key={etapa.id}
              onClick={() => navigate(`/turmas/${turmaId}/eventos`)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-violet-50 border-2 border-violet-200 hover:bg-violet-100 transition-colors text-left group"
            >
              <span className="text-3xl">{etapa.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-violet-900 truncate">{etapa.label}</p>
                <p className="text-xs font-bold text-violet-600">Criar evento "Celebração de Passagem" para registrar</p>
              </div>
              <ChevronRight className="w-5 h-5 text-violet-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      )}

      {/* Encounter pendencies */}
      {encontrosPendentes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Encontros Pendentes ({encontrosPendentes.length})
          </p>
          <button
            onClick={() => navigate(`/turmas/${turmaId}/encontros`)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-50 border-2 border-blue-200 hover:bg-blue-100 transition-colors text-left group"
          >
            <Calendar className="w-6 h-6 text-blue-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-blue-900">{encontrosPendentes.length} encontro(s) aguardando realização</p>
              <p className="text-xs font-bold text-blue-600">Clique para acessar o módulo de Encontros</p>
            </div>
            <ChevronRight className="w-5 h-5 text-blue-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

      {pendentes.length === 0 && encontrosPendentes.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhuma pendência encontrada! 🎉
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MANUAL OVERRIDE CONTROL
// ─────────────────────────────────────────────────────────────
function ManualControle({
  etapas,
  posicaoAtual,
  onChangePosicao,
}: {
  etapas: EtapaJornada[];
  posicaoAtual: number;
  onChangePosicao: (idx: number) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        Selecione a etapa atual da turma:
      </p>
      <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
        {etapas.map((etapa, idx) => (
          <button
            key={etapa.id}
            onClick={() => onChangePosicao(idx)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
              posicaoAtual === idx
                ? "bg-primary/10 border-primary shadow-sm"
                : "bg-muted/30 border-transparent hover:border-border hover:bg-muted/50"
            )}
          >
            <span className="text-2xl">{etapa.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-black truncate", posicaoAtual === idx ? "text-primary" : "text-foreground/80")}>
                {etapa.label}
              </p>
            </div>
            {posicaoAtual === idx && (
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────
export default function PainelIVC() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: turmas = [] } = useTurmas();
  const { data: catequizandos = [] } = useCatequizandos(id);
  const { data: encontros = [] } = useEncontros(id);
  const { data: atividades = [] } = useAtividades(id);
  const { data: reunioes = [] } = useReunioes(id);

  const turma = turmas.find(t => t.id === id);

  const [modoManual, setModoManual] = useState(false);
  const [overrideIdx, setOverrideIdx] = useState<number | undefined>(undefined);
  const [abaAtiva, setAbaAtiva] = useState<'mapa' | 'pendencias' | 'estatisticas'>('mapa');
  const [showQR, setShowQR] = useState(false);

  const modelo = useMemo(() => detectarModelo(turma?.etapa ?? ''), [turma?.etapa]);
  const modeloInfo = MODELO_INFO[modelo];
  const etapasBase = ETAPAS_POR_MODELO[modelo];

  const { etapas, posicaoAtual, percentualGeral } = useMemo(
    () => calcularProgressoJornada(etapasBase, encontros, atividades, modoManual, overrideIdx),
    [etapasBase, encontros, atividades, modoManual, overrideIdx]
  );

  const risco = useMemo(() => calcularRisco(encontros, atividades, percentualGeral), [encontros, atividades, percentualGeral]);
  const estimativa = useMemo(() => estimarDataConclusao(encontros, percentualGeral), [encontros, percentualGeral]);

  const encontrosRealizados = encontros.filter(e => e.status === 'realizado');
  const freqMedia = useMemo(() => {
    if (!encontrosRealizados.length || !catequizandos.length) return 0;
    const totalPresencas = encontrosRealizados.reduce((acc, e) => acc + (e.presencas?.length ?? 0), 0);
    return Math.round((totalPresencas / (encontrosRealizados.length * catequizandos.length)) * 100);
  }, [encontrosRealizados, catequizandos]);

  const publicUrl = `${getAppUrl()}/painel-ivc/${turma?.codigoAcesso ?? id}`;

  const handleShare = useCallback(() => {
    if (turma?.codigoAcesso) {
      setShowQR(true);
    } else {
      toast.info("Esta turma não possui código de acesso público ainda. Gere um na página da turma.");
    }
  }, [turma]);

  if (!turma) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-black text-primary/60 uppercase tracking-widest animate-pulse">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-20">
      {/* ─── HEADER ─── */}
      <div className="space-y-4 animate-fade-in flex flex-col pt-4">
        <div className="flex items-center justify-center min-h-[44px] relative">
          <button onClick={() => navigate(`/turmas/${id}`)} className="back-btn absolute left-0">
            <ArrowLeft className="h-5 w-5 text-black dark:text-white" />
          </button>
          <div className="flex flex-col items-center gap-0.5 text-center px-12">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">{turma.nome}</p>
            <h1 className="text-xl font-black text-foreground tracking-tight uppercase">Painel IVC</h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
              Itinerário Inteligente
            </p>
          </div>
          <button onClick={handleShare} className="absolute right-0 w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
            <Share2 className="h-4 w-4 text-foreground/60" />
          </button>
        </div>
      </div>

      {/* ─── MODELO CARD ─── */}
      <div className="rounded-3xl p-6 bg-white dark:bg-card border-2 border-border/60 shadow-md animate-fade-in text-foreground relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col gap-5 relative z-10">
          {/* Header Info */}
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-4xl shadow-sm shrink-0">
              {modeloInfo.emoji}
            </div>
            <div className="flex-1">
              <h2 className="font-black text-2xl leading-tight text-foreground">{turma.nome}</h2>
              {turma.ano && (
                <p className="text-sm font-bold text-muted-foreground mt-0.5">{turma.ano}</p>
              )}
            </div>
          </div>

          <div className="h-px bg-border/50 w-full" />

          {/* Current Stage Indicator */}
          {etapas[posicaoAtual] && (
            <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-card shadow-sm border border-border/50 flex items-center justify-center text-2xl shrink-0">
                {etapas[posicaoAtual].emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5">Posição Atual da Turma</p>
                <p className="font-black text-sm text-foreground truncate">{etapas[posicaoAtual].label}</p>
                {etapas[posicaoAtual].sublabel && (
                  <p className="text-xs font-medium text-muted-foreground truncate mt-0.5">{etapas[posicaoAtual].sublabel}</p>
                )}
              </div>
            </div>
          )}

          {/* Progress Section */}
          <div className="space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1.5">Evolução na Jornada</p>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-black text-primary leading-none tracking-tighter">{percentualGeral}%</span>
                  <RiscoBadge nivel={risco.nivel} mensagem={risco.mensagem} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-foreground bg-muted px-2 py-1 rounded-md inline-block mb-1">
                  {etapas.filter(e => e.status === 'concluido').length} de {etapas.length} etapas
                </p>
                {estimativa && <p className="text-[10px] font-black text-muted-foreground uppercase block">Término: {estimativa}</p>}
              </div>
            </div>
            
            <div className="h-4 bg-muted rounded-full overflow-hidden border border-border/50 shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-1000 relative"
                style={{ width: `${percentualGeral}%` }}
              >
                {/* Shine effect */}
                <div className="absolute top-0 inset-x-0 h-[40%] bg-white/20 rounded-t-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── RISK ALERT (if not ok) ─── */}
      {risco.nivel !== 'em_dia' && (
        <div className={cn(
          "rounded-2xl p-4 border flex items-start gap-3 animate-fade-in",
          risco.nivel === 'atrasado'
            ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/30"
            : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/30"
        )}>
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            risco.nivel === 'atrasado' ? "bg-red-100 text-red-500" : "bg-amber-100 text-amber-500"
          )}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("font-black text-sm", risco.nivel === 'atrasado' ? "text-red-700" : "text-amber-700")}>
              {risco.nivel === 'atrasado' ? '🔴 Caminhada atrasada' : '🟡 Requer atenção'}
            </p>
            <p className={cn("text-xs mt-0.5", risco.nivel === 'atrasado' ? "text-red-600" : "text-amber-600")}>
              {risco.detalhes}
            </p>
          </div>
        </div>
      )}

      {/* ─── MODO AUTOMATICO / MANUAL ─── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-card rounded-2xl border border-border/40 shadow-sm">
        <div className="flex-1">
          <p className="text-xs font-black text-foreground">Modo de Atualização</p>
          <p className="text-[10px] text-muted-foreground">
            {modoManual ? 'Manual — você define a etapa atual' : 'Automático — calculado pelos dados registrados'}
          </p>
        </div>
        <button
          onClick={() => { setModoManual(!modoManual); setOverrideIdx(undefined); }}
          className={cn(
            "relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0",
            modoManual ? "bg-primary" : "bg-muted"
          )}
        >
          <div className={cn(
            "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200",
            modoManual ? "left-7" : "left-1"
          )} />
        </button>
      </div>

      {/* ─── TAB NAVIGATION ─── */}
      <div className="flex bg-muted/40 p-1.5 rounded-2xl gap-2">
        {([
          { id: 'mapa',         color: 'text-indigo-500',  bg: 'bg-indigo-500/10',  icon: Route },
          { id: 'pendencias',   color: 'text-amber-500',   bg: 'bg-amber-500/10',   icon: ListTodo },
          { id: 'estatisticas', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: LineChart },
        ] as const).map(aba => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            className={cn(
              "flex-1 flex items-center justify-center py-3 rounded-xl transition-all border",
              abaAtiva === aba.id
                ? cn("bg-white dark:bg-card shadow-md border-border/50", aba.color)
                : "border-transparent text-muted-foreground hover:bg-white/50 dark:hover:bg-card/50 hover:text-foreground"
            )}
          >
            <div className={cn("p-2 rounded-xl transition-colors", abaAtiva === aba.id ? aba.bg : "bg-transparent")}>
              <aba.icon className="w-6 h-6 shrink-0" />
            </div>
          </button>
        ))}
      </div>

      {/* ─── TAB: MAPA ─── */}
      {abaAtiva === 'mapa' && (
        <div className="animate-fade-in space-y-4">
          {modoManual && (
            <div className="bg-white dark:bg-card rounded-2xl border border-border/40 p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3" /> Controle Manual de Posição
              </p>
              <ManualControle
                etapas={etapas}
                posicaoAtual={overrideIdx ?? posicaoAtual}
                onChangePosicao={setOverrideIdx}
              />
            </div>
          )}

          {/* Etapa atual destacada */}
          <div className="bg-white dark:bg-card rounded-2xl border border-primary/20 p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-primary" /> Posição Atual da Turma
            </p>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{etapas[posicaoAtual]?.emoji}</span>
              <div>
                <p className="font-black text-sm text-foreground">{etapas[posicaoAtual]?.label}</p>
                {etapas[posicaoAtual]?.sublabel && (
                  <p className="text-[10px] text-muted-foreground">{etapas[posicaoAtual]?.sublabel}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-card rounded-2xl border border-border/30 p-2 shadow-sm overflow-hidden">
            <JornadaMap etapas={etapas} posicaoAtual={posicaoAtual} modelo={modelo} />
          </div>
        </div>
      )}

      {/* ─── TAB: PENDÊNCIAS ─── */}
      {abaAtiva === 'pendencias' && (
        <div className="bg-white dark:bg-card rounded-2xl border-2 border-border/60 p-4 shadow-sm animate-fade-in">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-amber-500" /> O que ainda falta
          </p>
          <PendenciasPanel
            etapas={etapas}
            turmaId={id!}
            atividades={atividades}
            encontros={encontros}
          />
        </div>
      )}

      {/* ─── TAB: ESTATÍSTICAS ─── */}
      {abaAtiva === 'estatisticas' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={BookOpen}
              label="Encontros"
              value={`${encontrosRealizados.length}/${encontros.length}`}
              sub="realizados / total"
              color="bg-blue-50 border-blue-200 text-blue-700"
            />
            <StatCard
              icon={Users}
              label="Catequizandos"
              value={catequizandos.filter(c => c.status === 'ativo').length}
              sub="ativos na turma"
              color="bg-emerald-50 border-emerald-200 text-emerald-700"
            />
            <StatCard
              icon={TrendingUp}
              label="Frequência Média"
              value={`${freqMedia}%`}
              sub="média de presença"
              color={freqMedia >= 75 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : freqMedia >= 50 ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-red-50 border-red-200 text-red-700"}
            />
            <StatCard
              icon={Sparkles}
              label="Etapas IVC"
              value={`${etapas.filter(e => e.status === 'concluido').length}/${etapas.length}`}
              sub="concluídas / total"
              color="bg-violet-50 border-violet-200 text-violet-700"
            />
          </div>

          {/* Símbolos entregues */}
          <div className="bg-white dark:bg-card rounded-2xl border border-border/30 p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <Gift className="w-3 h-3" /> Símbolos Entregues
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SIMBOLOS_IVC.filter(s => s.id !== 'outro').map(simbolo => {
                const entregue = atividades.some(a =>
                  a.tipo === 'Entrega de Símbolos' && a.simboloIVC === simbolo.id
                );
                return (
                  <div key={simbolo.id} className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                    entregue
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-muted/20 border-border/30 opacity-50"
                  )}>
                    <span className="text-2xl">{simbolo.emoji}</span>
                    <p className="text-[9px] font-black uppercase tracking-wide text-center leading-tight">
                      {simbolo.label}
                    </p>
                    {entregue && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick access */}
          <div className="bg-white dark:bg-card rounded-2xl border border-border/30 p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
              Acesso Rápido aos Módulos
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Encontros', emoji: '📅', path: `/turmas/${id}/encontros`, color: 'bg-blue-50 border-blue-200 text-blue-700' },
                { label: 'Eventos', emoji: '🎉', path: `/turmas/${id}/eventos`, color: 'bg-amber-50 border-amber-200 text-amber-700' },
                { label: 'Reuniões', emoji: '👥', path: `/turmas/${id}/reunioes`, color: 'bg-violet-50 border-violet-200 text-violet-700' },
                { label: 'Catequizandos', emoji: '👤', path: `/turmas/${id}/catequizandos`, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
              ].map(item => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn("flex items-center gap-2 p-3 rounded-xl border font-bold text-xs transition-all hover:opacity-90 active:scale-95", item.color)}
                >
                  <span className="text-lg">{item.emoji}</span>
                  {item.label}
                  <ChevronRight className="w-3 h-3 ml-auto" />
                </button>
              ))}
            </div>
          </div>

          {/* Public link info */}
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 rounded-2xl border border-indigo-200/50 p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Eye className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-indigo-800">Versão Pública para Pais</p>
                <p className="text-[10px] text-indigo-600 mt-0.5">
                  Compartilhe o painel com pais, coordenador e padre via link ou QR Code.
                </p>
                <button
                  onClick={handleShare}
                  className="mt-2 flex items-center gap-1.5 text-[10px] font-black text-indigo-700 hover:text-indigo-900 transition-colors"
                >
                  <Share2 className="w-3 h-3" />
                  Compartilhar link público
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Share Modal */}
      {showQR && turma?.codigoAcesso && (
        <QRShareModal
          open={showQR}
          onClose={() => setShowQR(false)}
          url={publicUrl}
          title="Painel IVC — Versão Pública"
          description="Compartilhe com pais, coordenador e padre para acompanhar a jornada da turma."
        />
      )}
    </div>
  );
}
