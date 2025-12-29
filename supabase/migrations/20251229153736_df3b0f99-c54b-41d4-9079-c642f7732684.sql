-- Add tracking code column to pedidos
ALTER TABLE public.pedidos 
ADD COLUMN codigo_rastreio TEXT NULL;