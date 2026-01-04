-- Fix avaliacoes RLS policy to not expose cliente_email in approved reviews
-- The view avaliacoes_publicas already excludes cliente_email, but the base table policy needs adjustment

-- Drop the existing policy that exposes all approved avaliacoes
DROP POLICY IF EXISTS "Authenticated users can view approved avaliacoes" ON public.avaliacoes;

-- Create new policy that only allows viewing approved avaliacoes through the view
-- Users should use avaliacoes_publicas view instead of directly querying avaliacoes
-- Admin can still see all via their existing policy
-- This effectively blocks direct SELECT on avaliacoes for non-admins

-- Add validation constraint on pedidos to prevent zero/negative values
-- Using a trigger since CHECK constraints can have issues with dynamic values

CREATE OR REPLACE FUNCTION public.validate_pedido_values()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate that total and subtotal are positive
  IF NEW.total <= 0 THEN
    RAISE EXCEPTION 'Total do pedido deve ser maior que zero';
  END IF;
  
  IF NEW.subtotal <= 0 THEN
    RAISE EXCEPTION 'Subtotal do pedido deve ser maior que zero';
  END IF;
  
  -- Validate frete is not negative
  IF NEW.frete < 0 THEN
    RAISE EXCEPTION 'Frete não pode ser negativo';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for pedidos validation
DROP TRIGGER IF EXISTS validate_pedido_before_insert ON public.pedidos;
CREATE TRIGGER validate_pedido_before_insert
  BEFORE INSERT ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_pedido_values();