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

export interface Catequizando {
  id: string;
  turmaId: string;
  nome: string;
  dataNascimento: string;
  responsavel: string;
  telefone: string;
  email: string;
}

export type EncontroStatus = 'pendente' | 'realizado' | 'adiado' | 'transferido' | 'cancelado';

export type OracaoTipo = 'Ofício Divino' | 'Leitura Orante' | 'Celebrativo' | 'Oração Simples' | 'Louvor';

export type RoteiroStepTipo = 'acolhida' | 'oracao_inicial' | 'desenvolvimento' | 'dinamica' | 'compromisso' | 'avisos' | 'oracao_final';

export interface RoteiroStep {
  id: string;
  tipo: RoteiroStepTipo;
  label: string;
  conteudo: string;
  tempo: number; // minutos
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

export function deleteEncontro(id: string) {
  const all = getEncontros().filter(e => e.id !== id);
  localStorage.setItem(ENCONTROS_KEY, JSON.stringify(all));
}

export function deleteCatequizando(id: string) {
  const all = getCatequizandos().filter(c => c.id !== id);
  localStorage.setItem(CATEQUIZANDOS_KEY, JSON.stringify(all));
}

const TURMAS_KEY = 'ivc_turmas';
const CATEQUIZANDOS_KEY = 'ivc_catequizandos';
const ENCONTROS_KEY = 'ivc_encontros';

export function getTurmas(): Turma[] {
  return JSON.parse(localStorage.getItem(TURMAS_KEY) || '[]');
}

export function saveTurma(turma: Turma) {
  const turmas = getTurmas();
  const idx = turmas.findIndex(t => t.id === turma.id);
  if (idx >= 0) turmas[idx] = turma;
  else turmas.push(turma);
  localStorage.setItem(TURMAS_KEY, JSON.stringify(turmas));
}

export function deleteTurma(id: string) {
  const turmas = getTurmas().filter(t => t.id !== id);
  localStorage.setItem(TURMAS_KEY, JSON.stringify(turmas));
}

export function getCatequizandos(turmaId?: string): Catequizando[] {
  const all: Catequizando[] = JSON.parse(localStorage.getItem(CATEQUIZANDOS_KEY) || '[]');
  return turmaId ? all.filter(c => c.turmaId === turmaId) : all;
}

export function saveCatequizando(c: Catequizando) {
  const all = getCatequizandos();
  const idx = all.findIndex(x => x.id === c.id);
  if (idx >= 0) all[idx] = c;
  else all.push(c);
  localStorage.setItem(CATEQUIZANDOS_KEY, JSON.stringify(all));
}

export function getEncontros(turmaId?: string): Encontro[] {
  const all: Encontro[] = JSON.parse(localStorage.getItem(ENCONTROS_KEY) || '[]');
  return turmaId ? all.filter(e => e.turmaId === turmaId) : all;
}

export function saveEncontro(e: Encontro) {
  const all = getEncontros();
  const idx = all.findIndex(x => x.id === e.id);
  if (idx >= 0) all[idx] = e;
  else all.push(e);
  localStorage.setItem(ENCONTROS_KEY, JSON.stringify(all));
}

export const NOMES_TURMA = [
  'Pré-Catequese',
  'Eucaristia',
  'Pré-Crisma ou Perseverança',
  'Crisma',
  'Adultos',
  'Outros',
];

export const DIAS_SEMANA = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

export const ETAPAS_CATEQUESE = [
  { id: 'pre-catecumenato', label: 'Pré-Catecumenato', ordem: 1, cor: 'hsl(var(--primary))' },
  { id: 'catecumenato', label: 'Catecumenato', ordem: 2, cor: 'hsl(var(--accent))' },
  { id: 'purificacao', label: 'Purificação e Iluminação', ordem: 3, cor: 'hsl(var(--liturgical))' },
  { id: 'mistagogia', label: 'Mistagogia', ordem: 4, cor: 'hsl(var(--success))' },
];
