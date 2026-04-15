import { supabase } from "@/integrations/supabase/client";
import type { Turma, Catequizando, Encontro, Atividade, Paroquia, Comunidade, CatequistaCadastro, RegistroOcorrencia, MuralFoto, CitacaoBiblica, HistoricoSorteioCitacao, BingoModelo } from "./store";

// ========== TURMAS ==========

function gerarCodigoTurma(nome: string): string {
  const palavras = nome.trim().split(/\s+/);
  const letra1 = (palavras[0]?.[0] || 'A').toUpperCase();
  const letra2 = (palavras[1]?.[0] || palavras[0]?.[1] || 'B').toUpperCase();
  // 100000-999999: always exactly 6 digits, no padding needed → total 8 chars
  const digitos = (Math.floor(Math.random() * 900000) + 100000).toString();
  return `${letra1}${letra2}${digitos}`;
}

export async function fetchTurmas(): Promise<Turma[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Fetch owned turmas
  const { data: ownedData, error: ownedError } = await (supabase.from as any)("turmas")
    .select("*, turma_catequistas(catequista_id)")
    .eq("user_id", user.id)
    .order("criado_em", { ascending: false });
  if (ownedError) throw ownedError;

  // Fetch turmas where user is a member (shared)
  const { data: memberData, error: memberError } = await (supabase.from as any)("turma_membros")
    .select("turma_id")
    .eq("user_id", user.id);
  if (memberError) throw memberError;

  const sharedIds = (memberData || []).map((m: any) => m.turma_id);
  let sharedTurmas: Turma[] = [];

  if (sharedIds.length > 0) {
    const { data: sharedData, error: sharedError } = await (supabase.from as any)("turmas")
      .select("*, turma_catequistas(catequista_id)")
      .in("id", sharedIds)
      .order("criado_em", { ascending: false });
    if (sharedError) throw sharedError;

    sharedTurmas = (sharedData || []).map((t: any) => ({
      id: t.id, nome: t.nome, ano: t.ano, diaCatequese: t.dia_catequese,
      horario: t.horario, local: t.local, etapa: t.etapa, outrosDados: t.outros_dados,
      criadoEm: t.criado_em,
      comunidadeId: t.comunidade_id,
      catequistasIds: (t.turma_catequistas || []).map((tc: any) => tc.catequista_id),
      codigoAcesso: t.codigo_acesso,
      isShared: true,
    }));
  }

  const ownedTurmas = (ownedData || []).map((t: any) => ({
    id: t.id, nome: t.nome, ano: t.ano, diaCatequese: t.dia_catequese,
    horario: t.horario, local: t.local, etapa: t.etapa, outrosDados: t.outros_dados,
    criadoEm: t.criado_em,
    comunidadeId: t.comunidade_id,
    catequistasIds: (t.turma_catequistas || []).map((tc: any) => tc.catequista_id),
    codigoAcesso: t.codigo_acesso,
    isShared: false,
  }));

  return [...ownedTurmas, ...sharedTurmas];
}

export async function upsertTurma(turma: Turma) {
  // Generate access code for new turmas
  const codigo = turma.codigoAcesso || gerarCodigoTurma(turma.nome);

  const { error } = await (supabase.from as any)("turmas").upsert({
    id: turma.id, nome: turma.nome, ano: turma.ano, dia_catequese: turma.diaCatequese,
    horario: turma.horario, local: turma.local, etapa: turma.etapa, outros_dados: turma.outrosDados,
    criado_em: turma.criadoEm,
    comunidade_id: turma.comunidadeId || null,
    codigo_acesso: codigo,
  });
  if (error) throw error;

  if (turma.catequistasIds) {
    await (supabase.from as any)("turma_catequistas").delete().eq("turma_id", turma.id);
    if (turma.catequistasIds.length > 0) {
      const inserts = turma.catequistasIds.map(cid => ({ turma_id: turma.id, catequista_id: cid }));
      const { error: tcError } = await (supabase.from as any)("turma_catequistas").insert(inserts);
      if (tcError) throw tcError;
    }
  }
}

export async function removeTurma(id: string) {
  const { error } = await (supabase.from as any)("turmas").delete().eq("id", id);
  if (error) throw error;
}

export async function joinTurmaByCode(code: string): Promise<{ turmaId: string; nome: string }> {
  const normalizedCode = code.trim().toUpperCase();

  // Uses SECURITY DEFINER RPC to bypass RLS — the function validates ownership and membership server-side
  const { data, error } = await supabase.rpc('join_turma_by_code', { p_code: normalizedCode });

  if (error) {
    // Extract the human-readable message from the Postgres exception
    const msg = error.message || '';
    if (msg.includes('inválido')) throw new Error('Código inválido. Verifique e tente novamente.');
    if (msg.includes('proprietário')) throw new Error('Você já é o proprietário desta turma.');
    if (msg.includes('acesso')) throw new Error('Você já tem acesso a esta turma.');
    throw new Error('Erro ao entrar na turma. Tente novamente.');
  }

  const result = data as { turmaId: string; nome: string };
  return result;
}


export async function leaveTurma(turmaId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");
  const { error } = await (supabase.from as any)("turma_membros")
    .delete()
    .eq("turma_id", turmaId)
    .eq("user_id", user.id);
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
    endereco: c.endereco, numero: c.numero, bairro: c.bairro, complemento: c.complemento,
    necessidadeEspecial: c.necessidade_especial,
    observacao: c.observacao, status: c.status, foto: c.foto || undefined,
    sacramentos: c.sacramentos || undefined,
  }));
}

export async function upsertCatequizando(c: Catequizando) {
  const { error } = await (supabase.from as any)("catequizandos").upsert({
    id: c.id, turma_id: c.turmaId, nome: c.nome, data_nascimento: c.dataNascimento,
    responsavel: c.responsavel, telefone: c.telefone, email: c.email,
    endereco: c.endereco || '', numero: c.numero || '', bairro: c.bairro || '', complemento: c.complemento || '',
    necessidade_especial: c.necessidadeEspecial || '',
    observacao: c.observacao || '', status: c.status, foto: c.foto || null,
    sacramentos: c.sacramentos || null,
  });
  if (error) throw error;
}

export async function removeCatequizando(id: string) {
  const { error } = await (supabase.from as any)("catequizandos").delete().eq("id", id);
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
    avaliacao: e.avaliacao || undefined,
  }));
}

export async function upsertEncontro(e: Encontro) {
  const { error } = await (supabase.from as any)("encontros").upsert({
    id: e.id, turma_id: e.turmaId, tema: e.tema, data: e.data,
    leitura_biblica: e.leituraBiblica, material_apoio: e.materialApoio,
    roteiro: e.roteiro as any, status: e.status, presencas: e.presencas as any,
    criado_em: e.criadoEm, motivo_cancelamento: e.motivoCancelamento || null,
    data_transferida: e.dataTransferida || null,
    avaliacao: e.avaliacao || null,
  });
  if (error) throw error;
}

export async function removeEncontro(id: string) {
  const { error } = await (supabase.from as any)("encontros").delete().eq("id", id);
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
  const { error } = await (supabase.from as any)("atividades").upsert({
    id: a.id, turma_id: a.turmaId, nome: a.nome, descricao: a.descricao,
    tipo: a.tipo, modalidade: a.modalidade, conducao: a.conducao || null,
    data: a.data, local: a.local, horario: a.horario, observacao: a.observacao,
    presencas: a.presencas as any, criado_em: a.criadoEm,
  });
  if (error) throw error;
}

export async function removeAtividade(id: string) {
  const { error } = await (supabase.from as any)("atividades").delete().eq("id", id);
  if (error) throw error;
}

// ========== PAROQUIAS ==========
export async function fetchParoquias(): Promise<Paroquia[]> {
  const { data, error } = await (supabase.from as any)("paroquias").select("*").order("nome");
  if (error) throw error;
  return (data || []).map((p: any) => ({
    id: p.id, nome: p.nome, tipo: p.tipo, endereco: p.endereco,
    telefone: p.telefone, email: p.email, responsavel: p.responsavel, observacao: p.observacao,
  }));
}

export async function upsertParoquia(p: Paroquia) {
  const { error } = await (supabase.from as any)("paroquias").upsert({
    id: p.id, nome: p.nome, tipo: p.tipo, endereco: p.endereco,
    telefone: p.telefone, email: p.email, responsavel: p.responsavel, observacao: p.observacao,
  });
  if (error) throw error;
}

export async function removeParoquia(id: string) {
  const { error } = await (supabase.from as any)("paroquias").delete().eq("id", id);
  if (error) throw error;
}

// ========== COMUNIDADES ==========
export async function fetchComunidades(): Promise<Comunidade[]> {
  const { data, error } = await (supabase.from as any)("comunidades").select("*").order("nome");
  if (error) throw error;
  return (data || []).map((c: any) => ({
    id: c.id, nome: c.nome, tipo: c.tipo, paroquiaId: c.paroquia_id || '',
    endereco: c.endereco, responsavel: c.responsavel, telefone: c.telefone, observacao: c.observacao,
  }));
}

export async function upsertComunidade(c: Comunidade) {
  const { error } = await (supabase.from as any)("comunidades").upsert({
    id: c.id, nome: c.nome, tipo: c.tipo, paroquia_id: c.paroquiaId || null,
    endereco: c.endereco, responsavel: c.responsavel, telefone: c.telefone, observacao: c.observacao,
  });
  if (error) throw error;
}

export async function removeComunidade(id: string) {
  const { error } = await (supabase.from as any)("comunidades").delete().eq("id", id);
  if (error) throw error;
}

// ========== CATEQUISTAS ==========
export async function fetchCatequistas(): Promise<CatequistaCadastro[]> {
  const { data, error } = await (supabase.from as any)("catequistas").select("*").order("nome");
  if (error) throw error;
  return (data || []).map((c: any) => ({
    id: c.id, nome: c.nome, dataNascimento: c.data_nascimento, 
    endereco: c.endereco, numero: c.numero, bairro: c.bairro, complemento: c.complemento,
    profissao: c.profissao, telefone: c.telefone, email: c.email,
    comunidadeId: c.comunidade_id || '', formacao: c.formacao,
    anosExperiencia: c.anos_experiencia, observacao: c.observacao,
    foto: c.foto || undefined, status: c.status || 'ativo',
  }));
}

export async function upsertCatequista(c: CatequistaCadastro) {
  const { error } = await (supabase.from as any)("catequistas").upsert({
    id: c.id, nome: c.nome, data_nascimento: c.dataNascimento, 
    endereco: c.endereco, numero: c.numero, bairro: c.bairro, complemento: c.complemento,
    profissao: c.profissao, telefone: c.telefone, email: c.email,
    comunidade_id: c.comunidadeId || null, formacao: c.formacao,
    anos_experiencia: c.anosExperiencia, observacao: c.observacao,
    foto: c.foto || null, status: c.status || 'ativo',
  });
  if (error) throw error;
}

export async function removeCatequista(id: string) {
  const { error } = await (supabase.from as any)("catequistas").delete().eq("id", id);
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
  const { error } = await (supabase.from as any)("ocorrencias").insert({
    id: o.id, encontro_id: o.encontroId, turma_id: o.turmaId,
    tipo: o.tipo, motivo: o.motivo, data: o.data, tema_nome: o.temaNome,
  });
  if (error) throw error;
}

export async function removeOcorrencia(id: string) {
  const { error } = await (supabase.from as any)("ocorrencias").delete().eq("id", id);
  if (error) throw error;
}

// ========== CALENDARIO NOTAS ==========
export async function fetchCalendarioNotas(): Promise<{ id: string; data: string; nota: string }[]> {
  const { data, error } = await (supabase.from as any)("calendario_notas").select("*");
  if (error) throw error;
  return data || [];
}

export async function upsertCalendarioNota(n: { id: string; data: string; nota: string }) {
  const { error } = await (supabase.from as any)("calendario_notas").upsert({
    id: n.id, data: n.data, nota: n.nota,
  });
  if (error) throw error;
}

export async function removeCalendarioNota(id: string) {
  const { error } = await (supabase.from as any)("calendario_notas").delete().eq("id", id);
  if (error) throw error;
}

// ========== MURAL FOTOS ==========
export async function fetchMuralFotos(): Promise<MuralFoto[]> {
  const { data, error } = await (supabase.from as any)("mural_fotos").select("*").order("data", { ascending: false });
  if (error) throw error;
  return (data || []).map((f: any) => ({
    id: f.id, url: f.url, legenda: f.legenda, resumo: f.resumo,
    data: f.data, criadoEm: f.criado_em, turmaId: f.turma_id
  }));
}

export async function upsertMuralFoto(f: MuralFoto) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const { error } = await (supabase.from as any)("mural_fotos").upsert({
    id: f.id, url: f.url, legenda: f.legenda, resumo: f.resumo,
    data: f.data, criado_em: f.criadoEm, turma_id: f.turmaId || null,
    user_id: user.id
  });
  if (error) throw error;
}

export async function removeMuralFoto(id: string) {
  // Usa RPC SECURITY DEFINER para contornar RLS em fotos antigas sem user_id
  const { error } = await supabase.rpc('delete_mural_foto', { p_foto_id: id });
  if (error) throw error;
}

// ========== MEMBROS DA TURMA ==========
export async function fetchTurmaMembros(turmaId: string) {
  const { data, error } = await supabase.rpc('get_turma_membros', { p_turma_id: turmaId });
  if (error) throw error;
  return data || [];
}

export async function removeTurmaMembro(turmaId: string, userId: string) {
  const { error } = await supabase.rpc('remove_turma_membro', {
    p_turma_id: turmaId,
    p_user_id: userId,
  });
  if (error) throw error;
}

// ========== STORAGE ==========
export async function uploadFile(file: Blob, folder: string, fileName: string): Promise<string> {
  const path = `${folder}/${fileName}`;
  const { data, error } = await supabase.storage.from("catequese").upload(path, file, {
    upsert: true,
    contentType: 'image/jpeg'
  });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage.from("catequese").getPublicUrl(path);
  return publicUrl;
}

// ========== CITACOES BIBLICAS ==========
export async function fetchCitacoes(): Promise<CitacaoBiblica[]> {
  const { data, error } = await (supabase.from as any)("citacoes_biblicas").select("*").order("referencia");
  if (error) throw error;
  return data || [];
}

export async function fetchHistoricoCitacoes(turmaId?: string): Promise<HistoricoSorteioCitacao[]> {
  let q = (supabase.from as any)("sorteios_historico").select("*").order("criado_em", { ascending: false });
  if (turmaId) q = (q as any).eq("turma_id", turmaId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map((h: any) => ({
    id: h.id,
    turmaId: h.turma_id,
    data: h.data,
    tipo: h.tipo,
    resultados: h.resultados,
    criadoEm: h.criado_em
  }));
}

export async function saveSorteioHistorico(h: Omit<HistoricoSorteioCitacao, 'id' | 'criadoEm'>) {
  const { error } = await (supabase.from as any)("sorteios_historico").insert({
    turma_id: h.turmaId,
    data: h.data,
    tipo: h.tipo,
    resultados: h.resultados
  });
  if (error) throw error;
}

// ========== BINGO BÍBLICO ==========
export async function fetchBingoModelos(): Promise<BingoModelo[]> {
  const { data, error } = await (supabase.from as any)("bingo_modelos").select("*").order("nome");
  if (error) throw error;
  return data || [];
}
