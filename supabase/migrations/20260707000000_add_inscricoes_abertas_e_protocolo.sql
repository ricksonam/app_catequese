-- =====================================================
-- Controle de Inscrições Online + Protocolo de Confirmação
-- =====================================================
-- 1. Adiciona campo inscricoes_abertas na tabela turmas
--    Padrão FALSE = inscrições fechadas (segurança por padrão)
-- 2. Adiciona campo protocolo na tabela catequizandos
-- 3. Atualiza get_public_turma para retornar inscricoes_abertas
-- 4. Atualiza public_upsert_catequizando para:
--    - Verificar inscricoes_abertas antes de inserir (double-check server-side)
--    - Gerar protocolo único e retorná-lo
-- 5. Adiciona função toggle_inscricoes_abertas para o catequista
-- =====================================================

-- 1. Adicionar coluna inscricoes_abertas na tabela turmas
ALTER TABLE public.turmas
  ADD COLUMN IF NOT EXISTS inscricoes_abertas BOOLEAN NOT NULL DEFAULT false;

-- 2. Adicionar coluna protocolo na tabela catequizandos
ALTER TABLE public.catequizandos
  ADD COLUMN IF NOT EXISTS protocolo TEXT DEFAULT NULL;

-- 3. Atualizar get_public_turma para retornar inscricoes_abertas
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
    'paroquia_nome', p.nome,
    'inscricoes_abertas', t.inscricoes_abertas
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

-- 4. Atualizar public_upsert_catequizando para verificar inscrições
--    e gerar número de protocolo
CREATE OR REPLACE FUNCTION public.public_upsert_catequizando(p_payload JSONB)
RETURNS JSONB AS $$
DECLARE
    v_id UUID;
    v_turma_id UUID;
    v_nome TEXT;
    v_data_nasc TEXT;
    v_inscricoes_abertas BOOLEAN;
    v_protocolo TEXT;
    v_data_hoje TEXT;
    v_seq INT;
BEGIN
    v_turma_id := (p_payload->>'turmaId')::UUID;
    v_nome := p_payload->>'nome';
    v_data_nasc := p_payload->>'dataNascimento';

    -- Double-check server-side: verificar se inscrições estão abertas
    SELECT inscricoes_abertas INTO v_inscricoes_abertas
    FROM public.turmas
    WHERE id = v_turma_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Turma não encontrada.';
    END IF;

    IF NOT v_inscricoes_abertas THEN
        RAISE EXCEPTION 'As inscrições para esta turma estão encerradas. Entre em contato com o catequista.';
    END IF;

    -- Verificar se catequizando já existe (para upsert)
    SELECT id INTO v_id 
    FROM public.catequizandos 
    WHERE turma_id = v_turma_id 
    AND UPPER(TRIM(nome)) = UPPER(TRIM(v_nome))
    AND data_nascimento = v_data_nasc;

    IF v_id IS NOT NULL THEN
        -- Atualiza e mantém o protocolo existente
        SELECT protocolo INTO v_protocolo FROM public.catequizandos WHERE id = v_id;
        
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
        -- Gerar número de protocolo único: CAT-YYYYMMDD-XXXX
        v_data_hoje := TO_CHAR(NOW(), 'YYYYMMDD');
        
        -- Usar sequência baseada no total de inscrições online do dia
        SELECT COUNT(*) + 1 INTO v_seq
        FROM public.catequizandos
        WHERE protocolo LIKE 'CAT-' || v_data_hoje || '-%';
        
        v_protocolo := 'CAT-' || v_data_hoje || '-' || LPAD(v_seq::TEXT, 4, '0');

        INSERT INTO public.catequizandos (
            id, turma_id, nome, data_nascimento, telefone, email, 
            endereco, numero, bairro, complemento, responsavel, 
            participacao_pastoral, necessidade_especial, observacao, 
            foto, sacramentos, responsaveis, origem, protocolo
        ) VALUES (
            gen_random_uuid(),
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
            'online',
            v_protocolo
        ) RETURNING id INTO v_id;
    END IF;

    -- Retornar id e protocolo
    RETURN jsonb_build_object('id', v_id, 'protocolo', v_protocolo);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Conceder acesso público à função principal
GRANT EXECUTE ON FUNCTION public.public_upsert_catequizando(JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.public_upsert_catequizando(JSONB) TO authenticated;

-- 5. Função para o catequista ativar/desativar inscrições
--    Apenas o dono da turma pode fazer isso
CREATE OR REPLACE FUNCTION public.toggle_inscricoes_abertas(
  p_turma_id UUID,
  p_abertas BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;

  UPDATE public.turmas
  SET inscricoes_abertas = p_abertas
  WHERE id = p_turma_id
    AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Turma não encontrada ou sem permissão.';
  END IF;

  RETURN p_abertas;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.toggle_inscricoes_abertas(UUID, BOOLEAN) TO authenticated;
