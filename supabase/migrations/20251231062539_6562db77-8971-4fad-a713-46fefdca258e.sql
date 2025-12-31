-- Corrigir políticas de pedidos para serem PERMISSIVE
DROP POLICY IF EXISTS "Admin can update pedidos" ON pedidos;
DROP POLICY IF EXISTS "Admin can delete pedidos" ON pedidos;

-- Recriar como PERMISSIVE (padrão)
CREATE POLICY "Admin can update pedidos" ON pedidos
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete pedidos" ON pedidos
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));