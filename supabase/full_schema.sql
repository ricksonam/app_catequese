-- Consolidated Schema for Catechesis Flow

-- 1. Turmas
CREATE TABLE IF NOT EXISTS public.turmas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  nome TEXT NOT NULL,
  ano TEXT NOT NULL DEFAULT '',
  dia_catequese TEXT NOT NULL DEFAULT '',
  horario TEXT NOT NULL DEFAULT '',
  local TEXT NOT NULL DEFAULT '',
  etapa TEXT NOT NULL DEFAULT 'pre-catecumenato',
  outros_dados TEXT NOT NULL DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  comunidade_id UUID -- Added later via migration
);
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own turmas" ON public.turmas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Catequizandos
CREATE TABLE IF NOT EXISTS public.catequizandos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  data_nascimento TEXT NOT NULL DEFAULT '',
  responsavel TEXT NOT NULL DEFAULT '',
  telefone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  endereco TEXT NOT NULL DEFAULT '',
  necessidade_especial TEXT NOT NULL DEFAULT '',
  observacao TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'ativo',
  foto TEXT,
  sacramentos JSONB DEFAULT '{"batismo":{"recebido":false,"paroquia":"","data":""},"eucaristia":{"recebido":false,"paroquia":"","data":""},"crisma":{"recebido":false,"paroquia":"","data":""}}',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.catequizandos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own catequizandos" ON public.catequizandos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Encontros
CREATE TABLE IF NOT EXISTS public.encontros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE NOT NULL,
  tema TEXT NOT NULL,
  data TEXT NOT NULL DEFAULT '',
  leitura_biblica TEXT NOT NULL DEFAULT '',
  material_apoio TEXT NOT NULL DEFAULT '',
  roteiro JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pendente',
  presencas JSONB NOT NULL DEFAULT '[]',
  motivo_cancelamento TEXT,
  data_transferida TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.encontros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own encontros" ON public.encontros FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Atividades
CREATE TABLE IF NOT EXISTS public.atividades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  tipo TEXT NOT NULL DEFAULT 'Outros',
  modalidade TEXT NOT NULL DEFAULT 'interna',
  conducao TEXT,
  data TEXT NOT NULL DEFAULT '',
  local TEXT NOT NULL DEFAULT '',
  horario TEXT NOT NULL DEFAULT '',
  observacao TEXT NOT NULL DEFAULT '',
  presencas JSONB NOT NULL DEFAULT '[]',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own atividades" ON public.atividades FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Paroquias
CREATE TABLE IF NOT EXISTS public.paroquias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Paróquia',
  endereco TEXT NOT NULL DEFAULT '',
  telefone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  responsavel TEXT NOT NULL DEFAULT '',
  observacao TEXT NOT NULL DEFAULT ''
);
ALTER TABLE public.paroquias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own paroquias" ON public.paroquias FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. Comunidades
CREATE TABLE IF NOT EXISTS public.comunidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Comunidade',
  paroquia_id UUID REFERENCES public.paroquias(id) ON DELETE SET NULL,
  endereco TEXT NOT NULL DEFAULT '',
  responsavel TEXT NOT NULL DEFAULT '',
  telefone TEXT NOT NULL DEFAULT '',
  observacao TEXT NOT NULL DEFAULT ''
);
ALTER TABLE public.comunidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own comunidades" ON public.comunidades FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. Catequistas
CREATE TABLE IF NOT EXISTS public.catequistas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  nome TEXT NOT NULL,
  data_nascimento TEXT NOT NULL DEFAULT '',
  endereco TEXT NOT NULL DEFAULT '',
  profissao TEXT NOT NULL DEFAULT '',
  telefone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  comunidade_id UUID REFERENCES public.comunidades(id) ON DELETE SET NULL,
  formacao TEXT NOT NULL DEFAULT '',
  anos_experiencia TEXT NOT NULL DEFAULT '',
  observacao TEXT NOT NULL DEFAULT ''
);
ALTER TABLE public.catequistas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own catequistas" ON public.catequistas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. Ocorrencias
CREATE TABLE IF NOT EXISTS public.ocorrencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  encontro_id UUID REFERENCES public.encontros(id) ON DELETE CASCADE NOT NULL,
  turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'cancelamento',
  motivo TEXT NOT NULL DEFAULT '',
  data TEXT NOT NULL DEFAULT '',
  tema_nome TEXT NOT NULL DEFAULT ''
);
ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ocorrencias" ON public.ocorrencias FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 9. Sorteios
CREATE TABLE IF NOT EXISTS public.sorteios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  titulo text NOT NULL DEFAULT '',
  nomes jsonb NOT NULL DEFAULT '[]'::jsonb,
  resultado jsonb NOT NULL DEFAULT '[]'::jsonb,
  criado_em timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.sorteios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sorteios" ON public.sorteios FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 10. Relationships Updates (from latest migrations)

-- Add community_id to turmas if not exists
ALTER TABLE public.turmas ADD COLUMN IF NOT EXISTS comunidade_id UUID REFERENCES public.comunidades(id) ON DELETE SET NULL;

-- Create junction table for catechists
CREATE TABLE IF NOT EXISTS public.turma_catequistas (
  turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE,
  catequista_id UUID REFERENCES public.catequistas(id) ON DELETE CASCADE,
  PRIMARY KEY (turma_id, catequista_id)
);

-- Enable RLS for junction table
ALTER TABLE public.turma_catequistas ENABLE ROW LEVEL SECURITY;

-- Policies for junction table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own turma_catequistas') THEN
        CREATE POLICY "Users manage own turma_catequistas" ON public.turma_catequistas
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM public.turmas
              WHERE id = turma_id AND user_id = auth.uid()
            )
          );
    END IF;
END $$;

-- 11. Comunicação (Pesquisas, Questionários, Avaliações)
CREATE TABLE IF NOT EXISTS public.comunicacao_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  tipo TEXT NOT NULL DEFAULT 'pesquisa', -- 'pesquisa', 'questionario', 'avaliacao'
  codigo_acesso TEXT NOT NULL UNIQUE,
  campos JSONB NOT NULL DEFAULT '[]', -- Array of form fields
  configuracoes JSONB NOT NULL DEFAULT '{}',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comunicacao_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own comunicacao_forms" ON public.comunicacao_forms FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Allow public select by access code
CREATE POLICY "Public select comunicacao_forms by access code" ON public.comunicacao_forms FOR SELECT USING (true);


CREATE TABLE IF NOT EXISTS public.comunicacao_respostas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID REFERENCES public.comunicacao_forms(id) ON DELETE CASCADE NOT NULL,
  nome_respondente TEXT NOT NULL DEFAULT 'Anônimo',
  telefone TEXT,
  respostas JSONB NOT NULL DEFAULT '{}',
  pontuacao INTEGER,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comunicacao_respostas ENABLE ROW LEVEL SECURITY;
-- Owners can read/delete responses for their forms
CREATE POLICY "Users manage own comunicacao_respostas" ON public.comunicacao_respostas 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.comunicacao_forms
      WHERE id = form_id AND user_id = auth.uid()
    )
  );
-- Anyone can insert a response
CREATE POLICY "Public insert comunicacao_respostas" ON public.comunicacao_respostas FOR INSERT WITH CHECK (true);
