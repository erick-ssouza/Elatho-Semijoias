import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from './ProductCard';
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

export default function ProductGrid({ selectedCategory }: ProductGridProps) {
  const [produtos, setProdutos] = useState<ProductWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recentes');
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

        let sortedData = [...produtosComRating];
        
        switch (sortBy) {
          case 'menor':
            sortedData.sort((a, b) => (a.preco_promocional || a.preco) - (b.preco_promocional || b.preco));
            break;
          case 'maior':
            sortedData.sort((a, b) => (b.preco_promocional || b.preco) - (a.preco_promocional || a.preco));
            break;
          case 'avaliacao':
            sortedData.sort((a, b) => {
              if (a.mediaAvaliacoes === null && b.mediaAvaliacoes === null) return 0;
              if (a.mediaAvaliacoes === null) return 1;
              if (b.mediaAvaliacoes === null) return -1;
              return b.mediaAvaliacoes - a.mediaAvaliacoes;
            });
            break;
          default:
            break;
        }
        
        setProdutos(sortedData);
      }
      
      setLoading(false);
    };

    fetchProdutos();
  }, [selectedCategory, sortBy]);

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
              {produtos.length} produto{produtos.length !== 1 ? 's' : ''}
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

          {/* Sort - Text only with fade animation */}
          <div 
            className="flex items-center gap-4 text-xs uppercase tracking-[0.15em]"
            style={{
              opacity: headerVisible ? 1 : 0,
              transform: headerVisible ? 'translateX(0)' : 'translateX(20px)',
              transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s',
            }}
          >
            <span className="text-muted-foreground">Ordenar:</span>
            {[
              { value: 'recentes', label: 'Recentes' },
              { value: 'menor', label: 'Menor Preço' },
              { value: 'maior', label: 'Maior Preço' },
            ].map((option, index) => (
              <div key={option.value} className="flex items-center">
                <button
                  onClick={() => setSortBy(option.value)}
                  className={`transition-colors ${
                    sortBy === option.value
                      ? 'text-foreground underline underline-offset-4'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {option.label}
                </button>
                {index < 2 && <span className="text-muted-foreground/30 ml-4">·</span>}
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 md:gap-16">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-[4/5] mb-5" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-1/2 mx-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : produtos.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-muted-foreground">Nenhum produto encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 md:gap-16">
            {produtos.map((produto, index) => (
              <ProductCard 
                key={produto.id} 
                {...produto}
                mediaAvaliacoes={produto.mediaAvaliacoes}
                totalAvaliacoes={produto.totalAvaliacoes}
                index={index % 4}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}