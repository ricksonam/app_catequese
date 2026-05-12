CREATE OR REPLACE FUNCTION public.public_upsert_catequizando(p_payload JSONB)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
    v_turma_id UUID;
    v_nome TEXT;
    v_data_nasc TEXT;
    v_existing_id UUID;
BEGIN
    v_id := (p_payload->>'id')::UUID;
    v_turma_id := (p_payload->>'turmaId')::UUID;
    v_nome := p_payload->>'nome';
    v_data_nasc := p_payload->>'dataNascimento';

    -- Primeiro tenta achar pelo ID enviado no payload
    SELECT id INTO v_existing_id 
    FROM public.catequizandos 
    WHERE id = v_id;

    -- Se não achar pelo ID, tenta pelo nome + turma, como fallback da API
    IF v_existing_id IS NULL THEN
        SELECT id INTO v_existing_id 
        FROM public.catequizandos 
        WHERE turma_id = v_turma_id 
        AND lower(trim(nome)) = lower(trim(v_nome))
        AND (data_nascimento = v_data_nasc OR v_data_nasc = '' OR data_nascimento = '')
        LIMIT 1;
    END IF;

    IF v_existing_id IS NOT NULL THEN
        UPDATE public.catequizandos 
        SET 
            telefone = COALESCE(p_payload->>'telefone', telefone),
            email = COALESCE(p_payload->>'email', email),
            endereco = COALESCE(p_payload->>'endereco', endereco),
            numero = COALESCE(p_payload->>'numero', numero),
            bairro = COALESCE(p_payload->>'bairro', bairro),
            complemento = COALESCE(p_payload->>'complemento', complemento),
            responsavel = COALESCE(p_payload->>'responsavel', responsavel),
            participacao_pastoral = COALESCE(p_payload->>'participacaoPastoral', participacao_pastoral),
            necessidade_especial = COALESCE(p_payload->>'necessidadeEspecial', necessidade_especial),
            observacao = COALESCE(p_payload->>'observacao', observacao),
            foto = COALESCE(p_payload->>'foto', foto),
            sacramentos = COALESCE((p_payload->>'sacramentos')::JSONB, sacramentos),
            responsaveis = COALESCE((p_payload->>'responsaveis')::JSONB, responsaveis)
        WHERE id = v_existing_id;
        
        v_id := v_existing_id;
    ELSE
        INSERT INTO public.catequizandos (
            id, turma_id, nome, data_nascimento, telefone, email, 
            endereco, numero, bairro, complemento, responsavel, 
            participacao_pastoral, necessidade_especial, observacao, 
            foto, sacramentos, responsaveis, origem
        ) VALUES (
            v_id,
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
        );
    END IF;

    RETURN v_id;
END;
$$
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
