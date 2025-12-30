import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Produto {
  id: string;
  nome: string;
  preco: number;
  preco_promocional: number | null;
  imagem_url: string | null;
  categoria: string;
}

interface RelatedProductsProps {
  categoria: string;
  currentProductId: string;
}

export function RelatedProducts({ categoria, currentProductId }: RelatedProductsProps) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('produtos')
        .select('id, nome, preco, preco_promocional, imagem_url, categoria')
        .eq('categoria', categoria)
        .neq('id', currentProductId)
        .limit(4);

      if (data) {
        setProdutos(data);
      }
      setLoading(false);
    };

    fetchRelated();
  }, [categoria, currentProductId]);

  const formatPrice = (price: number) => {
    return price.toFixed(2).replace('.', ',');
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square bg-muted rounded-sm" />
            <div className="mt-3 h-4 bg-muted rounded w-3/4" />
            <div className="mt-2 h-3 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (produtos.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {produtos.map((produto) => {
        const hasDiscount = produto.preco_promocional && produto.preco_promocional < produto.preco;
        const finalPrice = produto.preco_promocional || produto.preco;

        return (
          <Link
            key={produto.id}
            to={`/produto/${produto.id}`}
            className="group block"
          >
            <div className="aspect-square overflow-hidden bg-muted/30 rounded-sm">
              <img
                src={produto.imagem_url || '/placeholder.svg'}
                alt={produto.nome}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="mt-3 space-y-1">
              <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                {produto.nome}
              </h3>
              <div className="flex items-center gap-2">
                {hasDiscount ? (
                  <>
                    <span className="text-xs text-muted-foreground line-through">
                      R$ {formatPrice(produto.preco)}
                    </span>
                    <span className="text-sm text-foreground">
                      R$ {formatPrice(produto.preco_promocional!)}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    R$ {formatPrice(finalPrice)}
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}