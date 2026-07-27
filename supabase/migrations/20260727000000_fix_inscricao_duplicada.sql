-- =====================================================
-- Fix: Inscrição duplicada na mesma paróquia ou globalmente
-- =====================================================
-- O catequizando que se inscreve por um link, se já existir
-- cadastrado (com mesmo nome e data de nascimento),
-- agora terá seu cadastro atualizado e será movido para
-- a nova turma em vez de duplicar o registro.

-- Remove as funções antigas para evitar erro de mudança de tipo de retorno
DROP FUNCTION IF EXISTS public.check_catequizando_exists(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.public_upsert_catequizando(JSONB);

-- 1. Corrige check_catequizando_exists
CREATE OR REPLACE FUNCTION public.check_catequizando_exists(
  p_turma_id UUID, -- Mantido por compatibilidade de assinatura
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
  WHERE lower(trim(nome)) = lower(trim(p_nome))
    AND (p_data_nascimento = '' OR data_nascimento = p_data_nascimento)
  LIMIT 1;
  
  IF v_result IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;
  
  RETURN jsonb_build_array(v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.check_catequizando_exists(UUID, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_catequizando_exists(UUID, TEXT, TEXT) TO authenticated;

-- 2. Corrige public_upsert_catequizando para atualizar turma_id
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

    -- Verificar se catequizando já existe globalmente pelo nome e data_nasc (para upsert e mudança de turma)
    SELECT id INTO v_id 
    FROM public.catequizandos 
    WHERE UPPER(TRIM(nome)) = UPPER(TRIM(v_nome))
    AND data_nascimento = v_data_nasc
    LIMIT 1;

    IF v_id IS NOT NULL THEN
        -- Atualiza e mantém o protocolo existente
        SELECT protocolo INTO v_protocolo FROM public.catequizandos WHERE id = v_id;
        
        UPDATE public.catequizandos 
        SET 
            turma_id = v_turma_id,
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

GRANT EXECUTE ON FUNCTION public.public_upsert_catequizando(JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.public_upsert_catequizando(JSONB) TO authenticated;
