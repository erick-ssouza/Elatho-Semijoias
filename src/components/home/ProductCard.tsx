import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Eye } from 'lucide-react';
import { QuickViewModal } from '@/components/product/QuickViewModal';

interface ProductCardProps {
  id: string;
  nome: string;
  preco: number;
  preco_promocional?: number | null;
  imagem_url: string | null;
  categoria: string;
  variacoes?: string[] | null;
  descricao?: string | null;
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
  variacoes,
  descricao,
  index = 0,
}: ProductCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewOpen(true);
  };

  return (
    <>
      <div 
        ref={cardRef}
        className="group block w-full"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)`,
          transitionDelay: `${index * 100}ms`,
        }}
      >
        {/* Image Container - 4:5 aspect ratio with hover effects */}
        <Link to={`/produto/${id}`} className="relative aspect-[4/5] overflow-hidden bg-muted mb-3 md:mb-5 block w-full">
          {/* Image with scale effect */}
          <img
            src={imagem_url || '/placeholder.svg'}
            alt={nome}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.05]"
          />
          
          {/* Hover overlay with gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Quick View Button */}
          <button
            onClick={handleQuickView}
            className="absolute top-4 right-4 p-2.5 bg-background/90 hover:bg-background text-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-10"
            aria-label="Visualização rápida"
          >
            <Eye className="h-4 w-4" />
          </button>

          {/* Quick view text */}
          <div className="absolute inset-0 hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
            <span className="text-white text-xs uppercase tracking-[0.2em] px-6 py-3 border border-white/50 bg-black/20 backdrop-blur-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              Ver Detalhes
            </span>
          </div>

          {/* Corner accent on hover */}
          <div className="absolute top-0 left-0 w-0 h-0 border-t-[40px] border-t-white/90 border-r-[40px] border-r-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100" />
        </Link>

        {/* Info - Centered, minimal with hover effect */}
        <Link to={`/produto/${id}`} className="text-center space-y-1 md:space-y-2 transition-transform duration-500 group-hover:-translate-y-1 block w-full">
          <h3 className="font-display text-sm md:text-base lg:text-lg font-medium text-foreground leading-tight group-hover:text-primary transition-colors duration-300 line-clamp-2 px-1">
            {nome}
          </h3>
          
          <div className="flex items-center justify-center gap-2 md:gap-3">
            {hasDiscount ? (
              <>
                <span className="text-xs md:text-sm text-muted-foreground line-through">
                  R$ {formatPrice(preco)}
                </span>
                <span className="text-xs md:text-sm text-foreground">
                  R$ {formatPrice(preco_promocional)}
                </span>
              </>
            ) : (
              <span className="text-xs md:text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                R$ {formatPrice(preco)}
              </span>
            )}
          </div>
          
          {/* Underline animation - hidden on mobile */}
          <div className="hidden md:block w-0 h-[1px] bg-foreground mx-auto group-hover:w-12 transition-all duration-500 ease-out" />
        </Link>
      </div>

      <QuickViewModal
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        product={{
          id,
          nome,
          preco,
          preco_promocional,
          imagem_url,
          variacoes,
          descricao,
        }}
      />
    </>
  );
}