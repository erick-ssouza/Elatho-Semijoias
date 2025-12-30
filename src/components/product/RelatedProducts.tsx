import { Link } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { useRelatedProducts } from '@/hooks/useProductQueries';
import { ProductSkeleton } from '@/components/ui/skeletons';

interface RelatedProductsProps {
  categoria: string;
  currentProductId: string;
}

function RelatedProductCard({ 
  produto, 
  index 
}: { 
  produto: { id: string; nome: string; preco: number; preco_promocional?: number | null; imagem_url: string | null };
  index: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const formatPrice = (price: number) => {
    return price.toFixed(2).replace('.', ',');
  };

  const hasDiscount = produto.preco_promocional && produto.preco_promocional < produto.preco;
  const finalPrice = produto.preco_promocional || produto.preco;

  return (
    <Link
      ref={cardRef}
      key={produto.id}
      to={`/produto/${produto.id}`}
      className="group block"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.5s ease-out, transform 0.5s ease-out`,
        transitionDelay: `${index * 100}ms`,
      }}
    >
      <div className="aspect-square overflow-hidden bg-muted/30 rounded-sm">
        <img
          src={produto.imagem_url || '/placeholder.svg'}
          alt={produto.nome}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
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
}

export function RelatedProducts({ categoria, currentProductId }: RelatedProductsProps) {
  const { data: produtos = [], isLoading: loading } = useRelatedProducts(categoria, currentProductId);

  if (loading) {
    return <ProductSkeleton count={4} columns={4} />;
  }

  if (produtos.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {produtos.map((produto, index) => (
        <RelatedProductCard key={produto.id} produto={produto} index={index} />
      ))}
    </div>
  );
}