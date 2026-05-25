CREATE TABLE IF NOT EXISTS public.diario_espiritual (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE NOT NULL,
  encontro_id UUID REFERENCES public.encontros(id) ON DELETE SET NULL,
  data_registro TEXT NOT NULL DEFAULT '',
  como_foi TEXT NOT NULL DEFAULT '',
  pontos_positivos TEXT NOT NULL DEFAULT '',
  pontos_negativos TEXT NOT NULL DEFAULT '',
  observacoes_catequizandos TEXT NOT NULL DEFAULT '',
  evolucao_espiritual TEXT NOT NULL DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.diario_espiritual ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own diario_espiritual" ON public.diario_espiritual FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
