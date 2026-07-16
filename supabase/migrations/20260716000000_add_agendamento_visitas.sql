-- =====================================================
-- Agendamento de Visitas às Famílias
-- =====================================================
-- 1. Criação da tabela visita_familias_config
-- 2. Criação da tabela visita_agendamentos
-- 3. Funções RPC públicas para acesso sem login
-- =====================================================

-- 1. Tabela de configuração (1 por turma)
CREATE TABLE public.visita_familias_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  ativo BOOLEAN NOT NULL DEFAULT true,
  titulo TEXT NOT NULL DEFAULT 'Agendamento de Visita',
  tema TEXT NOT NULL DEFAULT '',
  dias_horarios JSONB NOT NULL DEFAULT '[]', -- Ex: [{"data": "2026-08-10", "horarios": ["14:00", "15:00"]}]
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.visita_familias_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own visita_config" ON public.visita_familias_config 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Tabela de agendamentos
CREATE TABLE public.visita_agendamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE NOT NULL,
  config_id UUID REFERENCES public.visita_familias_config(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Catequista dono (para facilitar RLS)
  data_visita TEXT NOT NULL,
  horario_visita TEXT NOT NULL,
  nome_responsavel TEXT NOT NULL,
  nome_crianca TEXT NOT NULL,
  telefone TEXT NOT NULL,
  observacao TEXT NOT NULL DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garantir que não existam dois agendamentos no mesmo horário da mesma turma
ALTER TABLE public.visita_agendamentos ADD CONSTRAINT unique_slot_per_turma UNIQUE (turma_id, data_visita, horario_visita);

ALTER TABLE public.visita_agendamentos ENABLE ROW LEVEL SECURITY;
-- Catequista vê/deleta os agendamentos das suas turmas
CREATE POLICY "Users manage own visita_agendamentos" ON public.visita_agendamentos 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Funções RPC Públicas

-- 3.1 Pegar dados do painel público
CREATE OR REPLACE FUNCTION public.get_public_visita_config(p_token TEXT)
RETURNS JSONB AS $$
DECLARE
  v_config JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', c.id,
    'turma_id', c.turma_id,
    'titulo', c.titulo,
    'tema', c.tema,
    'dias_horarios', c.dias_horarios,
    'ativo', c.ativo,
    'turma_nome', t.nome,
    'agendamentos_ocupados', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('data', a.data_visita, 'horario', a.horario_visita)), '[]'::jsonb)
      FROM public.visita_agendamentos a
      WHERE a.config_id = c.id
    )
  )
  INTO v_config
  FROM public.visita_familias_config c
  JOIN public.turmas t ON c.turma_id = t.id
  WHERE c.token = p_token
  LIMIT 1;
  
  RETURN v_config;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_public_visita_config(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_visita_config(TEXT) TO authenticated;

-- 3.2 Fazer o agendamento público
CREATE OR REPLACE FUNCTION public.public_agendar_visita(p_payload JSONB)
RETURNS JSONB AS $$
DECLARE
  v_config_id UUID;
  v_turma_id UUID;
  v_user_id UUID;
  v_ativo BOOLEAN;
  v_data TEXT;
  v_horario TEXT;
  v_id UUID;
BEGIN
  v_config_id := (p_payload->>'config_id')::UUID;
  v_data := p_payload->>'data_visita';
  v_horario := p_payload->>'horario_visita';

  -- Validar config
  SELECT turma_id, user_id, ativo INTO v_turma_id, v_user_id, v_ativo
  FROM public.visita_familias_config
  WHERE id = v_config_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Painel de visitas não encontrado.';
  END IF;

  IF NOT v_ativo THEN
    RAISE EXCEPTION 'O agendamento para esta turma está encerrado.';
  END IF;

  -- Inserir (a constraint unique_slot_per_turma cuidará da concorrência de horário)
  BEGIN
    INSERT INTO public.visita_agendamentos (
      turma_id, config_id, user_id,
      data_visita, horario_visita,
      nome_responsavel, nome_crianca, telefone, observacao
    ) VALUES (
      v_turma_id, v_config_id, v_user_id,
      v_data, v_horario,
      p_payload->>'nome_responsavel',
      p_payload->>'nome_crianca',
      p_payload->>'telefone',
      COALESCE(p_payload->>'observacao', '')
    ) RETURNING id INTO v_id;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'Este horário já foi agendado por outra pessoa. Escolha outro horário.';
  END;

  RETURN jsonb_build_object('id', v_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.public_agendar_visita(JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.public_agendar_visita(JSONB) TO authenticated;
