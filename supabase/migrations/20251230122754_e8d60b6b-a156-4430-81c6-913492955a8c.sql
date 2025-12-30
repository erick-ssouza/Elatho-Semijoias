-- Adicionar colunas para pagamento PIX automático
ALTER TABLE public.pedidos
ADD COLUMN IF NOT EXISTS payment_id text,
ADD COLUMN IF NOT EXISTS payment_status text,
ADD COLUMN IF NOT EXISTS metodo_pagamento text DEFAULT 'pix';