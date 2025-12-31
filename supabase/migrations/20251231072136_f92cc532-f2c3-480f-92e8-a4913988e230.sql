-- ================================================================
-- FIX #3: Order History Accessible Without Authentication
-- Remove the overly permissive public policy on pedidos_historico
-- ================================================================

-- Drop the insecure public policy that allows anyone to view order history
DROP POLICY IF EXISTS "Anyone can view historico by pedido number" ON public.pedidos_historico;