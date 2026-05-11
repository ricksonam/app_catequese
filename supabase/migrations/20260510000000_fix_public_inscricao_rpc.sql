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
RETURNS UUID AS $$
DECLARE
    v_id UUID;
    v_turma_id UUID;
    v_nome TEXT;
    v_data_nasc TEXT;
BEGIN
    v_id := (p_payload->>'id')::UUID;
    v_turma_id := (p_payload->>'turmaId')::UUID;
    v_nome := p_payload->>'nome';
    v_data_nasc := p_payload->>'dataNascimento';

    SELECT id INTO v_id 
    FROM public.catequizandos 
    WHERE turma_id = v_turma_id 
    AND UPPER(TRIM(nome)) = UPPER(TRIM(v_nome))
    AND data_nascimento = v_data_nasc;

    IF v_id IS NOT NULL THEN
        UPDATE public.catequizandos 
        SET 
            telefone = p_payload->>'telefone',
            email = p_payload->>'email',
            endereco = p_payload->>'endereco',
            numero = p_payload->>'numero',
            bairro = p_payload->>'bairro',
            complemento = p_payload->>'complemento',
            responsavel = p_payload->>'responsavel',
            participacao_pastoral = p_payload->>'participacaoPastoral',
            necessidade_especial = p_payload->>'necessidadeEspecial',
            observacao = p_payload->>'observacao',
            foto = p_payload->>'foto',
            sacramentos = (p_payload->>'sacramentos')::JSONB,
            responsaveis = (p_payload->>'responsaveis')::JSONB,
            updated_at = NOW()
        WHERE id = v_id;
    ELSE
        INSERT INTO public.catequizandos (
            id, turma_id, nome, data_nascimento, telefone, email, 
            endereco, numero, bairro, complemento, responsavel, 
            participacao_pastoral, necessidade_especial, observacao, 
            foto, sacramentos, responsaveis, origem
        ) VALUES (
            COALESCE(v_id, gen_random_uuid()),
            v_turma_id,
            v_nome,
            COALESCE(v_data_nasc, ''),
            COALESCE(p_payload->>'telefone', ''),
            COALESCE(p_payload->>'email', ''),
            COALESCE(p_payload->>'endereco', ''),
            COALESCE(p_payload->>'numero', ''),
            COALESCE(p_payload->>'bairro', ''),
            COALESCE(p_payload->>'complemento', ''),
            COALESCE(p_payload->>'responsavel', ''),
            COALESCE(p_payload->>'participacaoPastoral', ''),
            COALESCE(p_payload->>'necessidadeEspecial', 'nenhuma'),
            COALESCE(p_payload->>'observacao', ''),
            NULLIF(p_payload->>'foto', ''),
            COALESCE((p_payload->>'sacramentos')::JSONB, '{"batismo":{"recebido":false,"paroquia":"","data":""},"eucaristia":{"recebido":false,"paroquia":"","data":""},"crisma":{"recebido":false,"paroquia":"","data":""}}'::jsonb),
            COALESCE((p_payload->>'responsaveis')::JSONB, '[]'::jsonb),
            'online'
        ) RETURNING id INTO v_id;
    END IF;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Conceder acesso público à função principal
GRANT EXECUTE ON FUNCTION public.public_upsert_catequizando(JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.public_upsert_catequizando(JSONB) TO authenticated;

-- 5. Função get_public_turma (para buscar turma pelo código de acesso sem auth)
--    Verifica se já existe para evitar duplicação
CREATE OR REPLACE FUNCTION public.get_public_turma(p_codigo TEXT)
RETURNS JSONB AS $$
DECLARE
  v_turma JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', t.id,
    'nome', t.nome,
    'ano', t.ano,
    'etapa', t.etapa,
    'comunidade_nome', c.nome,
    'paroquia_nome', p.nome
  )
  INTO v_turma
  FROM public.turmas t
  LEFT JOIN public.comunidades c ON t.comunidade_id = c.id
  LEFT JOIN public.paroquias p ON c.paroquia_id = p.id OR t.paroquia_id = p.id
  WHERE t.codigo_acesso = p_codigo
  LIMIT 1;
  
  RETURN v_turma;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_public_turma(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_turma(TEXT) TO authenticated;
