-- Adicionar coluna frase_destaque para armazenar o ID da frase (1-10 ou 0 para aleatório)
ALTER TABLE public.produtos 
ADD COLUMN frase_destaque INTEGER DEFAULT NULL;

-- Comentário explicativo
COMMENT ON COLUMN public.produtos.frase_destaque IS 'ID da frase destaque (1-10) ou NULL para aleatório';