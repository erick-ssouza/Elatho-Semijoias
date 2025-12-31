-- Remove a constraint antiga e adiciona nova com frete_gratis
ALTER TABLE cupons DROP CONSTRAINT IF EXISTS cupons_tipo_check;
ALTER TABLE cupons ADD CONSTRAINT cupons_tipo_check CHECK (tipo IN ('porcentagem', 'valor_fixo', 'frete_gratis'));