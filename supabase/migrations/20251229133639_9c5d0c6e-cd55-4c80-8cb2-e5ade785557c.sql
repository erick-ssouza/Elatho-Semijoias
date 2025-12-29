-- Create produtos table
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC NOT NULL,
  preco_promocional NUMERIC,
  categoria TEXT NOT NULL CHECK (categoria IN ('aneis', 'brincos', 'colares', 'pulseiras', 'conjuntos')),
  imagem_url TEXT,
  variacoes JSONB DEFAULT '["Dourado", "Prateado", "Rosé"]'::jsonb,
  estoque INTEGER DEFAULT 10,
  destaque BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clientes table
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE,
  whatsapp TEXT,
  cpf TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pedidos table
CREATE TABLE public.pedidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_pedido TEXT NOT NULL UNIQUE,
  cliente_nome TEXT NOT NULL,
  cliente_email TEXT,
  cliente_whatsapp TEXT,
  cliente_cpf TEXT,
  endereco JSONB,
  itens JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  frete NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'enviado', 'entregue', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create depoimentos table
CREATE TABLE public.depoimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_nome TEXT NOT NULL,
  texto TEXT NOT NULL,
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
  aprovado BOOLEAN DEFAULT false,
  resposta_admin TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mensagens table
CREATE TABLE public.mensagens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  assunto TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create configuracoes table
CREATE TABLE public.configuracoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave TEXT UNIQUE NOT NULL,
  valor JSONB
);

-- Enable RLS on all tables
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depoimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- Public read access for produtos (products are public)
CREATE POLICY "Produtos são públicos para leitura"
ON public.produtos FOR SELECT
USING (true);

-- Public read access for approved depoimentos
CREATE POLICY "Depoimentos aprovados são públicos"
ON public.depoimentos FOR SELECT
USING (aprovado = true);

-- Public insert for pedidos (anyone can place an order)
CREATE POLICY "Qualquer pessoa pode criar pedidos"
ON public.pedidos FOR INSERT
WITH CHECK (true);

-- Public insert for clientes
CREATE POLICY "Qualquer pessoa pode se cadastrar"
ON public.clientes FOR INSERT
WITH CHECK (true);

-- Public insert for mensagens (contact form)
CREATE POLICY "Qualquer pessoa pode enviar mensagens"
ON public.mensagens FOR INSERT
WITH CHECK (true);

-- Insert seed data for produtos
INSERT INTO public.produtos (nome, descricao, preco, preco_promocional, categoria, imagem_url, variacoes, estoque, destaque) VALUES
('Anel Lua Crescente', 'Anel delicado com pingente de lua crescente cravejado com zircônias. Acabamento em ouro 18k que realça a elegância de qualquer look.', 89.90, NULL, 'aneis', '/placeholder.svg', '["Dourado", "Prateado", "Rosé"]', 10, true),
('Anel Solitário Clássico', 'Anel solitário atemporal com zircônia central brilhante. Perfeito para ocasiões especiais ou uso diário.', 79.90, 69.90, 'aneis', '/placeholder.svg', '["Dourado", "Prateado", "Rosé"]', 10, true),
('Anel Coroa', 'Anel inspirado em realeza com detalhes delicados em formato de coroa. Símbolo de poder e feminilidade.', 94.90, NULL, 'aneis', '/placeholder.svg', '["Dourado", "Prateado", "Rosé"]', 10, true),
('Brinco Estrela', 'Brincos delicados em formato de estrela com acabamento brilhante. Leves e confortáveis para uso diário.', 59.90, NULL, 'brincos', '/placeholder.svg', '["Dourado", "Prateado", "Rosé"]', 10, true),
('Brinco Argola Cravejada', 'Argolas médias cravejadas com microzircônias. Elegância e sofisticação em uma única peça.', 69.90, 59.90, 'brincos', '/placeholder.svg', '["Dourado", "Prateado", "Rosé"]', 10, true),
('Brinco Gota Cristal', 'Brincos em formato de gota com cristal central. Ideal para eventos e ocasiões especiais.', 74.90, NULL, 'brincos', '/placeholder.svg', '["Dourado", "Prateado", "Rosé"]', 10, true),
('Colar Ponto de Luz', 'Colar minimalista com pingente ponto de luz. Delicadeza e brilho para iluminar seu visual.', 99.90, NULL, 'colares', '/placeholder.svg', '["Dourado", "Prateado", "Rosé"]', 10, true),
('Colar Coração Vazado', 'Colar com pingente de coração vazado. Símbolo de amor eterno com design contemporâneo.', 109.90, 89.90, 'colares', '/placeholder.svg', '["Dourado", "Prateado", "Rosé"]', 10, true),
('Colar Riviera', 'Colar riviera com zircônias em toda extensão. Peça statement para looks sofisticados.', 149.90, NULL, 'colares', '/placeholder.svg', '["Dourado", "Prateado", "Rosé"]', 10, true),
('Pulseira Riviera', 'Pulseira riviera delicada com zircônias. Elegância discreta para compor qualquer visual.', 119.90, 99.90, 'pulseiras', '/placeholder.svg', '["Dourado", "Prateado", "Rosé"]', 10, true),
('Pulseira Pingentes', 'Pulseira com múltiplos pingentes delicados. Charme e personalidade em cada detalhe.', 89.90, NULL, 'pulseiras', '/placeholder.svg', '["Dourado", "Prateado", "Rosé"]', 10, true),
('Conjunto Estrela', 'Conjunto completo com brinco e colar estrela. Combinação perfeita para presente ou uso pessoal.', 139.90, 119.90, 'conjuntos', '/placeholder.svg', '["Dourado", "Prateado", "Rosé"]', 10, true);

-- Insert seed depoimentos
INSERT INTO public.depoimentos (cliente_nome, texto, nota, aprovado) VALUES
('Maria Silva', 'Amei as peças! Qualidade incrível e o acabamento é impecável. Já virei cliente fiel!', 5, true),
('Ana Paula', 'Entrega super rápida e a joia veio muito bem embalada. Recomendo demais!', 5, true),
('Juliana Costa', 'Presente perfeito para minha mãe. Ela adorou o colar ponto de luz!', 5, true);