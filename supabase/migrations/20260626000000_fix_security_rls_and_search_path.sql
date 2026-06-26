-- ============================================================
-- MIGRATION: Correções de segurança detectadas pelo Supabase
-- Data: 2026-06-26
-- Alerta: rls_disabled_in_public + function_search_path_mutable
--         + anon_security_definer_function_executable
-- ============================================================

-- ============================================================
-- 1. HABILITAR RLS NA webhook_logs (resolve o email de alerta crítico)
-- ============================================================
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Apenas o service_role (backend) pode acessar webhook_logs
-- Usuários normais não têm acesso de nenhum tipo
CREATE POLICY "Apenas service_role acessa webhook_logs"
  ON public.webhook_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 2. REVOGAR EXECUTE DE ANON EM FUNÇÕES INTERNAS
--    (funções que não devem ser chamadas sem autenticação)
-- ============================================================

-- Funções que são triggers (não devem ser chamadas via API REST)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_user_login() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_error_webhook() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_on_response() FROM anon;
REVOKE EXECUTE ON FUNCTION public.limpar_error_logs_antigos() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_public_catequizando_insert() FROM anon;

-- Funções que exigem autenticação para funcionar corretamente
REVOKE EXECUTE ON FUNCTION public.check_is_super_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_is_user_blocked() FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_is_turma_member(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_is_turma_owner(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.approve_turma_membro(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_turma_audit_log(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_turma_membros(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_shared_catequistas() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_shared_paroquias() FROM anon;
REVOKE EXECUTE ON FUNCTION public.join_turma_by_code(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.insert_audit_log(uuid, text, text, uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.insert_audit_log(uuid, uuid, text, text, uuid, text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_mural_foto(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.confirmar_exclusao_usuario() FROM anon;
REVOKE EXECUTE ON FUNCTION public.transferir_dados_usuario(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_catequizando_exists(uuid, text, text) FROM anon;

-- ============================================================
-- 3. CORRIGIR search_path DAS FUNÇÕES
--    (previne ataque via schema search_path mutable)
-- ============================================================
ALTER FUNCTION public.generate_parish_code() SET search_path = public;
ALTER FUNCTION public.get_public_plano(text) SET search_path = public;
ALTER FUNCTION public.confirmar_exclusao_usuario() SET search_path = public;
ALTER FUNCTION public.limpar_error_logs_antigos() SET search_path = public;
ALTER FUNCTION public.notify_error_webhook() SET search_path = public;
ALTER FUNCTION public.incrementar_missao_concluida(text) SET search_path = public;
ALTER FUNCTION public.get_public_missao(text) SET search_path = public;
ALTER FUNCTION public.handle_public_catequizando_insert() SET search_path = public;
ALTER FUNCTION public.register_event_participation(uuid, text, text, jsonb, integer) SET search_path = public;
ALTER FUNCTION public.notify_on_response() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.handle_user_login() SET search_path = public;
ALTER FUNCTION public.transferir_dados_usuario(text, text) SET search_path = public;
ALTER FUNCTION public.public_upsert_catequizando(jsonb) SET search_path = public;
