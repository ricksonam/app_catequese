-- ============================================================
-- iCatequese: Garantir RLS em TODAS as tabelas do schema public
-- 2026-08-04
-- Verifica e ativa RLS + políticas mínimas em cada tabela.
-- Usa IF NOT EXISTS para ser idempotente (seguro rodar mais de uma vez).
-- ============================================================


-- ============================================================
-- 1. PROFILES
-- Criada automaticamente pelo Supabase Auth via trigger.
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Cada usuário lê/edita só o próprio perfil
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_select_own') THEN
    CREATE POLICY "profiles_select_own" ON public.profiles
      FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_update_own') THEN
    CREATE POLICY "profiles_update_own" ON public.profiles
      FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Admins podem ler todos os perfis (necessário para o AdminDashboard)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_admin_select_all') THEN
    CREATE POLICY "profiles_admin_select_all" ON public.profiles
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND (p.is_super_admin = true OR p.role IN ('admin', 'sub_admin'))
        )
      );
  END IF;
END $$;

-- Admins podem atualizar qualquer perfil (bloqueio, premium, etc.)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_admin_update_all') THEN
    CREATE POLICY "profiles_admin_update_all" ON public.profiles
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND (p.is_super_admin = true OR p.role IN ('admin', 'sub_admin'))
        )
      );
  END IF;
END $$;


-- ============================================================
-- 2. TURMAS — já tem RLS, garante que está ativo
-- ============================================================
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'turmas' AND policyname = 'Users manage own turmas') THEN
    CREATE POLICY "Users manage own turmas" ON public.turmas
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ============================================================
-- 3. CATEQUIZANDOS — já tem RLS, confirma
-- ============================================================
ALTER TABLE public.catequizandos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'catequizandos' AND policyname = 'Users manage own catequizandos') THEN
    CREATE POLICY "Users manage own catequizandos" ON public.catequizandos
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ============================================================
-- 4. ENCONTROS — já tem RLS
-- ============================================================
ALTER TABLE public.encontros ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'encontros' AND policyname = 'Users manage own encontros') THEN
    CREATE POLICY "Users manage own encontros" ON public.encontros
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ============================================================
-- 5. ATIVIDADES — já tem RLS
-- ============================================================
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'atividades' AND policyname = 'Users manage own atividades') THEN
    CREATE POLICY "Users manage own atividades" ON public.atividades
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ============================================================
-- 6. PAROQUIAS — já tem RLS
-- ============================================================
ALTER TABLE public.paroquias ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paroquias' AND policyname = 'Users manage own paroquias') THEN
    CREATE POLICY "Users manage own paroquias" ON public.paroquias
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Admin pode ler paróquias para o dashboard
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paroquias' AND policyname = 'paroquias_admin_select') THEN
    CREATE POLICY "paroquias_admin_select" ON public.paroquias
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND (p.is_super_admin = true OR p.role IN ('admin', 'sub_admin'))
        )
      );
  END IF;
END $$;


-- ============================================================
-- 7. COMUNIDADES — já tem RLS
-- ============================================================
ALTER TABLE public.comunidades ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comunidades' AND policyname = 'Users manage own comunidades') THEN
    CREATE POLICY "Users manage own comunidades" ON public.comunidades
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ============================================================
-- 8. CATEQUISTAS — já tem RLS
-- ============================================================
ALTER TABLE public.catequistas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'catequistas' AND policyname = 'Users manage own catequistas') THEN
    CREATE POLICY "Users manage own catequistas" ON public.catequistas
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ============================================================
-- 9. OCORRENCIAS — já tem RLS
-- ============================================================
ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ocorrencias' AND policyname = 'Users manage own ocorrencias') THEN
    CREATE POLICY "Users manage own ocorrencias" ON public.ocorrencias
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ============================================================
-- 10. SORTEIOS — já tem RLS
-- ============================================================
ALTER TABLE public.sorteios ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sorteios' AND policyname = 'Users manage own sorteios') THEN
    CREATE POLICY "Users manage own sorteios" ON public.sorteios
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ============================================================
-- 11. TURMA_CATEQUISTAS (junction) — já tem RLS
-- ============================================================
ALTER TABLE public.turma_catequistas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'turma_catequistas' AND policyname = 'Users manage own turma_catequistas') THEN
    CREATE POLICY "Users manage own turma_catequistas" ON public.turma_catequistas
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.turmas
          WHERE id = turma_id AND user_id = auth.uid()
        )
      );
  END IF;
END $$;


-- ============================================================
-- 12. TURMA_MEMBROS — verificar e garantir RLS
-- ============================================================
ALTER TABLE public.turma_membros ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'turma_membros' AND policyname = 'turma_membros_owner_select') THEN
    CREATE POLICY "turma_membros_owner_select" ON public.turma_membros
      FOR SELECT USING (
        auth.uid() = user_id OR check_is_turma_owner(turma_id)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'turma_membros' AND policyname = 'turma_membros_insert_own') THEN
    CREATE POLICY "turma_membros_insert_own" ON public.turma_membros
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ============================================================
-- 13. COMUNICACAO_FORMS — já tem RLS
-- ============================================================
ALTER TABLE public.comunicacao_forms ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comunicacao_forms' AND policyname = 'Users manage own comunicacao_forms') THEN
    CREATE POLICY "Users manage own comunicacao_forms" ON public.comunicacao_forms
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ============================================================
-- 14. COMUNICACAO_RESPOSTAS — já tem RLS
-- ============================================================
ALTER TABLE public.comunicacao_respostas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comunicacao_respostas' AND policyname = 'Users manage own comunicacao_respostas') THEN
    CREATE POLICY "Users manage own comunicacao_respostas" ON public.comunicacao_respostas
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.comunicacao_forms
          WHERE id = form_id AND user_id = auth.uid()
        )
      );
  END IF;
END $$;


-- ============================================================
-- 15. DIARIO_ESPIRITUAL — já tem RLS
-- ============================================================
ALTER TABLE public.diario_espiritual ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'diario_espiritual' AND policyname = 'Users manage own diario_espiritual') THEN
    CREATE POLICY "Users manage own diario_espiritual" ON public.diario_espiritual
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ============================================================
-- 16. ERROR_LOGS — já tem RLS (20260611000000)
-- ============================================================
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'error_logs' AND policyname = 'Qualquer um pode registrar erro') THEN
    CREATE POLICY "Qualquer um pode registrar erro" ON public.error_logs
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'error_logs' AND policyname = 'Apenas admin pode ler error_logs') THEN
    CREATE POLICY "Apenas admin pode ler error_logs" ON public.error_logs
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'sub_admin')
        )
      );
  END IF;
END $$;


-- ============================================================
-- 17. PAYMENT_ORDERS — já tem RLS (20260614000000)
-- ============================================================
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_orders' AND policyname = 'Users view own orders') THEN
    CREATE POLICY "Users view own orders" ON public.payment_orders
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_orders' AND policyname = 'Users insert own orders') THEN
    CREATE POLICY "Users insert own orders" ON public.payment_orders
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Admin pode ver todos os pedidos (para o painel financeiro)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_orders' AND policyname = 'payment_orders_admin_select') THEN
    CREATE POLICY "payment_orders_admin_select" ON public.payment_orders
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND (p.is_super_admin = true OR p.role IN ('admin', 'sub_admin'))
        )
      );
  END IF;
END $$;


-- ============================================================
-- 18. WEBHOOK_LOGS — já tem RLS (20260626000000)
-- ============================================================
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'webhook_logs' AND policyname = 'Apenas service_role acessa webhook_logs') THEN
    CREATE POLICY "Apenas service_role acessa webhook_logs" ON public.webhook_logs
      FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;
END $$;


-- ============================================================
-- 19. MISSOES_FAMILIA
-- ============================================================
ALTER TABLE public.missoes_familia ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'missoes_familia' AND policyname = 'membros_podem_ler_missoes') THEN
    CREATE POLICY "membros_podem_ler_missoes" ON public.missoes_familia
      FOR SELECT USING (
        check_is_turma_owner(turma_id) OR check_is_turma_member(turma_id)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'missoes_familia' AND policyname = 'donos_escrevem_missoes') THEN
    CREATE POLICY "donos_escrevem_missoes" ON public.missoes_familia
      FOR INSERT WITH CHECK (check_is_turma_owner(turma_id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'missoes_familia' AND policyname = 'donos_atualizam_missoes') THEN
    CREATE POLICY "donos_atualizam_missoes" ON public.missoes_familia
      FOR UPDATE USING (check_is_turma_owner(turma_id))
      WITH CHECK (check_is_turma_owner(turma_id));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'missoes_familia' AND policyname = 'donos_deletam_missoes') THEN
    CREATE POLICY "donos_deletam_missoes" ON public.missoes_familia
      FOR DELETE USING (check_is_turma_owner(turma_id));
  END IF;
END $$;


-- ============================================================
-- 20. SUGESTOES
-- ============================================================
ALTER TABLE public.sugestoes ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode inserir sugestão
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sugestoes' AND policyname = 'sugestoes_insert_authenticated') THEN
    CREATE POLICY "sugestoes_insert_authenticated" ON public.sugestoes
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Usuário vê apenas as próprias sugestões
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sugestoes' AND policyname = 'sugestoes_select_own') THEN
    CREATE POLICY "sugestoes_select_own" ON public.sugestoes
      FOR SELECT USING (auth.uid() = usuario_id);
  END IF;
END $$;

-- Admin pode ver e deletar todas as sugestões
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sugestoes' AND policyname = 'sugestoes_admin_all') THEN
    CREATE POLICY "sugestoes_admin_all" ON public.sugestoes
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND (p.is_super_admin = true OR p.role IN ('admin', 'sub_admin'))
        )
      );
  END IF;
END $$;


-- ============================================================
-- 21. ATENDIMENTOS
-- ============================================================
ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;

-- Usuário envia e vê os próprios atendimentos
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'atendimentos' AND policyname = 'atendimentos_select_own') THEN
    CREATE POLICY "atendimentos_select_own" ON public.atendimentos
      FOR SELECT USING (auth.uid() = usuario_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'atendimentos' AND policyname = 'atendimentos_insert_authenticated') THEN
    CREATE POLICY "atendimentos_insert_authenticated" ON public.atendimentos
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Admin vê e atualiza todos os atendimentos
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'atendimentos' AND policyname = 'atendimentos_admin_all') THEN
    CREATE POLICY "atendimentos_admin_all" ON public.atendimentos
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND (p.is_super_admin = true OR p.role IN ('admin', 'sub_admin'))
        )
      );
  END IF;
END $$;


-- ============================================================
-- 22. MATERIAL_APOIO (loja/catálogo)
-- ============================================================
ALTER TABLE public.material_apoio ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ler materiais ativos (loja pública)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'material_apoio' AND policyname = 'material_apoio_public_select') THEN
    CREATE POLICY "material_apoio_public_select" ON public.material_apoio
      FOR SELECT USING (ativo = true);
  END IF;
END $$;

-- Admin gerencia todos os materiais
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'material_apoio' AND policyname = 'material_apoio_admin_all') THEN
    CREATE POLICY "material_apoio_admin_all" ON public.material_apoio
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND (p.is_super_admin = true OR p.role IN ('admin', 'sub_admin'))
        )
      );
  END IF;
END $$;


-- ============================================================
-- 23. VISITA_FAMILIAS_CONFIG — já tem RLS (20260716000000)
-- ============================================================
ALTER TABLE public.visita_familias_config ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'visita_familias_config' AND policyname = 'Users manage own visita_config') THEN
    CREATE POLICY "Users manage own visita_config" ON public.visita_familias_config
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ============================================================
-- 24. VISITA_AGENDAMENTOS — já tem RLS (20260716000000)
-- ============================================================
ALTER TABLE public.visita_agendamentos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'visita_agendamentos' AND policyname = 'Users manage own visita_agendamentos') THEN
    CREATE POLICY "Users manage own visita_agendamentos" ON public.visita_agendamentos
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ============================================================
-- 25. APP_SETTINGS — já tem RLS (20260804000000)
-- ============================================================
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_settings' AND policyname = 'app_settings_public_read') THEN
    CREATE POLICY "app_settings_public_read" ON public.app_settings
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_settings' AND policyname = 'app_settings_admin_write') THEN
    CREATE POLICY "app_settings_admin_write" ON public.app_settings
      FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
END $$;


-- ============================================================
-- VERIFICAÇÃO FINAL
-- Execute esta query para confirmar o status de RLS:
-- SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname = 'public'
--   ORDER BY tablename;
-- ============================================================
