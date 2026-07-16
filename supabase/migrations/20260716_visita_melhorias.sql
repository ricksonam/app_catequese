-- ============================================================
-- Migracao: Melhorias no Painel de Visitas as Familias
-- Data: 2026-07-16
-- ============================================================

-- 1. Coluna status
ALTER TABLE public.visita_agendamentos
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmada';

-- 2. Coluna motivo do cancelamento
ALTER TABLE public.visita_agendamentos
  ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT;

-- 3. Coluna data reagendada
ALTER TABLE public.visita_agendamentos
  ADD COLUMN IF NOT EXISTS data_reagendada TEXT;

-- 4. Coluna horario reagendado
ALTER TABLE public.visita_agendamentos
  ADD COLUMN IF NOT EXISTS horario_reagendado TEXT;

-- 5. Coluna de validade do link
ALTER TABLE public.visita_familias_config
  ADD COLUMN IF NOT EXISTS data_validade TEXT;

-- 6. Preencher status nos registros existentes
UPDATE public.visita_agendamentos
SET status = 'confirmada'
WHERE status IS NULL;
