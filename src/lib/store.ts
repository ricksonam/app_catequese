export interface CoordenadorInfo {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
}

export interface SacramentoInfo {
  recebido: boolean;
  paroquia: string;
  data: string;
}

export interface DocumentoCustom {
  id: string;
  nome: string;
  entregue: boolean;
}

export interface TrilhaSacramental {
  documentos_entregues: boolean;
  documentos_rg: boolean;
  documentos_batistério: boolean;
  documentos_residencia: boolean;
  documentos_custom: DocumentoCustom[];
  contribuicao: boolean;
  participacao_missas: boolean;
  participacao_encontros: boolean;
  participacao_eventos: boolean;
  atividades_extras: boolean;
  observacoes?: string;
}

export interface TurmaTrilhaConfig {
  dataCelebracao?: string;
  etapasRito?: Record<string, string>;
}

export interface Turma {
  id: string;
  nome: string;
  ano: string;
  diaCatequese: string;
  horario: string;
  local: string;
  etapa: string;
  outrosDados: string;
  criadoEm: string;
  dataCelebracaoSacramento?: string;
  comunidadeId?: string;
  catequistasIds?: string[];
  coordenadores?: CoordenadorInfo[];
  codigoAcesso?: string;
  isShared?: boolean; // true if this turma belongs to another catechist
  status?: 'pending' | 'approved';
  proposito?: string;
  objetivo?: string;
  metas?: string;
  etapasRito?: Record<string, string>; // Legado (mantido para compatibilidade, migrar para trilhasConfig)
  trilhasConfig?: Record<string, TurmaTrilhaConfig>; // Novo: batismo, eucaristia, crisma
}

export interface ResponsavelInfo {
  id: string;
  nome: string;
  telefone: string;
  vinculo: 'pais' | 'avós' | 'tios' | 'outros';
}

export interface DadosPastoraisInfo {
  sacramentos: {
    batismo: SacramentoInfo;
    eucaristia: SacramentoInfo;
    crisma: SacramentoInfo;
  };
  participacaoPastoral: string;
}

export type CatequizandoStatus = 'ativo' | 'inativo' | 'transferido' | 'desistente' | 'confirmado';

export interface Catequizando {
  id: string;
  turmaId: string;
  nome: string;
  dataNascimento: string;
  responsavel: string;
  telefone: string;
  email: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  complemento?: string;
  necessidadeEspecial?: string;
  observacao?: string;
  status: CatequizandoStatus;
  foto?: string;
  sacramentos?: {
    batismo: SacramentoInfo;
    eucaristia: SacramentoInfo;
    crisma: SacramentoInfo;
  };
  responsaveis?: ResponsavelInfo[];
  dadosPastorais?: DadosPastoraisInfo;
  criadoEm?: string;
  origem?: 'manual' | 'online';
  trilhaSacramental?: TrilhaSacramental; // Legado (mantido para compatibilidade)
  trilhasPorSacramento?: Record<string, TrilhaSacramental>; // Novo: batismo, eucaristia, crisma
}



export type EncontroStatus = 'pendente' | 'realizado' | 'transferido' | 'cancelado';

export type OracaoTipo = 'Ofício Divino' | 'Leitura Orante' | 'Celebrativo' | 'Oração Simples' | 'Louvor';

export type RoteiroStepTipo = 'acolhida' | 'oracao_inicial' | 'desenvolvimento' | 'dinamica' | 'compromisso' | 'avisos' | 'oracao_final';

export interface AvaliacaoEncontro {
  atividadesRealizadas: 'sim' | 'nulo' | 'nao';
  pontosPositivos: string;
  pontosMelhorar: string;
  conclusao: string;
}

export interface RoteiroStep {
  id: string;
  tipo: RoteiroStepTipo;
  label: string;
  conteudo: string;
  tempo: number;
  catequista: string;
  oracaoTipo?: OracaoTipo;
}

export type JustificativaTipo = 'Problema de saúde' | 'Motivos familiares ou pessoais' | 'Compromissos' | 'Conflitos com agenda escolar' | 'Força maior' | 'Outros';

export interface Encontro {
  id: string;
  turmaId: string;
  tema: string;
  data: string;
  leituraBiblica: string;
  materialApoio: string;
  roteiro: RoteiroStep[];
  status: EncontroStatus;
  presencas: string[];
  criadoEm: string;
  motivoCancelamento?: string;
  dataTransferida?: string;
  avaliacao?: AvaliacaoEncontro;
  justificativas?: Record<string, JustificativaTipo>;
}

export interface RegistroOcorrencia {
  id: string;
  encontroId: string;
  turmaId: string;
  tipo: 'cancelamento' | 'exclusao';
  motivo: string;
  data: string;
  temaNome: string;
}

export type AtividadeTipo = 'Momento Orante' | 'Retiro' | 'Celebração' | 'Gincana' | 'Passeios' | 'Eventos geral' | 'Outros';
export type AtividadeModalidade = 'interna' | 'externa';
export type ConducaoTipo = 'A pé' | 'Carro' | 'Carro aplicativo' | 'Van' | 'Ônibus' | 'Trem' | 'Metrô' | 'Avião';

export const CONDUCAO_TIPOS: ConducaoTipo[] = ['A pé', 'Carro', 'Carro aplicativo', 'Van', 'Ônibus', 'Trem', 'Metrô', 'Avião'];

export interface Atividade {
  id: string;
  turmaId: string;
  nome: string;
  descricao: string;
  tipo: AtividadeTipo;
  modalidade: AtividadeModalidade;
  conducao?: ConducaoTipo;
  data: string;
  local: string;
  horario: string;
  observacao: string;
  presencas: string[];
  criadoEm: string;
}

export type ReuniaoTipo = 'Reunião de catequistas' | 'Reunião de pais' | 'Reunião de preparação de sacramento' | 'Reunião de preparação de encontro' | 'Reunião de preparação de eventos' | 'Reunião geral';

export const REUNIAO_TIPOS: ReuniaoTipo[] = [
  'Reunião de catequistas', 'Reunião de pais', 'Reunião de preparação de sacramento', 'Reunião de preparação de encontro', 'Reunião de preparação de eventos', 'Reunião geral'
];

export interface PautaItem {
  id: string;
  titulo: string;
  descricao: string;
  tempo?: number;
  decisao?: string;
}

export interface Reuniao {
  id: string;
  turmaId: string;
  nome: string;
  descricao?: string;
  pautas?: PautaItem[];
  oracaoInicial?: string;
  oracaoTipo?: string;
  encontrosPreparados?: string[];
  eventosPreparados?: string[];
  servicosLiturgia?: Record<string, string>;
  tipo: ReuniaoTipo;
  data: string;
  local: string;
  horario: string;
  observacao: string;
  presencas: string[];
  outrosParticipantes?: string[];
  ataDecisoes?: string;
  criadoEm: string;
}

export interface Paroquia {
  id: string;
  nome: string;
  tipo?: 'Paróquia' | 'Área Missionária' | 'Escola';
  endereco: string;
  telefone: string;
  email: string;
  responsavel: string;
  cidade?: string;
  estado?: string;
  observacao?: string;
}

export interface Comunidade {
  id: string;
  nome: string;
  tipo?: 'Comunidade' | 'Núcleo' | 'Grupo';
  paroquiaId: string;
  endereco: string;
  responsavel: string;
  telefone: string;
  cidade?: string;
  estado?: string;
  observacao?: string;
}

export interface CatequistaCadastro {
  id: string;
  nome: string;
  dataNascimento: string;
  endereco: string;
  numero?: string;
  bairro?: string;
  complemento?: string;
  profissao?: string;
  telefone: string;
  email: string;
  comunidadeId: string;
  formacao?: string;
  anosExperiencia: string;
  cidade?: string;
  estado?: string;
  observacao?: string;
  foto?: string;
  status?: string;
}

export interface MuralFoto {
  id: string;
  url: string;
  legenda: string;
  resumo: string;
  data: string;
  criadoEm: string;
  turmaId?: string;
  tipo?: 'comum' | 'criatividade';
}

export interface TurmaMembro {
  user_id: string;
  email: string;
  joined_at: string;
}

export interface CitacaoBiblica {
  id: string;
  referencia: string;
  texto: string;
  categoria?: string;
  clima?: string;
}

export interface HistoricoSorteioCitacao {
  id: string;
  turmaId?: string;
  data: string;
  tipo: 'aleatorio' | 'por_catequizando';
  resultados: Record<string, string>; // catequizandoId -> citacaoText
  criadoEm: string;
}

export interface BingoItem {
  label: string;
  icon: string;
}

export interface BingoModelo {
  id: string;
  nome: string;
  categoria: string;
  itens: BingoItem[];
  criado_em?: string;
}

export interface MissaoFamilia {
  id: string;
  turmaId: string;
  titulo: string;
  categoria: string;
  descricao: string;
  duracao?: string;
  materiais?: string;
  codigoCompartilhamento: string;
  concluidas: number;
  criadoPor: string;
  criadoEm: string;
  finalizada?: boolean;
}

export const ORACAO_TIPOS: OracaoTipo[] = [
  'Ofício Divino', 'Leitura Orante', 'Celebrativo', 'Oração Simples', 'Louvor',
];

export const ROTEIRO_STEPS: { tipo: RoteiroStepTipo; label: string }[] = [
  { tipo: 'acolhida', label: 'Acolhida' },
  { tipo: 'oracao_inicial', label: 'Oração Inicial' },
  { tipo: 'desenvolvimento', label: 'Desenvolvimento do Tema' },
  { tipo: 'dinamica', label: 'Dinâmica' },
  { tipo: 'compromisso', label: 'Compromisso' },
  { tipo: 'avisos', label: 'Avisos' },
  { tipo: 'oracao_final', label: 'Oração Final' },
];

export const ATIVIDADE_TIPOS: AtividadeTipo[] = [
  'Momento Orante', 'Retiro', 'Celebração', 'Gincana', 'Passeios', 'Eventos geral', 'Outros',
];

// ===== CONSTANTES =====

export const NOMES_TURMA = [
  'Sementinhas', 'Pré-Catequese', 'Eucaristia', 'Pré-Crisma', 'Perseverança', 'Crisma', 'Adultos', 'Outros',
];

export const DIAS_SEMANA = [
  'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo',
];

export const ETAPAS_CATEQUESE = [
  { id: 'pre-catecumenato', label: 'Pré-Catecumenato', ordem: 1, cor: 'hsl(var(--primary))' },
  { id: 'catecumenato', label: 'Catecumenato', ordem: 2, cor: 'hsl(var(--accent))' },
  { id: 'purificacao', label: 'Purificação e Iluminação', ordem: 3, cor: 'hsl(var(--liturgical))' },
  { id: 'mistagogia', label: 'Mistagogia', ordem: 4, cor: 'hsl(var(--success))' },
];

export type ComunicacaoFormType = 'pesquisa' | 'questionario' | 'avaliacao' | 'evento';

export interface ComunicacaoFormField {
  id: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'rating';
  label: string;
  required: boolean;
  options?: string[]; // For radio and checkbox
}

export interface ComunicacaoForm {
  id: string;
  user_id?: string;
  titulo: string;
  descricao: string;
  tipo: ComunicacaoFormType;
  codigo_acesso: string;
  campos: ComunicacaoFormField[];
  configuracoes: {
    mostrarPontuacao?: boolean;
    aceitandoRespostas?: boolean;
    // Event specific fields
    isPago?: boolean;
    valor?: number;
    chavePix?: string;
    vagasTotais?: number;
    vagasDisponiveis?: number;
    dataEvento?: string;
    prazoInscricao?: string;
    publicoAlvo?: string;
    localEvento?: string;
  };
  criado_em?: string;
}

export interface ComunicacaoResposta {
  id: string;
  form_id: string;
  nome_respondente: string;
  telefone?: string;
  respostas: Record<string, any>;
  pontuacao?: number;
  criado_em?: string;
}
