-- Create cupons table
CREATE TABLE public.cupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL CHECK (tipo IN ('percentual', 'fixo')),
  valor NUMERIC NOT NULL,
  valor_minimo NUMERIC DEFAULT 0,
  uso_maximo INTEGER DEFAULT NULL,
  uso_atual INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  validade TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;

-- Cupons can be read by anyone (to validate at checkout)
CREATE POLICY "Cupons ativos são públicos para leitura"
ON public.cupons
FOR SELECT
USING (ativo = true AND (validade IS NULL OR validade > now()));

-- Admin can manage cupons
CREATE POLICY "Admin can insert cupons"
ON public.cupons
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can update cupons"
ON public.cupons
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete cupons"
ON public.cupons
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can view all cupons (including inactive)
CREATE POLICY "Admin can view all cupons"
ON public.cupons
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));