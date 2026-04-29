-- Migration: Add community and catechists to turmas
ALTER TABLE public.turmas ADD COLUMN IF NOT EXISTS comunidade_id UUID REFERENCES public.comunidades(id) ON DELETE SET NULL;

-- Create junction table for catechists
CREATE TABLE IF NOT EXISTS public.turma_catequistas (
  turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE,
  catequista_id UUID REFERENCES public.catequistas(id) ON DELETE CASCADE,
  PRIMARY KEY (turma_id, catequista_id)
);

-- Enable RLS
ALTER TABLE public.turma_catequistas ENABLE ROW LEVEL SECURITY;

-- Policies for junction table
CREATE POLICY "Users manage own turma_catequistas" ON public.turma_catequistas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.turmas
      WHERE id = turma_id AND user_id = auth.uid()
    )
  );
