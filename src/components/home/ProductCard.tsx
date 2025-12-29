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
      {/* Image Container - 4:5 aspect ratio with hover effects */}
      <div className="relative aspect-[4/5] overflow-hidden bg-muted mb-5">
        {/* Image with scale effect */}
        <img
          src={imagem_url || '/placeholder.svg'}
          alt={nome}
          className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.05]"
        />
        
        {/* Hover overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Quick view text */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
          <span className="text-white text-xs uppercase tracking-[0.2em] px-6 py-3 border border-white/50 bg-black/20 backdrop-blur-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
            Ver Detalhes
          </span>
        </div>

        {/* Corner accent on hover */}
        <div className="absolute top-0 left-0 w-0 h-0 border-t-[40px] border-t-white/90 border-r-[40px] border-r-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100" />
      </div>

      {/* Info - Centered, minimal with hover effect */}
      <div className="text-center space-y-2 transition-transform duration-500 group-hover:-translate-y-1">
        <h3 className="font-display text-base md:text-lg font-medium text-foreground leading-tight group-hover:text-primary transition-colors duration-300">
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
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
              R$ {formatPrice(preco)}
            </span>
          )}
        </div>
        
        {/* Underline animation */}
        <div className="w-0 h-[1px] bg-foreground mx-auto group-hover:w-12 transition-all duration-500 ease-out" />
      </div>
    </Link>
  );
}