-- Create newsletter_inscricoes table
CREATE TABLE public.newsletter_inscricoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ativo BOOLEAN DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.newsletter_inscricoes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to subscribe (insert)
CREATE POLICY "Qualquer pessoa pode se inscrever na newsletter"
ON public.newsletter_inscricoes
FOR INSERT
WITH CHECK (true);

-- Only admin can view subscriptions
CREATE POLICY "Admin can view newsletter subscriptions"
ON public.newsletter_inscricoes
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admin can update subscriptions
CREATE POLICY "Admin can update newsletter subscriptions"
ON public.newsletter_inscricoes
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admin can delete subscriptions
CREATE POLICY "Admin can delete newsletter subscriptions"
ON public.newsletter_inscricoes
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));