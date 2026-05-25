-- Adiciona coluna tipo_registro para diferenciar Encontro, Evento e Evolução
ALTER TABLE public.diario_espiritual
  ADD COLUMN IF NOT EXISTS tipo_registro TEXT NOT NULL DEFAULT 'encontro';

-- Adiciona coluna evento_id para referenciar atividades (eventos)
ALTER TABLE public.diario_espiritual
  ADD COLUMN IF NOT EXISTS evento_id UUID REFERENCES public.atividades(id) ON DELETE SET NULL;
