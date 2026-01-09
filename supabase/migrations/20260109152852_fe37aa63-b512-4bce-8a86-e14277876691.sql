-- Adicionar campo tipo_material à tabela produtos
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS tipo_material text;