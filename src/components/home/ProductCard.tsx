import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

interface ProductCardProps {
  id: string;
  nome: string;
  preco: number;
  preco_promocional?: number | null;
  imagem_url: string | null;
  categoria: string;
  mediaAvaliacoes?: number | null;
  totalAvaliacoes?: number;
  index?: number;
}

export default function ProductCard({
  id,
  nome,
  preco,
  preco_promocional,
  imagem_url,
  index = 0,
}: ProductCardProps) {
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

  const hasDiscount = preco_promocional && preco_promocional < preco;

  return (
    <Link 
      ref={cardRef}
      to={`/produto/${id}`} 
      className="group block"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)`,
        transitionDelay: `${index * 100}ms`,
      }}
    >
      {/* Image Container - 4:5 aspect ratio */}
      <div className="relative aspect-[4/5] overflow-hidden bg-muted mb-5">
        <img
          src={imagem_url || '/placeholder.svg'}
          alt={nome}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      </div>

      {/* Info - Centered, minimal */}
      <div className="text-center space-y-2">
        <h3 className="font-display text-base md:text-lg font-medium text-foreground leading-tight">
          {nome}
        </h3>
        
        <div className="flex items-center justify-center gap-3">
          {hasDiscount ? (
            <>
              <span className="text-sm text-muted-foreground line-through">
                R$ {formatPrice(preco)}
              </span>
              <span className="text-sm text-foreground">
                R$ {formatPrice(preco_promocional)}
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              R$ {formatPrice(preco)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}