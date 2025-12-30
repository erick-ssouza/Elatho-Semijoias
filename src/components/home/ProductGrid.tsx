import { useState, useEffect, useRef, useMemo } from 'react';
import ProductCard from './ProductCard';
import ProductFilters, { FilterState, priceRanges, colors } from './ProductFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { useProducts } from '@/hooks/useProductQueries';

interface ProductGridProps {
  selectedCategory: string;
}

const initialFilters: FilterState = {
  priceRanges: [],
  colors: [],
  sortBy: 'recentes',
};

export default function ProductGrid({ selectedCategory }: ProductGridProps) {
  const { data: produtos = [], isLoading: loading } = useProducts(selectedCategory);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [headerVisible, setHeaderVisible] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  // Intersection observer for header animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHeaderVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: '0px' }
    );

    if (headerRef.current) {
      observer.observe(headerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Apply filters and sorting with useMemo
  const filteredProdutos = useMemo(() => {
    let result = [...produtos];

    // Filter by price range
    if (filters.priceRanges.length > 0) {
      result = result.filter((produto) => {
        const price = produto.preco_promocional || produto.preco;
        return filters.priceRanges.some((rangeId) => {
          const range = priceRanges.find((r) => r.id === rangeId);
          if (!range) return false;
          return price >= range.min && price < range.max;
        });
      });
    }

    // Filter by color/variation
    if (filters.colors.length > 0) {
      result = result.filter((produto) => {
        if (!produto.variacoes) return false;
        const produtoColors = produto.variacoes.map((v) => 
          v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        );
        return filters.colors.some((colorId) => {
          const colorLabel = colors.find((c) => c.id === colorId)?.label || '';
          const normalizedColor = colorLabel.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          return produtoColors.some((pc) => pc.includes(normalizedColor));
        });
      });
    }

    // Sort
    switch (filters.sortBy) {
      case 'menor':
        result.sort((a, b) => (a.preco_promocional || a.preco) - (b.preco_promocional || b.preco));
        break;
      case 'maior':
        result.sort((a, b) => (b.preco_promocional || b.preco) - (a.preco_promocional || a.preco));
        break;
      case 'avaliacao':
        result.sort((a, b) => {
          if (a.mediaAvaliacoes === null && b.mediaAvaliacoes === null) return 0;
          if (a.mediaAvaliacoes === null) return 1;
          if (b.mediaAvaliacoes === null) return -1;
          return b.mediaAvaliacoes - a.mediaAvaliacoes;
        });
        break;
      case 'vendidos':
        result.sort((a, b) => b.totalAvaliacoes - a.totalAvaliacoes);
        break;
      default:
        break;
    }

    return result;
  }, [produtos, filters]);

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  return (
    <section id="produtos" className="py-16 md:py-24">
      <div className="container px-6 lg:px-12">
        {/* Header - Minimal with entrance animation */}
        <div 
          ref={headerRef}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12"
        >
          <div 
            className="overflow-hidden"
            style={{
              opacity: headerVisible ? 1 : 0,
              transform: headerVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-normal text-foreground">
              Coleção
            </h2>
            <p 
              className="text-sm text-muted-foreground mt-2"
              style={{
                opacity: headerVisible ? 1 : 0,
                transform: headerVisible ? 'translateY(0)' : 'translateY(10px)',
                transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
              }}
            >
              {filteredProdutos.length} produto{filteredProdutos.length !== 1 ? 's' : ''}
            </p>
            {/* Animated underline */}
            <div 
              className="h-[1px] bg-foreground mt-4"
              style={{
                width: headerVisible ? '60px' : '0px',
                transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s',
              }}
            />
          </div>
        </div>

        {/* Mobile Filters - rendered outside flex container */}
        <div className="lg:hidden">
          <ProductFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={handleClearFilters}
            totalProducts={filteredProdutos.length}
          />
        </div>

        {/* Main content with filters */}
        <div className="flex gap-12">
          {/* Filters sidebar - desktop only */}
          <div className="hidden lg:block">
            <ProductFilters
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={handleClearFilters}
              totalProducts={filteredProdutos.length}
            />
          </div>

          {/* Products grid */}
          <div className="flex-1 w-full">
            {loading ? (
              <div className="grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-3 gap-4 min-[400px]:gap-4 md:gap-12">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="aspect-[4/5] mb-3 md:mb-5" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-3/4 mx-auto" />
                      <Skeleton className="h-4 w-1/2 mx-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProdutos.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-muted-foreground mb-4">Nenhum produto encontrado.</p>
                {(filters.priceRanges.length > 0 || filters.colors.length > 0) && (
                  <button
                    onClick={handleClearFilters}
                    className="text-sm underline underline-offset-4 text-foreground hover:text-muted-foreground transition-colors"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-3 gap-4 min-[400px]:gap-4 md:gap-12">
                {filteredProdutos.map((produto, index) => (
                  <ProductCard 
                    key={produto.id} 
                    {...produto}
                    mediaAvaliacoes={produto.mediaAvaliacoes}
                    totalAvaliacoes={produto.totalAvaliacoes}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
