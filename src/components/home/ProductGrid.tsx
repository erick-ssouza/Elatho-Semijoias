import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from './ProductCard';
import ProductFilters, { FilterState, priceRanges, colors } from './ProductFilters';
import { Skeleton } from '@/components/ui/skeleton';

interface Produto {
  id: string;
  nome: string;
  preco: number;
  preco_promocional: number | null;
  imagem_url: string | null;
  categoria: string;
  variacoes: string[] | null;
  descricao: string | null;
}

interface ProductWithRating extends Produto {
  mediaAvaliacoes: number | null;
  totalAvaliacoes: number;
}

interface ProductGridProps {
  selectedCategory: string;
}

const initialFilters: FilterState = {
  priceRanges: [],
  colors: [],
  sortBy: 'recentes',
};

export default function ProductGrid({ selectedCategory }: ProductGridProps) {
  const [produtos, setProdutos] = useState<ProductWithRating[]>([]);
  const [filteredProdutos, setFilteredProdutos] = useState<ProductWithRating[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch products
  useEffect(() => {
    const fetchProdutos = async () => {
      setLoading(true);
      
      let query = supabase
        .from('produtos')
        .select('id, nome, preco, preco_promocional, imagem_url, categoria, variacoes, descricao')
        .eq('destaque', true);

      if (selectedCategory !== 'todos') {
        query = query.eq('categoria', selectedCategory);
      }

      const { data, error } = await query;

      if (!error && data) {
        // Fetch ratings for all products
        const { data: avaliacoes } = await supabase
          .from('avaliacoes')
          .select('produto_id, nota')
          .eq('aprovado', true);

        // Calculate average ratings per product
        const ratingsMap = new Map<string, { sum: number; count: number }>();
        
        avaliacoes?.forEach((avaliacao) => {
          const current = ratingsMap.get(avaliacao.produto_id) || { sum: 0, count: 0 };
          ratingsMap.set(avaliacao.produto_id, {
            sum: current.sum + avaliacao.nota,
            count: current.count + 1,
          });
        });

        const produtosComRating: ProductWithRating[] = data.map((produto) => {
          const rating = ratingsMap.get(produto.id);
          return {
            ...produto,
            variacoes: Array.isArray(produto.variacoes) ? produto.variacoes as string[] : null,
            mediaAvaliacoes: rating ? rating.sum / rating.count : null,
            totalAvaliacoes: rating?.count || 0,
          };
        });

        setProdutos(produtosComRating);
      }
      
      setLoading(false);
    };

    fetchProdutos();
  }, [selectedCategory]);

  // Apply filters and sorting
  useEffect(() => {
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
        // For now, sort by total reviews as proxy for "most sold"
        result.sort((a, b) => b.totalAvaliacoes - a.totalAvaliacoes);
        break;
      default:
        // recentes - keep original order
        break;
    }

    setFilteredProdutos(result);
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

        {/* Main content with filters */}
        <div className="flex gap-12">
          {/* Filters sidebar */}
          <ProductFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={handleClearFilters}
            totalProducts={filteredProdutos.length}
          />

          {/* Products grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="aspect-[4/5] mb-5" />
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
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12">
                {filteredProdutos.map((produto, index) => (
                  <ProductCard 
                    key={produto.id} 
                    {...produto}
                    mediaAvaliacoes={produto.mediaAvaliacoes}
                    totalAvaliacoes={produto.totalAvaliacoes}
                    index={index % 3}
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
