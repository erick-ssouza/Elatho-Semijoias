import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchProdutos = async () => {
      setLoading(true);
      
      let query = supabase
        .from('produtos')
        .select('id, nome, preco, preco_promocional, imagem_url, categoria')
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
        {/* Header - Minimal */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-normal text-foreground">
              Coleção
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {produtos.length} produto{produtos.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Sort - Text only */}
          <div className="flex items-center gap-4 text-xs uppercase tracking-[0.15em]">
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
            {produtos.map((produto) => (
              <ProductCard 
                key={produto.id} 
                {...produto}
                mediaAvaliacoes={produto.mediaAvaliacoes}
                totalAvaliacoes={produto.totalAvaliacoes}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}