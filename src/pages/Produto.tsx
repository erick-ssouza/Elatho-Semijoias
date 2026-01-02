import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ShareButtons } from '@/components/product/ShareButtons';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { RecentlyViewed } from '@/components/product/RecentlyViewed';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';

interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  preco_promocional: number | null;
  imagem_url: string | null;
  imagens: string[] | null;
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
  const [activeTab, setActiveTab] = useState<'descricao' | 'cuidados'>('descricao');
  const { addItem } = useCart();
  const { toast } = useToast();
  const { addProduct, getProductsExcluding } = useRecentlyViewed();

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
          : ['Banho de Ouro 18k', 'Banho de Ródio'];
        
        const imagens = Array.isArray(data.imagens) 
          ? data.imagens as string[]
          : [];
        
        setProduto({ ...data, variacoes, imagens });
        setSelectedVariacao(variacoes[0] || '');
        
        // Track recently viewed
        addProduct({
          id: data.id,
          nome: data.nome,
          preco: data.preco,
          preco_promocional: data.preco_promocional,
          imagem_url: data.imagem_url,
        });
      }
      setLoading(false);
    };

    fetchProduto();
  }, [id]);

  const formatPrice = (price: number) => {
    return price.toFixed(2).replace('.', ',');
  };

  const isOutOfStock = produto && (produto.estoque !== null && produto.estoque !== undefined && produto.estoque <= 0);

  const handleAddToCart = () => {
    if (!produto || !selectedVariacao || isOutOfStock) return;

    addItem({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      preco_promocional: produto.preco_promocional,
      imagem_url: produto.imagem_url || '/placeholder.svg',
      variacao: selectedVariacao,
      estoque: produto.estoque,
    }, quantidade);

    toast({
      title: "Adicionado ao carrinho",
      description: `${quantidade}x ${produto.nome} (${selectedVariacao})`,
    });
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

  const productUrl = `https://elathosemijoias.com.br/produto/${produto.id}`;

  const categoriaLabel = {
    aneis: 'Anéis',
    brincos: 'Brincos',
    colares: 'Colares',
    pulseiras: 'Pulseiras',
  }[produto.categoria] || produto.categoria;

  // Schema JSON-LD para SEO
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": produto.nome,
    "description": produto.descricao || `${produto.nome} - Semijoia exclusiva Elatho com acabamento em ouro 18k.`,
    "image": produto.imagens?.length 
      ? [produto.imagem_url, ...produto.imagens].filter(Boolean)
      : produto.imagem_url ? [produto.imagem_url] : [],
    "sku": produto.id,
    "brand": {
      "@type": "Brand",
      "name": "Elatho Semijoias"
    },
    "category": categoriaLabel,
    "material": "Liga metálica com banho de ouro 18k",
    "color": produto.variacoes,
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": "BRL",
      "price": finalPrice,
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      "availability": (produto.estoque ?? 0) > 0 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Elatho Semijoias"
      },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "0",
          "currency": "BRL"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "BR"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 3,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 3,
            "maxValue": 10,
            "unitCode": "DAY"
          }
        }
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 7,
        "returnMethod": "https://schema.org/ReturnByMail"
      }
    }
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Início",
        "item": "https://elathosemijoias.com.br"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": categoriaLabel,
        "item": `https://elathosemijoias.com.br/#produtos`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": produto.nome,
        "item": productUrl
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>{produto.nome} | Elatho Semijoias</title>
        <meta name="description" content={produto.descricao || `${produto.nome} - Semijoia exclusiva Elatho com acabamento em ouro 18k.`} />
        <meta property="og:title" content={`${produto.nome} | Elatho Semijoias`} />
        <meta property="og:description" content={produto.descricao || 'Semijoia exclusiva Elatho com acabamento premium.'} />
        <meta property="og:image" content={produto.imagem_url || ''} />
        <meta property="og:url" content={productUrl} />
        <meta property="og:type" content="product" />
        <meta property="product:price:amount" content={String(finalPrice)} />
        <meta property="product:price:currency" content="BRL" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${produto.nome} | Elatho Semijoias`} />
        <meta name="twitter:description" content={produto.descricao || 'Semijoia exclusiva Elatho.'} />
        <meta name="twitter:image" content={produto.imagem_url || ''} />
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20">
          <div className="container px-6 lg:px-12 py-12">
            {/* Breadcrumbs */}
            <Breadcrumbs 
              items={[
                { label: categoriaLabel, href: `/#produtos` },
                { label: produto.nome }
              ]} 
            />

            <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 mt-8">
              {/* Product Gallery */}
              <ProductGallery 
                mainImage={produto.imagem_url}
                images={produto.imagens || []}
                productName={produto.nome}
              />

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
              {!isOutOfStock && (
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
              )}

              {/* Add to Cart */}
              {isOutOfStock ? (
                <div className="w-full py-4 text-center border border-border bg-muted text-muted-foreground cursor-not-allowed">
                  <span className="text-sm uppercase tracking-[0.15em]">Produto Esgotado</span>
                </div>
              ) : (
                <button 
                  onClick={handleAddToCart}
                  className="w-full btn-minimal py-4"
                >
                  Adicionar ao carrinho
                </button>
              )}

              {/* Share Buttons */}
              <ShareButtons 
                productName={produto.nome}
                productUrl={productUrl}
              />

              {/* Trust badges */}
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
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'descricao' | 'cuidados')}
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
          </div>

          {/* Produtos Relacionados */}
          <div className="mt-16 md:mt-24 border-t border-border pt-12">
            <h2 className="font-display text-xl md:text-2xl mb-8">Você também pode gostar</h2>
            <RelatedProducts 
              categoria={produto.categoria} 
              currentProductId={produto.id} 
            />
          </div>

          {/* Produtos Vistos Recentemente */}
          {getProductsExcluding(produto.id).length > 0 && (
            <div className="mt-16 md:mt-24 border-t border-border pt-12">
              <h2 className="font-display text-xl md:text-2xl mb-8">Vistos recentemente</h2>
              <RecentlyViewed products={getProductsExcluding(produto.id)} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
    </>
  );
}