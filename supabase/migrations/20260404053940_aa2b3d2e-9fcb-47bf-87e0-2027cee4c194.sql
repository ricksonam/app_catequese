
-- Turmas
CREATE TABLE public.turmas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  nome TEXT NOT NULL,
  ano TEXT NOT NULL DEFAULT '',
  dia_catequese TEXT NOT NULL DEFAULT '',
  horario TEXT NOT NULL DEFAULT '',
  local TEXT NOT NULL DEFAULT '',
  etapa TEXT NOT NULL DEFAULT 'pre-catecumenato',
  outros_dados TEXT NOT NULL DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own turmas" ON public.turmas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Catequizandos
CREATE TABLE public.catequizandos (
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

-- Encontros
CREATE TABLE public.encontros (
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

-- Atividades
CREATE TABLE public.atividades (
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

-- Paroquias
CREATE TABLE public.paroquias (
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

-- Comunidades
CREATE TABLE public.comunidades (
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

-- Catequistas
CREATE TABLE public.catequistas (
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

-- Ocorrencias
CREATE TABLE public.ocorrencias (
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
