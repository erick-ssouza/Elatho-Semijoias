-- Atualizar constraint para aceitar todos os tipos usados no código
ALTER TABLE cupons DROP CONSTRAINT IF EXISTS cupons_tipo_check;
ALTER TABLE cupons ADD CONSTRAINT cupons_tipo_check CHECK (tipo IN ('porcentagem', 'percentual', 'valor_fixo', 'fixo', 'frete_gratis'));