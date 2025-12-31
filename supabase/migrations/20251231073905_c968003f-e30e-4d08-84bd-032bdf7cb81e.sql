-- ================================================================
-- FIX #1 & #7: Secure public reviews - hide email in avaliacoes
-- The avaliacoes table has cliente_email exposed through "Avaliacoes aprovadas são públicas" policy
-- We need to drop this policy and only allow access through the view that excludes email
-- ================================================================

-- Remove the policy that exposes emails publicly
DROP POLICY IF EXISTS "Avaliacoes aprovadas são públicas" ON public.avaliacoes;

-- Create a more restrictive policy - only admins and authenticated users can see approved reviews
-- For public access, they must use the avaliacoes_publicas view (which already excludes email)
CREATE POLICY "Authenticated users can view approved avaliacoes" 
ON public.avaliacoes 
FOR SELECT 
TO authenticated
USING (aprovado = true);

-- ================================================================
-- FIX #2: Strengthen clientes table insert policy
-- Currently "Service role can insert clientes" has WITH CHECK (true) which is too permissive
-- Need to ensure only edge functions (service role) can insert
-- ================================================================

-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "Service role can insert clientes" ON public.clientes;

-- Create a more secure insert policy that still allows edge functions to work
-- The key is that authenticated service role calls from edge functions will work
-- but direct inserts from anon users will be blocked
CREATE POLICY "Only service role can insert clientes" 
ON public.clientes 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Add policy to allow authenticated users to update their own data
CREATE POLICY "Users can update own cliente data" 
ON public.clientes 
FOR UPDATE 
TO authenticated
USING (email = get_user_email())
WITH CHECK (email = get_user_email());