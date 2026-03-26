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
}

export interface SacramentoInfo {
  recebido: boolean;
  paroquia: string;
  data: string;
}

export type CatequizandoStatus = 'ativo' | 'desistente' | 'afastado';

export interface Catequizando {
  id: string;
  turmaId: string;
  nome: string;
  dataNascimento: string;
  responsavel: string;
  telefone: string;
  email: string;
  endereco?: string;
  necessidadeEspecial?: string;
  observacao?: string;
  status: CatequizandoStatus;
  foto?: string;
  sacramentos?: {
    batismo: SacramentoInfo;
    eucaristia: SacramentoInfo;
    crisma: SacramentoInfo;
  };
}

export type EncontroStatus = 'pendente' | 'realizado' | 'transferido' | 'cancelado';

export type OracaoTipo = 'Ofício Divino' | 'Leitura Orante' | 'Celebrativo' | 'Oração Simples' | 'Louvor';

export type RoteiroStepTipo = 'acolhida' | 'oracao_inicial' | 'desenvolvimento' | 'dinamica' | 'compromisso' | 'avisos' | 'oracao_final';

export interface RoteiroStep {
  id: string;
  tipo: RoteiroStepTipo;
  label: string;
  conteudo: string;
  tempo: number;
  catequista: string;
  oracaoTipo?: OracaoTipo;
}

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

export type AtividadeTipo = 'Retiro' | 'Celebração' | 'Encontro de pais' | 'Gincana' | 'Passeios' | 'Jornada' | 'Eventos geral' | 'Outros';

export interface Atividade {
  id: string;
  turmaId: string;
  nome: string;
  descricao: string;
  tipo: AtividadeTipo;
  data: string;
  local: string;
  horario: string;
  observacao: string;
  criadoEm: string;
}

export interface Paroquia {
  id: string;
  nome: string;
  tipo: 'Paróquia' | 'Área Pastoral' | 'Escola';
  endereco: string;
  telefone: string;
  email: string;
  responsavel: string;
  observacao: string;
}

export interface Comunidade {
  id: string;
  nome: string;
  tipo: 'Comunidade' | 'Núcleo' | 'Grupo';
  paroquiaId: string;
  endereco: string;
  responsavel: string;
  telefone: string;
  observacao: string;
}

export interface CatequistaCadastro {
  id: string;
  nome: string;
  dataNascimento: string;
  endereco: string;
  profissao: string;
  telefone: string;
  email: string;
  comunidadeId: string;
  formacao: string;
  anosExperiencia: string;
  observacao: string;
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
  'Retiro', 'Celebração', 'Encontro de pais', 'Gincana', 'Passeios', 'Jornada', 'Eventos geral', 'Outros',
];

const TURMAS_KEY = 'ivc_turmas';
const OCORRENCIAS_KEY = 'ivc_ocorrencias';
const CATEQUIZANDOS_KEY = 'ivc_catequizandos';
const ENCONTROS_KEY = 'ivc_encontros';
const ATIVIDADES_KEY = 'ivc_atividades';
const PAROQUIAS_KEY = 'ivc_paroquias';
const COMUNIDADES_KEY = 'ivc_comunidades';
const CATEQUISTAS_KEY = 'ivc_catequistas';

// Turmas
export function getTurmas(): Turma[] {
  return JSON.parse(localStorage.getItem(TURMAS_KEY) || '[]');
}
export function saveTurma(turma: Turma) {
  const turmas = getTurmas();
  const idx = turmas.findIndex(t => t.id === turma.id);
  if (idx >= 0) turmas[idx] = turma; else turmas.push(turma);
  localStorage.setItem(TURMAS_KEY, JSON.stringify(turmas));
}
export function deleteTurma(id: string) {
  localStorage.setItem(TURMAS_KEY, JSON.stringify(getTurmas().filter(t => t.id !== id)));
}

// Catequizandos
export function getCatequizandos(turmaId?: string): Catequizando[] {
  const all: Catequizando[] = JSON.parse(localStorage.getItem(CATEQUIZANDOS_KEY) || '[]');
  return turmaId ? all.filter(c => c.turmaId === turmaId) : all;
}
export function saveCatequizando(c: Catequizando) {
  const all = getCatequizandos();
  const idx = all.findIndex(x => x.id === c.id);
  if (idx >= 0) all[idx] = c; else all.push(c);
  localStorage.setItem(CATEQUIZANDOS_KEY, JSON.stringify(all));
}
export function deleteCatequizando(id: string) {
  localStorage.setItem(CATEQUIZANDOS_KEY, JSON.stringify(getCatequizandos().filter(c => c.id !== id)));
}

// Encontros
export function getEncontros(turmaId?: string): Encontro[] {
  const all: Encontro[] = JSON.parse(localStorage.getItem(ENCONTROS_KEY) || '[]');
  return turmaId ? all.filter(e => e.turmaId === turmaId) : all;
}
export function saveEncontro(e: Encontro) {
  const all = getEncontros();
  const idx = all.findIndex(x => x.id === e.id);
  if (idx >= 0) all[idx] = e; else all.push(e);
  localStorage.setItem(ENCONTROS_KEY, JSON.stringify(all));
}
export function deleteEncontro(id: string) {
  localStorage.setItem(ENCONTROS_KEY, JSON.stringify(getEncontros().filter(e => e.id !== id)));
}

// Ocorrências (cancelamentos/exclusões)
export function getOcorrencias(turmaId?: string): RegistroOcorrencia[] {
  const all: RegistroOcorrencia[] = JSON.parse(localStorage.getItem(OCORRENCIAS_KEY) || '[]');
  return turmaId ? all.filter(o => o.turmaId === turmaId) : all;
}
export function saveOcorrencia(o: RegistroOcorrencia) {
  const all = getOcorrencias();
  all.push(o);
  localStorage.setItem(OCORRENCIAS_KEY, JSON.stringify(all));
}
export function deleteOcorrencia(id: string) {
  localStorage.setItem(OCORRENCIAS_KEY, JSON.stringify(getOcorrencias().filter(o => o.id !== id)));
}


export function getAtividades(turmaId?: string): Atividade[] {
  const all: Atividade[] = JSON.parse(localStorage.getItem(ATIVIDADES_KEY) || '[]');
  return turmaId ? all.filter(a => a.turmaId === turmaId) : all;
}
export function saveAtividade(a: Atividade) {
  const all = getAtividades();
  const idx = all.findIndex(x => x.id === a.id);
  if (idx >= 0) all[idx] = a; else all.push(a);
  localStorage.setItem(ATIVIDADES_KEY, JSON.stringify(all));
}
export function deleteAtividade(id: string) {
  localStorage.setItem(ATIVIDADES_KEY, JSON.stringify(getAtividades().filter(a => a.id !== id)));
}

// Paróquias
export function getParoquias(): Paroquia[] {
  return JSON.parse(localStorage.getItem(PAROQUIAS_KEY) || '[]');
}
export function saveParoquia(p: Paroquia) {
  const all = getParoquias();
  const idx = all.findIndex(x => x.id === p.id);
  if (idx >= 0) all[idx] = p; else all.push(p);
  localStorage.setItem(PAROQUIAS_KEY, JSON.stringify(all));
}
export function deleteParoquia(id: string) {
  localStorage.setItem(PAROQUIAS_KEY, JSON.stringify(getParoquias().filter(p => p.id !== id)));
}

// Comunidades
export function getComunidades(): Comunidade[] {
  return JSON.parse(localStorage.getItem(COMUNIDADES_KEY) || '[]');
}
export function saveComunidade(c: Comunidade) {
  const all = getComunidades();
  const idx = all.findIndex(x => x.id === c.id);
  if (idx >= 0) all[idx] = c; else all.push(c);
  localStorage.setItem(COMUNIDADES_KEY, JSON.stringify(all));
}
export function deleteComunidade(id: string) {
  localStorage.setItem(COMUNIDADES_KEY, JSON.stringify(getComunidades().filter(c => c.id !== id)));
}

// Catequistas
export function getCatequistas(): CatequistaCadastro[] {
  return JSON.parse(localStorage.getItem(CATEQUISTAS_KEY) || '[]');
}
export function saveCatequista(c: CatequistaCadastro) {
  const all = getCatequistas();
  const idx = all.findIndex(x => x.id === c.id);
  if (idx >= 0) all[idx] = c; else all.push(c);
  localStorage.setItem(CATEQUISTAS_KEY, JSON.stringify(all));
}
export function deleteCatequista(id: string) {
  localStorage.setItem(CATEQUISTAS_KEY, JSON.stringify(getCatequistas().filter(c => c.id !== id)));
}

export const NOMES_TURMA = [
  'Pré-Catequese', 'Eucaristia', 'Pré-Crisma ou Perseverança', 'Crisma', 'Adultos', 'Outros',
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
