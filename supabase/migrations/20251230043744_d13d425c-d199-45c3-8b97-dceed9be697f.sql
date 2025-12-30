-- Corrigir a view para usar SECURITY INVOKER (padrão seguro)
DROP VIEW IF EXISTS public.avaliacoes_publicas;

CREATE VIEW public.avaliacoes_publicas 
WITH (security_invoker = true) AS
SELECT 
  id,
  produto_id,
  cliente_nome,
  nota,
  titulo,
  comentario,
  created_at
FROM public.avaliacoes
WHERE aprovado = true;

-- Dar acesso público à view
GRANT SELECT ON public.avaliacoes_publicas TO anon, authenticated;