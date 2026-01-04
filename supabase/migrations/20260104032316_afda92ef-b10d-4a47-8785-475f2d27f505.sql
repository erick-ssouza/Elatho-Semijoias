-- 1. Drop existing policies that allow public access to sensitive data
DROP POLICY IF EXISTS "Users can view own cliente data" ON public.clientes;
DROP POLICY IF EXISTS "Users can view own pedidos" ON public.pedidos;

-- 2. Create secure policies for clientes - requires authenticated user
CREATE POLICY "Users can view own cliente data"
ON public.clientes
FOR SELECT
USING (auth.uid() IS NOT NULL AND email = get_user_email());

-- 3. Create secure policies for pedidos - requires authenticated user  
CREATE POLICY "Users can view own pedidos"
ON public.pedidos
FOR SELECT
USING (auth.uid() IS NOT NULL AND cliente_email = get_user_email());

-- 4. Create function to check if email has a paid order (for verified purchase badge)
CREATE OR REPLACE FUNCTION public.check_verified_purchase(p_cliente_email text, p_produto_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pedidos
    WHERE cliente_email = p_cliente_email
      AND status IN ('pago', 'enviado', 'entregue')
      AND itens::jsonb @> jsonb_build_array(jsonb_build_object('id', p_produto_id::text))
  )
$$;