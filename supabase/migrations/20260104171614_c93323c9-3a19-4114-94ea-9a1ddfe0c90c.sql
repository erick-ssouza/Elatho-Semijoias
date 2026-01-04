-- Fix function search path for validate_pedido_values
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;