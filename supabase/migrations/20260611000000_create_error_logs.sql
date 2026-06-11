-- ============================================================
-- Migration: Criar tabela error_logs
-- Usada pelo errorLogger.ts para registrar erros de produção
-- ============================================================

CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL, -- 'render_crash' | 'api_error' | 'js_error' | 'auth_error'
  mensagem TEXT NOT NULL DEFAULT '',
  stack TEXT,
  pagina TEXT NOT NULL DEFAULT '',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  dispositivo TEXT NOT NULL DEFAULT '',
  metadata TEXT NOT NULL DEFAULT '{}',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para consultas rápidas no AdminDashboard
CREATE INDEX IF NOT EXISTS error_logs_criado_em_idx ON public.error_logs (criado_em DESC);
CREATE INDEX IF NOT EXISTS error_logs_user_id_idx   ON public.error_logs (user_id);
CREATE INDEX IF NOT EXISTS error_logs_tipo_idx      ON public.error_logs (tipo);

-- RLS: apenas admins podem ler; qualquer usuário autenticado (ou anon) pode inserir
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Inserção aberta — o errorLogger precisa registrar erros mesmo sem sessão
CREATE POLICY "Qualquer um pode registrar erro" ON public.error_logs
  FOR INSERT WITH CHECK (true);

-- Leitura restrita a super-admin (pelo e-mail configurado)
-- Nota: substituir pela verificação de role quando a verificação server-side for implementada
CREATE POLICY "Apenas admin pode ler error_logs" ON public.error_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'sub_admin')
    )
  );
