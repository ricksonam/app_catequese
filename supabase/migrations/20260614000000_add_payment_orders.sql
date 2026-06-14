-- Migration: Sistema de rastreamento de pagamentos via Order NSU (InfinitePay)
-- Criado em: 2026-06-14

-- Tabela de ordens de pagamento
-- Permite rastrear qual usuário está pagando via Order NSU,
-- sem depender do e-mail no payload do webhook da InfinitePay
CREATE TABLE IF NOT EXISTS public.payment_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_nsu TEXT UNIQUE NOT NULL,       -- Ex: ORD-userId-timestamp (rastreável na InfinitePay)
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  amount NUMERIC DEFAULT 9.90,
  created_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ,
  webhook_payload JSONB,                -- Payload bruto da InfinitePay para auditoria
  user_email TEXT                       -- Email do usuário no momento da criação
);

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

-- Usuário só vê seus próprios pedidos
DROP POLICY IF EXISTS "Users view own orders" ON public.payment_orders;
CREATE POLICY "Users view own orders" ON public.payment_orders
  FOR SELECT USING (auth.uid() = user_id);

-- Usuário pode criar seus próprios pedidos
DROP POLICY IF EXISTS "Users insert own orders" ON public.payment_orders;
CREATE POLICY "Users insert own orders" ON public.payment_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Adicionar campo premium_set_by na tabela profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS premium_set_by TEXT DEFAULT 'webhook';
