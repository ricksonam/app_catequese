import { supabase } from "@/integrations/supabase/client";
import type { Turma, Catequizando, Encontro, Atividade, Paroquia, Comunidade, CatequistaCadastro, RegistroOcorrencia } from "./store";

// ========== TURMAS ==========
export async function fetchTurmas(): Promise<Turma[]> {
  const { data, error } = await supabase.from("turmas").select("*").order("criado_em", { ascending: false });
  if (error) throw error;
  return (data || []).map((t: any) => ({
    id: t.id, nome: t.nome, ano: t.ano, diaCatequese: t.dia_catequese,
    horario: t.horario, local: t.local, etapa: t.etapa, outrosDados: t.outros_dados,
    criadoEm: t.criado_em,
  }));
}

export async function upsertTurma(turma: Turma) {
  const { error } = await supabase.from("turmas").upsert({
    id: turma.id, nome: turma.nome, ano: turma.ano, dia_catequese: turma.diaCatequese,
    horario: turma.horario, local: turma.local, etapa: turma.etapa, outros_dados: turma.outrosDados,
    criado_em: turma.criadoEm,
  });
  if (error) throw error;
}

export async function removeTurma(id: string) {
  const { error } = await supabase.from("turmas").delete().eq("id", id);
  if (error) throw error;
}

// ========== CATEQUIZANDOS ==========
export async function fetchCatequizandos(turmaId?: string): Promise<Catequizando[]> {
  let q = supabase.from("catequizandos").select("*").order("nome");
  if (turmaId) q = q.eq("turma_id", turmaId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map((c: any) => ({
    id: c.id, turmaId: c.turma_id, nome: c.nome, dataNascimento: c.data_nascimento,
    responsavel: c.responsavel, telefone: c.telefone, email: c.email,
    endereco: c.endereco, necessidadeEspecial: c.necessidade_especial,
    observacao: c.observacao, status: c.status, foto: c.foto || undefined,
    sacramentos: c.sacramentos || undefined,
  }));
}

export async function upsertCatequizando(c: Catequizando) {
  const { error } = await supabase.from("catequizandos").upsert({
    id: c.id, turma_id: c.turmaId, nome: c.nome, data_nascimento: c.dataNascimento,
    responsavel: c.responsavel, telefone: c.telefone, email: c.email,
    endereco: c.endereco || '', necessidade_especial: c.necessidadeEspecial || '',
    observacao: c.observacao || '', status: c.status, foto: c.foto || null,
    sacramentos: c.sacramentos || null,
  });
  if (error) throw error;
}

export async function removeCatequizando(id: string) {
  const { error } = await supabase.from("catequizandos").delete().eq("id", id);
  if (error) throw error;
}

// ========== ENCONTROS ==========
export async function fetchEncontros(turmaId?: string): Promise<Encontro[]> {
  let q = supabase.from("encontros").select("*").order("data");
  if (turmaId) q = q.eq("turma_id", turmaId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map((e: any) => ({
    id: e.id, turmaId: e.turma_id, tema: e.tema, data: e.data,
    leituraBiblica: e.leitura_biblica, materialApoio: e.material_apoio,
    roteiro: e.roteiro || [], status: e.status, presencas: e.presencas || [],
    criadoEm: e.criado_em, motivoCancelamento: e.motivo_cancelamento || undefined,
    dataTransferida: e.data_transferida || undefined,
  }));
}

export async function upsertEncontro(e: Encontro) {
  const { error } = await supabase.from("encontros").upsert({
    id: e.id, turma_id: e.turmaId, tema: e.tema, data: e.data,
    leitura_biblica: e.leituraBiblica, material_apoio: e.materialApoio,
    roteiro: e.roteiro as any, status: e.status, presencas: e.presencas as any,
    criado_em: e.criadoEm, motivo_cancelamento: e.motivoCancelamento || null,
    data_transferida: e.dataTransferida || null,
  });
  if (error) throw error;
}

export async function removeEncontro(id: string) {
  const { error } = await supabase.from("encontros").delete().eq("id", id);
  if (error) throw error;
}

// ========== ATIVIDADES ==========
export async function fetchAtividades(turmaId?: string): Promise<Atividade[]> {
  let q = supabase.from("atividades").select("*").order("data");
  if (turmaId) q = q.eq("turma_id", turmaId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map((a: any) => ({
    id: a.id, turmaId: a.turma_id, nome: a.nome, descricao: a.descricao,
    tipo: a.tipo, modalidade: a.modalidade, conducao: a.conducao || undefined,
    data: a.data, local: a.local, horario: a.horario, observacao: a.observacao,
    presencas: a.presencas || [], criadoEm: a.criado_em,
  }));
}

export async function upsertAtividade(a: Atividade) {
  const { error } = await supabase.from("atividades").upsert({
    id: a.id, turma_id: a.turmaId, nome: a.nome, descricao: a.descricao,
    tipo: a.tipo, modalidade: a.modalidade, conducao: a.conducao || null,
    data: a.data, local: a.local, horario: a.horario, observacao: a.observacao,
    presencas: a.presencas as any, criado_em: a.criadoEm,
  });
  if (error) throw error;
}

export async function removeAtividade(id: string) {
  const { error } = await supabase.from("atividades").delete().eq("id", id);
  if (error) throw error;
}

// ========== PAROQUIAS ==========
export async function fetchParoquias(): Promise<Paroquia[]> {
  const { data, error } = await supabase.from("paroquias").select("*").order("nome");
  if (error) throw error;
  return (data || []).map((p: any) => ({
    id: p.id, nome: p.nome, tipo: p.tipo, endereco: p.endereco,
    telefone: p.telefone, email: p.email, responsavel: p.responsavel, observacao: p.observacao,
  }));
}

export async function upsertParoquia(p: Paroquia) {
  const { error } = await supabase.from("paroquias").upsert({
    id: p.id, nome: p.nome, tipo: p.tipo, endereco: p.endereco,
    telefone: p.telefone, email: p.email, responsavel: p.responsavel, observacao: p.observacao,
  });
  if (error) throw error;
}

export async function removeParoquia(id: string) {
  const { error } = await supabase.from("paroquias").delete().eq("id", id);
  if (error) throw error;
}

// ========== COMUNIDADES ==========
export async function fetchComunidades(): Promise<Comunidade[]> {
  const { data, error } = await supabase.from("comunidades").select("*").order("nome");
  if (error) throw error;
  return (data || []).map((c: any) => ({
    id: c.id, nome: c.nome, tipo: c.tipo, paroquiaId: c.paroquia_id || '',
    endereco: c.endereco, responsavel: c.responsavel, telefone: c.telefone, observacao: c.observacao,
  }));
}

export async function upsertComunidade(c: Comunidade) {
  const { error } = await supabase.from("comunidades").upsert({
    id: c.id, nome: c.nome, tipo: c.tipo, paroquia_id: c.paroquiaId || null,
    endereco: c.endereco, responsavel: c.responsavel, telefone: c.telefone, observacao: c.observacao,
  });
  if (error) throw error;
}

export async function removeComunidade(id: string) {
  const { error } = await supabase.from("comunidades").delete().eq("id", id);
  if (error) throw error;
}

// ========== CATEQUISTAS ==========
export async function fetchCatequistas(): Promise<CatequistaCadastro[]> {
  const { data, error } = await supabase.from("catequistas").select("*").order("nome");
  if (error) throw error;
  return (data || []).map((c: any) => ({
    id: c.id, nome: c.nome, dataNascimento: c.data_nascimento, endereco: c.endereco,
    profissao: c.profissao, telefone: c.telefone, email: c.email,
    comunidadeId: c.comunidade_id || '', formacao: c.formacao,
    anosExperiencia: c.anos_experiencia, observacao: c.observacao,
  }));
}

export async function upsertCatequista(c: CatequistaCadastro) {
  const { error } = await supabase.from("catequistas").upsert({
    id: c.id, nome: c.nome, data_nascimento: c.dataNascimento, endereco: c.endereco,
    profissao: c.profissao, telefone: c.telefone, email: c.email,
    comunidade_id: c.comunidadeId || null, formacao: c.formacao,
    anos_experiencia: c.anosExperiencia, observacao: c.observacao,
  });
  if (error) throw error;
}

export async function removeCatequista(id: string) {
  const { error } = await supabase.from("catequistas").delete().eq("id", id);
  if (error) throw error;
}

// ========== OCORRENCIAS ==========
export async function fetchOcorrencias(turmaId?: string): Promise<RegistroOcorrencia[]> {
  let q = supabase.from("ocorrencias").select("*").order("data", { ascending: false });
  if (turmaId) q = q.eq("turma_id", turmaId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map((o: any) => ({
    id: o.id, encontroId: o.encontro_id, turmaId: o.turma_id,
    tipo: o.tipo, motivo: o.motivo, data: o.data, temaNome: o.tema_nome,
  }));
}

export async function insertOcorrencia(o: RegistroOcorrencia) {
  const { error } = await supabase.from("ocorrencias").insert({
    id: o.id, encontro_id: o.encontroId, turma_id: o.turmaId,
    tipo: o.tipo, motivo: o.motivo, data: o.data, tema_nome: o.temaNome,
  });
  if (error) throw error;
}

export async function removeOcorrencia(id: string) {
  const { error } = await supabase.from("ocorrencias").delete().eq("id", id);
  if (error) throw error;
}
