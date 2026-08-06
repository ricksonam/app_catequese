-- Adiciona políticas para que admins e sub-admins possam ler dados de outros usuários
-- Isso é necessário para o Painel Inteligente no AdminDashboard carregar as informações.

-- Turmas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'turmas' AND policyname = 'turmas_admin_select') THEN
    CREATE POLICY "turmas_admin_select" ON public.turmas
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND (p.is_super_admin = true OR p.role IN ('admin', 'sub_admin'))
        )
      );
  END IF;
END $$;

-- Catequizandos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'catequizandos' AND policyname = 'catequizandos_admin_select') THEN
    CREATE POLICY "catequizandos_admin_select" ON public.catequizandos
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND (p.is_super_admin = true OR p.role IN ('admin', 'sub_admin'))
        )
      );
  END IF;
END $$;

-- Catequistas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'catequistas' AND policyname = 'catequistas_admin_select') THEN
    CREATE POLICY "catequistas_admin_select" ON public.catequistas
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND (p.is_super_admin = true OR p.role IN ('admin', 'sub_admin'))
        )
      );
  END IF;
END $$;

-- Turma Catequistas (junction table)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'turma_catequistas' AND policyname = 'turma_catequistas_admin_select') THEN
    CREATE POLICY "turma_catequistas_admin_select" ON public.turma_catequistas
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
            AND (p.is_super_admin = true OR p.role IN ('admin', 'sub_admin'))
        )
      );
  END IF;
END $$;
