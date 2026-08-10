import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useCatequizandos, useEncontros, useAtividades, useAtividadeMutation } from "@/hooks/useSupabaseData";
import { useState, useMemo, useCallback, useEffect } from "react";
import {
  ArrowLeft, Share2, CheckCircle2, Calendar, ChevronRight,
  BookOpen, Users, MapPin, Gift, Star, Settings, AlertTriangle
} from "lucide-react";
import { cn, getAppUrl } from "@/lib/utils";
import { toast } from "sonner";
import type { Atividade } from "@/lib/store";
import { SIMBOLOS_IVC, CELEBRACOES_PASSAGEM, type CelebracaoPassagemTipo, type SimboloIVCType } from "@/lib/store";
import { QRShareModal } from "@/components/QRShareModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TYPES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

export interface ConfiguracaoTurma {
  modelo: ModeloIVC;
  simbolosAtivos: string[];
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MODEL DETECTION
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function detectarModelo(etapa: string): ModeloIVC {
  const e = etapa?.toLowerCase() ?? '';
  if (e.includes('sement') || e.includes('prÃ©-cat') || e.includes('pre-cat') || e.includes('pre cat')) {
    return 'sementinhas';
  }
  if (e.includes('adult')) {
    return 'adultos';
  }
  return 'eucaristia_crisma';
}

const MODELO_INFO: Record<ModeloIVC, { label: string; emoji: string; cor: string; descricao: string; sacTipo: string }> = {
  sementinhas: {
    label: 'Sementinhas / PrÃ©-Catequese',
    emoji: 'ðŸŒ±',
    cor: 'from-emerald-500 to-green-600',
    descricao: 'Processo de iniciaÃ§Ã£o para crianÃ§as de 5 a 8 anos, focado em acolhida lÃºdica e primeiros passos na fÃ©.',
    sacTipo: 'IniciaÃ§Ã£o',
  },
  eucaristia_crisma: {
    label: 'Eucaristia / Crisma / PerseveranÃ§a',
    emoji: 'âœ¨',
    cor: 'from-violet-500 to-purple-600',
    descricao: 'Processo completo dos 4 Tempos do IVC para crianÃ§as, adolescentes e jovens.',
    sacTipo: 'Eucaristia / Crisma',
  },
  adultos: {
    label: 'Adultos (RICA)',
    emoji: 'ðŸ•Šï¸',
    cor: 'from-sky-500 to-blue-600',
    descricao: 'Rito de IniciaÃ§Ã£o CristÃ£ de Adultos â€” processo prÃ³prio com escrutÃ­nios e eleiÃ§Ã£o.',
    sacTipo: 'Batismo / Crisma / Eucaristia',
  },
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// IVC JOURNEY DEFINITIONS (per model)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type EtapaBase = Omit<EtapaJornada, 'status' | 'dataEvento' | 'percentual' | 'entregaCruz' | 'entregaBiblia'>;

const ETAPAS_SEMENTINHAS: EtapaBase[] = [
  { id: 'acolhida',       label: 'Acolhida e InscriÃ§Ã£o',              emoji: 'ðŸŒ±', tipo: 'inicio', tempoId: 'tempo1' },
  { id: 'pre_cat',        label: 'PrÃ©-Catecumenato',                  sublabel: 'Tempo de IniciaÃ§Ã£o LÃºdica', emoji: 'ðŸŽˆ', tipo: 'tempo', tempoId: 'tempo1' },
  { id: 'encontros_seed', label: 'Encontros Formativos',              emoji: 'ðŸ“š', tipo: 'simbolo', tempoId: 'tempo1' },
  { id: 'pass_catec',     label: 'CelebraÃ§Ã£o de InÃ­cio da Catequese', emoji: 'ðŸŽ‰', tipo: 'passagem', celebracaoTipo: 'admissao_catecumenato', tempoId: 'tempo2' },
  { id: 'catec_seed',     label: 'Catecumenato Infantil',             sublabel: 'Aprofundamento da FÃ©', emoji: 'ðŸ“–', tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'entrega_menino_jesus', label: 'Menino Jesus',              emoji: 'ðŸ‘¶', tipo: 'simbolo', simboloId: 'menino_jesus', tempoId: 'tempo2' },
  { id: 'entrega_biblia', label: 'BÃ­blia das CrianÃ§as',              emoji: 'ðŸ“–', tipo: 'simbolo', simboloId: 'biblia', tempoId: 'tempo2' },
  { id: 'entrega_pai_nosso', label: 'Entrega do Pai-Nosso',                        emoji: 'ðŸ™',  tipo: 'simbolo', simboloId: 'pai_nosso', tempoId: 'tempo2' },
  { id: 'entrega_creio',     label: 'Entrega do SÃ­mbolo da FÃ©',                    emoji: 'âœï¸',  tipo: 'simbolo', simboloId: 'creio', tempoId: 'tempo2' },
  { id: 'pass_ilum_seed', label: 'CelebraÃ§Ã£o da FamÃ­lia',             emoji: 'ðŸŽŠ', tipo: 'passagem', tempoId: 'tempo3' },
  { id: 'ilum_seed',      label: 'PurificaÃ§Ã£o e Alegria',             sublabel: 'PreparaÃ§Ã£o Final', emoji: 'âœ¨', tipo: 'tempo', tempoId: 'tempo3' },
  { id: 'mis_seed',       label: 'MissÃ£o das Sementinhas',            sublabel: 'Mistagogia', emoji: 'ðŸŒ¿', tipo: 'fim', tempoId: 'tempo4' },
];

const ETAPAS_EUC_CRISMA: EtapaBase[] = [
  { id: 'preparacao',        label: 'PreparaÃ§Ã£o / Convite',                        emoji: 'ðŸ“£',  tipo: 'inicio', tempoId: 'tempo1' },
  { id: 'pass_entrada',      label: 'CelebraÃ§Ã£o de InÃ­cio da Catequese',           emoji: 'ðŸŽ‰',  tipo: 'inicio', tempoId: 'tempo1' },
  { id: 'pre_cat',           label: 'PrÃ©-Catecumenato',                            sublabel: '1Âº Tempo â€” Querigma (mÃ­n. 6 meses)', emoji: 'ðŸ”¥', tipo: 'tempo', tempoId: 'tempo1' },
  { id: 'pass_cat',          label: 'Rito de AdmissÃ£o ao Catecumenato',            emoji: 'â›ª',  tipo: 'passagem', celebracaoTipo: 'admissao_catecumenato', tempoId: 'tempo2' },
  { id: 'cat_biblia',        label: 'Catecumenato â€” Catequeses',                   sublabel: '2Âº Tempo â€” Fase 1', emoji: 'ðŸ“–', tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'entrega_cruz',      label: 'Entrega da Cruz',                             emoji: 'âœš',  tipo: 'simbolo', simboloId: 'cruz', tempoId: 'tempo2' },
  { id: 'entrega_biblia',    label: 'Entrega da BÃ­blia',                           emoji: 'ðŸ“–',  tipo: 'simbolo', simboloId: 'biblia', tempoId: 'tempo2' },
  { id: 'cat_pessoa',        label: 'Catecumenato â€” Catequeses',                   sublabel: 'Fase 2', emoji: 'ðŸ‘¤', tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'celebracao_vida',   label: 'CelebraÃ§Ã£o da Vida',                          sublabel: 'CelebraÃ§Ã£o interna â€” sÃ­mbolo opcional', emoji: 'ðŸŽŠ', tipo: 'simbolo', tempoId: 'tempo2' },
  { id: 'cat_jesus',         label: 'Catecumenato â€” Catequeses',                   sublabel: 'Fase 3', emoji: 'âœï¸',  tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'jornada_disc',      label: 'Jornada do Discipulado',                      sublabel: 'Atividade externa no Catecumenato', emoji: 'ðŸ¤',  tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'cat_oracao',        label: 'Catecumenato â€” Catequeses',                   sublabel: 'Fase 4', emoji: 'ðŸ™',  tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'entrega_pai_nosso', label: 'Entrega do Pai-Nosso',                        emoji: 'ðŸ™',  tipo: 'simbolo', simboloId: 'pai_nosso', tempoId: 'tempo2' },
  { id: 'cat_comunidade',    label: 'Catecumenato â€” Catequeses',                   sublabel: 'Fase 5', emoji: 'â›ª', tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'entrega_creio',     label: 'Entrega do SÃ­mbolo da FÃ©',                    emoji: 'âœï¸',  tipo: 'simbolo', simboloId: 'creio', tempoId: 'tempo2' },
  { id: 'cat_sacramental',   label: 'Catecumenato â€” Catequeses',                   sublabel: 'Fase 6', emoji: 'ðŸ’§', tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'eleicao',           label: 'EleiÃ§Ã£o â€” PreparaÃ§Ã£o para os Sacramentos',   emoji: 'ðŸ—³ï¸',  tipo: 'passagem', celebracaoTipo: 'eleicao_preparacao', tempoId: 'tempo3' },
  { id: 'purificacao',       label: 'PurificaÃ§Ã£o e IluminaÃ§Ã£o',                   sublabel: '3Âº Tempo â€” Quaresma', emoji: 'ðŸ’œ', tipo: 'tempo', tempoId: 'tempo3' },
  { id: 'recepcao_sac',      label: 'RecepÃ§Ã£o dos Sacramentos',                   emoji: 'ðŸ‘‘',  tipo: 'passagem', celebracaoTipo: 'recepcao_sacramentos', tempoId: 'tempo4' },
  { id: 'mistagogia',        label: 'Mistagogia',                                  sublabel: '4Âº Tempo â€” Envio MissionÃ¡rio', emoji: 'ðŸ•Šï¸', tipo: 'fim', tempoId: 'tempo4' },
];

const ETAPAS_ADULTOS: EtapaBase[] = [
  { id: 'pre_cat',       label: 'PrÃ©-Catecumenato',                              sublabel: '1Âº Tempo â€” Querigma', emoji: 'ðŸ”¥', tipo: 'inicio', tempoId: 'tempo1' },
  { id: 'pass_entrada',  label: 'Rito de AdmissÃ£o ao Catecumenato',              emoji: 'â›ª',  tipo: 'passagem', celebracaoTipo: 'admissao_catecumenato', tempoId: 'tempo2' },
  { id: 'catecumenato',  label: 'Catecumenato',                                  sublabel: '2Âº Tempo â€” Aprofundamento', emoji: 'ðŸ“–', tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'entrega_cruz',      label: 'Entrega da Cruz',                             emoji: 'âœš',  tipo: 'simbolo', simboloId: 'cruz', tempoId: 'tempo2' },
  { id: 'entrega_biblia',    label: 'Entrega da BÃ­blia',                         emoji: 'ðŸ“–',  tipo: 'simbolo', simboloId: 'biblia', tempoId: 'tempo2' },
  { id: 'entrega_creio',     label: 'Entrega do SÃ­mbolo da FÃ©',                  emoji: 'âœï¸',  tipo: 'simbolo', simboloId: 'creio', tempoId: 'tempo2' },
  { id: 'entrega_pai_nosso', label: 'Entrega do Pai-Nosso',                      emoji: 'ðŸ™',  tipo: 'simbolo', simboloId: 'pai_nosso', tempoId: 'tempo2' },
  { id: 'eleicao',       label: 'EleiÃ§Ã£o â€” PreparaÃ§Ã£o para os Sacramentos',     emoji: 'ðŸ—³ï¸',  tipo: 'passagem', celebracaoTipo: 'eleicao_preparacao', tempoId: 'tempo3' },
  { id: 'escrutinios',   label: 'PurificaÃ§Ã£o / EscrutÃ­nios',                    sublabel: '3Âº Tempo â€” Quaresma', emoji: 'ðŸ’œ', tipo: 'tempo', tempoId: 'tempo3' },
  { id: 'recepcao_sac',  label: 'RecepÃ§Ã£o dos Sacramentos',                     emoji: 'ðŸ‘‘',  tipo: 'passagem', celebracaoTipo: 'recepcao_sacramentos', tempoId: 'tempo4' },
  { id: 'mistagogia',    label: 'Mistagogia',                                    sublabel: '4Âº Tempo â€” Envio MissionÃ¡rio', emoji: 'ðŸŒ¿', tipo: 'fim', tempoId: 'tempo4' },
];

export const ETAPAS_POR_MODELO: Record<ModeloIVC, EtapaBase[]> = {
  sementinhas: ETAPAS_SEMENTINHAS,
  eucaristia_crisma: ETAPAS_EUC_CRISMA,
  adultos: ETAPAS_ADULTOS,
};

const getDefaultConfiguracao = (turmaEtapa?: string): ConfiguracaoTurma => {
  const modelo = detectarModelo(turmaEtapa ?? '');
  let simbolosAtivos: string[] = ['biblia', 'creio', 'pai_nosso'];
  if (modelo === 'sementinhas') {
    simbolosAtivos.push('menino_jesus');
  } else {
    simbolosAtivos.push('cruz');
  }
  return { modelo, simbolosAtivos };
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CALCULATION ENGINE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function calcularProgressoJornada(
  etapasBase: EtapaBase[],
  encontros: any[],
  atividades: Atividade[],
  configuracao: ConfiguracaoTurma
): { etapas: EtapaJornada[]; posicaoAtual: number; percentualGeral: number } {
  const hoje = new Date();

  // Filtra as etapas removendo sÃ­mbolos que nÃ£o estÃ£o ativos
  const etapasFiltradasBase = etapasBase.filter(e => e.tipo !== 'simbolo' || !e.simboloId || configuracao.simbolosAtivos.includes(e.simboloId));

  const eventosIVC = atividades.filter(a =>
    a.tipo === 'Entrega de SÃ­mbolos' || a.tipo === 'CelebraÃ§Ã£o de Passagem'
  );

  const encontrosRealizados = encontros.filter(e => e.status === 'realizado');
  const totalEncontros = encontros.length;
  const percFreq = totalEncontros > 0 ? encontrosRealizados.length / totalEncontros : 0;

  let bloqueado = false;

  const etapas: EtapaJornada[] = etapasFiltradasBase.map((base, idx) => {
    let status: EtapaStatus = 'pendente';
    let dataEvento: string | undefined;
    let entregaCruz: boolean | undefined;
    let entregaBiblia: boolean | undefined;
    let dispensado = false;

    if (base.tipo === 'simbolo') {
      let evSim: Atividade | undefined;
      if (base.simboloId) {
        evSim = eventosIVC.find(a =>
          a.simboloIVC === base.simboloId || a.etapaIVC === base.id
        );
      } else {
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
        a.tipo === 'CelebraÃ§Ã£o de Passagem' && (
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
      const evInicio = atividades.find(a => a.tipo === 'CelebraÃ§Ã£o' && (a.etapaIVC as string) === base.id);
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

    if (bloqueado) {
      if (status === 'concluido' || status === 'em_andamento') {
        status = 'pendente';
      }
    }

    if ((base.tipo === 'passagem' || base.tipo === 'simbolo') && status !== 'concluido') {
      bloqueado = true;
    }

    return { ...base, status, dataEvento, entregaCruz, entregaBiblia, dispensado };
  });

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
  const eventosIVC = atividades.filter(a => a.tipo === 'Entrega de SÃ­mbolos' || a.tipo === 'CelebraÃ§Ã£o de Passagem');

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
      mensagem: 'Requer atenÃ§Ã£o',
      detalhes: `${pendentes.length} encontro(s) com data passada ainda pendente(s). Verifique o calendÃ¡rio.`,
    };
  }
  return {
    nivel: 'em_dia',
    mensagem: 'Em dia',
    detalhes: 'A caminhada estÃ¡ dentro do ritmo esperado.',
  };
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ETAPA ACTION MODAL
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      (a.tipo === 'CelebraÃ§Ã£o de Passagem' && (
        (a.etapaIVC as string) === etapa.id ||
        (etapa.celebracaoTipo && a.celebracaoPassagemTipo === etapa.celebracaoTipo)
      )) ||
      (a.tipo === 'Entrega de SÃ­mbolos' && (
        a.simboloIVC === etapa.simboloId ||
        (a.etapaIVC as string) === etapa.id
      )) ||
      (a.tipo === 'CelebraÃ§Ã£o' && (a.etapaIVC as string) === etapa.id)
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
                {isPassagem ? 'âœ¦ CelebraÃ§Ã£o de Passagem de Etapa' : 'ðŸŽ Entrega de SÃ­mbolo'}
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
                  ðŸ“… Data de InÃ­cio
                </label>
                <input type="date" value={data} onChange={e => setData(e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
                  ðŸ“… Data de TÃ©rmino
                </label>
                <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="form-input" />
              </div>
            </div>
          ) : isCelebracaoInicio ? (
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
                ðŸ“… Data da CelebraÃ§Ã£o
              </label>
              <input type="date" value={data} onChange={e => setData(e.target.value)} className="form-input" />
              <p className="text-[10px] text-muted-foreground mt-1.5">Informe a data em que a celebraÃ§Ã£o aconteceu ou estÃ¡ agendada.</p>
            </div>
          ) : (
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
                Data da CelebraÃ§Ã£o
              </label>
              <input type="date" value={data} onChange={e => setData(e.target.value)} className="form-input" />
            </div>
          )}

          {/* Symbol selector for CelebraÃ§Ã£o da Vida (no fixed symbol) */}
          {isSimboloSemId && (
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
                SÃ­mbolo Entregue <span className="text-muted-foreground/60 normal-case font-semibold">(opcional, de acordo com a tradiÃ§Ã£o da comunidade)</span>
              </label>
              <select
                value={simboloSelecionado}
                onChange={e => setSimboloSelecionado(e.target.value)}
                className="form-input"
              >
                <option value="">Nenhum sÃ­mbolo especÃ­fico</option>
                {SIMBOLOS_IVC.map(s => (
                  <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Realizado toggle â€” hidden for preparacao/celebracao inicio (auto from date) */}
          <div className="flex flex-col gap-2">
            {!isPreparacao && !isCelebracaoInicio && (
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/40">
                <div>
                  <p className="font-black text-sm text-foreground">JÃ¡ foi realizada</p>
                  <p className="text-[10px] text-muted-foreground">Marque se esta celebraÃ§Ã£o jÃ¡ aconteceu</p>
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
                  <p className="font-black text-sm text-red-700 dark:text-red-400">NÃ£o serÃ¡ entregue</p>
                  <p className="text-[10px] text-red-600/80 dark:text-red-400/80">Motivos pastorais (nÃ£o bloqueia a turma)</p>
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
                  ? "Este sÃ­mbolo serÃ¡ ignorado e nÃ£o travarÃ¡ o progresso da turma."
                  : "O card ficarÃ¡ verde no painel â€” posiÃ§Ã£o da turma serÃ¡ atualizada!"}
              </p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/30 active:scale-95 transition-transform disabled:opacity-70"
          >
            <CheckCircle2 className="w-4 h-4" />
            {saving ? 'Salvando...' : existing ? 'Salvar AlteraÃ§Ãµes' : 'Salvar e Criar Evento'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CHIP CONFIGURACAO INICIAL
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ChipConfiguracaoInicial({
  configuracao,
  onSave
}: {
  configuracao: ConfiguracaoTurma,
  onSave: (config: ConfiguracaoTurma) => void
}) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<ConfiguracaoTurma>(configuracao);

  // When opening, reset to current prop config
  useEffect(() => {
    if (open) setConfig(configuracao);
  }, [open, configuracao]);

  const handleSave = () => {
    onSave(config);
    setOpen(false);
  };

  const toggleSimbolo = (simboloId: string) => {
    setConfig(prev => {
      const ativos = prev.simbolosAtivos.includes(simboloId)
        ? prev.simbolosAtivos.filter(id => id !== simboloId)
        : [...prev.simbolosAtivos, simboloId];
      return { ...prev, simbolosAtivos: ativos };
    });
  };

  const isSementinhas = config.modelo === 'sementinhas';

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between p-3 bg-white dark:bg-card border-2 border-border/40 rounded-2xl shadow-sm hover:border-primary/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary leading-tight">Configurar Turma</p>
            <p className="text-xs font-semibold text-foreground truncate">
              {MODELO_INFO[config.modelo].label}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl border-border/30 max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              ConfiguraÃ§Ã£o da Turma
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Modelo Selection */}
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Qual o modelo do IVC desta turma?
              </p>
              <div className="grid grid-cols-1 gap-2">
                {(Object.entries(MODELO_INFO) as [ModeloIVC, any][]).map(([key, info]) => (
                  <button
                    key={key}
                    onClick={() => {
                      // Adjust default symbols when changing models
                      let defaultSimbolos = ['biblia', 'creio', 'pai_nosso'];
                      if (key === 'sementinhas') defaultSimbolos.push('menino_jesus');
                      else defaultSimbolos.push('cruz');

                      setConfig({ ...config, modelo: key, simbolosAtivos: defaultSimbolos });
                    }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left",
                      config.modelo === key
                        ? "bg-primary/10 border-primary"
                        : "bg-white dark:bg-card border-border/40 hover:border-primary/40"
                    )}
                  >
                    <span className="text-2xl">{info.emoji}</span>
                    <div className="flex-1">
                      <p className={cn("text-sm font-black", config.modelo === key ? "text-primary" : "text-foreground")}>
                        {info.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{info.descricao}</p>
                    </div>
                    {config.modelo === key && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Simbolos Selection */}
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Quais sÃ­mbolos a turma vai receber?
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight -mt-2 mb-2">
                As etapas nÃ£o selecionadas ficarÃ£o ocultas do painel desta turma.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SIMBOLOS_IVC.map(simbolo => {
                  const isChecked = config.simbolosAtivos.includes(simbolo.id);
                  
                  // In Sementinhas, Menino Jesus is recommended and Cruz is unrecommended
                  // In other models, Cruz is standard, Menino Jesus is rarely used
                  const isSementinhasSpecial = isSementinhas && simbolo.id === 'menino_jesus';
                  
                  return (
                    <button
                      key={simbolo.id}
                      onClick={() => toggleSimbolo(simbolo.id)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-xl border-2 transition-all text-left",
                        isChecked 
                          ? "bg-primary/10 border-primary" 
                          : "bg-white dark:bg-card border-border/40 hover:border-primary/40"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-colors",
                        isChecked ? "bg-primary border-primary" : "border-border"
                      )}>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className="text-xl">{simbolo.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-black truncate", isChecked ? "text-primary" : "text-foreground/80")}>
                          {simbolo.label}
                        </p>
                        {isSementinhasSpecial && <p className="text-[8px] font-bold text-amber-500 leading-tight mt-0.5">Recomendado Sementinhas</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-black text-sm flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-transform"
            >
              Salvar ConfiguraÃ§Ãµes
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// BLOCOS TEMPOS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TEMPOS_CONFIG = [
  {
    id: 'tempo1',
    label: 'PrÃ©-Catecumenato',
    emoji: 'ðŸ”¥',
    cor: 'border-yellow-300 bg-yellow-50',
    corHeader: 'bg-yellow-100 text-yellow-800',
    corBadge: 'bg-yellow-200 text-yellow-900',
    descricao: '1Âº Tempo â€” Querigma',
  },
  {
    id: 'tempo2',
    label: 'Catecumenato',
    emoji: 'ðŸ“–',
    cor: 'border-sky-300 bg-sky-50',
    corHeader: 'bg-sky-100 text-sky-800',
    corBadge: 'bg-sky-200 text-sky-900',
    descricao: '2Âº Tempo â€” Aprofundamento',
  },
  {
    id: 'tempo3',
    label: 'PurificaÃ§Ã£o e IluminaÃ§Ã£o',
    emoji: 'ðŸ’œ',
    cor: 'border-purple-300 bg-purple-50',
    corHeader: 'bg-purple-100 text-purple-800',
    corBadge: 'bg-purple-200 text-purple-900',
    descricao: '3Âº Tempo â€” Quaresma',
  },
  {
    id: 'tempo4',
    label: 'Mistagogia',
    emoji: 'ðŸ•Šï¸',
    cor: 'border-emerald-300 bg-emerald-50',
    corHeader: 'bg-emerald-100 text-emerald-800',
    corBadge: 'bg-emerald-200 text-emerald-900',
    descricao: '4Âº Tempo â€” MissionÃ¡rio',
  },
];

function BlocosTempos({
  etapas,
  onOpenTempo
}: {
  etapas: EtapaJornada[];
  onOpenTempo: (tempoId: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {TEMPOS_CONFIG.map(tempo => {
        const etapasDoTempo = etapas.filter(e => e.tempoId === tempo.id);
        if (etapasDoTempo.length === 0) return null;
        
        const concluidas = etapasDoTempo.filter(e => e.status === 'concluido').length;
        const total = etapasDoTempo.length;
        const progresso = Math.round((concluidas / total) * 100);
        
        // Define status geral do tempo
        const todosConcluidos = concluidas === total && total > 0;
        const algumAndamento = etapasDoTempo.some(e => e.status === 'em_andamento' || e.status === 'concluido');
        
        return (
          <button
            key={tempo.id}
            onClick={() => onOpenTempo(tempo.id)}
            className={cn(
              "relative overflow-hidden rounded-3xl border-2 transition-all p-5 text-left group hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md",
              tempo.cor
            )}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-5xl drop-shadow-md group-hover:scale-110 transition-transform origin-bottom-left">{tempo.emoji}</span>
              <div className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", tempo.corBadge)}>
                {concluidas}/{total}
              </div>
            </div>
            
            <p className="font-black text-lg text-foreground/90 leading-tight mb-1">{tempo.label}</p>
            <p className="text-[10px] font-bold opacity-70 mb-4">{tempo.descricao}</p>
            
            <div className="space-y-1.5 mt-auto">
              <div className="h-1.5 w-full bg-white/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-current opacity-60 rounded-full transition-all duration-1000"
                  style={{ width: `${progresso}%` }}
                />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest flex items-center justify-between opacity-80">
                <span>
                  {todosConcluidos ? 'ConcluÃ­do' : algumAndamento ? 'Em andamento' : 'Pendente'}
                </span>
                <span>{progresso}%</span>
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// JOURNEY MAP (Filtered for Modal)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  onEtapaClick?: (etapa: EtapaJornada) => void;
  readonly?: boolean;
  modelo?: ModeloIVC;
  turmaNome?: string;
  turmaAno?: string;
}) {
  const [expandida, setExpandida] = useState<string | null>(null);

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

  return (
    <div className="relative py-4">
      {/* Central spine */}
      <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 bg-muted/40 rounded-full z-0" />

      <div className="space-y-8 flex flex-col items-center">
        {etapas.filter(e => !e.dispensado).map((etapa, idx) => {
          const st = statusStyle[etapa.status];
          const ts = tipoNodeSize[etapa.tipo];
          const isLeft = idx % 2 === 0;
          const isActive = posicaoAtual === etapas.findIndex(e => e.id === etapa.id);
          const isExpanded = expandida === etapa.id;
          const isPassagem = etapa.tipo === 'passagem';
          const isClickable = !readonly && (etapa.tipo === 'passagem' || etapa.tipo === 'simbolo' || etapa.id === 'preparacao' || etapa.id === 'pass_entrada' || etapa.id === 'acolhida');

          const nodeBg = etapa.status === 'concluido' ? 'bg-emerald-500 text-white border-2 border-emerald-600' :
                         etapa.status === 'agendado'  ? 'bg-amber-400 text-amber-950 border-2 border-amber-500' :
                         etapa.status === 'em_andamento' ? 'bg-primary text-primary-foreground border-2 border-primary' :
                         'bg-white border-2 border-gray-200 text-gray-500'; 

          const nodeRing = etapa.status === 'concluido' ? 'ring-4 ring-emerald-400/30 shadow-emerald-500/40' :
                           etapa.status === 'agendado'  ? 'ring-4 ring-amber-400/30 shadow-amber-500/40' :
                           etapa.status === 'em_andamento' ? 'ring-4 ring-primary/30 shadow-primary/40' :
                           'ring-2 ring-gray-100 shadow-sm';

          return (
            <div key={etapa.id} className="relative flex items-center justify-center w-full py-2">
              {/* Drop-shadow wrapper */}
              <div className={cn(
                "relative z-10 flex items-center justify-center transition-all duration-300",
                "shadow-md rounded-full hover:scale-105 active:scale-95",
                isActive && "scale-110 shadow-2xl shadow-primary/40",
                isPassagem && "drop-shadow-lg"
              )}>
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

                {etapa.status === 'concluido' && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center z-10 border border-gray-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                )}
                {isPassagem && (etapa.status === 'pendente' || etapa.status === 'agendado') && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-violet-500 rounded-full shadow flex items-center justify-center z-10 border border-violet-400">
                    <Star className="w-3.5 h-3.5 text-white fill-white" />
                  </div>
                )}
              </div>

              {/* Label card */}
              <div
                className={cn(
                  "absolute w-max max-w-[calc(50vw-40px)] sm:max-w-[160px]",
                  isLeft ? "right-[calc(50%+40px)]" : "left-[calc(50%+40px)]"
                )}
              >
                <div
                  onClick={() => {
                    if (isClickable && onEtapaClick) onEtapaClick(etapa);
                    else setExpandida(isExpanded ? null : etapa.id);
                  }}
                  className={cn(
                    "rounded-2xl px-3 py-2.5 shadow-sm border-2 transition-all duration-200 cursor-pointer",
                    isPassagem && etapa.status === 'concluido'
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 shadow-md"
                    : isPassagem && etapa.status === 'agendado'
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 shadow-md"
                    : isPassagem
                      ? "bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40 border-violet-300 shadow-md"
                    : etapa.tipo === 'simbolo'
                      ? (etapa.status === 'concluido'
                          ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 shadow-sm"
                          : "bg-white/90 dark:bg-card/90 border-amber-200/60")
                    : "bg-white/90 dark:bg-card/90 border-border"
                  )}
                >
                  {isPassagem && (
                    <p className={cn(
                      "text-[8px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1",
                      etapa.status === 'concluido' ? "text-emerald-600" :
                      etapa.status === 'agendado'  ? "text-amber-600" : "text-violet-600"
                    )}>
                      <Star className="w-2.5 h-2.5" /> Passagem
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

                  {etapa.dataEvento && (
                    <p className={cn(
                      "text-[9px] font-black mt-1 flex items-center gap-1",
                      isPassagem ? "text-violet-600" : etapa.tipo === 'simbolo' ? "text-amber-600" : "text-primary"
                    )}>
                      <Calendar className="w-2.5 h-2.5" />
                      {etapa.id === 'preparacao' && etapa.dataFim
                        ? `${new Date(etapa.dataEvento + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} â†’ ${new Date(etapa.dataFim + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
                        : new Date(etapa.dataEvento + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </p>
                  )}
                  
                  {isClickable && !etapa.dataEvento && etapa.status === 'pendente' && (
                    <p className="text-[8px] font-bold mt-1.5 flex items-center gap-0.5 text-primary/60">
                      <Calendar className="w-2.5 h-2.5" /> Toque p/ registrar
                    </p>
                  )}
                </div>
              </div>

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


// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MAIN PAGE COMPONENT
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function PainelIVC() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: turmas = [] } = useTurmas();
  const { data: encontros = [] } = useEncontros(id);
  const { data: atividades = [] } = useAtividades(id);
  const mutation = useAtividadeMutation();

  const turma = turmas.find(t => t.id === id);

  // Load / Save ConfiguracaoTurma
  const [configuracao, setConfiguracao] = useState<ConfiguracaoTurma>(() => {
    const saved = localStorage.getItem(`ivcConfig_${id}`);
    if (saved) return JSON.parse(saved);
    return getDefaultConfiguracao(turma?.etapa);
  });

  useEffect(() => {
    if (id) {
      localStorage.setItem(`ivcConfig_${id}`, JSON.stringify(configuracao));
    }
  }, [id, configuracao]);

  const [tempoSelecionado, setTempoSelecionado] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [etapaModal, setEtapaModal] = useState<EtapaJornada | null>(null);

  const modeloInfo = MODELO_INFO[configuracao.modelo];
  const etapasBase = ETAPAS_POR_MODELO[configuracao.modelo];

  const { etapas, posicaoAtual } = useMemo(
    () => calcularProgressoJornada(etapasBase, encontros, atividades, configuracao),
    [etapasBase, encontros, atividades, configuracao]
  );

  const publicUrl = `${getAppUrl()}/painel-ivc/${turma?.codigoAcesso ?? id}`;

  const handleShare = useCallback(() => {
    if (turma?.codigoAcesso) setShowQR(true);
    else toast.info("Esta turma nÃ£o possui cÃ³digo de acesso pÃºblico ainda. Gere um na pÃ¡gina da turma.");
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

    const existing = atividades.find(a =>
      (a.tipo === 'CelebraÃ§Ã£o de Passagem' && (
        (a.etapaIVC as string) === etapaModal.id ||
        (etapaModal.celebracaoTipo && a.celebracaoPassagemTipo === etapaModal.celebracaoTipo)
      )) ||
      (a.tipo === 'Entrega de SÃ­mbolos' && (
        a.simboloIVC === etapaModal.simboloId ||
        (a.etapaIVC as string) === etapaModal.id
      )) ||
      (a.tipo === 'CelebraÃ§Ã£o' && (a.etapaIVC as string) === etapaModal.id)
    );

    const tipoEvento = isPassagem
      ? 'CelebraÃ§Ã£o de Passagem'
      : isInicio
        ? 'CelebraÃ§Ã£o'
        : 'Entrega de SÃ­mbolos';

    const eventData: Atividade = {
      id: existing?.id ?? crypto.randomUUID(),
      turmaId: id,
      nome: etapaModal.label,
      descricao: isPassagem
        ? `CelebraÃ§Ã£o de passagem: ${etapaModal.label}`
        : isInicio
          ? `${etapaModal.label}`
          : `Entrega de sÃ­mbolo: ${etapaModal.label}`,
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
    toast.success(existing ? 'âœ… Evento atualizado no painel!' : 'âœ… CelebraÃ§Ã£o registrada e evento criado!');
  }, [id, etapaModal, atividades, mutation]);

  if (!turma) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-black text-primary/60 uppercase tracking-widest animate-pulse">Carregando...</p>
      </div>
    );
  }

  // Find info of selected Tempo
  const tempoInfo = tempoSelecionado ? TEMPOS_CONFIG.find(t => t.id === tempoSelecionado) : null;
  const etapasDoTempoSelecionado = tempoSelecionado ? etapas.filter(e => e.tempoId === tempoSelecionado) : [];

  return (
    <div className="space-y-6 pb-20">
      {/* â”€â”€â”€ HEADER â”€â”€â”€ */}
      <div className="space-y-4 animate-fade-in flex flex-col pt-4">
        <div className="flex items-center justify-center min-h-[44px] relative">
          <button onClick={() => navigate(`/turmas/${id}`)} className="back-btn absolute left-0">
            <ArrowLeft className="h-5 w-5 text-black dark:text-white" />
          </button>
          <div className="flex flex-col items-center gap-0.5 text-center px-12">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">{turma.nome}</p>
            <h1 className="text-xl font-black text-foreground tracking-tight uppercase">Painel IVC</h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
              ItinerÃ¡rio de Vida CristÃ£
            </p>
          </div>
          <button onClick={handleShare} className="absolute right-0 w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
            <Share2 className="h-4 w-4 text-foreground/60" />
          </button>
        </div>
      </div>

      {/* â”€â”€â”€ CONFIGURAÃ‡ÃƒO INICIAL â”€â”€â”€ */}
      <div className="px-4">
        <ChipConfiguracaoInicial 
          configuracao={configuracao}
          onSave={setConfiguracao}
        />
      </div>

      {/* â”€â”€â”€ BLOCOS DE TEMPOS â”€â”€â”€ */}
      <div className="px-4">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" /> Tempos do IVC
        </p>
        <BlocosTempos 
          etapas={etapas} 
          onOpenTempo={setTempoSelecionado} 
        />
      </div>

      {/* â”€â”€â”€ LINHA DO TEMPO MODAL (SHEET) â”€â”€â”€ */}
      <Sheet open={!!tempoSelecionado} onOpenChange={(open) => !open && setTempoSelecionado(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-[3rem] px-0 py-6 overflow-hidden flex flex-col">
          {tempoInfo && (
            <>
              <SheetHeader className="px-6 pb-4 border-b border-border/40 shrink-0">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">{tempoInfo.emoji}</span>
                  <div className="flex-1 text-left">
                    <SheetTitle className="text-2xl font-black text-foreground">{tempoInfo.label}</SheetTitle>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                      {tempoInfo.descricao}
                    </p>
                  </div>
                </div>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-6">
                <JornadaMap 
                  etapas={etapasDoTempoSelecionado}
                  posicaoAtual={-1} // Not critical for the filtered view, or you can compute local index
                  onEtapaClick={handleEtapaClick}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* â”€â”€â”€ ETAPA ACTION MODAL â”€â”€â”€ */}
      {etapaModal && (
        <EtapaActionModal
          etapa={etapaModal}
          atividades={atividades}
          onClose={() => setEtapaModal(null)}
          onSave={handleEtapaSave}
        />
      )}

      {/* â”€â”€â”€ QR SHARE MODAL â”€â”€â”€ */}
      {showQR && turma?.codigoAcesso && (
        <QRShareModal
          open={showQR}
          onClose={() => setShowQR(false)}
          url={publicUrl}
          title="Painel IVC â€” VersÃ£o PÃºblica"
          description="Compartilhe com pais, coordenador e padre para acompanhar a jornada da turma."
        />
      )}
    </div>
  );
}
