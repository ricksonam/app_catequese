-- =====================================================
-- Bloqueio Global de Inscrições (Admin)
-- =====================================================
-- Cria tabela app_settings para configurações globais do sistema.
-- O admin pode bloquear TODAS as inscrições independente da turma.
-- =====================================================

-- 1. Criar tabela de configurações globais
CREATE TABLE IF NOT EXISTS public.app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- 2. Inserir valor padrão: inscrições abertas globalmente
INSERT INTO public.app_settings (key, value)
VALUES ('inscricoes_bloqueadas', 'false')
ON CONFLICT (key) DO NOTHING;

-- 3. RLS: apenas admins podem escrever; leitura pública permitida
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ler (necessário para a página pública de inscrição)
CREATE POLICY "app_settings_public_read"
  ON public.app_settings FOR SELECT
  USING (true);

-- Apenas autenticados (admins) podem atualizar
CREATE POLICY "app_settings_admin_write"
  ON public.app_settings FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 4. Função pública para ler o status de bloqueio (sem auth)
CREATE OR REPLACE FUNCTION public.get_inscricoes_bloqueadas()
RETURNS BOOLEAN AS $$
DECLARE
  v_val TEXT;
BEGIN
  SELECT value INTO v_val FROM public.app_settings WHERE key = 'inscricoes_bloqueadas';
  RETURN COALESCE(v_val, 'false') = 'true';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_inscricoes_bloqueadas() TO anon;
GRANT EXECUTE ON FUNCTION public.get_inscricoes_bloqueadas() TO authenticated;

-- 5. Atualizar public_upsert_catequizando para também verificar bloqueio global
CREATE OR REPLACE FUNCTION public.public_upsert_catequizando(p_payload JSONB)
RETURNS JSONB AS $$
DECLARE
    v_id UUID;
    v_turma_id UUID;
    v_nome TEXT;
    v_data_nasc TEXT;
    v_inscricoes_abertas BOOLEAN;
    v_bloqueio_global TEXT;
    v_protocolo TEXT;
    v_data_hoje TEXT;
    v_seq INT;
BEGIN
    v_turma_id := (p_payload->>'turmaId')::UUID;
    v_nome := p_payload->>'nome';
    v_data_nasc := p_payload->>'dataNascimento';

    -- Verificar bloqueio global primeiro
    SELECT value INTO v_bloqueio_global FROM public.app_settings WHERE key = 'inscricoes_bloqueadas';
    IF COALESCE(v_bloqueio_global, 'false') = 'true' THEN
        RAISE EXCEPTION 'O sistema de inscrições está temporariamente suspenso. Entre em contato pelo e-mail icatequese2026@gmail.com.';
    END IF;

    -- Double-check server-side: verificar se inscrições da turma estão abertas
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

    RETURN jsonb_build_object('id', v_id, 'protocolo', v_protocolo);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.public_upsert_catequizando(JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.public_upsert_catequizando(JSONB) TO authenticated;
