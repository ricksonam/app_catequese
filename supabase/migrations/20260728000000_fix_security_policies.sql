-- ============================================================
-- iCatequese: Security Policy Fixes
-- 2026-07-28
-- Corrige políticas RLS e protege endpoints públicos
-- ============================================================

-- ── 1. Fix: comunicacao_forms SELECT policy too open ─────────────────────────
-- A policy anterior usava USING (true) permitindo listar TODOS os formulários
-- de todos os catequistas via API sem autenticação.
DROP POLICY IF EXISTS "Public select comunicacao_forms by access code" ON public.comunicacao_forms;
-- Acesso público a forms agora só acontece via RPCs.
-- Usuários autenticados já têm acesso via "Users manage own comunicacao_forms".


-- ── 2. Fix: comunicacao_respostas - prevenir spam ────────────────────────────
DROP POLICY IF EXISTS "Public insert comunicacao_respostas" ON public.comunicacao_respostas;

-- Nova policy: só permite INSERT se o form_id referenciado existe com codigo_acesso válido
CREATE POLICY "Public insert comunicacao_respostas with validation"
  ON public.comunicacao_respostas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.comunicacao_forms
      WHERE id = form_id
        AND codigo_acesso IS NOT NULL
        AND codigo_acesso != ''
    )
  );


-- ── 3. Índice único: previne respostas duplicadas por telefone ────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_response_per_phone
  ON public.comunicacao_respostas (form_id, telefone)
  WHERE telefone IS NOT NULL AND telefone != '' AND length(trim(telefone)) > 0;


-- ── 4. Segurança das RPCs públicas: fix search_path ──────────────────────────
-- Previne ataques de search_path injection nas funções acessadas sem autenticação
ALTER FUNCTION IF EXISTS public.public_upsert_catequizando(jsonb)
  SET search_path = public, pg_temp;

ALTER FUNCTION IF EXISTS public.get_public_turma(text)
  SET search_path = public, pg_temp;

ALTER FUNCTION IF EXISTS public.toggle_inscricoes_abertas(uuid, boolean)
  SET search_path = public, pg_temp;

ALTER FUNCTION IF EXISTS public.check_catequizando_exists(uuid, text, text)
  SET search_path = public, pg_temp;

ALTER FUNCTION IF EXISTS public.get_public_visita_config(text)
  SET search_path = public, pg_temp;

ALTER FUNCTION IF EXISTS public.public_agendar_visita(jsonb)
  SET search_path = public, pg_temp;

ALTER FUNCTION IF EXISTS public.get_public_plano(uuid)
  SET search_path = public, pg_temp;
