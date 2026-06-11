-- ============================================================
-- Migration: Corrigir políticas RLS com WITH CHECK
-- Problema: membros de turmas compartilhadas podiam fazer
-- INSERT/UPDATE/DELETE em dados de outras turmas.
-- Solução: separar SELECT (membros) de INSERT/UPDATE/DELETE (só donos)
-- ============================================================

-- ===== CATEQUIZANDOS =====
DROP POLICY IF EXISTS "shared_turma_members_all_catequizandos" ON public.catequizandos;

CREATE POLICY "membros_podem_ler_catequizandos" ON public.catequizandos
  FOR SELECT USING (
    check_is_turma_owner(turma_id) OR check_is_turma_member(turma_id)
  );

CREATE POLICY "donos_escrevem_catequizandos" ON public.catequizandos
  FOR INSERT WITH CHECK (check_is_turma_owner(turma_id));

CREATE POLICY "donos_atualizam_catequizandos" ON public.catequizandos
  FOR UPDATE USING (check_is_turma_owner(turma_id))
  WITH CHECK (check_is_turma_owner(turma_id));

CREATE POLICY "donos_deletam_catequizandos" ON public.catequizandos
  FOR DELETE USING (check_is_turma_owner(turma_id));

-- ===== ENCONTROS =====
DROP POLICY IF EXISTS "shared_turma_members_all_encontros" ON public.encontros;

CREATE POLICY "membros_podem_ler_encontros" ON public.encontros
  FOR SELECT USING (
    check_is_turma_owner(turma_id) OR check_is_turma_member(turma_id)
  );

CREATE POLICY "donos_escrevem_encontros" ON public.encontros
  FOR INSERT WITH CHECK (check_is_turma_owner(turma_id));

CREATE POLICY "donos_atualizam_encontros" ON public.encontros
  FOR UPDATE USING (check_is_turma_owner(turma_id))
  WITH CHECK (check_is_turma_owner(turma_id));

CREATE POLICY "donos_deletam_encontros" ON public.encontros
  FOR DELETE USING (check_is_turma_owner(turma_id));

-- ===== ATIVIDADES =====
DROP POLICY IF EXISTS "shared_turma_members_all_atividades" ON public.atividades;

CREATE POLICY "membros_podem_ler_atividades" ON public.atividades
  FOR SELECT USING (
    check_is_turma_owner(turma_id) OR check_is_turma_member(turma_id)
  );

CREATE POLICY "donos_escrevem_atividades" ON public.atividades
  FOR INSERT WITH CHECK (check_is_turma_owner(turma_id));

CREATE POLICY "donos_atualizam_atividades" ON public.atividades
  FOR UPDATE USING (check_is_turma_owner(turma_id))
  WITH CHECK (check_is_turma_owner(turma_id));

CREATE POLICY "donos_deletam_atividades" ON public.atividades
  FOR DELETE USING (check_is_turma_owner(turma_id));

-- ===== OCORRENCIAS =====
DROP POLICY IF EXISTS "shared_turma_members_all_ocorrencias" ON public.ocorrencias;

CREATE POLICY "membros_podem_ler_ocorrencias" ON public.ocorrencias
  FOR SELECT USING (
    check_is_turma_owner(turma_id) OR check_is_turma_member(turma_id)
  );

CREATE POLICY "donos_escrevem_ocorrencias" ON public.ocorrencias
  FOR INSERT WITH CHECK (check_is_turma_owner(turma_id));

CREATE POLICY "donos_deletam_ocorrencias" ON public.ocorrencias
  FOR DELETE USING (check_is_turma_owner(turma_id));

-- ===== MISSOES FAMILIA =====
DROP POLICY IF EXISTS "Catequistas gerenciam missões de suas turmas" ON public.missoes_familia;

CREATE POLICY "membros_podem_ler_missoes" ON public.missoes_familia
  FOR SELECT USING (
    check_is_turma_owner(turma_id) OR check_is_turma_member(turma_id)
  );

CREATE POLICY "donos_escrevem_missoes" ON public.missoes_familia
  FOR INSERT WITH CHECK (check_is_turma_owner(turma_id));

CREATE POLICY "donos_atualizam_missoes" ON public.missoes_familia
  FOR UPDATE USING (check_is_turma_owner(turma_id))
  WITH CHECK (check_is_turma_owner(turma_id));

CREATE POLICY "donos_deletam_missoes" ON public.missoes_familia
  FOR DELETE USING (check_is_turma_owner(turma_id));
