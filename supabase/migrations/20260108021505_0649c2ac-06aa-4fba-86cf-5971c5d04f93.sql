-- Create function to decrement product stock
CREATE OR REPLACE FUNCTION public.decrement_stock(p_produto_id uuid, p_quantidade integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.produtos
  SET estoque = GREATEST(0, estoque - p_quantidade)
  WHERE id = p_produto_id;
END;
$$;