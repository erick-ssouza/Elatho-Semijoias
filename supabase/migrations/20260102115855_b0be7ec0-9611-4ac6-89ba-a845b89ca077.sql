-- Permitir que qualquer pessoa possa enviar depoimentos (irão para aprovação)
DROP POLICY IF EXISTS "Qualquer pessoa pode enviar depoimentos" ON public.depoimentos;

CREATE POLICY "Qualquer pessoa pode enviar depoimentos"
ON public.depoimentos
FOR INSERT
WITH CHECK (true);

-- Admin can view all depoimentos (for management)
DROP POLICY IF EXISTS "Admin can view all depoimentos" ON public.depoimentos;

CREATE POLICY "Admin can view all depoimentos"
ON public.depoimentos
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));