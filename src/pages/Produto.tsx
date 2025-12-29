import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Minus, Plus, Share2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
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
  const [reviewRefresh, setReviewRefresh] = useState(0);
  const [activeTab, setActiveTab] = useState<'descricao' | 'cuidados' | 'avaliacoes'>('descricao');
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
      title: "Adicionado ao carrinho",
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
        <main className="pt-20">
          <div className="container px-6 lg:px-12 py-12">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
              <Skeleton className="aspect-[4/5]" />
              <div className="space-y-6">
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
        <main className="pt-20">
          <div className="container px-6 lg:px-12 py-24 text-center">
            <h1 className="font-display text-2xl mb-4">Produto não encontrado</h1>
            <p className="text-muted-foreground mb-8">O produto que você está procurando não existe.</p>
            <Link to="/" className="btn-minimal">
              Voltar à loja
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const hasDiscount = produto.preco_promocional && produto.preco_promocional < produto.preco;
  const finalPrice = produto.preco_promocional || produto.preco;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <div className="container px-6 lg:px-12 py-12">
          {/* Breadcrumb - Minimal */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-12"
          >
            <ChevronLeft className="h-4 w-4 stroke-[1.5]" />
            Voltar
          </Link>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
            {/* Product Image - Clean */}
            <div className="aspect-[4/5] bg-muted overflow-hidden">
              <img
                src={produto.imagem_url || '/placeholder.svg'}
                alt={produto.nome}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Product Info - Minimal */}
            <div className="lg:py-12 space-y-8">
              {/* Title */}
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-normal mb-4">
                  {produto.nome}
                </h1>
                
                {/* Price */}
                <div className="flex items-center gap-4">
                  {hasDiscount ? (
                    <>
                      <span className="text-lg text-muted-foreground line-through">
                        R$ {formatPrice(produto.preco)}
                      </span>
                      <span className="text-lg text-foreground">
                        R$ {formatPrice(produto.preco_promocional!)}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg text-muted-foreground">
                      R$ {formatPrice(produto.preco)}
                    </span>
                  )}
                </div>
              </div>

              {/* Variation Selector - Text style */}
              <div className="space-y-4">
                <p className="text-sm">
                  Cor: <span className="font-medium">{selectedVariacao}</span>
                </p>
                <div className="flex flex-wrap gap-4">
                  {produto.variacoes.map((variacao) => (
                    <button
                      key={variacao}
                      onClick={() => setSelectedVariacao(variacao)}
                      className={`text-sm transition-all duration-300 ${
                        selectedVariacao === variacao
                          ? 'text-foreground underline underline-offset-4'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {variacao}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Selector - Minimal */}
              <div className="flex items-center gap-6">
                <div className="flex items-center border border-border">
                  <button
                    onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                    className="w-12 h-12 flex items-center justify-center hover:bg-muted transition-colors"
                    disabled={quantidade <= 1}
                  >
                    <Minus className="h-4 w-4 stroke-[1.5]" />
                  </button>
                  <span className="w-12 h-12 flex items-center justify-center text-sm border-x border-border">
                    {quantidade}
                  </span>
                  <button
                    onClick={() => setQuantidade(quantidade + 1)}
                    className="w-12 h-12 flex items-center justify-center hover:bg-muted transition-colors"
                    disabled={quantidade >= (produto.estoque || 10)}
                  >
                    <Plus className="h-4 w-4 stroke-[1.5]" />
                  </button>
                </div>
              </div>

              {/* Add to Cart - Minimal button */}
              <div className="flex gap-4">
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 btn-minimal py-4"
                >
                  Adicionar ao carrinho
                </button>
                <button
                  onClick={handleShare}
                  className="w-14 h-14 border border-border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Share2 className="h-4 w-4 stroke-[1.5]" />
                </button>
              </div>

              {/* Trust badges - Text only */}
              <div className="pt-8 border-t border-border">
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                  <span>Frete grátis +R$299</span>
                  <span>·</span>
                  <span>Garantia 1 ano</span>
                  <span>·</span>
                  <span>Troca em 7 dias</span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details - Minimal tabs */}
          <div className="mt-16 md:mt-24 border-t border-border pt-12">
            {/* Tab navigation */}
            <div className="flex gap-8 mb-8">
              {[
                { id: 'descricao', label: 'Descrição' },
                { id: 'cuidados', label: 'Cuidados' },
                { id: 'avaliacoes', label: 'Avaliações' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'descricao' | 'cuidados' | 'avaliacoes')}
                  className={`text-sm uppercase tracking-[0.15em] pb-2 transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'text-foreground border-b border-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'descricao' && (
              <div className="max-w-2xl">
                <p className="text-muted-foreground leading-relaxed">
                  {produto.descricao || 'Semijoia exclusiva Elatho com acabamento premium em ouro 18k. Peça delicada e sofisticada, perfeita para qualquer ocasião.'}
                </p>
                <div className="mt-8 space-y-2 text-sm text-muted-foreground">
                  <p>Material: Liga metálica com banho de ouro 18k</p>
                  <p>Pedras: Zircônias de alta qualidade</p>
                  <p>Garantia: 12 meses contra defeitos</p>
                </div>
              </div>
            )}

            {activeTab === 'cuidados' && (
              <div className="max-w-2xl">
                <ul className="space-y-3 text-muted-foreground">
                  <li>Evite contato com água, perfumes e cremes</li>
                  <li>Guarde separadamente em local seco</li>
                  <li>Limpe com flanela macia</li>
                  <li>Retire para dormir e praticar exercícios</li>
                  <li>Evite exposição a produtos químicos</li>
                </ul>
              </div>
            )}

            {activeTab === 'avaliacoes' && (
              <div className="grid lg:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-lg font-display mb-6">Avaliações</h3>
                  <ProductReviews produtoId={produto.id} refreshTrigger={reviewRefresh} />
                </div>
                <div>
                  <h3 className="text-lg font-display mb-6">Deixe sua avaliação</h3>
                  <ProductReviewForm 
                    produtoId={produto.id} 
                    produtoNome={produto.nome}
                    onSuccess={() => setReviewRefresh((prev) => prev + 1)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}