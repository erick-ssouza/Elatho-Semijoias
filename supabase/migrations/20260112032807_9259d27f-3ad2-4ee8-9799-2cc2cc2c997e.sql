-- Add descricao_customizada field to produtos table
ALTER TABLE public.produtos 
ADD COLUMN descricao_customizada text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.produtos.descricao_customizada IS 'Custom description that overrides auto-generated description when set';