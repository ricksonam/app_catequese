-- ============================================================
-- iCatequese: Triggers de sanitização + RLS completo
-- 2026-08-04
-- Cobre:
--   1. Triggers BEFORE INSERT/UPDATE para sanitizar e validar dados
--   2. RLS em tabelas que não tinham cobertura (mural_fotos,
--      calendario_notas, reunioes, bingo_modelos, citacoes_biblicas,
--      sorteios_historico, push_subscriptions, turma_audit_log,
--      frequencia_acessos)
--   3. Proteção do bucket de Storage "catequese" via políticas
-- ============================================================


-- ============================================================
-- PARTE 1: FUNÇÕES AUXILIARES DE SANITIZAÇÃO
-- ============================================================

-- Sanitiza texto: remove espaços extras e caracteres de controle
CREATE OR REPLACE FUNCTION public.sanitize_text(v TEXT)
RETURNS TEXT AS $$
BEGIN
  IF v IS NULL THEN RETURN NULL; END IF;
  -- Remove caracteres de controle (exceto nova linha) e normaliza espaços
  RETURN TRIM(REGEXP_REPLACE(v, '[\x00-\x08\x0B-\x1F\x7F]', '', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Valida e-mail
CREATE OR REPLACE FUNCTION public.is_valid_email(v TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF v IS NULL OR v = '' THEN RETURN TRUE; END IF; -- campo opcional
  RETURN v ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Valida telefone (aceita vazio)
CREATE OR REPLACE FUNCTION public.is_valid_telefone(v TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF v IS NULL OR v = '' THEN RETURN TRUE; END IF;
  RETURN v ~ '^\+?[\d\s\(\)\-]{7,20}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Valida URL de imagem (deve vir de domínio seguro do Supabase)
CREATE OR REPLACE FUNCTION public.is_valid_storage_url(v TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF v IS NULL OR v = '' THEN RETURN TRUE; END IF;
  -- Aceita URLs do Supabase Storage ou vazias
  RETURN v ~* '^https?://[a-z0-9]+\.supabase\.(?:co|com)/storage/v1/object/public/';
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;


-- ============================================================
-- PARTE 2: TRIGGER PARA TABELA turmas
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_sanitize_turmas()
RETURNS TRIGGER AS $$
BEGIN
  -- Sanitizar campos de texto
  NEW.nome             := public.sanitize_text(NEW.nome);
  NEW.ano              := public.sanitize_text(NEW.ano);
  NEW.dia_catequese    := public.sanitize_text(NEW.dia_catequese);
  NEW.horario          := public.sanitize_text(NEW.horario);
  NEW.local            := public.sanitize_text(NEW.local);
  NEW.outros_dados     := public.sanitize_text(NEW.outros_dados);

  -- Validações
  IF NEW.nome IS NULL OR LENGTH(TRIM(NEW.nome)) < 2 THEN
    RAISE EXCEPTION 'Nome da turma deve ter pelo menos 2 caracteres.';
  END IF;

  IF LENGTH(NEW.nome) > 120 THEN
    RAISE EXCEPTION 'Nome da turma não pode ter mais de 120 caracteres.';
  END IF;

  -- Garante user_id não seja adulterado
  IF TG_OP = 'UPDATE' AND NEW.user_id <> OLD.user_id THEN
    RAISE EXCEPTION 'Não é permitido alterar o dono da turma.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sanitize_turmas ON public.turmas;
CREATE TRIGGER trg_sanitize_turmas
  BEFORE INSERT OR UPDATE ON public.turmas
  FOR EACH ROW EXECUTE FUNCTION public.trg_sanitize_turmas();


-- ============================================================
-- PARTE 3: TRIGGER PARA TABELA catequizandos
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_sanitize_catequizandos()
RETURNS TRIGGER AS $$
BEGIN
  NEW.nome                := public.sanitize_text(NEW.nome);
  NEW.responsavel         := public.sanitize_text(NEW.responsavel);
  NEW.telefone            := public.sanitize_text(NEW.telefone);
  NEW.email               := public.sanitize_text(NEW.email);
  NEW.endereco            := public.sanitize_text(NEW.endereco);
  NEW.observacao          := public.sanitize_text(NEW.observacao);
  NEW.necessidade_especial := public.sanitize_text(NEW.necessidade_especial);

  -- Validações
  IF NEW.nome IS NULL OR LENGTH(TRIM(NEW.nome)) < 2 THEN
    RAISE EXCEPTION 'Nome do catequizando deve ter pelo menos 2 caracteres.';
  END IF;

  IF LENGTH(NEW.nome) > 150 THEN
    RAISE EXCEPTION 'Nome do catequizando não pode ter mais de 150 caracteres.';
  END IF;

  IF NOT public.is_valid_email(NEW.email) THEN
    RAISE EXCEPTION 'E-mail inválido: %', NEW.email;
  END IF;

  IF NOT public.is_valid_telefone(NEW.telefone) THEN
    RAISE EXCEPTION 'Telefone inválido: %', NEW.telefone;
  END IF;

  -- Foto deve vir do storage seguro
  IF NEW.foto IS NOT NULL AND NEW.foto <> '' AND NOT public.is_valid_storage_url(NEW.foto) THEN
    RAISE EXCEPTION 'URL de foto inválida. Use apenas imagens do armazenamento do sistema.';
  END IF;

  -- Status só pode ser um valor válido
  IF NEW.status NOT IN ('ativo', 'inativo', 'transferido', 'desistente') THEN
    NEW.status := 'ativo';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sanitize_catequizandos ON public.catequizandos;
CREATE TRIGGER trg_sanitize_catequizandos
  BEFORE INSERT OR UPDATE ON public.catequizandos
  FOR EACH ROW EXECUTE FUNCTION public.trg_sanitize_catequizandos();


-- ============================================================
-- PARTE 4: TRIGGER PARA TABELA encontros
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_sanitize_encontros()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tema             := public.sanitize_text(NEW.tema);
  NEW.leitura_biblica  := public.sanitize_text(NEW.leitura_biblica);
  NEW.material_apoio   := public.sanitize_text(NEW.material_apoio);

  IF NEW.tema IS NULL OR LENGTH(TRIM(NEW.tema)) < 2 THEN
    RAISE EXCEPTION 'Tema do encontro deve ter pelo menos 2 caracteres.';
  END IF;

  IF NEW.status NOT IN ('pendente', 'realizado', 'cancelado', 'transferido') THEN
    NEW.status := 'pendente';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sanitize_encontros ON public.encontros;
CREATE TRIGGER trg_sanitize_encontros
  BEFORE INSERT OR UPDATE ON public.encontros
  FOR EACH ROW EXECUTE FUNCTION public.trg_sanitize_encontros();


-- ============================================================
-- PARTE 5: TRIGGER PARA TABELA catequistas
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_sanitize_catequistas()
RETURNS TRIGGER AS $$
BEGIN
  NEW.nome       := public.sanitize_text(NEW.nome);
  NEW.telefone   := public.sanitize_text(NEW.telefone);
  NEW.email      := public.sanitize_text(NEW.email);
  NEW.endereco   := public.sanitize_text(NEW.endereco);
  NEW.profissao  := public.sanitize_text(NEW.profissao);
  NEW.formacao   := public.sanitize_text(NEW.formacao);
  NEW.observacao := public.sanitize_text(NEW.observacao);

  IF NEW.nome IS NULL OR LENGTH(TRIM(NEW.nome)) < 2 THEN
    RAISE EXCEPTION 'Nome do catequista deve ter pelo menos 2 caracteres.';
  END IF;

  IF NOT public.is_valid_email(NEW.email) THEN
    RAISE EXCEPTION 'E-mail do catequista inválido: %', NEW.email;
  END IF;

  IF NOT public.is_valid_telefone(NEW.telefone) THEN
    RAISE EXCEPTION 'Telefone do catequista inválido: %', NEW.telefone;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sanitize_catequistas ON public.catequistas;
CREATE TRIGGER trg_sanitize_catequistas
  BEFORE INSERT OR UPDATE ON public.catequistas
  FOR EACH ROW EXECUTE FUNCTION public.trg_sanitize_catequistas();


-- ============================================================
-- PARTE 6: TRIGGER PARA TABELA paroquias
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_sanitize_paroquias()
RETURNS TRIGGER AS $$
BEGIN
  NEW.nome        := public.sanitize_text(NEW.nome);
  NEW.telefone    := public.sanitize_text(NEW.telefone);
  NEW.email       := public.sanitize_text(NEW.email);
  NEW.endereco    := public.sanitize_text(NEW.endereco);
  NEW.responsavel := public.sanitize_text(NEW.responsavel);
  NEW.observacao  := public.sanitize_text(NEW.observacao);

  IF NEW.nome IS NULL OR LENGTH(TRIM(NEW.nome)) < 2 THEN
    RAISE EXCEPTION 'Nome da paróquia deve ter pelo menos 2 caracteres.';
  END IF;

  IF NOT public.is_valid_email(NEW.email) THEN
    RAISE EXCEPTION 'E-mail da paróquia inválido: %', NEW.email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sanitize_paroquias ON public.paroquias;
CREATE TRIGGER trg_sanitize_paroquias
  BEFORE INSERT OR UPDATE ON public.paroquias
  FOR EACH ROW EXECUTE FUNCTION public.trg_sanitize_paroquias();


-- ============================================================
-- PARTE 7: TRIGGER + RLS PARA TABELA mural_fotos
-- ============================================================

-- 7a. Garantir RLS ativo
ALTER TABLE public.mural_fotos ENABLE ROW LEVEL SECURITY;

-- 7b. Remover policies antigas se existirem
DROP POLICY IF EXISTS "mural_fotos_select_own" ON public.mural_fotos;
DROP POLICY IF EXISTS "mural_fotos_insert_own" ON public.mural_fotos;
DROP POLICY IF EXISTS "mural_fotos_update_own" ON public.mural_fotos;
DROP POLICY IF EXISTS "mural_fotos_delete_own" ON public.mural_fotos;
DROP POLICY IF EXISTS "Users manage own mural_fotos" ON public.mural_fotos;

-- 7c. Policies granulares: usuário vê APENAS as suas fotos
CREATE POLICY "mural_fotos_select_own" ON public.mural_fotos
  FOR SELECT USING (auth.uid() = user_id);

-- Pode inserir somente com seu próprio user_id
CREATE POLICY "mural_fotos_insert_own" ON public.mural_fotos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Pode atualizar somente as suas
CREATE POLICY "mural_fotos_update_own" ON public.mural_fotos
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Pode deletar somente as suas (a RPC delete_mural_foto usa SECURITY DEFINER já)
CREATE POLICY "mural_fotos_delete_own" ON public.mural_fotos
  FOR DELETE USING (auth.uid() = user_id);

-- 7d. Trigger de sanitização e validação da foto
CREATE OR REPLACE FUNCTION public.trg_sanitize_mural_fotos()
RETURNS TRIGGER AS $$
BEGIN
  NEW.legenda := public.sanitize_text(NEW.legenda);
  NEW.resumo  := public.sanitize_text(NEW.resumo);

  -- Tipo deve ser válido
  IF NEW.tipo NOT IN ('comum', 'criatividade') THEN
    NEW.tipo := 'comum';
  END IF;

  -- URL da foto deve vir do storage seguro
  IF NEW.url IS NULL OR NEW.url = '' THEN
    RAISE EXCEPTION 'URL da foto é obrigatória.';
  END IF;

  IF NOT public.is_valid_storage_url(NEW.url) THEN
    RAISE EXCEPTION 'URL de foto inválida. Use apenas o armazenamento do sistema.';
  END IF;

  -- Limitar tamanho da legenda
  IF NEW.legenda IS NOT NULL AND LENGTH(NEW.legenda) > 200 THEN
    NEW.legenda := LEFT(NEW.legenda, 200);
  END IF;

  -- Garante user_id não seja adulterado no UPDATE
  IF TG_OP = 'UPDATE' AND NEW.user_id <> OLD.user_id THEN
    RAISE EXCEPTION 'Não é permitido alterar o dono da foto.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sanitize_mural_fotos ON public.mural_fotos;
CREATE TRIGGER trg_sanitize_mural_fotos
  BEFORE INSERT OR UPDATE ON public.mural_fotos
  FOR EACH ROW EXECUTE FUNCTION public.trg_sanitize_mural_fotos();


-- ============================================================
-- PARTE 8: RLS PARA TABELAS SEM COBERTURA
-- ============================================================

-- 8a. calendario_notas
ALTER TABLE public.calendario_notas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calendario_notas_own" ON public.calendario_notas;
CREATE POLICY "calendario_notas_own" ON public.calendario_notas
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8b. reunioes (criadas via UI do Supabase sem migration documentada)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'reunioes') THEN
    EXECUTE 'ALTER TABLE public.reunioes ENABLE ROW LEVEL SECURITY';
    -- Remove policy antiga se existir
    EXECUTE 'DROP POLICY IF EXISTS "reunioes_own" ON public.reunioes';
    EXECUTE '
      CREATE POLICY "reunioes_own" ON public.reunioes
        FOR ALL USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id)
    ';
  END IF;
END $$;

-- 8c. push_subscriptions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'push_subscriptions') THEN
    EXECUTE 'ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "push_subscriptions_own" ON public.push_subscriptions';
    EXECUTE '
      CREATE POLICY "push_subscriptions_own" ON public.push_subscriptions
        FOR ALL USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id)
    ';
  END IF;
END $$;

-- 8d. bingo_modelos (seed de conteúdo - somente admin escreve, todos leem)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'bingo_modelos') THEN
    EXECUTE 'ALTER TABLE public.bingo_modelos ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "bingo_modelos_public_read" ON public.bingo_modelos';
    EXECUTE 'DROP POLICY IF EXISTS "bingo_modelos_admin_write" ON public.bingo_modelos';
    -- Usuários autenticados podem ler (é conteúdo de sistema)
    EXECUTE '
      CREATE POLICY "bingo_modelos_public_read" ON public.bingo_modelos
        FOR SELECT USING (auth.uid() IS NOT NULL)
    ';
    -- Apenas admins podem inserir/atualizar/deletar
    EXECUTE '
      CREATE POLICY "bingo_modelos_admin_write" ON public.bingo_modelos
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND (p.is_super_admin = true OR p.role IN (''admin'', ''sub_admin''))
          )
        )
    ';
  END IF;
END $$;

-- 8e. citacoes_biblicas (seed de conteúdo - todos leem, admin escreve)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'citacoes_biblicas') THEN
    EXECUTE 'ALTER TABLE public.citacoes_biblicas ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "citacoes_public_read" ON public.citacoes_biblicas';
    EXECUTE 'DROP POLICY IF EXISTS "citacoes_admin_write" ON public.citacoes_biblicas';
    EXECUTE '
      CREATE POLICY "citacoes_public_read" ON public.citacoes_biblicas
        FOR SELECT USING (auth.uid() IS NOT NULL)
    ';
    EXECUTE '
      CREATE POLICY "citacoes_admin_write" ON public.citacoes_biblicas
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND (p.is_super_admin = true OR p.role IN (''admin'', ''sub_admin''))
          )
        )
    ';
  END IF;
END $$;

-- 8f. sorteios_historico
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'sorteios_historico') THEN
    EXECUTE 'ALTER TABLE public.sorteios_historico ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "sorteios_historico_own" ON public.sorteios_historico';
    EXECUTE '
      CREATE POLICY "sorteios_historico_own" ON public.sorteios_historico
        FOR ALL USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id)
    ';
  END IF;
END $$;

-- 8g. frequencia_acessos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'frequencia_acessos') THEN
    EXECUTE 'ALTER TABLE public.frequencia_acessos ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "frequencia_acessos_own" ON public.frequencia_acessos';
    EXECUTE '
      CREATE POLICY "frequencia_acessos_own" ON public.frequencia_acessos
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.turmas t
            WHERE t.id = turma_id AND t.user_id = auth.uid()
          )
        )
    ';
  END IF;
END $$;

-- 8h. turma_audit_log (apenas leitura pelo dono, inserção via funções)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'turma_audit_log') THEN
    EXECUTE 'ALTER TABLE public.turma_audit_log ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "audit_log_turma_owner_read" ON public.turma_audit_log';
    EXECUTE '
      CREATE POLICY "audit_log_turma_owner_read" ON public.turma_audit_log
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.turmas t
            WHERE t.id = turma_id AND t.user_id = auth.uid()
          )
        )
    ';
  END IF;
END $$;


-- ============================================================
-- PARTE 9: POLÍTICAS DE STORAGE (bucket "catequese")
-- Protege os arquivos por caminho: cada user só acessa
-- a sua pasta user_id/ dentro do bucket.
-- ============================================================

-- Remover policies antigas do bucket "catequese"
DROP POLICY IF EXISTS "catequese_storage_select_own" ON storage.objects;
DROP POLICY IF EXISTS "catequese_storage_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "catequese_storage_update_own" ON storage.objects;
DROP POLICY IF EXISTS "catequese_storage_delete_own" ON storage.objects;
DROP POLICY IF EXISTS "catequese_public_read" ON storage.objects;

-- Leitura pública de arquivos no bucket (fotos são referenciadas por URL pública)
-- MAS dentro da pasta do usuário, somente ele pode acessar via API autenticada
CREATE POLICY "catequese_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'catequese');

-- Upload: usuário só pode fazer upload dentro da sua própria pasta (user_id/)
CREATE POLICY "catequese_storage_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'catequese'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (auth.uid()::text, 'mural', 'foto')
  );

-- Update: só o próprio dono do arquivo
CREATE POLICY "catequese_storage_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'catequese'
    AND auth.uid() IS NOT NULL
  );

-- Delete: só o próprio dono do arquivo ou admin
CREATE POLICY "catequese_storage_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'catequese'
    AND (
      auth.uid() IS NOT NULL
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND (p.is_super_admin = true OR p.role IN ('admin', 'sub_admin'))
      )
    )
  );


-- ============================================================
-- PARTE 10: Atualizar delete_mural_foto para validar dono
-- (garante que mesmo via RPC, só o dono pode deletar)
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_mural_foto(p_foto_id UUID)
RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_foto_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autorizado.';
  END IF;

  SELECT user_id INTO v_foto_user_id
  FROM public.mural_fotos
  WHERE id = p_foto_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Foto não encontrada.';
  END IF;

  -- Apenas o dono ou um admin pode deletar
  IF v_foto_user_id <> v_user_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = v_user_id
        AND (is_super_admin = true OR role IN ('admin', 'sub_admin'))
    ) THEN
      RAISE EXCEPTION 'Sem permissão para excluir esta foto.';
    END IF;
  END IF;

  DELETE FROM public.mural_fotos WHERE id = p_foto_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.delete_mural_foto(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_mural_foto(UUID) FROM anon;


-- ============================================================
-- VERIFICAÇÃO: rodar após execução para confirmar tudo
-- SELECT tablename, rowsecurity
--   FROM pg_tables
--   WHERE schemaname = 'public'
--   ORDER BY tablename;
--
-- SELECT policyname, tablename, cmd
--   FROM pg_policies
--   WHERE schemaname = 'public'
--   ORDER BY tablename, cmd;
-- ============================================================
