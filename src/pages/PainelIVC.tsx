import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useCatequizandos, useEncontros, useAtividades, useAtividadeMutation, useTurmaMutation } from "@/hooks/useSupabaseData";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  ArrowLeft, Share2, CheckCircle2, Calendar, ChevronRight, ChevronDown,
  BookOpen, Users, MapPin, Gift, Star, Settings, AlertTriangle
} from "lucide-react";
import { cn, getAppUrl } from "@/lib/utils";
import { toast } from "sonner";
import type { Atividade } from "@/lib/store";
import { SIMBOLOS_IVC, CELEBRACOES_PASSAGEM, type CelebracaoPassagemTipo, type SimboloIVCType } from "@/lib/store";
import { QRShareModal } from "@/components/QRShareModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { CustomDatePicker } from "@/components/CustomDatePicker";

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

export interface ConfiguracaoTurma {
  modelo: ModeloIVC;
  simbolosAtivos: string[];
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
    label: 'Eucaristia / Crisma',
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
  { id: 'acolhida',       label: 'Acolhida e Inscrição',              emoji: '🌱', tipo: 'inicio', tempoId: 'tempo1' },
  { id: 'pre_cat',        label: 'Pré-Catecumenato',                  sublabel: 'Tempo de Iniciação Lúdica', emoji: '🎈', tipo: 'tempo', tempoId: 'tempo1' },
  { id: 'encontros_seed', label: 'Encontros Formativos',              emoji: '📚', tipo: 'simbolo', tempoId: 'tempo1' },
  { id: 'pass_catec',     label: 'Celebração de Início da Catequese', emoji: '🎉', tipo: 'passagem', celebracaoTipo: 'admissao_catecumenato', tempoId: 'tempo2' },
  { id: 'catec_seed',     label: 'Catecumenato Infantil',             sublabel: 'Aprofundamento da Fé', emoji: '📖', tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'entrega_menino_jesus', label: 'Menino Jesus',              emoji: '👶', tipo: 'simbolo', simboloId: 'menino_jesus', tempoId: 'tempo2' },
  { id: 'entrega_biblia', label: 'Bíblia das Crianças',              emoji: '📖', tipo: 'simbolo', simboloId: 'biblia', tempoId: 'tempo2' },
  { id: 'entrega_pai_nosso', label: 'Entrega do Pai-Nosso',                        emoji: '🙏',  tipo: 'simbolo', simboloId: 'pai_nosso', tempoId: 'tempo2' },
  { id: 'entrega_creio',     label: 'Entrega do Símbolo da Fé',                    emoji: '✝️',  tipo: 'simbolo', simboloId: 'creio', tempoId: 'tempo2' },
  { id: 'pass_ilum_seed', label: 'Celebração da Família',             emoji: '🎊', tipo: 'passagem', tempoId: 'tempo3' },
  { id: 'ilum_seed',      label: 'Purificação e Alegria',             sublabel: 'Preparação Final', emoji: '✨', tipo: 'tempo', tempoId: 'tempo3' },
  { id: 'mis_seed',       label: 'Missão das Sementinhas',            sublabel: 'Mistagogia', emoji: '🌿', tipo: 'fim', tempoId: 'tempo4' },
];

const ETAPAS_EUC_CRISMA: EtapaBase[] = [
  { id: 'preparacao',        label: 'Preparação / Convite',                        emoji: '📣',  tipo: 'inicio', tempoId: 'tempo1' },
  { id: 'pass_entrada',      label: 'Celebração de Início da Catequese',           emoji: '🎉',  tipo: 'inicio', tempoId: 'tempo1' },
  { id: 'pre_cat',           label: 'Pré-Catecumenato',                            sublabel: '1º Tempo — Querigma (mín. 6 meses)', emoji: '🔥', tipo: 'tempo', tempoId: 'tempo1' },
  { id: 'pass_cat',          label: 'Rito de Admissão ao Catecumenato',            emoji: '⛪',  tipo: 'passagem', celebracaoTipo: 'admissao_catecumenato', tempoId: 'tempo2' },
  { id: 'cat_biblia',        label: 'Catecumenato — Catequeses',                   sublabel: '2º Tempo — Fase 1', emoji: '📖', tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'entrega_biblia',    label: 'Entrega da Bíblia',                           emoji: '📖',  tipo: 'simbolo', simboloId: 'biblia', tempoId: 'tempo2' },
  { id: 'cat_pessoa',        label: 'Catecumenato — Catequeses',                   sublabel: 'Fase 2', emoji: '👤', tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'celebracao_vida',   label: 'Celebração da Vida',                          sublabel: 'Celebração interna — símbolo opcional', emoji: '🎊', tipo: 'simbolo', tempoId: 'tempo2' },
  { id: 'cat_jesus',         label: 'Catecumenato — Catequeses',                   sublabel: 'Fase 3', emoji: '✝️',  tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'jornada_disc',      label: 'Jornada do Discipulado',                      sublabel: 'Atividade externa no Catecumenato', emoji: '🤝',  tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'cat_oracao',        label: 'Catecumenato — Catequeses',                   sublabel: 'Fase 4', emoji: '🙏',  tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'cat_comunidade',    label: 'Catecumenato — Catequeses',                   sublabel: 'Fase 5', emoji: '⛪', tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'cat_sacramental',   label: 'Catecumenato — Catequeses',                   sublabel: 'Fase 6', emoji: '💧', tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'eleicao',           label: 'Eleição — Preparação para os Sacramentos',   emoji: '🗳️',  tipo: 'passagem', celebracaoTipo: 'eleicao_preparacao', tempoId: 'tempo3' },
  { id: 'purificacao',       label: 'Purificação e Iluminação',                   sublabel: '3º Tempo', emoji: '💜', tipo: 'tempo', tempoId: 'tempo3' },
  { id: 'purif_escrutinios', label: 'Escrutínios',                                emoji: '✝️', tipo: 'tempo', tempoId: 'tempo3' },
  { id: 'purif_simbolo',     label: 'Entrega do Símbolo da Fé',                 emoji: '✝️', tipo: 'simbolo', simboloId: 'creio', tempoId: 'tempo3' },
  { id: 'purif_oracao',      label: 'Entrega da Oração do Senhor',                emoji: '🙏', tipo: 'simbolo', simboloId: 'pai_nosso', tempoId: 'tempo3' },
  { id: 'purif_praticas',    label: 'Práticas Quaresmais',                        emoji: '💜', tipo: 'tempo', tempoId: 'tempo3' },
  { id: 'purif_ritos',       label: 'Outros Ritos',                               emoji: '⛪', tipo: 'tempo', tempoId: 'tempo3' },
  { id: 'purif_orantes',     label: 'Momentos Orantes',                           emoji: '🙌', tipo: 'tempo', tempoId: 'tempo3' },
  { id: 'mistagogia',        label: 'Mistagogia',                                 sublabel: '4º Tempo', emoji: '🌿', tipo: 'tempo', tempoId: 'tempo4' },
  { id: 'mist_aprofundamento', label: 'Aprofundamento no Mistério Celebrado',     emoji: '✨', tipo: 'tempo', tempoId: 'tempo4' },
  { id: 'mist_comunidade',   label: 'Vivência na Comunidade Cristã',              emoji: '🤝', tipo: 'tempo', tempoId: 'tempo4' },
  { id: 'mist_pastoral',     label: 'Vivência Pastoral',                          emoji: '❤️', tipo: 'tempo', tempoId: 'tempo4' },
  { id: 'mist_envio',        label: 'Envio Missionário: Pentecostes',             emoji: '🕊️', tipo: 'passagem', tempoId: 'tempo4' },
];

const ETAPAS_ADULTOS: EtapaBase[] = [
  { id: 'pre_cat',       label: 'Pré-Catecumenato',                              sublabel: '1º Tempo — Querigma', emoji: '🔥', tipo: 'inicio', tempoId: 'tempo1' },
  { id: 'pass_entrada',  label: 'Rito de Admissão ao Catecumenato',              emoji: '⛪',  tipo: 'passagem', celebracaoTipo: 'admissao_catecumenato', tempoId: 'tempo2' },
  { id: 'catecumenato',  label: 'Catecumenato',                                  sublabel: '2º Tempo — Aprofundamento', emoji: '📖', tipo: 'tempo', tempoId: 'tempo2' },
  { id: 'entrega_biblia',    label: 'Entrega da Bíblia',                         emoji: '📖',  tipo: 'simbolo', simboloId: 'biblia', tempoId: 'tempo2' },
  { id: 'eleicao',           label: 'Eleição — Preparação para os Sacramentos', emoji: '🗳️',  tipo: 'passagem', celebracaoTipo: 'eleicao_preparacao', tempoId: 'tempo3' },
  { id: 'escrutinios',       label: 'Purificação / Escrutínios',                 sublabel: '3º Tempo', emoji: '💜', tipo: 'tempo', tempoId: 'tempo3' },
  { id: 'purif_escrutinios', label: 'Escrutínios',                               emoji: '✝️', tipo: 'tempo', tempoId: 'tempo3' },
  { id: 'purif_simbolo',     label: 'Entrega do Símbolo da Fé',                  emoji: '✝️', tipo: 'simbolo', simboloId: 'creio', tempoId: 'tempo3' },
  { id: 'purif_oracao',      label: 'Entrega da Oração do Senhor',               emoji: '🙏', tipo: 'simbolo', simboloId: 'pai_nosso', tempoId: 'tempo3' },
  { id: 'purif_praticas',    label: 'Práticas Quaresmais',                       emoji: '💜', tipo: 'tempo', tempoId: 'tempo3' },
  { id: 'purif_ritos',       label: 'Outros Ritos',                              emoji: '⛪', tipo: 'tempo', tempoId: 'tempo3' },
  { id: 'purif_orantes',     label: 'Momentos Orantes',                          emoji: '🙌', tipo: 'tempo', tempoId: 'tempo3' },
  { id: 'mistagogia',        label: 'Mistagogia',                                sublabel: '4º Tempo', emoji: '🌿', tipo: 'tempo', tempoId: 'tempo4' },
  { id: 'mist_aprofundamento', label: 'Aprofundamento no Mistério Celebrado',    emoji: '✨', tipo: 'tempo', tempoId: 'tempo4' },
  { id: 'mist_comunidade',   label: 'Vivência na Comunidade Cristã',             emoji: '🤝', tipo: 'tempo', tempoId: 'tempo4' },
  { id: 'mist_pastoral',     label: 'Vivência Pastoral',                         emoji: '❤️', tipo: 'tempo', tempoId: 'tempo4' },
  { id: 'mist_envio',        label: 'Envio Missionário: Pentecostes',            emoji: '🕊️', tipo: 'passagem', tempoId: 'tempo4' },
];

export const ETAPAS_POR_MODELO: Record<ModeloIVC, EtapaBase[]> = {
  sementinhas: ETAPAS_SEMENTINHAS,
  eucaristia_crisma: ETAPAS_EUC_CRISMA,
  adultos: ETAPAS_ADULTOS,
};

// ─────────────────────────────────────────────────────────────
// ETAPA DESCRIPTIONS (balão explicativo)
// ─────────────────────────────────────────────────────────────
export const ETAPA_DESCRICOES: Record<string, { titulo: string; descricao: string; cor: string; showEncontros?: boolean }> = {
  // Sementinhas
  acolhida:            { titulo: 'Acolhida e Inscrição', descricao: 'Momento de boas-vindas e registro da criança na turma. A família é recebida com alegria e convidada a participar do processo de iniciação.', cor: 'emerald' },
  pre_cat:             { titulo: 'Pré-Catecumenato', descricao: '1º Tempo do IVC. Período de anúncio do Querigma — o núcleo da Boa Nova. A turma é despertada para a experiência viva de Deus por meio de dinâmicas, testemunhos e celebrações lúdicas. Duração mínima de 6 meses.', cor: 'yellow' },
  encontros_seed:      { titulo: 'Encontros Formativos', descricao: 'Encontros temáticos que acompanham o tempo do Pré-Catecumenato, ajudando as crianças a descobrirem a fé de forma lúdica e experiencial.', cor: 'amber' },
  catec_seed:          { titulo: 'Catecumenato Infantil', descricao: '2º Tempo do IVC para as sementinhas. Período de aprofundamento da fé, com catequeses sobre a Sagrada Escritura, os sacramentos e a vida cristã em comunidade.', cor: 'sky', showEncontros: true },
  ilum_seed:           { titulo: 'Purificação e Alegria', descricao: '3º Tempo — período de preparação final para os sacramentos. Momento de revisão de vida, reconciliação e alegria pascal.', cor: 'purple' },
  mis_seed:            { titulo: 'Missão das Sementinhas', descricao: '4º Tempo — Mistagogia. As crianças são enviadas em missão, vivendo o que receberam e testemunhando na família e na comunidade.', cor: 'green' },
  // Eucaristia/Crisma
  preparacao:          { titulo: 'Preparação / Convite', descricao: 'Período de divulgação, convite e inscrição. A comunidade é mobilizada para receber novos catequizandos no processo do IVC.', cor: 'emerald' },
  pass_entrada:        { titulo: 'Celebração de Início', descricao: 'Celebração litúrgica que marca o início formal da jornada catequética. A turma é apresentada à comunidade e acolhida com oração.', cor: 'violet' },
  cat_biblia:          { titulo: 'Catecumenato — Fase 1', descricao: '2º Tempo — Fase 1: A Bíblia. Os catequizandos mergulham na Palavra de Deus, aprendendo a ler, rezar e viver os textos sagrados.', cor: 'sky', showEncontros: true },
  cat_pessoa:          { titulo: 'Catecumenato — Fase 2', descricao: '2º Tempo — Fase 2: A Pessoa de Jesus. Aprofundamento no conhecimento de Jesus Cristo — sua vida, missão e o convite ao seguimento.', cor: 'sky', showEncontros: true },
  celebracao_vida:     { titulo: 'Celebração da Vida', descricao: 'Celebração interna de passagem entre as fases do Catecumenato. Momento de agradecimento pela caminhada e renovação do compromisso.', cor: 'violet' },
  cat_jesus:           { titulo: 'Catecumenato — Fase 3', descricao: '2º Tempo — Fase 3: Jesus e a Igreja. Os catequizandos descobrem a Igreja como Corpo de Cristo e sua inserção nela pelo Batismo e Crisma.', cor: 'sky', showEncontros: true },
  jornada_disc:        { titulo: 'Jornada do Discipulado', descricao: 'Atividade externa de imersão no Catecumenato. Experiência de retiro, convivência e missão que fortalece os vínculos e a identidade cristã.', cor: 'amber' },
  cat_oracao:          { titulo: 'Catecumenato — Fase 4', descricao: '2º Tempo — Fase 4: A Oração. Iniciação à vida de oração: Pai-Nosso, Rosário, Lectio Divina e outras formas de encontro pessoal com Deus.', cor: 'sky', showEncontros: true },
  cat_comunidade:      { titulo: 'Catecumenato — Fase 5', descricao: '2º Tempo — Fase 5: A Comunidade. Vivência eclesial — participação na missa, nos grupos de jovens, na liturgia e nos serviços pastorais.', cor: 'sky', showEncontros: true },
  cat_sacramental:     { titulo: 'Catecumenato — Fase 6', descricao: '2º Tempo — Fase 6: Os Sacramentos. Preparação específica para os sacramentos da iniciação: Batismo, Eucaristia e Crisma.', cor: 'sky', showEncontros: true },
  purificacao:         { titulo: 'Purificação e Iluminação', descricao: '3º Tempo — período quaresmal de intenso preparo espiritual. Os catequizandos vivem escrutínios, práticas de penitência e momentos de oração profunda.', cor: 'purple' },
  purif_escrutinios:   { titulo: 'Escrutínios', descricao: 'Ritos de purificação interior celebrados durante a Quaresma. Momentos de exame de consciência, intercessão e fortalecimento espiritual.', cor: 'purple' },
  purif_praticas:      { titulo: 'Práticas Quaresmais', descricao: 'Jejum, esmola e oração — as três práticas da Quaresma. Os catequizandos são convidados a exercícios concretos de conversão e solidariedade.', cor: 'purple' },
  purif_ritos:         { titulo: 'Outros Ritos', descricao: 'Ritos complementares da Quaresma: entrega do Credo, entrega do Pai-Nosso, bênçãos especiais e outros momentos litúrgicos de preparação.', cor: 'purple' },
  purif_orantes:       { titulo: 'Momentos Orantes', descricao: 'Encontros de oração contemplativa: adoração eucarística, via-sacra, terço, vigílias e outros momentos de encontro íntimo com Deus.', cor: 'purple' },
  mistagogia:          { titulo: 'Mistagogia', descricao: '4º Tempo — o mergulho no mistério celebrado. Após receber os sacramentos, os novos cristãos aprofundam o sentido do que viveram e são enviados em missão.', cor: 'emerald' },
  mist_aprofundamento: { titulo: 'Aprofundamento no Mistério', descricao: 'Catequeses mistagógicas que ajudam os neocristãos a compreender a riqueza dos sacramentos recebidos e integrá-los na vida cotidiana.', cor: 'emerald' },
  mist_comunidade:     { titulo: 'Vivência na Comunidade', descricao: 'Inserção ativa na comunidade paroquial: participação nos grupos, nos ministérios e na vida litúrgica da Igreja local.', cor: 'emerald' },
  mist_pastoral:       { titulo: 'Vivência Pastoral', descricao: 'Exercício concreto da missão: serviço ao próximo, caridade, evangelização e participação nas pastorais da paróquia.', cor: 'emerald' },
  // Adultos
  catecumenato:        { titulo: 'Catecumenato', descricao: '2º Tempo — Aprofundamento da fé para adultos. Catequeses sistemáticas sobre a Escritura, a Tradição, os sacramentos e a moral cristã, em comunidade.', cor: 'sky', showEncontros: true },
  escrutinios:         { titulo: 'Purificação / Escrutínios', descricao: '3º Tempo para adultos. Ritos de purificação e escrutínio realizados durante a Quaresma, preparando os eleitos para a recepção dos sacramentos na Vigília Pascal.', cor: 'purple' },
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

// ─────────────────────────────────────────────────────────────
// CALCULATION ENGINE
// ─────────────────────────────────────────────────────────────
export function calcularProgressoJornada(
  etapasBase: EtapaBase[],
  encontros: any[],
  atividades: Atividade[],
  configuracao: ConfiguracaoTurma
): { etapas: EtapaJornada[]; posicaoAtual: number; percentualGeral: number } {
  const hoje = new Date();

  // Filtra as etapas removendo símbolos que não estão ativos, e injeta o sublabel da cruz na admissão
  const etapasFiltradasBase = etapasBase.map(e => {
    if (e.celebracaoTipo === 'admissao_catecumenato' && configuracao.simbolosAtivos.includes('cruz')) {
      return { ...e, sublabel: '✚ Com Entrega da Cruz' };
    }
    return e;
  }).filter(e => e.tipo !== 'simbolo' || !e.simboloId || configuracao.simbolosAtivos.includes(e.simboloId));

  const eventosIVC = atividades.filter(a =>
    a.tipo === 'Entrega de Símbolos' || a.tipo === 'Celebração de Passagem'
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
      const evSac = atividades.find(a => (a.tipo === 'Celebração' || a.tipo === 'Celebração de Passagem') && (a.etapaIVC as string) === base.id);
      if (evSac) {
        dataEvento = evSac.data;
        dispensado = evSac.dispensado || false;
        const dataEv = new Date(evSac.data + 'T23:59:59');
        if (evSac.realizado || dataEv < hoje) status = 'concluido';
        else status = 'agendado';
      }
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

// ─────────────────────────────────────────────────────────────
// ETAPA ACTION MODAL
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

  const isSacramento = etapa?.tipo === 'sacramento';

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
                isPassagem ? "text-violet-600" : isSacramento ? "text-blue-600" : "text-amber-600"
              )}>
                {isPassagem ? '✦ Celebração de Passagem de Etapa' : isSacramento ? '🕊️ Recepção de Sacramento' : '🎁 Entrega de Símbolo'}
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

            {(isSimbolo || isSacramento) && (
              <div className="flex items-center justify-between p-4 bg-red-50/50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30">
                <div>
                  <p className="font-black text-sm text-red-700 dark:text-red-400">
                    {isSacramento ? "Não será realizado" : "Não será entregue"}
                  </p>
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
                  ? "Este evento será ignorado e não travará o progresso da turma."
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
// CHIP CONFIGURACAO INICIAL
// ─────────────────────────────────────────────────────────────
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
              Configuração da Turma
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
                Quais símbolos a turma vai receber?
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight -mt-2 mb-2">
                As etapas não selecionadas ficarão ocultas do painel desta turma.
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
              Salvar Configurações
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// BLOCOS TEMPOS
// ─────────────────────────────────────────────────────────────
const TEMPOS_CONFIG = [
  {
    id: 'tempo1',
    label: 'Pré-Catecumenato',
    emoji: '🔥',
    cor: 'border-yellow-300 bg-yellow-50',
    corHeader: 'bg-yellow-100 text-yellow-800',
    corBadge: 'bg-yellow-200 text-yellow-900',
    descricao: '1º Tempo — Querigma',
  },
  {
    id: 'tempo2',
    label: 'Catecumenato',
    emoji: '📖',
    cor: 'border-sky-300 bg-sky-50',
    corHeader: 'bg-sky-100 text-sky-800',
    corBadge: 'bg-sky-200 text-sky-900',
    descricao: '2º Tempo — Aprofundamento',
  },
  {
    id: 'tempo3',
    label: 'Purificação e Iluminação',
    emoji: '💜',
    cor: 'border-purple-300 bg-purple-50',
    corHeader: 'bg-purple-100 text-purple-800',
    corBadge: 'bg-purple-200 text-purple-900',
    descricao: '3º Tempo — Preparação para os Sacramentos',
  },
  {
    id: 'tempo4',
    label: 'Mistagogia',
    emoji: '🕊️',
    cor: 'border-emerald-300 bg-emerald-50',
    corHeader: 'bg-emerald-100 text-emerald-800',
    corBadge: 'bg-emerald-200 text-emerald-900',
    descricao: '4º Tempo — Envio Missionário',
  },
];

function EtapaChip({ titulo, descricao, onClick, expanded }: { titulo: string; descricao: string; onClick: () => void; expanded?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-3.5 w-full rounded-[1.25rem] border-2 shadow-sm cursor-pointer active:scale-[0.98] transition-all text-center gap-1 relative overflow-visible",
        expanded
          ? "bg-violet-600 dark:bg-violet-700 border-violet-600 dark:border-violet-600"
          : "bg-violet-100 dark:bg-violet-900/30 border-violet-200 dark:border-violet-800/60 hover:scale-[1.02]"
      )}
    >
      <div className={cn(
        "absolute -top-3 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm",
        expanded ? "bg-white text-violet-700" : "bg-violet-600 text-white"
      )}>
        Etapa
      </div>
      <div className="flex items-center gap-2 mt-1">
        <p className={cn("font-black text-[13px] leading-tight", expanded ? "text-white" : "text-violet-800 dark:text-violet-300")}>{titulo}</p>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform shrink-0", expanded ? "text-white rotate-180" : "text-violet-600")} />
      </div>
      <p className={cn("text-[10px] font-bold leading-tight", expanded ? "text-violet-100" : "text-violet-600/80 dark:text-violet-400/80")}>{descricao}</p>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// ENCONTROS CHIP LIST (shown below EtapaChip when expanded)
// ─────────────────────────────────────────────────────────────
function EncontrosChipList({
  encontros,
  dataInicio,
  label,
}: {
  encontros: any[];
  dataInicio?: string;
  label: string;
}) {
  // Filter encontros from dataInicio onwards, sorted by date
  const filtrados = useMemo(() => {
    const inicio = dataInicio ? new Date(dataInicio + 'T00:00:00') : null;
    return [...encontros]
      .filter(e => {
        if (!e.data) return false;
        if (inicio) return new Date(e.data + 'T00:00:00') >= inicio;
        return true;
      })
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [encontros, dataInicio]);

  if (filtrados.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <span className="text-2xl">📅</span>
        <p className="text-xs font-bold text-muted-foreground">Nenhum encontro cadastrado neste período ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-black uppercase tracking-widest text-violet-700 dark:text-violet-300 mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {filtrados.map((enc, i) => {
          const isRealizado = enc.status === 'realizado';
          const isCancelado = enc.status === 'cancelado';
          const dateFmt = enc.data
            ? new Date(enc.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
            : '';
          return (
            <div
              key={enc.id}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black border-2 transition-all",
                isRealizado
                  ? "bg-emerald-100 border-emerald-400 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-600 dark:text-emerald-300"
                  : isCancelado
                  ? "bg-red-50 border-red-200 text-red-500 line-through dark:bg-red-950/20 dark:border-red-800"
                  : "bg-white border-violet-200 text-violet-700 dark:bg-card dark:border-violet-700 dark:text-violet-300"
              )}
            >
              {isRealizado ? (
                <CheckCircle2 className="w-3 h-3 shrink-0" />
              ) : (
                <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-[8px] font-black shrink-0">
                  {i + 1}
                </span>
              )}
              <span>{dateFmt}</span>
              {enc.tema && <span className="opacity-70 max-w-[80px] truncate">· {enc.tema}</span>}
            </div>
          );
        })}
      </div>
      <p className="text-[9px] text-muted-foreground mt-1">
        {filtrados.filter(e => e.status === 'realizado').length} de {filtrados.length} encontro(s) realizados
      </p>
    </div>
  );
}

function BlocosTempos({
  etapas,
  onOpenEtapa,
  onOpenSacramentos,
  configuracao,
  encontros,
  atividades,
}: {
  etapas: EtapaJornada[];
  onOpenEtapa: (etapa: EtapaJornada) => void;
  onOpenSacramentos: () => void;
  configuracao: ConfiguracaoTurma;
  encontros: any[];
  atividades: any[];
}) {
  const [expandedTempo, setExpandedTempo] = useState<string | null>(null);
  const [expandedChip, setExpandedChip] = useState<string | null>(null);
  const expandedRef = useRef<HTMLDivElement>(null);

  const toggleTempo = (id: string) => {
    setExpandedTempo(prev => (prev === id ? null : id));
    setExpandedChip(null);
  };

  const toggleChip = (chipId: string) => {
    setExpandedChip(prev => (prev === chipId ? null : chipId));
  };

  // Find the date of the rito de admissão ao catecumenato (start of Catecumenato)
  const dataEntradaCatecumenato = useMemo(() => {
    const ev = atividades.find(a =>
      a.tipo === 'Celebração de Passagem' &&
      (a.celebracaoPassagemTipo === 'admissao_catecumenato' ||
       (a.etapaIVC as string) === 'pass_cat' ||
       (a.etapaIVC as string) === 'pass_catec' ||
       (a.etapaIVC as string) === 'pass_entrada')
    );
    return ev?.data;
  }, [atividades]);

  const renderTempo = (id: string) => {
    const tempo = TEMPOS_CONFIG.find(t => t.id === id);
    if (!tempo) return null;
    const etapasDoTempo = etapas.filter(e => e.tempoId === tempo.id);
    if (etapasDoTempo.length === 0) return null;

    const concluidas = etapasDoTempo.filter(e => e.status === 'concluido').length;
    const total = etapasDoTempo.length;
    const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;

    const todosConcluidos = concluidas === total && total > 0;
    const algumAndamento = etapasDoTempo.some(e => e.status === 'em_andamento' || e.status === 'concluido');
    const isExpanded = expandedTempo === id;

    return (
      <div key={id} className="w-full">
        {/* Card do Tempo */}
        <button
          onClick={() => toggleTempo(id)}
          className={cn(
            "relative overflow-hidden rounded-3xl border-2 transition-all p-5 text-left group active:scale-[0.98] shadow-sm hover:shadow-md w-full",
            isExpanded ? tempo.cor + ' rounded-b-none border-b-0' : tempo.cor + ' hover:scale-[1.02]'
          )}
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-5xl drop-shadow-md group-hover:scale-110 transition-transform origin-bottom-left">{tempo.emoji}</span>
            <div className="flex items-center gap-2">
              <div className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", tempo.corBadge)}>
                {concluidas}/{total}
              </div>
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                tempo.corBadge
              )}>
                <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isExpanded && "rotate-180")} />
              </div>
            </div>
          </div>

          <p className="font-black text-lg text-foreground/90 leading-tight mb-4">{tempo.label}</p>

          <div className="space-y-1.5 mt-auto">
            <div className="h-1.5 w-full bg-white/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-current opacity-60 rounded-full transition-all duration-1000"
                style={{ width: `${progresso}%` }}
              />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest flex items-center justify-between opacity-80">
              <span>
                {todosConcluidos ? 'Concluído' : algumAndamento ? 'Em andamento' : 'Pendente'}
              </span>
              <span>{progresso}%</span>
            </p>
          </div>
        </button>

        {/* Connector line + Dropdown panel */}
        {isExpanded && (
          <div className="relative">
            {/* Connecting line on left side */}
            <div className={cn(
              "absolute left-6 top-0 w-0.5 h-full",
              id === 'tempo1' ? 'bg-yellow-300' :
              id === 'tempo2' ? 'bg-sky-300' :
              id === 'tempo3' ? 'bg-purple-300' : 'bg-emerald-300'
            )} />
            {/* Right line */}
            <div className={cn(
              "absolute right-6 top-0 w-0.5 h-full",
              id === 'tempo1' ? 'bg-yellow-300' :
              id === 'tempo2' ? 'bg-sky-300' :
              id === 'tempo3' ? 'bg-purple-300' : 'bg-emerald-300'
            )} />

            <div
              ref={expandedRef}
              className={cn(
                "rounded-b-3xl border-2 border-t-0 p-4 animate-fade-in",
                id === 'tempo1' ? 'border-yellow-300 bg-yellow-50/80 dark:bg-yellow-950/20' :
                id === 'tempo2' ? 'border-sky-300 bg-sky-50/80 dark:bg-sky-950/20' :
                id === 'tempo3' ? 'border-purple-300 bg-purple-50/80 dark:bg-purple-950/20' :
                'border-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/20'
              )}
            >
              {/* Etapas do tempo */}
              <JornadaMap
                etapas={etapasDoTempo}
                posicaoAtual={-1}
                onEtapaClick={onOpenEtapa}
                encontros={encontros}
                dataEntradaCatecumenato={dataEntradaCatecumenato}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const hasTempo = (id: string) => etapas.some(e => e.tempoId === id);

  return (
    <div className="flex flex-col space-y-6 pt-2">
      {renderTempo('tempo1')}

      {hasTempo('tempo1') && hasTempo('tempo2') && (
        <div className="w-full">
          <EtapaChip
            titulo="1ª ETAPA - Rito de Admissão (Entrada)"
            descricao={configuracao.modelo === 'sementinhas' ? 'Aqui se entrega o Menino Jesus.' : 'Aqui se entrega a Cruz.'}
            expanded={expandedChip === 'admissao'}
            onClick={() => {
              const etapa = etapas.find(e => e.celebracaoTipo === 'admissao_catecumenato' || e.id === 'pass_cat' || e.id === 'pass_catec' || e.id === 'pass_entrada');
              if (etapa) {
                onOpenEtapa(etapa);
              }
            }}
          />
        </div>
      )}



      {renderTempo('tempo2')}

      {hasTempo('tempo2') && hasTempo('tempo3') && (
        <div className="w-full">
          <EtapaChip
            titulo="2ª ETAPA - Rito de Eleição"
            descricao="Preparação para os sacramentos."
            expanded={expandedChip === 'eleicao'}
            onClick={() => {
              const etapa = etapas.find(e => e.celebracaoTipo === 'eleicao_preparacao' || e.id === 'eleicao' || e.id === 'pass_ilum_seed');
              if (etapa) onOpenEtapa(etapa);
            }}
          />
        </div>
      )}

      {renderTempo('tempo3')}

      {hasTempo('tempo3') && configuracao.modelo !== 'sementinhas' && (
        <div className="w-full">
          <EtapaChip
            titulo="3ª ETAPA - Celebração dos Sacramentos da Iniciação"
            descricao="Batismo, Confissão, Eucaristia e Crisma."
            expanded={false}
            onClick={onOpenSacramentos}
          />
        </div>
      )}

      {renderTempo('tempo4')}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// JOURNEY MAP (Filtered for Modal)
// ─────────────────────────────────────────────────────────────
export function JornadaMap({
  etapas,
  posicaoAtual,
  onEtapaClick,
  readonly = false,
  modelo,
  turmaNome,
  turmaAno,
  encontros,
  dataEntradaCatecumenato,
}: {
  etapas: EtapaJornada[];
  posicaoAtual: number;
  onEtapaClick?: (etapa: EtapaJornada) => void;
  readonly?: boolean;
  modelo?: ModeloIVC;
  turmaNome?: string;
  turmaAno?: string;
  encontros?: any[];
  dataEntradaCatecumenato?: string;
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
          const isClickable = !readonly && (etapa.tipo === 'passagem' || etapa.tipo === 'simbolo' || etapa.tipo === 'sacramento' || etapa.id === 'preparacao' || etapa.id === 'pass_entrada' || etapa.id === 'acolhida');
          const descInfo = ETAPA_DESCRICOES[etapa.id];
          const isBalloonExpanded = expandida === etapa.id;
          const corMap: Record<string, string> = {
            yellow: 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950/30 dark:border-yellow-700',
            sky: 'bg-sky-50 border-sky-300 dark:bg-sky-950/30 dark:border-sky-700',
            purple: 'bg-purple-50 border-purple-300 dark:bg-purple-950/30 dark:border-purple-700',
            emerald: 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-700',
            amber: 'bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-700',
            violet: 'bg-violet-50 border-violet-300 dark:bg-violet-950/30 dark:border-violet-700',
            green: 'bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-700',
          };
          const titleCorMap: Record<string, string> = {
            yellow: 'text-yellow-700 dark:text-yellow-400',
            sky: 'text-sky-700 dark:text-sky-400',
            purple: 'text-purple-700 dark:text-purple-400',
            emerald: 'text-emerald-700 dark:text-emerald-400',
            amber: 'text-amber-700 dark:text-amber-400',
            violet: 'text-violet-700 dark:text-violet-400',
            green: 'text-green-700 dark:text-green-400',
          };
          const balloonCor = descInfo ? (corMap[descInfo.cor] ?? corMap.sky) : corMap.sky;
          const balloonTitleCor = descInfo ? (titleCorMap[descInfo.cor] ?? titleCorMap.sky) : titleCorMap.sky;

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
                      setExpandida(isBalloonExpanded ? null : etapa.id);
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
                    : etapa.tipo === 'sacramento'
                      ? (etapa.status === 'concluido'
                          ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 shadow-sm"
                          : "bg-white/90 dark:bg-card/90 border-blue-200/60")
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
                    etapa.tipo === 'sacramento' ? "text-blue-700 dark:text-blue-400" :
                    "text-muted-foreground"
                  )}>
                    {etapa.label}
                  </p>

                  {etapa.sublabel && (
                    <p className={cn(
                      "text-[9px] font-bold mt-1 leading-tight",
                      isPassagem ? "text-violet-600/80 dark:text-violet-400/80" : "text-muted-foreground"
                    )}>
                      {etapa.sublabel}
                    </p>
                  )}

                  {etapa.dataEvento && (
                    <div className={cn(
                      "mt-2 w-full py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-black text-center border shadow-sm",
                      isPassagem ? "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-800" 
                      : etapa.tipo === 'simbolo' ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800" 
                      : etapa.tipo === 'sacramento' ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800" 
                      : "bg-primary/10 text-primary border-primary/20"
                    )}>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {etapa.id === 'preparacao' && etapa.dataFim
                          ? `${new Date(etapa.dataEvento + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} → ${new Date(etapa.dataFim + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
                          : new Date(etapa.dataEvento + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  )}
                  
                  {isClickable && !etapa.dataEvento && etapa.status === 'pendente' && (
                    <div className="mt-2 w-full py-1.5 px-2 rounded-lg border-2 border-dashed border-primary/20 flex items-center justify-center gap-1.5 text-[10px] font-bold text-primary/60 bg-primary/5">
                      <Calendar className="w-3 h-3" />
                      <span>Toque p/ registrar</span>
                    </div>
                  )}
                </div>
              </div>

              {idx < etapas.length - 1 && (
                <div className={cn(
                  "absolute top-full left-1/2 -translate-x-1/2 w-1 h-8 rounded-full",
                  etapa.status === 'concluido' ? 'bg-emerald-400' : 'bg-muted/40'
                )} />
              )}

              {/* ── Balão explicativo ── */}
              {isBalloonExpanded && descInfo && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-10 z-30 w-[min(88vw,320px)] animate-fade-in">
                  {/* Seta */}
                  <div className={cn(
                    "w-3 h-3 rotate-45 border-t-2 border-l-2 mx-auto -mb-1.5 relative z-20",
                    balloonCor
                  )} />
                  <div className={cn(
                    "rounded-3xl border-2 shadow-xl p-4 space-y-2.5",
                    balloonCor
                  )}>
                    {/* Header */}
                    <div className="flex items-start gap-2.5">
                      <span className="text-3xl shrink-0">{etapa.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-[11px] font-black uppercase tracking-widest leading-none mb-0.5", balloonTitleCor)}>Sobre esta etapa</p>
                        <p className="text-sm font-black text-foreground leading-tight">{descInfo.titulo}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandida(null); }}
                        className="shrink-0 w-6 h-6 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors text-xs font-black"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-[12px] leading-relaxed text-foreground/80">{descInfo.descricao}</p>

                    {/* Encontros do catecumenato */}
                    {descInfo.showEncontros && encontros && encontros.length > 0 && (
                      <div className="mt-1 pt-2.5 border-t-2 border-current/10">
                        <EncontrosChipList
                          encontros={encontros}
                          dataInicio={dataEntradaCatecumenato}
                          label={`Encontros${dataEntradaCatecumenato ? ` a partir de ${new Date(dataEntradaCatecumenato + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}` : ' do Catecumenato'}`}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────
function ModalDatasSacramentos({
  isOpen,
  onClose,
  turma,
  atividades,
  updateTurma,
  updateAtividade,
}: {
  isOpen: boolean;
  onClose: () => void;
  turma: any;
  atividades: Atividade[];
  updateTurma: any;
  updateAtividade: any;
}) {
  const [datas, setDatas] = useState({
    confissao: '',
    batismo: '',
    eucaristia: '',
    crisma: '',
    matrimonio: ''
  });
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const getAtivDate = (id: string) => atividades.find(a => a.etapaIVC === id)?.data || '';
      
      setDatas({
        confissao: getAtivDate('sac_confissao'),
        batismo: turma?.trilhasConfig?.batismo?.dataCelebracao || getAtivDate('sac_batismo'),
        eucaristia: turma?.trilhasConfig?.eucaristia?.dataCelebracao || getAtivDate('sac_eucaristia'),
        crisma: turma?.trilhasConfig?.crisma?.dataCelebracao || getAtivDate('sac_crisma'),
        matrimonio: getAtivDate('sac_matrimonio')
      });
    }
  }, [isOpen, turma, atividades]);

  const handleSave = async () => {
    setIsSaving(true);
    
    // 1. Update Turma Trilha config
    const newTrilhasConfig = { ...(turma?.trilhasConfig || {}) };
    
    if (!newTrilhasConfig.batismo) newTrilhasConfig.batismo = {};
    newTrilhasConfig.batismo.dataCelebracao = datas.batismo;
    
    if (!newTrilhasConfig.eucaristia) newTrilhasConfig.eucaristia = {};
    newTrilhasConfig.eucaristia.dataCelebracao = datas.eucaristia;
    
    if (!newTrilhasConfig.crisma) newTrilhasConfig.crisma = {};
    newTrilhasConfig.crisma.dataCelebracao = datas.crisma;
    
    await updateTurma.mutateAsync({
      id: turma.id,
      trilhasConfig: newTrilhasConfig
    });
    
    // 2. Update Atividades for the IVC Panel
    const saveAtiv = async (id: string, data: string) => {
      const existing = atividades.find(a => a.etapaIVC === id);
      if (data) {
        await updateAtividade.mutateAsync({
          id: existing?.id,
          turmaId: turma.id,
          etapaIVC: id,
          tipo: 'Celebração',
          data: data,
          descricao: `Celebração do Sacramento`
        });
      }
    };
    
    await Promise.all([
      saveAtiv('sac_confissao', datas.confissao),
      saveAtiv('sac_batismo', datas.batismo),
      saveAtiv('sac_eucaristia', datas.eucaristia),
      saveAtiv('sac_crisma', datas.crisma),
      saveAtiv('sac_matrimonio', datas.matrimonio),
      saveAtiv('pass_sacramentos', datas.batismo || datas.eucaristia || datas.crisma)
    ]);
    
    setIsSaving(false);
    toast.success('Datas dos sacramentos atualizadas com sucesso!');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md w-[95vw] rounded-[2rem] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-violet-800 text-center flex flex-col items-center gap-2">
            <span className="text-3xl">✨</span>
            Datas dos Sacramentos
          </DialogTitle>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Defina as datas das celebrações para integrá-las à Trilha Sacramental.
          </p>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1.5 block">Batismo 💧</label>
            <CustomDatePicker date={datas.batismo} setDate={(d) => setDatas({...datas, batismo: d})} />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1.5 block">Confissão 🙏</label>
            <CustomDatePicker date={datas.confissao} setDate={(d) => setDatas({...datas, confissao: d})} />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1.5 block">Eucaristia 🍞</label>
            <CustomDatePicker date={datas.eucaristia} setDate={(d) => setDatas({...datas, eucaristia: d})} />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1.5 block">Crisma 🕊️</label>
            <CustomDatePicker date={datas.crisma} setDate={(d) => setDatas({...datas, crisma: d})} />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1.5 block">Matrimônio 💍 (Opcional)</label>
            <CustomDatePicker date={datas.matrimonio} setDate={(d) => setDatas({...datas, matrimonio: d})} />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl py-3.5 font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
        >
          {isSaving ? 'Salvando...' : 'Salvar Datas'}
        </button>
      </DialogContent>
    </Dialog>
  );
}

export default function PainelIVC() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: turmas = [] } = useTurmas();
  const { data: encontros = [] } = useEncontros(id);
  const { data: atividades = [] } = useAtividades(id);
  const mutation = useAtividadeMutation();
  const turmaMutation = useTurmaMutation();

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

  const [showQR, setShowQR] = useState(false);
  const [etapaModal, setEtapaModal] = useState<EtapaJornada | null>(null);
  const [showModalSacramentos, setShowModalSacramentos] = useState(false);

  const modeloInfo = MODELO_INFO[configuracao.modelo];
  const etapasBase = ETAPAS_POR_MODELO[configuracao.modelo];

  const { etapas, posicaoAtual } = useMemo(
    () => calcularProgressoJornada(etapasBase, encontros, atividades, configuracao),
    [etapasBase, encontros, atividades, configuracao]
  );

  const publicUrl = `${getAppUrl()}/painel-ivc/${turma?.codigoAcesso ?? id}`;

  const handleShare = useCallback(() => {
    if (turma?.codigoAcesso) setShowQR(true);
    else toast.info("Esta turma não possui código de acesso público ainda. Gere um na página da turma.");
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
      : isInicio || etapaModal.tipo === 'sacramento'
        ? 'Celebração'
        : 'Entrega de Símbolos';

    const eventData: Atividade = {
      id: existing?.id ?? crypto.randomUUID(),
      turmaId: id,
      nome: etapaModal.label,
      descricao: isPassagem
        ? `Celebração de passagem: ${etapaModal.label}`
        : etapaModal.tipo === 'sacramento'
          ? `Sacramento: ${etapaModal.label}`
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
    <div className="space-y-6 pb-20">
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

      {/* ─── CONFIGURAÇÃO INICIAL ─── */}
      <div className="px-4">
        <ChipConfiguracaoInicial 
          configuracao={configuracao}
          onSave={setConfiguracao}
        />
      </div>

      {/* ─── BLOCOS DE TEMPOS ─── */}
      <div className="px-4">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" /> Tempos do IVC
        </p>
        <BlocosTempos
          etapas={etapas}
          onOpenEtapa={setEtapaModal}
          onOpenSacramentos={() => setShowModalSacramentos(true)}
          configuracao={configuracao}
          encontros={encontros}
          atividades={atividades}
        />
      </div>

      {/* ─── ETAPA ACTION MODAL ─── */}
      {etapaModal && (
        <EtapaActionModal
          etapa={etapaModal}
          atividades={atividades}
          onClose={() => setEtapaModal(null)}
          onSave={handleEtapaSave}
        />
      )}

      {/* ─── MODAL DATAS SACRAMENTOS ─── */}
      {showModalSacramentos && turma && (
        <ModalDatasSacramentos
          isOpen={showModalSacramentos}
          onClose={() => setShowModalSacramentos(false)}
          turma={turma}
          atividades={atividades}
          updateTurma={turmaMutation}
          updateAtividade={mutation}
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
