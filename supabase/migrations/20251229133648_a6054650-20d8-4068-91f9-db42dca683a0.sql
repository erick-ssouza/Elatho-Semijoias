-- Add public read policy for configuracoes (public settings)
CREATE POLICY "Configurações são públicas para leitura"
ON public.configuracoes FOR SELECT
USING (true);