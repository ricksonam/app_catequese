-- Adiciona campos de referência à tabela mural_fotos
-- Permite associar uma foto a um encontro, atividade ou evento

ALTER TABLE public.mural_fotos
  ADD COLUMN IF NOT EXISTS referencia_id text,
  ADD COLUMN IF NOT EXISTS referencia_tipo text CHECK (referencia_tipo IN ('encontro', 'atividade', 'evento')),
  ADD COLUMN IF NOT EXISTS referencia_nome text;

COMMENT ON COLUMN public.mural_fotos.referencia_id IS 'ID do encontro, atividade ou evento associado à foto';
COMMENT ON COLUMN public.mural_fotos.referencia_tipo IS 'Tipo da referência: encontro, atividade ou evento';
COMMENT ON COLUMN public.mural_fotos.referencia_nome IS 'Nome/tema do encontro ou atividade para exibição (cache)';
