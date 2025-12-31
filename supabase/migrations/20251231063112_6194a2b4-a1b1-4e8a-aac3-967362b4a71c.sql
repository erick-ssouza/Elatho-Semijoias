-- Criar função security definer para obter email do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text FROM auth.users WHERE id = auth.uid()
$$;

-- Corrigir política de clientes
DROP POLICY IF EXISTS "Users can view own cliente data" ON clientes;
CREATE POLICY "Users can view own cliente data" ON clientes
FOR SELECT TO authenticated
USING (email = public.get_user_email());

-- Corrigir política de pedidos
DROP POLICY IF EXISTS "Users can view own pedidos" ON pedidos;
CREATE POLICY "Users can view own pedidos" ON pedidos
FOR SELECT TO authenticated
USING (cliente_email = public.get_user_email());

-- Corrigir política de pedidos_historico
DROP POLICY IF EXISTS "Users can view own pedidos historico" ON pedidos_historico;
CREATE POLICY "Users can view own pedidos historico" ON pedidos_historico
FOR SELECT TO authenticated
USING (pedido_id IN (
  SELECT id FROM pedidos WHERE cliente_email = public.get_user_email()
));