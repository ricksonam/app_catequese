-- =====================================================
-- FIX: Inscrição Pública de Catequizandos
-- =====================================================
-- Problema: A função public_upsert_catequizando não existia,
-- e a tabela catequizandos exige user_id NOT NULL mas usuários
-- públicos não estão autenticados.
-- Solução: RPC com SECURITY DEFINER que usa o user_id do 
-- proprietário da turma para inserir o catequizando.
-- =====================================================

-- 1. Adicionar colunas que podem estar faltando na tabela catequizandos
ALTER TABLE public.catequizandos
  ADD COLUMN IF NOT EXISTS numero TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bairro TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS complemento TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS responsaveis JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS participacao_pastoral TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS origem TEXT NOT NULL DEFAULT 'manual';

-- 2. Tornar user_id nullable temporariamente para permitir inserção via função
-- (A função vai preencher com o user_id do dono da turma)
ALTER TABLE public.catequizandos
  ALTER COLUMN user_id DROP NOT NULL;

-- 3. Função para verificar se catequizando já existe na turma
CREATE OR REPLACE FUNCTION public.check_catequizando_exists(
  p_turma_id UUID,
  p_nome TEXT,
  p_data_nascimento TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object('id', id, 'nome', nome)
  INTO v_result
  FROM public.catequizandos
  WHERE turma_id = p_turma_id
    AND lower(trim(nome)) = lower(trim(p_nome))
    AND (p_data_nascimento = '' OR data_nascimento = p_data_nascimento)
  LIMIT 1;
  
  IF v_result IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;
  
  RETURN jsonb_build_array(v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Conceder acesso público à função de verificação
GRANT EXECUTE ON FUNCTION public.check_catequizando_exists(UUID, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_catequizando_exists(UUID, TEXT, TEXT) TO authenticated;

-- 4. Função principal de inserção pública de catequizandos
--    SECURITY DEFINER: executa com privilégios do criador da função (postgres)
--    Isso permite inserir mesmo sem autenticação do usuário público
CREATE OR REPLACE FUNCTION public.public_upsert_catequizando(p_payload JSONB)
RETURNS JSONB AS $$
DECLARE
  v_turma_id UUID;
  v_turma_owner_id UUID;
  v_catequizando_id UUID;
  v_existing_id UUID;
BEGIN
  -- Extrair turma_id do payload
  v_turma_id := (p_payload->>'turmaId')::UUID;
  
  IF v_turma_id IS NULL THEN
    RAISE EXCEPTION 'turmaId é obrigatório';
  END IF;
  
  -- Buscar o proprietário da turma (para associar user_id ao catequizando)
  SELECT user_id INTO v_turma_owner_id
  FROM public.turmas
  WHERE id = v_turma_id;
  
  IF v_turma_owner_id IS NULL THEN
    RAISE EXCEPTION 'Turma não encontrada ou sem proprietário';
  END IF;
  
  -- Verificar se já existe (pelo id fornecido no payload)
  v_catequizando_id := (p_payload->>'id')::UUID;
  
  IF v_catequizando_id IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM public.catequizandos
    WHERE id = v_catequizando_id;
  END IF;
  
  IF v_existing_id IS NOT NULL THEN
    -- Atualizar existente
    UPDATE public.catequizandos SET
      nome = COALESCE(p_payload->>'nome', nome),
      data_nascimento = COALESCE(p_payload->>'dataNascimento', data_nascimento),
      responsavel = COALESCE(p_payload->>'responsavel', responsavel),
      telefone = COALESCE(p_payload->>'telefone', telefone),
      email = COALESCE(p_payload->>'email', email),
      endereco = COALESCE(p_payload->>'endereco', endereco),
      numero = COALESCE(p_payload->>'numero', numero),
      bairro = COALESCE(p_payload->>'bairro', bairro),
      complemento = COALESCE(p_payload->>'complemento', complemento),
      necessidade_especial = COALESCE(p_payload->>'necessidadeEspecial', necessidade_especial),
      observacao = COALESCE(p_payload->>'observacao', observacao),
      status = COALESCE(p_payload->>'status', status),
      foto = COALESCE(NULLIF(p_payload->>'foto', ''), foto),
      sacramentos = COALESCE(p_payload->'sacramentos', sacramentos),
      responsaveis = COALESCE(p_payload->'responsaveis', responsaveis),
      participacao_pastoral = COALESCE(p_payload->>'participacaoPastoral', participacao_pastoral),
      origem = 'online'
    WHERE id = v_existing_id;
    
    RETURN jsonb_build_object('id', v_existing_id, 'action', 'updated');
  ELSE
    -- Inserir novo
    v_catequizando_id := COALESCE(v_catequizando_id, gen_random_uuid());
    
    INSERT INTO public.catequizandos (
      id, user_id, turma_id,
      nome, data_nascimento, responsavel, telefone, email,
      endereco, numero, bairro, complemento,
      necessidade_especial, observacao, status, foto,
      sacramentos, responsaveis, participacao_pastoral, origem
    ) VALUES (
      v_catequizando_id,
      v_turma_owner_id,
      v_turma_id,
      COALESCE(p_payload->>'nome', ''),
      COALESCE(p_payload->>'dataNascimento', ''),
      COALESCE(p_payload->>'responsavel', ''),
      COALESCE(p_payload->>'telefone', ''),
      COALESCE(p_payload->>'email', ''),
      COALESCE(p_payload->>'endereco', ''),
      COALESCE(p_payload->>'numero', ''),
      COALESCE(p_payload->>'bairro', ''),
      COALESCE(p_payload->>'complemento', ''),
      COALESCE(p_payload->>'necessidadeEspecial', 'nenhuma'),
      COALESCE(p_payload->>'observacao', ''),
      COALESCE(p_payload->>'status', 'ativo'),
      NULLIF(p_payload->>'foto', ''),
      COALESCE(p_payload->'sacramentos', '{"batismo":{"recebido":false,"paroquia":"","data":""},"eucaristia":{"recebido":false,"paroquia":"","data":""},"crisma":{"recebido":false,"paroquia":"","data":""}}'::jsonb),
      COALESCE(p_payload->'responsaveis', '[]'::jsonb),
      COALESCE(p_payload->>'participacaoPastoral', ''),
      'online'
    );
    
    RETURN jsonb_build_object('id', v_catequizando_id, 'action', 'inserted');
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Erro ao registrar catequizando: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Conceder acesso público à função principal
GRANT EXECUTE ON FUNCTION public.public_upsert_catequizando(JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.public_upsert_catequizando(JSONB) TO authenticated;

-- 5. Função get_public_turma (para buscar turma pelo código de acesso sem auth)
--    Verifica se já existe para evitar duplicação
CREATE OR REPLACE FUNCTION public.get_public_turma(p_code TEXT)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', t.id,
    'nome', t.nome,
    'ano', t.ano,
    'etapa', t.etapa,
    'local', t.local,
    'diaCatequese', t.dia_catequese,
    'horario', t.horario,
    'codigoAcesso', t.codigo_acesso,
    'paroquia_nome', p.nome,
    'comunidade_nome', c.nome
  )
  INTO v_result
  FROM public.turmas t
  LEFT JOIN public.paroquias p ON p.id = (
    SELECT paroquia_id FROM public.comunidades WHERE id = t.comunidade_id LIMIT 1
  )
  LEFT JOIN public.comunidades c ON c.id = t.comunidade_id
  WHERE t.codigo_acesso = upper(trim(p_code));
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Conceder acesso público
GRANT EXECUTE ON FUNCTION public.get_public_turma(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_turma(TEXT) TO authenticated;
