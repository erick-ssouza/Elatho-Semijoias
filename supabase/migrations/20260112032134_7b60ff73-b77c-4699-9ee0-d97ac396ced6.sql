-- Create waitlist table for out-of-stock product notifications
CREATE TABLE public.lista_espera (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL,
  email TEXT NOT NULL,
  notificado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lista_espera ENABLE ROW LEVEL SECURITY;

-- Public can add themselves to waitlist
CREATE POLICY "Anyone can add to waitlist"
ON public.lista_espera
FOR INSERT
WITH CHECK (true);

-- Admin can view all waitlist entries
CREATE POLICY "Admin can view all waitlist entries"
ON public.lista_espera
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can update waitlist entries
CREATE POLICY "Admin can update waitlist entries"
ON public.lista_espera
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin can delete waitlist entries
CREATE POLICY "Admin can delete waitlist entries"
ON public.lista_espera
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));