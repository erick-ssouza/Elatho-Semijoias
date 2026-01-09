-- Revoke all access from public and authenticated users
REVOKE ALL ON FUNCTION public.decrement_stock(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decrement_stock(uuid, integer) FROM anon;
REVOKE ALL ON FUNCTION public.decrement_stock(uuid, integer) FROM authenticated;

-- Grant execute only to service_role (used by edge functions)
GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) TO service_role;