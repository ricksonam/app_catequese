import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useCatequizandos, useEncontros, useAtividades, useReunioes, useAtividadeMutation } from "@/hooks/useSupabaseData";
import { useState, useMemo, useCallback } from "react";
import {
  ArrowLeft, Share2, AlertTriangle, CheckCircle2, Calendar, ChevronRight,
  BookOpen, Users, TrendingUp, MapPin, Gift, Sparkles,
  Route, ListTodo, LineChart, RefreshCw, Eye, X, Star,
} from "lucide-react";
import { cn, getAppUrl } from "@/lib/utils";
import { toast } from "sonner";
import type { Atividade } from "@/lib/store";
import { SIMBOLOS_IVC, CELEBRACOES_PASSAGEM, type CelebracaoPassagemTipo } from "@/lib/store";
import { QRShareModal } from "@/components/QRShareModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
export type ModeloIVC = 'sementinhas' | 'eucaristia_crisma' | 'adultos';
export type RiscoNivel = 'em_dia' | 'atencao' | 'atrasado';
export type EtapaStatus = 'concluido' | 'em_andamento' | 'pendente' | 'agendado';

export interface EtapaJornada {
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
  celebracaoTipo?: CelebracaoPassagemTipo;
  entregaCruz?: boolean;
  entregaBiblia?: boolean;
  dispensado?: boolean;
  dataFim?: string;
}

// ─────────────────────────────────────────────────────────────
// MODEL DETECTION
// ─────────────────────────────────────────────────────────────
export function detectarModelo(etapa: string): ModeloIVC {
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
export type EtapaBase = Omit<EtapaJornada, 'status' | 'dataEvento' | 'percentual' | 'entregaCruz' | 'entregaBiblia'>;

const ETAPAS_SEMENTINHAS: EtapaBase[] = [
  { id: 'acolhida',       label: 'Acolhida e Inscrição',              emoji: '🌱', tipo: 'inicio' },
  { id: 'pre_cat',        label: 'Pré-Catecumenato',                  sublabel: 'Tempo de Iniciação Lúdica', emoji: '🎈', tipo: 'tempo', tempoId: 'tempo1' },
  { id: 'encontros_seed', label: 'Encontros Formativos',              emoji: '📚', tipo: 'simbolo' },
  { id: 'pass_catec',     label: 'Celebração de Início da Catequese', emoji: '🎉', tipo: 'passagem', celebracaoTipo: 'admissao_catecumenato' },
  { id: 'catec_seed',     label: 'Catecumenato Infantil',             sublabel: 'Aprofundamento da Fé', emoji: '📖', tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'entrega_biblia', label: 'Bíblia das Crianças',              emoji: '📖', tipo: 'simbolo', simboloId: 'biblia' },
  { id: 'pass_ilum_seed', label: 'Celebração da Família',             emoji: '🎊', tipo: 'passagem' },
  { id: 'ilum_seed',      label: 'Purificação e Alegria',             sublabel: 'Preparação Final', emoji: '✨', tipo: 'tempo', tempoId: 'tempo3' },
  { id: 'mis_seed',       label: 'Missão das Sementinhas',            sublabel: 'Mistagogia', emoji: '🌿', tipo: 'fim' },
];

const ETAPAS_EUC_CRISMA: EtapaBase[] = [
  { id: 'preparacao',        label: 'Preparação / Convite',                        emoji: '📣',  tipo: 'inicio' },
  // ✅ Celebração de Início da Catequese — NÃO é passagem de etapa, é o início
  { id: 'pass_entrada',      label: 'Celebração de Início da Catequese',           emoji: '🎉',  tipo: 'inicio' },
  { id: 'pre_cat',           label: 'Pré-Catecumenato',                            sublabel: '1º Tempo — Querigma (mín. 6 meses)', emoji: '🔥', tipo: 'tempo', tempoId: 'tempo1' },
  // ✅ 1ª PASSAGEM DE ETAPA: Rito de Admissão ao Catecumenato (entrega Cruz + opcional Bíblia)
  { id: 'pass_cat',          label: 'Rito de Admissão ao Catecumenato',            emoji: '⛪',  tipo: 'passagem', celebracaoTipo: 'admissao_catecumenato' },
  { id: 'cat_biblia',        label: 'Catecumenato — Palavra de Deus',              sublabel: '2º Tempo — Fase 1', emoji: '📖', tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'entrega_biblia',    label: 'Entrega da Bíblia',                           emoji: '📖',  tipo: 'simbolo', simboloId: 'biblia' },
  { id: 'cat_pessoa',        label: 'Catecumenato — Pessoa Humana',                sublabel: 'Fase 2', emoji: '👤', tipo: 'tempo', tempoId: 'tempo2' },
  // ✅ Celebração da Vida — celebração interna do catecumenato, símbolo opcional pela tradição da comunidade
  { id: 'celebracao_vida',   label: 'Celebração da Vida',                          sublabel: 'Celebração interna — símbolo opcional', emoji: '🎊', tipo: 'simbolo' },
  { id: 'cat_jesus',         label: 'Catecumenato — Jesus Cristo',                 sublabel: 'Fase 3', emoji: '✝️',  tipo: 'tempo', tempoId: 'tempo2' },
  // ✅ Jornada do Discipulado — atividade externa dentro do Catecumenato, não é passagem
  { id: 'jornada_disc',      label: 'Jornada do Discipulado',                      sublabel: 'Atividade externa no Catecumenato', emoji: '🤝',  tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'cat_oracao',        label: 'Catecumenato — Vida de Oração',               sublabel: 'Fase 4', emoji: '🙏',  tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'entrega_pai_nosso', label: 'Entrega do Pai-Nosso',                        emoji: '🙏',  tipo: 'simbolo', simboloId: 'pai_nosso' },
  { id: 'cat_comunidade',    label: 'Catecumenato — Comunidade de Fé',             sublabel: 'Fase 5', emoji: '⛪', tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'entrega_creio',     label: 'Entrega do Símbolo da Fé',                    emoji: '✝️',  tipo: 'simbolo', simboloId: 'creio' },
  { id: 'cat_sacramental',   label: 'Catecumenato — Vida Sacramental',             sublabel: 'Fase 6', emoji: '💧', tipo: 'tempo', tempoId: 'tempo2' },
  // ✅ 2ª PASSAGEM DE ETAPA: Eleição — Preparação para os Sacramentos
  { id: 'eleicao',           label: 'Eleição — Preparação para os Sacramentos',   emoji: '🗳️',  tipo: 'passagem', celebracaoTipo: 'eleicao_preparacao' },
  { id: 'purificacao',       label: 'Purificação e Iluminação',                   sublabel: '3º Tempo — Quaresma', emoji: '💜', tipo: 'tempo', tempoId: 'tempo3' },
  // ✅ 3ª PASSAGEM DE ETAPA: Recepção dos Sacramentos
  { id: 'recepcao_sac',      label: 'Recepção dos Sacramentos',                   emoji: '👑',  tipo: 'passagem', celebracaoTipo: 'recepcao_sacramentos' },
  { id: 'mistagogia',        label: 'Mistagogia',                                  sublabel: '4º Tempo — Envio Missionário', emoji: '🕊️', tipo: 'fim', tempoId: 'tempo4' },
];

const ETAPAS_ADULTOS: EtapaBase[] = [
  { id: 'pre_cat',       label: 'Pré-Catecumenato',                              sublabel: '1º Tempo — Querigma', emoji: '🔥', tipo: 'inicio' },
  // ✅ 1ª PASSAGEM DE ETAPA: Rito de Admissão (entrega Cruz + opcional Bíblia)
  { id: 'pass_entrada',  label: 'Rito de Admissão ao Catecumenato',              emoji: '⛪',  tipo: 'passagem', celebracaoTipo: 'admissao_catecumenato' },
  { id: 'catecumenato',  label: 'Catecumenato',                                  sublabel: '2º Tempo — Aprofundamento', emoji: '📖', tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'entrega_biblia',    label: 'Entrega da Bíblia',                         emoji: '📖',  tipo: 'simbolo', simboloId: 'biblia' },
  { id: 'entrega_creio',     label: 'Entrega do Símbolo da Fé',                  emoji: '✝️',  tipo: 'simbolo', simboloId: 'creio' },
  { id: 'entrega_pai_nosso', label: 'Entrega do Pai-Nosso',                      emoji: '🙏',  tipo: 'simbolo', simboloId: 'pai_nosso' },
  // ✅ 2ª PASSAGEM DE ETAPA: Eleição — Preparação para os Sacramentos
  { id: 'eleicao',       label: 'Eleição — Preparação para os Sacramentos',     emoji: '🗳️',  tipo: 'passagem', celebracaoTipo: 'eleicao_preparacao' },
  { id: 'escrutinios',   label: 'Purificação / Escrutínios',                    sublabel: '3º Tempo — Quaresma', emoji: '💜', tipo: 'tempo', tempoId: 'tempo3' },
  // ✅ 3ª PASSAGEM DE ETAPA: Recepção dos Sacramentos
  { id: 'recepcao_sac',  label: 'Recepção dos Sacramentos',                     emoji: '👑',  tipo: 'passagem', celebracaoTipo: 'recepcao_sacramentos' },
  { id: 'mistagogia',    label: 'Mistagogia',                                    sublabel: '4º Tempo — Envio Missionário', emoji: '🌿', tipo: 'fim', tempoId: 'tempo4' },
];

export const ETAPAS_POR_MODELO: Record<ModeloIVC, EtapaBase[]> = {
  sementinhas: ETAPAS_SEMENTINHAS,
  eucaristia_crisma: ETAPAS_EUC_CRISMA,
  adultos: ETAPAS_ADULTOS,
};

// ─────────────────────────────────────────────────────────────
// CALCULATION ENGINE
// ─────────────────────────────────────────────────────────────
export function calcularProgressoJornada(
  etapasBase: EtapaBase[],
  encontros: any[],
  atividades: Atividade[],
  modoManual: boolean,
  overrideEtapaIdx?: number
): { etapas: EtapaJornada[]; posicaoAtual: number; percentualGeral: number } {
  const hoje = new Date();

  const eventosIVC = atividades.filter(a =>
    a.tipo === 'Entrega de Símbolos' || a.tipo === 'Celebração de Passagem'
  );

  const encontrosRealizados = encontros.filter(e => e.status === 'realizado');
  const totalEncontros = encontros.length;
  const percFreq = totalEncontros > 0 ? encontrosRealizados.length / totalEncontros : 0;

  let bloqueado = false;

  const etapas: EtapaJornada[] = etapasBase.map((base, idx) => {
    let status: EtapaStatus = 'pendente';
    let dataEvento: string | undefined;
    let entregaCruz: boolean | undefined;
    let entregaBiblia: boolean | undefined;
    let dispensado = false;

    if (modoManual && overrideEtapaIdx !== undefined) {
      status = idx < overrideEtapaIdx ? 'concluido' : idx === overrideEtapaIdx ? 'em_andamento' : 'pendente';
    } else {
      if (base.tipo === 'simbolo') {
        let evSim: Atividade | undefined;
        if (base.simboloId) {
          evSim = eventosIVC.find(a =>
            a.simboloIVC === base.simboloId || a.etapaIVC === base.id
          );
        } else {
          // No fixed symbol (e.g. Celebração da Vida) — match by etapaIVC
          evSim = eventosIVC.find(a => (a.etapaIVC as string) === base.id);
        }
        if (evSim) {
          dataEvento = evSim.data;
          dispensado = evSim.dispensado || false;
          const dataEv = new Date(evSim.data + 'T23:59:59');
          if (evSim.realizado || dataEv < hoje) status = 'concluido';
          else status = 'agendado';
        }
      } else if (base.tipo === 'passagem') {
        const evPass = eventosIVC.find(a =>
          a.tipo === 'Celebração de Passagem' && (
            (a.etapaIVC as string) === base.id ||
            (base.celebracaoTipo && a.celebracaoPassagemTipo === base.celebracaoTipo) ||
            a.nome.toLowerCase().includes(base.label.toLowerCase().slice(0, 8))
          )
        );
        if (evPass) {
          dataEvento = evPass.data;
          entregaCruz = evPass.entregaCruz;
          entregaBiblia = evPass.entregaBiblia;
          dispensado = evPass.dispensado || false;
          const dataEv = new Date(evPass.data + 'T23:59:59');
          if (evPass.realizado || dataEv < hoje) status = 'concluido';
          else status = 'agendado';
        }
      } else if (base.tipo === 'tempo') {
        if (percFreq >= 0.75) status = 'concluido';
        else if (percFreq >= 0.25) status = 'em_andamento';
        else status = 'pendente';
      } else if (base.tipo === 'inicio') {
        const evInicio = atividades.find(a => a.tipo === 'Celebração' && (a.etapaIVC as string) === base.id);
        let dataFim: string | undefined;
        if (evInicio) {
          dataEvento = evInicio.data;
          dispensado = evInicio.dispensado || false;
          const dataFimRaw = evInicio.observacao?.match(/dataFim:(\d{4}-\d{2}-\d{2})/)?.[1];
          if (dataFimRaw) dataFim = dataFimRaw;
        }
        status = totalEncontros > 0 || (evInicio && evInicio.realizado) ? 'concluido' : 'em_andamento';
        return { ...base, status, dataEvento, dataFim, dispensado };
      } else if (base.tipo === 'sacramento') {
        status = 'pendente';
      } else if (base.tipo === 'fim') {
        status = percFreq >= 0.9 && encontrosRealizados.length > 0 ? 'concluido' : 'pendente';
      }

      // LÓGICA DE BLOQUEIO SEQUENCIAL
      // A jornada IVC é sequencial. Se uma passagem ou símbolo obrigatório anterior não foi concluído,
      // a turma não pode estar 'em_andamento' ou 'concluída' nos tempos seguintes.
      if (bloqueado) {
        if (status === 'concluido' || status === 'em_andamento') {
          status = 'pendente';
        }
      }

      // Se um Rito de Passagem ou Símbolo não estiver concluído, bloqueia o avanço da jornada
      if ((base.tipo === 'passagem' || base.tipo === 'simbolo') && status !== 'concluido') {
        bloqueado = true;
      }
    }

    return { ...base, status, dataEvento, entregaCruz, entregaBiblia, dispensado };
  });

  // Find current position: last concluido or first em_andamento
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

export function calcularRisco(
  encontros: any[],
  atividades: Atividade[],
  percentual: number
): { nivel: RiscoNivel; mensagem: string; detalhes: string } {
  const hoje = new Date();
  const eventosIVC = atividades.filter(a => a.tipo === 'Entrega de Símbolos' || a.tipo === 'Celebração de Passagem');

  const eventosAtrasados = eventosIVC.filter(a => {
    if (!a.data) return false;
    const dataEv = new Date(a.data + 'T23:59:59');
    return dataEv < hoje && !a.realizado;
  });

  const realizados = encontros.filter(e => e.status === 'realizado');
  const pendentes = encontros.filter(e => e.status === 'pendente' && new Date(e.data) < hoje);

  if (eventosAtrasados.length > 0 || pendentes.length > 2) {
    return {
      nivel: 'atrasado',
      mensagem: 'Caminhada atrasada',
      detalhes: `${eventosAtrasados.length} evento(s) IVC atrasado(s) e ${pendentes.length} encontro(s) pendente(s) passados.`,
    };
  }
  if (pendentes.length > 0 || (percentual < 30 && realizados.length > 5)) {
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
// RISK BADGE
// ─────────────────────────────────────────────────────────────
function RiscoBadge({ nivel, mensagem }: { nivel: RiscoNivel; mensagem: string }) {
  const cfg = {
    em_dia:   { dot: 'bg-emerald-400', bg: 'bg-emerald-500/10 border-emerald-400/30', text: 'text-emerald-600', icon: CheckCircle2 },
    atencao:  { dot: 'bg-amber-400 animate-pulse', bg: 'bg-amber-500/10 border-amber-400/30', text: 'text-amber-600', icon: AlertTriangle },
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
// STAT CARD
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
// ETAPA ACTION MODAL — opens when clicking passagem/simbolo cards
// ─────────────────────────────────────────────────────────────
function EtapaActionModal({
  etapa,
  atividades,
  onClose,
  onSave,
}: {
  etapa: EtapaJornada | null;
  atividades: Atividade[];
  onClose: () => void;
  onSave: (params: {
    data: string;
    dataFim?: string;
    realizado: boolean;
    dispensado?: boolean;
    entregaCruz?: boolean;
    entregaBiblia?: boolean;
    simboloIVC?: string;
  }) => Promise<void>;
}) {
  const existing = useMemo(() => {
    if (!etapa) return null;
    return atividades.find(a =>
      (a.tipo === 'Celebração de Passagem' && (
        (a.etapaIVC as string) === etapa.id ||
        (etapa.celebracaoTipo && a.celebracaoPassagemTipo === etapa.celebracaoTipo)
      )) ||
      (a.tipo === 'Entrega de Símbolos' && (
        a.simboloIVC === etapa.simboloId ||
        (a.etapaIVC as string) === etapa.id
      )) ||
      (a.tipo === 'Celebração' && (a.etapaIVC as string) === etapa.id)
    );
  }, [etapa, atividades]);

  const [data, setData] = useState(existing?.data || '');
  const [dataFim, setDataFim] = useState((existing as any)?.dataFim || '');
  const [realizado, setRealizado] = useState(existing?.realizado || false);
  const [dispensado, setDispensado] = useState(existing?.dispensado || false);
  const [entregaCruz, setEntregaCruz] = useState(existing?.entregaCruz !== false);
  const [entregaBiblia, setEntregaBiblia] = useState(existing?.entregaBiblia || false);
  const [simboloSelecionado, setSimboloSelecionado] = useState<string>(existing?.simboloIVC || etapa?.simboloId || '');
  const [saving, setSaving] = useState(false);

  if (!etapa) return null;

  const isAdmissao = etapa.celebracaoTipo === 'admissao_catecumenato';
  const isPassagem = etapa.tipo === 'passagem';
  const isSimboloSemId = etapa.tipo === 'simbolo' && !etapa.simboloId;
  const isSimbolo = etapa.tipo === 'simbolo';
  const isPreparacao = etapa.id === 'preparacao';
  const isCelebracaoInicio = etapa.id === 'pass_entrada' || etapa.id === 'acolhida';

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        data,
        dataFim: (isPreparacao && dataFim) ? dataFim : undefined,
        realizado: dispensado ? true : (isCelebracaoInicio || isPreparacao ? !!data : realizado),
        dispensado,
        entregaCruz: isAdmissao ? entregaCruz : undefined,
        entregaBiblia: isAdmissao ? entregaBiblia : undefined,
        simboloIVC: isSimboloSemId ? simboloSelecionado : etapa.simboloId,
      });
      onClose();
    } catch {
      setSaving(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl border-border/30 max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{etapa.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-[10px] font-black uppercase tracking-widest mb-0.5",
                isPassagem ? "text-violet-600" : "text-amber-600"
              )}>
                {isPassagem ? '✦ Celebração de Passagem de Etapa' : '🎁 Entrega de Símbolo'}
              </p>
              <DialogTitle className="text-sm font-black text-foreground leading-tight text-left">
                {etapa.label}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          {/* Date input(s) */}
          {isPreparacao ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
                  📅 Data de Início
                </label>
                <input type="date" value={data} onChange={e => setData(e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
                  📅 Data de Término
                </label>
                <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="form-input" />
              </div>
            </div>
          ) : isCelebracaoInicio ? (
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
                📅 Data da Celebração
              </label>
              <input type="date" value={data} onChange={e => setData(e.target.value)} className="form-input" />
              <p className="text-[10px] text-muted-foreground mt-1.5">Informe a data em que a celebração aconteceu ou está agendada.</p>
            </div>
          ) : (
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
                Data da Celebração
              </label>
              <input type="date" value={data} onChange={e => setData(e.target.value)} className="form-input" />
            </div>
          )}

          {/* Symbol selector for Celebração da Vida (no fixed symbol) */}
          {isSimboloSemId && (
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
                Símbolo Entregue <span className="text-muted-foreground/60 normal-case font-semibold">(opcional, de acordo com a tradição da comunidade)</span>
              </label>
              <select
                value={simboloSelecionado}
                onChange={e => setSimboloSelecionado(e.target.value)}
                className="form-input"
              >
                <option value="">Nenhum símbolo específico</option>
                {SIMBOLOS_IVC.map(s => (
                  <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Cruz & Bíblia for Rito de Admissão */}
          {isAdmissao && (
            <div className="space-y-3 p-4 bg-violet-50 dark:bg-violet-950/20 rounded-2xl border border-violet-200/50">
              <p className="text-[10px] font-black uppercase tracking-widest text-violet-700 flex items-center gap-1.5">
                <Star className="w-3 h-3 fill-violet-600 text-violet-600" />
                Símbolos Entregues nesta Celebração
              </p>

              <button
                type="button"
                onClick={() => setEntregaCruz(!entregaCruz)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                  entregaCruz
                    ? "border-violet-400 bg-violet-100 dark:bg-violet-900/30"
                    : "border-border bg-transparent hover:border-violet-300"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors shrink-0",
                  entregaCruz ? "bg-violet-600 border-violet-600" : "border-border"
                )}>
                  {entregaCruz && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <p className="font-black text-sm text-foreground">✚ Cruz</p>
                  <p className="text-[10px] text-muted-foreground">Padrão do Rito de Admissão ao Catecumenato</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setEntregaBiblia(!entregaBiblia)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                  entregaBiblia
                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30"
                    : "border-border bg-transparent hover:border-blue-300"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors shrink-0",
                  entregaBiblia ? "bg-blue-600 border-blue-600" : "border-border"
                )}>
                  {entregaBiblia && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <div>
                  <p className="font-black text-sm text-foreground">📖 Bíblia</p>
                  <p className="text-[10px] text-muted-foreground">Opcional — algumas comunidades entregam a Bíblia nesta celebração</p>
                </div>
              </button>
            </div>
          )}

          {/* Realizado toggle — hidden for preparacao/celebracao inicio (auto from date) */}
          <div className="flex flex-col gap-2">
            {!isPreparacao && !isCelebracaoInicio && (
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/40">
                <div>
                  <p className="font-black text-sm text-foreground">Já foi realizada</p>
                  <p className="text-[10px] text-muted-foreground">Marque se esta celebração já aconteceu</p>
                </div>
                <button
                  type="button"
                  onClick={() => setRealizado(!realizado)}
                  disabled={dispensado}
                  className={cn(
                    "relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0",
                    realizado && !dispensado ? "bg-emerald-500" : "bg-muted",
                    dispensado && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200",
                    realizado && !dispensado ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
            )}

            {isSimbolo && (
              <div className="flex items-center justify-between p-4 bg-red-50/50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30">
                <div>
                  <p className="font-black text-sm text-red-700 dark:text-red-400">Não será entregue</p>
                  <p className="text-[10px] text-red-600/80 dark:text-red-400/80">Motivos pastorais (não bloqueia a turma)</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !dispensado;
                    setDispensado(nextVal);
                    if (nextVal) setRealizado(false);
                  }}
                  className={cn(
                    "relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0",
                    dispensado ? "bg-red-500" : "bg-muted"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200",
                    dispensado ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
            )}
          </div>

          {(realizado || dispensado) && (
            <div className={cn(
              "flex items-center gap-2 p-3 rounded-xl border animate-fade-in",
              dispensado 
                ? "bg-red-50 dark:bg-red-950/20 border-red-200/50" 
                : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50"
            )}>
              <CheckCircle2 className={cn("w-4 h-4 shrink-0", dispensado ? "text-red-600" : "text-emerald-600")} />
              <p className={cn("text-xs font-bold", dispensado ? "text-red-700" : "text-emerald-700")}>
                {dispensado 
                  ? "Este símbolo será ignorado e não travará o progresso da turma."
                  : "O card ficará verde no painel — posição da turma será atualizada!"}
              </p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/30 active:scale-95 transition-transform disabled:opacity-70"
          >
            <CheckCircle2 className="w-4 h-4" />
            {saving ? 'Salvando...' : existing ? 'Salvar Alterações' : 'Salvar e Criar Evento'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// JOURNEY MAP — enhanced visual for passagem + clickable cards
// ─────────────────────────────────────────────────────────────
export function JornadaMap({
  etapas,
  posicaoAtual,
  onEtapaClick,
  readonly = false,
  modelo,
  turmaNome,
  turmaAno,
}: {
  etapas: EtapaJornada[];
  posicaoAtual: number;
  modelo: ModeloIVC;
  onEtapaClick?: (etapa: EtapaJornada) => void;
  readonly?: boolean;
  turmaNome?: string;
  turmaAno?: string;
}) {
  const [expandida, setExpandida] = useState<string | null>(null);

  // Status styles affect only ring/connector; bg is now overridden per tipo below
  const statusStyle: Record<EtapaStatus, { ring: string; bg: string; connector: string }> = {
    concluido:    { ring: 'ring-4 ring-emerald-400/50', bg: 'bg-emerald-500', connector: 'bg-emerald-400' },
    em_andamento: { ring: 'ring-4 ring-primary/30',     bg: 'bg-primary',     connector: 'bg-primary/40' },
    agendado:     { ring: 'ring-4 ring-amber-400/40',   bg: 'bg-amber-400',   connector: 'bg-amber-300' },
    pendente:     { ring: '',                            bg: 'bg-muted/50 border-2 border-muted-foreground/20', connector: 'bg-muted/40' },
  };

  const tipoNodeSize: Record<EtapaJornada['tipo'], { size: string; nodeSize: string }> = {
    inicio:    { size: 'text-2xl', nodeSize: 'w-16 h-16' },
    tempo:     { size: 'text-4xl', nodeSize: 'w-20 h-20' },
    passagem:  { size: 'text-3xl', nodeSize: 'w-16 h-16' },
    simbolo:   { size: 'text-2xl', nodeSize: 'w-14 h-14' },
    sacramento:{ size: 'text-4xl', nodeSize: 'w-20 h-20' },
    fim:       { size: 'text-3xl', nodeSize: 'w-16 h-16' },
  };

  let currentScreenBg = 'bg-transparent';

  return (
    <div className="relative py-4 overflow-x-hidden">
      {/* Central spine */}
      <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 bg-gradient-to-b from-emerald-500/30 via-violet-500/30 to-rose-500/30 rounded-full z-0" />

      <div className="space-y-8 flex flex-col items-center">
        {etapas.filter(e => !e.dispensado).map((etapa, idx) => {
          const st = statusStyle[etapa.status];
          const ts = tipoNodeSize[etapa.tipo];
          const isLeft = idx % 2 === 0;
          const isActive = posicaoAtual === etapas.findIndex(e => e.id === etapa.id);
          const isExpanded = expandida === etapa.id;
          const isPassagem = etapa.tipo === 'passagem';
          const isSimbol = etapa.tipo === 'simbolo';
          const isTempo = etapa.tipo === 'tempo' || etapa.tipo === 'inicio' || etapa.tipo === 'fim';
          const isClickable = !readonly && (etapa.tipo === 'passagem' || etapa.tipo === 'simbolo' || etapa.id === 'preparacao' || etapa.id === 'pass_entrada' || etapa.id === 'acolhida');

          // Atualiza a cor de fundo da seção de acordo com o tempo
          if (etapa.tempoId === 'tempo1' || etapa.id === 'pre_cat' || etapa.id === 'acolhida') {
            currentScreenBg = 'bg-yellow-100/40';
          } else if (etapa.tempoId === 'tempo2' || etapa.id === 'catecumenato') {
            currentScreenBg = 'bg-sky-100/40';
          } else if (etapa.tempoId === 'tempo3' || etapa.id === 'purificacao' || etapa.id === 'escrutinios') {
            currentScreenBg = 'bg-purple-100/40';
          } else if (etapa.tempoId === 'tempo4' || etapa.id === 'mistagogia' || etapa.id === 'mis_seed') {
            currentScreenBg = 'bg-emerald-100/40';
          } else if (etapa.tipo === 'inicio' && currentScreenBg === 'bg-transparent') {
            currentScreenBg = 'bg-yellow-100/20';
          }

          // Compute node background by status
          const nodeBg = etapa.status === 'concluido' ? 'bg-emerald-500 text-white border-2 border-emerald-600' :
                         etapa.status === 'agendado'  ? 'bg-amber-400 text-amber-950 border-2 border-amber-500' :
                         etapa.status === 'em_andamento' ? 'bg-primary text-primary-foreground border-2 border-primary' :
                         'bg-white border-2 border-gray-200 text-gray-500'; // pendente

          const nodeRing = etapa.status === 'concluido' ? 'ring-4 ring-emerald-400/30 shadow-emerald-500/40' :
                           etapa.status === 'agendado'  ? 'ring-4 ring-amber-400/30 shadow-amber-500/40' :
                           etapa.status === 'em_andamento' ? 'ring-4 ring-primary/30 shadow-primary/40' :
                           'ring-2 ring-gray-100 shadow-sm';

          return (
            <div key={etapa.id} className="relative flex items-center justify-center w-full py-2">
              {/* Full bleed screen background for this tempo */}
              <div className={cn("absolute inset-y-0 w-[200vw] left-1/2 -translate-x-1/2 -z-10 transition-colors duration-500", currentScreenBg)} />

              {/* Animated glow behind passagem nodes */}
              {isPassagem && (
                <div className={cn(
                  "absolute left-1/2 -translate-x-1/2 rounded-full blur-2xl opacity-40 pointer-events-none transition-all duration-500",
                  "w-20 h-20",
                  etapa.status === 'concluido' ? 'bg-emerald-500' :
                  etapa.status === 'agendado'  ? 'bg-amber-400' : 'bg-amber-300'
                )} />
              )}

              {/* Drop-shadow wrapper */}
              <div className={cn(
                "relative z-10 flex items-center justify-center transition-all duration-300",
                "shadow-md rounded-full hover:scale-105 active:scale-95",
                isActive && "scale-110 shadow-2xl shadow-primary/40",
                isPassagem && "drop-shadow-lg"
              )}>
                
                {/* Node button */}
                <button
                  onClick={() => {
                    if (isClickable && onEtapaClick) {
                      onEtapaClick(etapa);
                    } else {
                      setExpandida(isExpanded ? null : etapa.id);
                    }
                  }}
                  className={cn(
                    "relative flex items-center justify-center transition-all duration-300 rounded-full",
                    ts.nodeSize,
                    nodeBg,
                    nodeRing
                  )}
                >
                  <span className={cn(ts.size, "filter drop-shadow-sm select-none z-20")}>{etapa.emoji}</span>
                </button>

                {/* Concluido check */}
                {etapa.status === 'concluido' && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center z-10 border border-gray-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                )}

                {/* Star badge for pending passagem */}
                {isPassagem && (etapa.status === 'pendente' || etapa.status === 'agendado') && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-violet-500 rounded-full shadow flex items-center justify-center z-10 border border-violet-400">
                    <Star className="w-3.5 h-3.5 text-white fill-white" />
                  </div>
                )}

                {/* Agendado pulse ring */}
                {etapa.status === 'agendado' && (
                  <div className="absolute inset-0 rounded-full ring-4 ring-amber-400/40 animate-ping pointer-events-none" />
                )}
              </div>

              {/* Active turma chip */}
              {isActive && (
                <div
                  className={cn(
                    "absolute z-30 flex items-center animate-bounce",
                    isLeft ? "left-[calc(50%+36px)] flex-row" : "right-[calc(50%+36px)] flex-row-reverse"
                  )}
                  style={{ top: '50%', transform: 'translateY(-50%)' }}
                >
                  <div className="h-[2px] w-5 bg-rose-500" />
                  <div className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-3 py-1.5 rounded-full shadow-xl shadow-rose-500/40 flex items-center gap-1.5 border-2 border-white dark:border-zinc-900">
                    <Users className="w-3.5 h-3.5" />
                    <div className="flex flex-col leading-none">
                      <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                        {turmaNome ?? 'Sua Turma'}
                      </span>
                      {turmaAno && (
                        <span className="text-[8px] font-semibold opacity-80 whitespace-nowrap">{turmaAno}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Label card */}
              <div
                className={cn(
                  "absolute w-max max-w-[calc(50vw-64px)] sm:max-w-[160px]",
                  isLeft ? "right-[calc(50%+44px)]" : "left-[calc(50%+44px)]"
                )}
              >
                <div
                  onClick={() => {
                    if (isClickable && onEtapaClick) onEtapaClick(etapa);
                    else setExpandida(isExpanded ? null : etapa.id);
                  }}
                  className={cn(
                    "rounded-2xl px-3 py-2.5 shadow-sm border-2 transition-all duration-200 cursor-pointer",
                    // ★ Passagem: strong visual emphasis
                    isPassagem && etapa.status === 'concluido'
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 shadow-emerald-500/10 shadow-md"
                    : isPassagem && etapa.status === 'agendado'
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 shadow-amber-500/10 shadow-md"
                    : isPassagem
                      ? "bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40 border-violet-300 shadow-violet-500/15 shadow-md hover:shadow-violet-500/25"
                    // Simbolo: amber emphasis
                    : etapa.tipo === 'simbolo'
                      ? (etapa.status === 'concluido'
                          ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 shadow-sm"
                          : "bg-white/90 dark:bg-card/90 border-amber-200/60 hover:border-amber-300")
                    // Normal
                    : isExpanded
                      ? "bg-white dark:bg-card border-primary/50 shadow-lg"
                      : "bg-white/90 dark:bg-card/90 border-border hover:border-primary/40"
                  )}
                >
                  {/* Passagem de Etapa badge */}
                  {isPassagem && (
                    <p className={cn(
                      "text-[8px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1",
                      etapa.status === 'concluido' ? "text-emerald-600" :
                      etapa.status === 'agendado'  ? "text-amber-600" : "text-violet-600"
                    )}>
                      <Star className={cn(
                        "w-2.5 h-2.5",
                        etapa.status === 'concluido' ? "fill-emerald-500 text-emerald-500" :
                        etapa.status === 'agendado'  ? "fill-amber-500 text-amber-500" : "fill-violet-500 text-violet-500"
                      )} />
                      Passagem de Etapa
                    </p>
                  )}

                  <p className={cn(
                    "text-xs font-black leading-tight uppercase tracking-wide break-words whitespace-normal",
                    etapa.status === 'concluido' ? "text-emerald-700 dark:text-emerald-400" :
                    etapa.status === 'em_andamento' ? "text-primary" :
                    etapa.status === 'agendado' ? "text-amber-700" :
                    isPassagem ? "text-violet-700 dark:text-violet-400" :
                    etapa.tipo === 'simbolo' ? "text-amber-700 dark:text-amber-400" :
                    "text-muted-foreground"
                  )}>
                    {etapa.label}
                  </p>

                  {etapa.sublabel && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-bold leading-tight">
                      {etapa.sublabel}
                    </p>
                  )}

                  {/* Display Data for all stages that have it */}
                  {etapa.dataEvento && (
                    <p className={cn(
                      "text-[9px] font-black mt-1 flex items-center gap-1",
                      isPassagem ? "text-violet-600" : etapa.tipo === 'simbolo' ? "text-amber-600" : "text-primary"
                    )}>
                      <Calendar className="w-2.5 h-2.5" />
                      {etapa.id === 'preparacao' && etapa.dataFim
                        ? `${new Date(etapa.dataEvento + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} → ${new Date(etapa.dataFim + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
                        : new Date(etapa.dataEvento + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </p>
                  )}

                  {/* Cruz & Bíblia badges shown when Rito de Admissão is concluido */}
                  {etapa.celebracaoTipo === 'admissao_catecumenato' && etapa.status === 'concluido' && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {etapa.entregaCruz !== false && (
                        <span className="text-[8px] font-black bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full border border-violet-200">✚ Cruz</span>
                      )}
                      {etapa.entregaBiblia && (
                        <span className="text-[8px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full border border-blue-200">📖 Bíblia</span>
                      )}
                    </div>
                  )}

                  {/* "Toque para registrar" hint on clickable pending cards */}
                  {isClickable && !etapa.dataEvento && etapa.status === 'pendente' && (
                    <p className={cn(
                      "text-[8px] font-bold mt-1.5 flex items-center gap-0.5",
                      isPassagem ? "text-violet-500" : "text-primary/60"
                    )}>
                      <Calendar className="w-2.5 h-2.5" />
                      Toque para registrar
                    </p>
                  )}
                  {isClickable && etapa.dataEvento && etapa.status === 'concluido' && (
                    <p className="text-[8px] font-bold text-emerald-600 mt-1 flex items-center gap-0.5 opacity-70">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Realizada — toque p/ editar
                    </p>
                  )}
                  {isClickable && etapa.dataEvento && etapa.status === 'agendado' && (
                    <p className="text-[8px] font-bold text-amber-600 mt-1 flex items-center gap-0.5 opacity-70">
                      <Calendar className="w-2.5 h-2.5" />
                      Agendada — toque p/ marcar
                    </p>
                  )}
                </div>

                {/* Expanded info for non-clickable types */}
                {isExpanded && !isClickable && (
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
                    {etapa.tipo === 'tempo' && (
                      <p className="text-muted-foreground font-medium">Período formativo do IVC.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Connector to next */}
              {idx < etapas.length - 1 && (
                <div className={cn(
                  "absolute top-full left-1/2 -translate-x-1/2 w-1 h-8 rounded-full",
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
// CRONOGRAMA POR TEMPOS (Opção B — accordion cards na aba de Pendências)
// ─────────────────────────────────────────────────────────────
const TEMPOS_CONFIG = [
  {
    id: 'tempo_pre_cat',
    label: 'Pré-Catecumenato',
    emoji: '🔥',
    cor: 'border-yellow-300 bg-yellow-50',
    corHeader: 'bg-yellow-100 text-yellow-800',
    corBadge: 'bg-yellow-200 text-yellow-900',
    etapaIds: ['preparacao', 'pass_entrada', 'acolhida', 'pre_cat', 'pre_cat_seed', 'encontros_seed'],
    descricao: '1º Tempo — Querigma (mín. 6 meses)',
  },
  {
    id: 'tempo_catec',
    label: 'Catecumenato',
    emoji: '📖',
    cor: 'border-sky-300 bg-sky-50',
    corHeader: 'bg-sky-100 text-sky-800',
    corBadge: 'bg-sky-200 text-sky-900',
    etapaIds: ['pass_cat', 'pass_entrada_adultos', 'cat_biblia', 'entrega_biblia', 'cat_pessoa', 'celebracao_vida', 'cat_jesus', 'jornada_disc', 'cat_oracao', 'entrega_pai_nosso', 'cat_comunidade', 'entrega_creio', 'cat_sacramental', 'catecumenato', 'entrega_biblia_adultos', 'entrega_creio_adultos', 'entrega_pai_nosso_adultos', 'catec_seed'],
    descricao: '2º Tempo — Aprofundamento da Fé',
  },
  {
    id: 'tempo_purif',
    label: 'Purificação e Iluminação',
    emoji: '💜',
    cor: 'border-purple-300 bg-purple-50',
    corHeader: 'bg-purple-100 text-purple-800',
    corBadge: 'bg-purple-200 text-purple-900',
    etapaIds: ['eleicao', 'purificacao', 'escrutinios', 'pass_ilum_seed', 'ilum_seed'],
    descricao: '3º Tempo — Quaresma',
  },
  {
    id: 'tempo_mis',
    label: 'Mistagogia',
    emoji: '🕊️',
    cor: 'border-emerald-300 bg-emerald-50',
    corHeader: 'bg-emerald-100 text-emerald-800',
    corBadge: 'bg-emerald-200 text-emerald-900',
    etapaIds: ['recepcao_sac', 'mistagogia', 'mis_seed'],
    descricao: '4º Tempo — Envio Missionário',
  },
];

function CronogramaTempo({
  etapas,
  atividades,
  onEtapaClick,
}: {
  etapas: EtapaJornada[];
  atividades: Atividade[];
  onEtapaClick: (etapa: EtapaJornada) => void;
}) {
  const [tempoAberto, setTempoAberto] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Calendar className="w-4 h-4 text-primary" />
        <p className="text-xs font-black uppercase tracking-widest text-foreground">Cronograma por Tempo</p>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">Toque em um Tempo para ver e registrar as datas das etapas e celebrações daquele período.</p>

      {TEMPOS_CONFIG.map(tempo => {
        const etapasDeTempo = etapas.filter(e => tempo.etapaIds.includes(e.id));
        if (etapasDeTempo.length === 0) return null;

        const concluidas = etapasDeTempo.filter(e => e.status === 'concluido').length;
        const isAberto = tempoAberto === tempo.id;
        const progresso = Math.round((concluidas / etapasDeTempo.length) * 100);

        return (
          <div key={tempo.id} className={cn("rounded-2xl border-2 overflow-hidden transition-all", tempo.cor)}>
            {/* Header accordion */}
            <button
              onClick={() => setTempoAberto(isAberto ? null : tempo.id)}
              className={cn("w-full flex items-center gap-3 px-4 py-3.5 text-left", tempo.corHeader)}
            >
              <span className="text-2xl">{tempo.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm">{tempo.label}</p>
                <p className="text-[10px] font-semibold opacity-70">{tempo.descricao}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full", tempo.corBadge)}>
                  {concluidas}/{etapasDeTempo.length}
                </span>
                <ChevronRight className={cn("w-4 h-4 transition-transform", isAberto && "rotate-90")} />
              </div>
            </button>

            {/* Progress bar */}
            <div className="h-1 bg-white/50">
              <div
                className="h-full bg-current opacity-40 transition-all duration-500 rounded-full"
                style={{ width: `${progresso}%` }}
              />
            </div>

            {/* Etapas do tempo */}
            {isAberto && (
              <div className="px-4 py-3 space-y-2 animate-fade-in">
                {etapasDeTempo.map(etapa => {
                  const dataEvento = etapa.dataEvento
                    ? new Date(etapa.dataEvento + 'T12:00:00').toLocaleDateString('pt-BR')
                    : null;
                  const isClickable = etapa.tipo === 'passagem' || etapa.tipo === 'simbolo' || etapa.id === 'preparacao' || etapa.id === 'pass_entrada' || etapa.id === 'acolhida';

                  // Decode dataFim from observacao if stored
                  const atividadeEtapa = atividades.find(a => (a.etapaIVC as string) === etapa.id);
                  const dataFimRaw = atividadeEtapa?.observacao?.match(/dataFim:(\d{4}-\d{2}-\d{2})/)?.[1];
                  const dataFim = dataFimRaw
                    ? new Date(dataFimRaw + 'T12:00:00').toLocaleDateString('pt-BR')
                    : null;

                  return (
                    <button
                      key={etapa.id}
                      onClick={() => isClickable && onEtapaClick(etapa)}
                      disabled={!isClickable}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                        etapa.status === 'concluido'
                          ? "bg-white border-emerald-200"
                          : etapa.status === 'agendado'
                            ? "bg-white border-amber-200"
                            : isClickable
                              ? "bg-white/70 border-white hover:bg-white hover:border-primary/30 cursor-pointer"
                              : "bg-white/40 border-white/40 cursor-default"
                      )}
                    >
                      <span className="text-xl shrink-0">{etapa.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-xs font-black truncate",
                          etapa.status === 'concluido' ? "text-emerald-700" :
                          etapa.status === 'agendado' ? "text-amber-700" : "text-foreground/80"
                        )}>
                          {etapa.label}
                        </p>
                        {dataEvento && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {etapa.id === 'preparacao' && dataFim
                              ? `${dataEvento} → ${dataFim}`
                              : dataEvento}
                          </p>
                        )}
                        {!dataEvento && isClickable && (
                          <p className="text-[10px] text-primary/60 mt-0.5">Toque para registrar a data</p>
                        )}
                      </div>
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                        etapa.status === 'concluido' ? "bg-emerald-100" :
                        etapa.status === 'agendado' ? "bg-amber-100" :
                        isClickable ? "bg-muted/50" : "bg-transparent"
                      )}>
                        {etapa.status === 'concluido'
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          : etapa.status === 'agendado'
                            ? <Calendar className="w-3.5 h-3.5 text-amber-500" />
                            : isClickable
                              ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                              : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PENDENCIAS PANEL
// ─────────────────────────────────────────────────────────────
function PendenciasPanel({
  etapas,
  turmaId,
  atividades,
  encontros,
  onEtapaClick,
}: {
  etapas: EtapaJornada[];
  turmaId: string;
  atividades: Atividade[];
  encontros: any[];
  onEtapaClick: (etapa: EtapaJornada) => void;
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
    <div className="space-y-4">
      {/* Missing passagem celebrations */}
      {pendentes.filter(e => e.tipo === 'passagem').length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-violet-600 flex items-center gap-2">
            <Star className="w-4 h-4 fill-violet-500 text-violet-500" /> Celebrações de Passagem de Etapa Pendentes
          </p>
          {pendentes.filter(e => e.tipo === 'passagem').map(etapa => {
            const celInfo = etapa.celebracaoTipo
              ? CELEBRACOES_PASSAGEM.find(c => c.id === etapa.celebracaoTipo)
              : null;
            return (
              <button
                key={etapa.id}
                onClick={() => onEtapaClick(etapa)}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 border-2 border-violet-200 hover:border-violet-400 hover:shadow-md hover:shadow-violet-500/10 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center shrink-0 shadow-sm">
                  <span className="text-2xl">{etapa.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-widest text-violet-500 mb-0.5 flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-violet-500" />
                    Passagem de Etapa
                  </p>
                  <p className="text-sm font-black text-violet-900 dark:text-violet-300 truncate">{etapa.label}</p>
                  {celInfo && <p className="text-[10px] font-bold text-violet-600 mt-0.5">{celInfo.descricao}</p>}
                  <p className="text-[10px] font-bold text-violet-500 mt-1">Toque para registrar a data e marcar como realizada</p>
                </div>
                <ChevronRight className="w-5 h-5 text-violet-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            );
          })}
        </div>
      )}

      {/* Missing symbol deliveries */}
      {pendentes.filter(e => e.tipo === 'simbolo').length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
            <Gift className="w-4 h-4" /> Entregas de Símbolos Pendentes
          </p>
          {pendentes.filter(e => e.tipo === 'simbolo').map(etapa => {
            const simbolo = etapa.simboloId ? SIMBOLOS_IVC.find(s => s.id === etapa.simboloId) : null;
            return (
              <button
                key={etapa.id}
                onClick={() => onEtapaClick(etapa)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-50 border-2 border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-all text-left group"
              >
                <span className="text-3xl">{simbolo?.emoji ?? etapa.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-amber-900 truncate">{etapa.label}</p>
                  <p className="text-[10px] font-bold text-amber-600">Toque para registrar a data da entrega</p>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            );
          })}
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
            {posicaoAtual === idx && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
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
  const mutation = useAtividadeMutation();

  const turma = turmas.find(t => t.id === id);

  const [modoManual, setModoManual] = useState(false);
  const [overrideIdx, setOverrideIdx] = useState<number | undefined>(undefined);
  const [abaAtiva, setAbaAtiva] = useState<'mapa' | 'pendencias' | 'estatisticas'>('mapa');
  const [showQR, setShowQR] = useState(false);
  const [etapaModal, setEtapaModal] = useState<EtapaJornada | null>(null);

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

  const handleEtapaClick = useCallback((etapa: EtapaJornada) => {
    setEtapaModal(etapa);
  }, []);

  const handleEtapaSave = useCallback(async (params: {
    data: string;
    dataFim?: string;
    realizado: boolean;
    dispensado?: boolean;
    entregaCruz?: boolean;
    entregaBiblia?: boolean;
    simboloIVC?: string;
  }) => {
    if (!id || !etapaModal) return;

    const isPassagem = etapaModal.tipo === 'passagem';
    const isInicio = etapaModal.tipo === 'inicio';

    // Find existing event for this etapa to update instead of duplicate
    const existing = atividades.find(a =>
      (a.tipo === 'Celebração de Passagem' && (
        (a.etapaIVC as string) === etapaModal.id ||
        (etapaModal.celebracaoTipo && a.celebracaoPassagemTipo === etapaModal.celebracaoTipo)
      )) ||
      (a.tipo === 'Entrega de Símbolos' && (
        a.simboloIVC === etapaModal.simboloId ||
        (a.etapaIVC as string) === etapaModal.id
      )) ||
      (a.tipo === 'Celebração' && (a.etapaIVC as string) === etapaModal.id)
    );

    const tipoEvento = isPassagem
      ? 'Celebração de Passagem'
      : isInicio
        ? 'Celebração'
        : 'Entrega de Símbolos';

    const eventData: Atividade = {
      id: existing?.id ?? crypto.randomUUID(),
      turmaId: id,
      nome: etapaModal.label,
      descricao: isPassagem
        ? `Celebração de passagem: ${etapaModal.label}`
        : isInicio
          ? `${etapaModal.label}`
          : `Entrega de símbolo: ${etapaModal.label}`,
      tipo: tipoEvento as any,
      modalidade: 'interna',
      conducao: undefined,
      data: params.data,
      local: '',
      horario: '',
      observacao: params.dataFim ? `dataFim:${params.dataFim}` : (existing?.observacao ?? ''),
      presencas: existing?.presencas ?? [],
      criadoEm: existing?.criadoEm ?? new Date().toISOString(),
      etapaIVC: etapaModal.id as any,
      simboloIVC: params.simboloIVC as any,
      celebracaoPassagemTipo: etapaModal.celebracaoTipo as any,
      entregaCruz: params.entregaCruz,
      entregaBiblia: params.entregaBiblia,
      realizado: params.realizado,
      dispensado: params.dispensado,
    };

    await mutation.mutateAsync(eventData);
    toast.success(existing ? '✅ Evento atualizado no painel!' : '✅ Celebração registrada e evento criado!');
  }, [id, etapaModal, atividades, mutation]);

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
              Itinerário de Vida Cristã
            </p>
          </div>
          <button onClick={handleShare} className="absolute right-0 w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
            <Share2 className="h-4 w-4 text-foreground/60" />
          </button>
        </div>
      </div>

      {/* ─── MODO AUTOMÁTICO / MANUAL ─── */}
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
      <div className="flex bg-muted/40 p-1.5 rounded-2xl gap-2 max-w-sm mx-auto">
        {([
          { id: 'mapa',         label: 'Mapa',       color: 'text-indigo-500',  bg: 'bg-indigo-500/10',  icon: Route },
          { id: 'pendencias',   label: 'Pendências', color: 'text-amber-500',   bg: 'bg-amber-500/10',   icon: ListTodo },
        ] as const).map(aba => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id as any)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl transition-all border gap-1",
              abaAtiva === aba.id
                ? cn("bg-white dark:bg-card shadow-md border-border/50", aba.color)
                : "border-transparent text-muted-foreground hover:bg-white/50 dark:hover:bg-card/50 hover:text-foreground"
            )}
          >
            <div className={cn("p-1.5 rounded-xl transition-colors", abaAtiva === aba.id ? aba.bg : "bg-transparent")}>
              <aba.icon className="w-5 h-5 shrink-0" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">{aba.label}</span>
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
          <div className={cn(
            "rounded-2xl border p-4 shadow-sm",
            etapas[posicaoAtual]?.tipo === 'passagem'
              ? "bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200"
              : "bg-white dark:bg-card border-primary/20"
          )}>
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
            <JornadaMap
              etapas={etapas}
              posicaoAtual={posicaoAtual}
              modelo={modelo}
              onEtapaClick={handleEtapaClick}
              turmaNome={turma?.nome}
              turmaAno={turma?.ano}
            />
          </div>
        </div>
      )}

      {/* ─── TAB: PENDÊNCIAS ─── */}
      {abaAtiva === 'pendencias' && (
        <div className="space-y-4 animate-fade-in">
          {/* Cronograma por Tempos */}
          <div className="bg-white dark:bg-card rounded-2xl border-2 border-border/60 p-4 shadow-sm">
            <CronogramaTempo
              etapas={etapas}
              atividades={atividades}
              onEtapaClick={handleEtapaClick}
            />
          </div>

          {/* Pendências tradicionais */}
          <div className="bg-white dark:bg-card rounded-2xl border-2 border-border/60 p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-amber-500" /> O que ainda falta
            </p>
            <PendenciasPanel
              etapas={etapas}
              turmaId={id!}
              atividades={atividades}
              encontros={encontros}
              onEtapaClick={handleEtapaClick}
            />
          </div>
        </div>
      )}

      {/* ─── ETAPA ACTION MODAL ─── */}
      {etapaModal && (
        <EtapaActionModal
          etapa={etapaModal}
          atividades={atividades}
          onClose={() => setEtapaModal(null)}
          onSave={handleEtapaSave}
        />
      )}

      {/* ─── QR SHARE MODAL ─── */}
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
