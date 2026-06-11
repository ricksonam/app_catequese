-- ============================================================
-- Migration: Verificação de super-admin via banco de dados
-- Remove a dependência do e-mail hard-coded no frontend
-- ============================================================

-- Adicionar coluna is_super_admin na tabela profiles (se não existir)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT false;

-- Criar função RPC para verificar se o usuário atual é super admin
-- (SECURITY DEFINER — executa com privilégios do owner da função)
CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_super_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar função RPC para retornar o papel completo do usuário logado
-- O frontend chama essa função em vez de hard-codar o e-mail
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS jsonb AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = auth.uid();
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'role', 'user',
      'is_super_admin', false,
      'is_admin', false,
      'sub_admin_status', null
    );
  END IF;
  RETURN jsonb_build_object(
    'role', COALESCE(v_profile.role, 'user'),
    'is_super_admin', COALESCE(v_profile.is_super_admin, false),
    'is_admin', (COALESCE(v_profile.is_super_admin, false) OR v_profile.role = 'sub_admin'),
    'sub_admin_status', v_profile.sub_admin_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Marcar o super-admin existente na tabela profiles
-- IMPORTANTE: Execute este UPDATE manualmente com o e-mail correto:
-- UPDATE public.profiles SET is_super_admin = true WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'icatequese2026@gmail.com'
-- );
