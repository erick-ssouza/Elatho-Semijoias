import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Minus, Plus, ShoppingBag, Heart, Share2, Truck, Shield, RotateCcw, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import ProductReviews from '@/components/product/ProductReviews';
import ProductReviewForm from '@/components/product/ProductReviewForm';

interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  preco_promocional: number | null;
  imagem_url: string | null;
  categoria: string;
  variacoes: string[];
  estoque: number | null;
}

export default function ProdutoPage() {
  const { id } = useParams<{ id: string }>();
  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariacao, setSelectedVariacao] = useState<string>('');
  const [quantidade, setQuantidade] = useState(1);
  const [imageZoom, setImageZoom] = useState(false);
  const [reviewRefresh, setReviewRefresh] = useState(0);
  const { addItem } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProduto = async () => {
      if (!id) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        const variacoes = Array.isArray(data.variacoes) 
          ? data.variacoes as string[]
          : ['Dourado', 'Prateado', 'Rosé'];
        
        setProduto({ ...data, variacoes });
        setSelectedVariacao(variacoes[0] || '');
      }
      setLoading(false);
    };

    fetchProduto();
  }, [id]);

  const formatPrice = (price: number) => {
    return price.toFixed(2).replace('.', ',');
  };

  const handleAddToCart = () => {
    if (!produto || !selectedVariacao) return;

    addItem({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      preco_promocional: produto.preco_promocional,
      imagem_url: produto.imagem_url || '/placeholder.svg',
      variacao: selectedVariacao,
    }, quantidade);

    toast({
      title: "Adicionado ao carrinho!",
      description: `${quantidade}x ${produto.nome} (${selectedVariacao})`,
    });
  };

  const handleShare = async () => {
    if (navigator.share && produto) {
      try {
        await navigator.share({
          title: produto.nome,
          text: produto.descricao || '',
          url: window.location.href,
        });
      } catch {
        // User cancelled or error
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 md:pt-24">
          <div className="container px-4 py-8">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
              <Skeleton className="aspect-square rounded-2xl" />
              <div className="space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 md:pt-24">
          <div className="container px-4 py-16 text-center">
            <h1 className="text-2xl font-display font-bold mb-4">Produto não encontrado</h1>
            <p className="text-muted-foreground mb-8">O produto que você está procurando não existe.</p>
            <Link to="/">
              <Button className="btn-gold">Voltar à loja</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const hasDiscount = produto.preco_promocional && produto.preco_promocional < produto.preco;
  const finalPrice = produto.preco_promocional || produto.preco;
  const discountPercent = hasDiscount
    ? Math.round(((produto.preco - produto.preco_promocional!) / produto.preco) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 md:pt-24">
        <div className="container px-4 py-8">
          {/* Breadcrumb */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar à loja
          </Link>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Product Image */}
            <div className="relative">
              <div 
                className={`aspect-square rounded-2xl overflow-hidden bg-accent/30 cursor-zoom-in transition-transform duration-300 ${
                  imageZoom ? 'scale-110' : ''
                }`}
                onMouseEnter={() => setImageZoom(true)}
                onMouseLeave={() => setImageZoom(false)}
              >
                <img
                  src={produto.imagem_url || '/placeholder.svg'}
                  alt={produto.nome}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Discount Badge */}
              {hasDiscount && (
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-gradient-gold text-sm font-bold text-primary-foreground">
                  -{discountPercent}% OFF
                </div>
              )}

              {/* Category Badge */}
              <div className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-background/90 backdrop-blur-sm text-sm font-medium capitalize">
                {produto.categoria}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                  {produto.nome}
                </h1>
                <p className="text-muted-foreground">
                  Código: {produto.id.slice(0, 8).toUpperCase()}
                </p>
              </div>

              {/* Price */}
              <div className="space-y-1">
                {hasDiscount ? (
                  <>
                    <p className="text-lg text-muted-foreground line-through">
                      R$ {formatPrice(produto.preco)}
                    </p>
                    <p className="text-3xl md:text-4xl font-display font-bold text-primary">
                      R$ {formatPrice(produto.preco_promocional!)}
                    </p>
                  </>
                ) : (
                  <p className="text-3xl md:text-4xl font-display font-bold text-primary">
                    R$ {formatPrice(produto.preco)}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  ou 3x de R$ {formatPrice(finalPrice / 3)} sem juros
                </p>
              </div>

              {/* Variation Selector */}
              <div className="space-y-3">
                <p className="font-medium">
                  Cor: <span className="text-primary">{selectedVariacao}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {produto.variacoes.map((variacao) => (
                    <button
                      key={variacao}
                      onClick={() => setSelectedVariacao(variacao)}
                      className={`px-4 py-2 rounded-xl border-2 font-medium transition-all duration-200 ${
                        selectedVariacao === variacao
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {variacao}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-3">
                <p className="font-medium">Quantidade:</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                      className="w-12 h-12 flex items-center justify-center hover:bg-accent transition-colors"
                      disabled={quantidade <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 h-12 flex items-center justify-center font-semibold border-x border-border">
                      {quantidade}
                    </span>
                    <button
                      onClick={() => setQuantidade(quantidade + 1)}
                      className="w-12 h-12 flex items-center justify-center hover:bg-accent transition-colors"
                      disabled={quantidade >= (produto.estoque || 10)}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {produto.estoque || 10} disponíveis
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={handleAddToCart}
                  className="flex-1 btn-gold gap-2 text-lg py-6"
                >
                  <ShoppingBag className="h-5 w-5" />
                  Adicionar ao Carrinho
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-xl"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Frete grátis +R$299</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Garantia 1 ano</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                    <RotateCcw className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Troca em 7 dias</span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details Tabs */}
          <div className="mt-12 md:mt-16">
            <Tabs defaultValue="descricao" className="w-full">
              <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0 gap-4 md:gap-8 flex-wrap">
                <TabsTrigger 
                  value="descricao"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 font-display text-base md:text-lg"
                >
                  Descrição
                </TabsTrigger>
                <TabsTrigger 
                  value="especificacoes"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 font-display text-base md:text-lg"
                >
                  Especificações
                </TabsTrigger>
                <TabsTrigger 
                  value="cuidados"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 font-display text-base md:text-lg"
                >
                  Cuidados
                </TabsTrigger>
                <TabsTrigger 
                  value="avaliacoes"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 font-display text-base md:text-lg flex items-center gap-2"
                >
                  <Star className="w-4 h-4" />
                  Avaliações
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="descricao" className="mt-6">
                <div className="prose prose-lg max-w-none">
                  <p className="text-muted-foreground leading-relaxed">
                    {produto.descricao || 'Semijoia exclusiva Elatho com acabamento premium em ouro 18k. Peça delicada e sofisticada, perfeita para qualquer ocasião. Cada detalhe foi pensado para realçar sua elegância natural.'}
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="especificacoes" className="mt-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-accent/50">
                    <p className="text-sm text-muted-foreground">Material</p>
                    <p className="font-medium">Liga metálica com banho de ouro 18k</p>
                  </div>
                  <div className="p-4 rounded-xl bg-accent/50">
                    <p className="text-sm text-muted-foreground">Pedras</p>
                    <p className="font-medium">Zircônias de alta qualidade</p>
                  </div>
                  <div className="p-4 rounded-xl bg-accent/50">
                    <p className="text-sm text-muted-foreground">Garantia</p>
                    <p className="font-medium">12 meses contra defeitos</p>
                  </div>
                  <div className="p-4 rounded-xl bg-accent/50">
                    <p className="text-sm text-muted-foreground">Categoria</p>
                    <p className="font-medium capitalize">{produto.categoria}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="cuidados" className="mt-6">
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    Evite contato com água, perfumes e cremes
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    Guarde separadamente em local seco
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    Limpe com flanela macia
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    Retire para dormir e praticar exercícios
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                    Evite exposição a produtos químicos
                  </li>
                </ul>
              </TabsContent>

              <TabsContent value="avaliacoes" className="mt-6">
                <div className="grid lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-display font-semibold mb-4">Avaliações dos Clientes</h3>
                    <ProductReviews produtoId={produto.id} refreshTrigger={reviewRefresh} />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-semibold mb-4">Deixe sua Avaliação</h3>
                    <div className="p-6 bg-accent/30 rounded-xl">
                      <ProductReviewForm 
                        produtoId={produto.id} 
                        produtoNome={produto.nome}
                        onSuccess={() => setReviewRefresh((prev) => prev + 1)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
