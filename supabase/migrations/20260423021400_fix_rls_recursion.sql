-- 1. Create helper functions with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.check_is_turma_owner(t_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.turmas
    WHERE id = t_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.check_is_turma_member(t_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.turma_membros
    WHERE turma_id = t_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Update turma_membros policies
DROP POLICY IF EXISTS "owner_can_remove_membros" ON public.turma_membros;
CREATE POLICY "owner_can_remove_membros" ON public.turma_membros
FOR DELETE TO public
USING (check_is_turma_owner(turma_id));

-- 3. Update turmas policies
DROP POLICY IF EXISTS "turmas_shared_select" ON public.turmas;
CREATE POLICY "turmas_shared_select" ON public.turmas
FOR SELECT TO public
USING (check_is_turma_member(id));

-- 4. Update other tables that depend on membership/ownership
DROP POLICY IF EXISTS "shared_turma_members_all_catequizandos" ON public.catequizandos;
CREATE POLICY "shared_turma_members_all_catequizandos" ON public.catequizandos
FOR ALL TO public
USING (check_is_turma_owner(turma_id) OR check_is_turma_member(turma_id));

DROP POLICY IF EXISTS "shared_turma_members_all_encontros" ON public.encontros;
CREATE POLICY "shared_turma_members_all_encontros" ON public.encontros
FOR ALL TO public
USING (check_is_turma_owner(turma_id) OR check_is_turma_member(turma_id));

DROP POLICY IF EXISTS "shared_turma_members_all_atividades" ON public.atividades;
CREATE POLICY "shared_turma_members_all_atividades" ON public.atividades
FOR ALL TO public
USING (check_is_turma_owner(turma_id) OR check_is_turma_member(turma_id));

DROP POLICY IF EXISTS "shared_turma_members_all_ocorrencias" ON public.ocorrencias;
CREATE POLICY "shared_turma_members_all_ocorrencias" ON public.ocorrencias
FOR ALL TO public
USING (check_is_turma_owner(turma_id) OR check_is_turma_member(turma_id));

DROP POLICY IF EXISTS "Catequistas gerenciam missões de suas turmas" ON public.missoes_familia;
CREATE POLICY "Catequistas gerenciam missões de suas turmas" ON public.missoes_familia
FOR ALL TO public
USING (check_is_turma_owner(turma_id) OR check_is_turma_member(turma_id));
