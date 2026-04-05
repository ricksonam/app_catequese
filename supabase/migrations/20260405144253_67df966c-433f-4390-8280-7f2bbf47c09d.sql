CREATE TABLE public.sorteios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  titulo text NOT NULL DEFAULT '',
  nomes jsonb NOT NULL DEFAULT '[]'::jsonb,
  resultado jsonb NOT NULL DEFAULT '[]'::jsonb,
  criado_em timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sorteios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sorteios" ON public.sorteios
  FOR ALL TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);