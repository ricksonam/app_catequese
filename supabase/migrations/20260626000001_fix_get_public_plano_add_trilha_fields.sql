-- Adiciona campos etapas_rito, trilhas_config e data_celebracao_sacramento
-- ao retorno da função get_public_plano para exibição na página pública do rito sacramental.
CREATE OR REPLACE FUNCTION public.get_public_plano(p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_turma_id UUID;
    v_turma_data RECORD;
    v_encontros JSONB;
    v_atividades JSONB;
    v_catequistas JSONB;
    v_result JSONB;
BEGIN
    -- 1. Find the turma data including community name
    SELECT 
        t.id, t.nome, t.dia_catequese, t.horario, t.local, t.etapa, t.outros_dados, t.ano,
        coalesce(c.nome, '') as comunidade_nome,
        t.data_celebracao_sacramento,
        t.etapas_rito,
        t.trilhas_config
    FROM public.turmas t
    LEFT JOIN public.comunidades c ON c.id = t.comunidade_id
    WHERE UPPER(t.codigo_acesso) = UPPER(p_code)
    LIMIT 1
    INTO v_turma_data;

    IF v_turma_data.id IS NULL THEN
        RETURN NULL;
    END IF;

    v_turma_id := v_turma_data.id;

    -- 2. Fetch encounters
    SELECT COALESCE(jsonb_agg(e), '[]'::jsonb)
    INTO v_encontros
    FROM (
        SELECT id, tema, data, leitura_biblica, material_apoio, status
        FROM public.encontros
        WHERE turma_id = v_turma_id
        ORDER BY data ASC
    ) e;

    -- 3. Fetch activities
    SELECT COALESCE(jsonb_agg(a), '[]'::jsonb)
    INTO v_atividades
    FROM (
        SELECT id, nome, data, tipo, modalidade, local, horario, descricao
        FROM public.atividades
        WHERE turma_id = v_turma_id
        ORDER BY data ASC
    ) a;

    -- 4. Fetch catechists names
    SELECT COALESCE(jsonb_agg(c.nome), '[]'::jsonb)
    INTO v_catequistas
    FROM public.turma_catequistas tc
    JOIN public.catequistas c ON c.id = tc.catequista_id
    WHERE tc.turma_id = v_turma_id;

    -- 5. Combine everything
    v_result := jsonb_build_object(
        'turma', jsonb_build_object(
            'id', v_turma_data.id,
            'nome', v_turma_data.nome,
            'ano', v_turma_data.ano,
            'dia_catequese', v_turma_data.dia_catequese,
            'horario', v_turma_data.horario,
            'local', v_turma_data.local,
            'etapa', v_turma_data.etapa,
            'comunidade_nome', v_turma_data.comunidade_nome,
            'data_celebracao_sacramento', v_turma_data.data_celebracao_sacramento,
            'etapas_rito', COALESCE(v_turma_data.etapas_rito, '{}'::jsonb),
            'trilhas_config', COALESCE(v_turma_data.trilhas_config, '{}'::jsonb)
        ),
        'encontros', v_encontros,
        'atividades', v_atividades,
        'catequistas', v_catequistas
    );

    RETURN v_result;
END;
$function$;
