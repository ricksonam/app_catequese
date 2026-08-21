-- ============================================================
-- Migration: Adicionar coluna preferences em push_subscriptions
-- e constraint única por endpoint para suportar upsert
-- ============================================================
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Adicionar coluna preferences (se não existir)
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{
    "birthdays": true,
    "meetings": true,
    "reunioes": true
  }'::jsonb;

-- 2. Adicionar constraint única por endpoint (necessário para upsert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'push_subscriptions_endpoint_unique'
  ) THEN
    ALTER TABLE public.push_subscriptions
      ADD CONSTRAINT push_subscriptions_endpoint_unique UNIQUE (endpoint);
  END IF;
END $$;

-- ============================================================
-- Agendamento com pg_cron (rodar todo dia às 07:00 BRT = 10:00 UTC)
-- Substitua SEU_PROJECT_ID e SEU_SERVICE_ROLE_KEY abaixo
-- ============================================================
-- Habilitar extensão pg_cron (se não estiver ativa):
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- Agendar a função:
-- select cron.schedule(
--   'send-birthday-notifications',
--   '0 10 * * *',
--   $$
--   select net.http_post(
--     url:='https://SEU_PROJECT_ID.supabase.co/functions/v1/send-birthday-notifications',
--     headers:='{"Authorization":"Bearer SEU_SERVICE_ROLE_KEY","Content-Type":"application/json"}'::jsonb,
--     body:='{}'::jsonb
--   ) as request_id;
--   $$
-- );

-- Para verificar os jobs agendados:
-- SELECT * FROM cron.job;

-- Para remover o agendamento se necessário:
-- SELECT cron.unschedule('send-birthday-notifications');
