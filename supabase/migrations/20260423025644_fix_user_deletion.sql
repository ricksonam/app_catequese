-- Fix User Deletion Logic
-- This migration updates the confirmar_exclusao_usuario function to actually delete
-- the user's data from public tables and their account from auth.users.

CREATE OR REPLACE FUNCTION public.confirmar_exclusao_usuario()
RETURNS void AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autorizado: Nenhum usuário autenticado encontrado.';
  END IF;

  -- 1. Deletar explicitamente de todas as tabelas com user_id para garantir limpeza total
  DELETE FROM public.turma_membros WHERE user_id = v_user_id;
  DELETE FROM public.mural_fotos WHERE user_id = v_user_id;
  DELETE FROM public.calendario_notas WHERE user_id = v_user_id;
  DELETE FROM public.push_subscriptions WHERE user_id = v_user_id;
  DELETE FROM public.ocorrencias WHERE user_id = v_user_id;
  DELETE FROM public.sorteios WHERE user_id = v_user_id;
  DELETE FROM public.atividades WHERE user_id = v_user_id;
  DELETE FROM public.encontros WHERE user_id = v_user_id;
  DELETE FROM public.catequizandos WHERE user_id = v_user_id;
  DELETE FROM public.comunicacao_forms WHERE user_id = v_user_id;
  DELETE FROM public.error_logs WHERE user_id = v_user_id;
  
  -- Deletar turmas do usuário
  DELETE FROM public.turmas WHERE user_id = v_user_id;
  
  -- Deletar cadastros base
  DELETE FROM public.catequistas WHERE user_id = v_user_id;
  DELETE FROM public.comunidades WHERE user_id = v_user_id;
  DELETE FROM public.paroquias WHERE user_id = v_user_id;

  -- 2. Deletar da tabela de auth do Supabase
  DELETE FROM auth.users WHERE id = v_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
