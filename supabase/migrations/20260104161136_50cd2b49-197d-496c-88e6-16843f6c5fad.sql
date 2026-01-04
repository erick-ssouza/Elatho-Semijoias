-- Add ring size fields to produtos table
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS tipo_tamanho text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS faixa_tamanho text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tamanhos_disponiveis jsonb DEFAULT NULL;

-- tipo_tamanho: 'unico' (Tamanho Único/Regulável) or 'pmg' (P/M/G)
-- faixa_tamanho: Optional adjustment range for 'unico' (e.g., "Regulável 14-18")
-- tamanhos_disponiveis: For 'pmg', array like ["P", "M", "G"] indicating which sizes are available

COMMENT ON COLUMN public.produtos.tipo_tamanho IS 'Ring size type: unico (unique/adjustable) or pmg (P/M/G sizes)';
COMMENT ON COLUMN public.produtos.faixa_tamanho IS 'Adjustment range for unique/adjustable size (e.g., Regulável 14-18)';
COMMENT ON COLUMN public.produtos.tamanhos_disponiveis IS 'Array of available sizes for P/M/G type: ["P", "M", "G"]';