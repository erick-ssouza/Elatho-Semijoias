-- Fix SELECT policies to be permissive (so admin OR user policy can grant access)

-- PEDIDOS
DROP POLICY IF EXISTS "Admin can view all pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Users can view own pedidos" ON public.pedidos;

CREATE POLICY "Admin can view all pedidos"
ON public.pedidos
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users can view own pedidos"
ON public.pedidos
FOR SELECT
TO authenticated
USING (
  cliente_email = (
    SELECT users.email
    FROM auth.users AS users
    WHERE users.id = auth.uid()
  )::text
);

-- CLIENTES
DROP POLICY IF EXISTS "Admin can view all clientes" ON public.clientes;
DROP POLICY IF EXISTS "Users can view own cliente data" ON public.clientes;

CREATE POLICY "Admin can view all clientes"
ON public.clientes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users can view own cliente data"
ON public.clientes
FOR SELECT
TO authenticated
USING (
  email = (
    SELECT users.email
    FROM auth.users AS users
    WHERE users.id = auth.uid()
  )::text
);
