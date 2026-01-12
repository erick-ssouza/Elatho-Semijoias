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
import heroColar from '@/assets/hero-colar.jpg';
import BenefitsBar from '@/components/layout/BenefitsBar';

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
  const [scrollY, setScrollY] = useState(0);
  
  const { data: produtos, isLoading } = useAllProducts(selectedCategory);

  const headerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (categoriaFromUrl) {
      setSelectedCategory(categoriaFromUrl);
    }
  }, [categoriaFromUrl]);

  // Parallax scroll effect like Home
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        if (rect.bottom > 0) {
          setScrollY(window.scrollY);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    'vendidos': 'recent',
  };

  // Calculate parallax values like Home
  const textOpacity = Math.max(0, 1 - scrollY / 400);
  const textTranslateY = scrollY * 0.2;
  const blurAmount = Math.min(10, scrollY / 50);

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

    // Sort products
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
  ];

  const hasActiveFilters = filters.priceRanges.length > 0 || filters.colors.length > 0 || selectedCategory !== 'todos';

  return (
    <>
      <Helmet>
        <title>Todos os Produtos | Elatho Semijoias</title>
        <meta name="description" content="Explore nossa coleção completa de semijoias femininas. Anéis, brincos, colares e pulseiras banhados a ouro 18k. Tecnologia antialérgica. Frete grátis acima de R$299." />
        <link rel="canonical" href="https://elathosemijoias.com.br/loja" />
        <meta property="og:title" content="Todos os Produtos | Elatho Semijoias" />
        <meta property="og:description" content="Explore nossa coleção completa de semijoias femininas banhadas a ouro 18k. Tecnologia antialérgica." />
        <meta property="og:url" content="https://elathosemijoias.com.br/loja" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://elathosemijoias.com.br/og-image.jpg" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <BenefitsBar />
        <Navbar />
        <main>
          {/* Hero Banner - Colar coração com vestido cinza */}
          <section ref={heroRef} className="relative h-[45vh] md:h-[55vh] flex items-center justify-center overflow-hidden">
            {/* Background Image with Parallax and Progressive Blur */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
              style={{
                backgroundImage: `url(${heroColar})`,
                transform: `translateY(${scrollY * 0.4}px) scale(1.1)`,
                filter: `blur(${blurAmount}px)`,
              }}
            />
            
            {/* Gradient overlay - darker at top for text readability */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 100%)'
              }}
            />
            
            {/* Vignette overlay - darkens edges */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.35) 100%)'
              }}
            />

            {/* Content with fade on scroll - matching Home style */}
            <div 
              className="container relative z-10 px-6 lg:px-12 will-change-transform"
              style={{
                opacity: textOpacity,
                transform: `translateY(${textTranslateY}px)`,
              }}
            >
              <div className="max-w-2xl mx-auto text-center">
                {/* Subtitle with letter-spacing animation */}
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/80 mb-6 animate-letter-spacing">
                  Coleção Exclusiva
                </p>

                {/* Title with staggered reveal */}
                <div className="overflow-hidden mb-4">
                  <h1 
                    className="font-display text-4xl md:text-5xl lg:text-6xl font-normal leading-[1.1] animate-reveal-text"
                    style={{ 
                      animationDelay: '200ms',
                      color: '#FFFFFF',
                      textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                    }}
                  >
                    Nossos Produtos
                  </h1>
                </div>
                
                <p 
                  className="text-white/80 text-lg md:text-xl max-w-xl mx-auto animate-fade-in-up"
                  style={{ animationDelay: '400ms' }}
                >
                  Peças exclusivas banhadas a ouro 18k
                </p>
              </div>
            </div>
          </section>

          {/* Category Pills - Matching Home's horizontal scroll style */}
          <section className="py-6 md:py-12 border-b border-border/30 bg-gradient-to-b from-background to-muted/20">
            <div className="container px-4 lg:px-12">
              <nav className="flex md:flex-wrap md:justify-center items-center gap-2 md:gap-3 overflow-x-auto scrollbar-hide pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
                {categories.map((cat, index) => (
                  <div 
                    key={cat.id}
                    className="flex-shrink-0 animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <button
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 md:px-5 md:py-2 rounded-full text-[11px] md:text-xs uppercase tracking-[0.1em] md:tracking-[0.15em] font-medium transition-all duration-300 border md:border-2 whitespace-nowrap ${
                        selectedCategory === cat.id
                          ? 'bg-primary border-primary text-primary-foreground shadow-lg'
                          : 'bg-primary/90 border-primary text-primary-foreground hover:bg-primary hover:shadow-md'
                      }`}
                      style={{
                        boxShadow: selectedCategory === cat.id ? '0 4px 20px -3px rgba(212, 168, 70, 0.5)' : 'none'
                      }}
                    >
                      {cat.label}
                    </button>
                  </div>
                ))}
              </nav>
            </div>
          </section>

          {/* Products Grid */}
          <section className="py-12 md:py-16">
            <div className="container mx-auto px-4">
              <div
                ref={headerRef}
                className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                <div>
                  <h2 className="text-2xl font-display font-semibold text-foreground">
                    {selectedCategory === 'todos' 
                      ? 'Todos os Produtos' 
                      : categories.find(c => c.id === selectedCategory)?.label || 'Produtos'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
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

              <div className="flex flex-col lg:flex-row gap-10">
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

                {/* Products Grid - 4 cols desktop, 3 tablet, 2 mobile */}
                <div className="flex-1">
                  {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <SkeletonCard key={i} />
                      ))}
                    </div>
                  ) : filteredProdutos.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                      {filteredProdutos.map((produto, index) => (
                        <ProductCard
                          key={produto.id}
                          id={produto.id}
                          nome={produto.nome}
                          preco={produto.preco}
                          preco_promocional={produto.preco_promocional}
                          imagem_url={produto.imagem_url}
                          categoria={produto.categoria}
                          descricao={produto.descricao}
                          estoque={produto.estoque}
                          tipo_material={produto.tipo_material}
                          mediaAvaliacoes={produto.mediaAvaliacoes}
                          totalAvaliacoes={produto.totalAvaliacoes}
                          index={index}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <p className="text-muted-foreground text-lg mb-6">
                        Nenhum produto encontrado com os filtros selecionados.
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={handleClearFilters}
                        className="border-primary/40 hover:bg-primary hover:text-primary-foreground"
                      >
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
