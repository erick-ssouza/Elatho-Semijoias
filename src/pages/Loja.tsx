import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/home/ProductCard';
import ProductFilters, { priceRanges, colors } from '@/components/home/ProductFilters';
import { useAllProducts } from '@/hooks/useProductQueries';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface FilterState {
  priceRanges: string[];
  colors: string[];
  sortBy: string;
}

const initialFilters: FilterState = {
  priceRanges: [],
  colors: [],
  sortBy: 'recent',
};

const Loja = () => {
  const [searchParams] = useSearchParams();
  const categoriaFromUrl = searchParams.get('categoria');
  const [selectedCategory, setSelectedCategory] = useState(categoriaFromUrl || 'todos');
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  
  const { data: produtos, isLoading } = useAllProducts(selectedCategory);

  const headerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (categoriaFromUrl) {
      setSelectedCategory(categoriaFromUrl);
    }
  }, [categoriaFromUrl]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
      if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (headerRef.current) observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  // Match sortBy values with ProductFilters component
  const sortByMap: Record<string, string> = {
    'recentes': 'recent',
    'menor': 'price-asc',
    'maior': 'price-desc',
    'vendidos': 'recent', // fallback
  };

  const reverseSortByMap: Record<string, string> = {
    'recent': 'recentes',
    'price-asc': 'menor',
    'price-desc': 'maior',
  };

  const filteredProdutos = useMemo(() => {
    if (!produtos) return [];

    let filtered = [...produtos];

    // Filter by price ranges
    if (filters.priceRanges.length > 0) {
      filtered = filtered.filter((produto) => {
        const price = produto.preco_promocional || produto.preco;
        return filters.priceRanges.some((rangeId) => {
          const range = priceRanges.find((r) => r.id === rangeId);
          if (!range) return false;
          return price >= range.min && price <= range.max;
        });
      });
    }

    // Filter by colors
    if (filters.colors.length > 0) {
      filtered = filtered.filter((produto) => {
        if (!produto.variacoes) return false;
        return filters.colors.some((colorId) => {
          const color = colors.find((c) => c.id === colorId);
          if (!color) return false;
          return produto.variacoes?.some((v) =>
            v.toLowerCase().includes(color.label.toLowerCase())
          );
        });
      });
    }

    // Sort products - map internal values to component values
    const sortValue = sortByMap[filters.sortBy] || filters.sortBy;
    switch (sortValue) {
      case 'price-asc':
      case 'menor':
        filtered.sort((a, b) => {
          const priceA = a.preco_promocional || a.preco;
          const priceB = b.preco_promocional || b.preco;
          return priceA - priceB;
        });
        break;
      case 'price-desc':
      case 'maior':
        filtered.sort((a, b) => {
          const priceA = a.preco_promocional || a.preco;
          const priceB = b.preco_promocional || b.preco;
          return priceB - priceA;
        });
        break;
      case 'recent':
      case 'recentes':
      default:
        // Already sorted by created_at desc from the query
        break;
    }

    return filtered;
  }, [produtos, filters]);

  const handleClearFilters = () => {
    setFilters(initialFilters);
    setSelectedCategory('todos');
  };

  const categories = [
    { id: 'todos', label: 'Todos' },
    { id: 'colares', label: 'Colares' },
    { id: 'brincos', label: 'Brincos' },
    { id: 'aneis', label: 'Anéis' },
    { id: 'pulseiras', label: 'Pulseiras' },
    { id: 'conjuntos', label: 'Conjuntos' },
  ];

  const hasActiveFilters = filters.priceRanges.length > 0 || filters.colors.length > 0 || selectedCategory !== 'todos';

  return (
    <>
      <Helmet>
        <title>Coleção Completa | Elatho Semijoias</title>
        <meta name="description" content="Explore nossa coleção completa de semijoias femininas. Anéis, brincos, colares e pulseiras com acabamento em ouro 18k. Frete grátis acima de R$299." />
        <link rel="canonical" href="https://elathosemijoias.com.br/loja" />
        <meta property="og:title" content="Coleção Completa | Elatho Semijoias" />
        <meta property="og:description" content="Explore nossa coleção completa de semijoias femininas com acabamento em ouro 18k." />
        <meta property="og:url" content="https://elathosemijoias.com.br/loja" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://elathosemijoias.com.br/og-image.jpg" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16 md:pt-20">
          {/* Hero Section */}
          <section className="relative py-12 md:py-16 bg-gradient-to-b from-primary/5 to-background">
            <div className="container mx-auto px-4">
              <div className="text-center max-w-2xl mx-auto">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
                  Nossa Coleção
                </h1>
                <p className="text-muted-foreground text-lg">
                  Explore todas as nossas peças exclusivas com acabamento premium em ouro 18k
                </p>
              </div>
            </div>
          </section>

          {/* Category Pills */}
          <section className="py-6 border-b border-border/50">
            <div className="container mx-auto px-4">
              <div className="flex flex-wrap justify-center gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      selectedCategory === cat.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Products Grid */}
          <section className="py-8 md:py-12">
            <div className="container mx-auto px-4">
              <div
                ref={headerRef}
                className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {selectedCategory === 'todos' 
                      ? 'Todos os Produtos' 
                      : categories.find(c => c.id === selectedCategory)?.label || 'Produtos'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {filteredProdutos.length} {filteredProdutos.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
                  </p>
                </div>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpar filtros
                  </Button>
                )}
              </div>

              <div className="flex flex-col lg:flex-row gap-8">
                {/* Filters Sidebar - Desktop */}
                <aside className="hidden lg:block w-64 flex-shrink-0">
                  <ProductFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    onClearFilters={handleClearFilters}
                    totalProducts={filteredProdutos.length}
                  />
                </aside>

                {/* Mobile Filters */}
                <div className="lg:hidden">
                  <ProductFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    onClearFilters={handleClearFilters}
                    totalProducts={filteredProdutos.length}
                  />
                </div>

                {/* Products Grid */}
                <div className="flex-1">
                  {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <SkeletonCard key={i} />
                      ))}
                    </div>
                  ) : filteredProdutos.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                      {filteredProdutos.map((produto, index) => (
                        <div
                          key={produto.id}
                          className="animate-fade-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <ProductCard
                            id={produto.id}
                            nome={produto.nome}
                            preco={produto.preco}
                            preco_promocional={produto.preco_promocional}
                            imagem_url={produto.imagem_url}
                            categoria={produto.categoria}
                            variacoes={produto.variacoes}
                            descricao={produto.descricao}
                            mediaAvaliacoes={produto.mediaAvaliacoes}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <p className="text-muted-foreground text-lg mb-4">
                        Nenhum produto encontrado com os filtros selecionados.
                      </p>
                      <Button variant="outline" onClick={handleClearFilters}>
                        Limpar filtros
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Loja;
