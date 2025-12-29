-- Create avaliacoes table for product reviews
CREATE TABLE public.avaliacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  cliente_nome TEXT NOT NULL,
  cliente_email TEXT NOT NULL,
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
  titulo TEXT,
  comentario TEXT,
  aprovado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_avaliacoes_produto ON public.avaliacoes(produto_id);
CREATE INDEX idx_avaliacoes_aprovado ON public.avaliacoes(aprovado);

-- Enable RLS
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved reviews
CREATE POLICY "Avaliacoes aprovadas são públicas"
ON public.avaliacoes
FOR SELECT
USING (aprovado = true);

-- Anyone can submit a review
CREATE POLICY "Qualquer pessoa pode enviar avaliação"
ON public.avaliacoes
FOR INSERT
WITH CHECK (true);

-- Admin can view all reviews
CREATE POLICY "Admin can view all avaliacoes"
ON public.avaliacoes
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can update reviews (approve/reject)
CREATE POLICY "Admin can update avaliacoes"
ON public.avaliacoes
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can delete reviews
CREATE POLICY "Admin can delete avaliacoes"
ON public.avaliacoes
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));