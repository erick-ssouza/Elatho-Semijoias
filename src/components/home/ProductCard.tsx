import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Eye, Heart } from 'lucide-react';
import { QuickViewModal } from '@/components/product/QuickViewModal';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
  estoque?: number | null;
  tipo_material?: string | null;
  index?: number;
}

export default function ProductCard({
  id,
  nome,
  preco,
  preco_promocional,
  imagem_url,
  categoria,
  variacoes,
  descricao,
  estoque,
  tipo_material,
  index = 0,
}: ProductCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { favorites, loading: favLoading, addFavorite, removeFavorite } = useFavorites();
  
  const isFavorited = favorites.includes(id);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logado para adicionar favoritos.',
        variant: 'destructive',
      });
      return;
    }
    
    if (isFavorited) {
      await removeFavorite(id);
    } else {
      await addFavorite(id);
    }
  };

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
  const isOutOfStock = estoque !== null && estoque !== undefined && estoque <= 0;

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock) {
      setQuickViewOpen(true);
    }
  };

  return (
    <>
      <div 
        ref={cardRef}
        className="group block w-full"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.98)',
          transition: `opacity 0.5s ease-out, transform 0.5s ease-out`,
          transitionDelay: `${index * 80}ms`,
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
          
          {/* Out of Stock Badge */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <span className="bg-background text-foreground text-xs uppercase tracking-[0.15em] px-4 py-2 font-medium">
                Esgotado
              </span>
            </div>
          )}
          
          {/* Favorite Button - Top Left */}
          <button
            onClick={handleToggleFavorite}
            disabled={favLoading}
            className={`absolute top-3 left-3 p-2 bg-background/80 hover:bg-background rounded-full transition-all duration-300 z-10 ${
              isFavorited ? 'text-red-500' : 'text-foreground/70 hover:text-foreground'
            }`}
            aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
          </button>

          {/* Quick View Button */}
          {!isOutOfStock && (
            <button
              onClick={handleQuickView}
              className="absolute top-3 right-3 p-2 bg-background/80 hover:bg-background rounded-full text-foreground/70 hover:text-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-10"
              aria-label="Visualização rápida"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}

          {/* Quick view text */}
          {!isOutOfStock && (
            <div className="absolute inset-0 hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
              <span className="text-white text-xs uppercase tracking-[0.2em] px-6 py-3 border border-white/50 bg-black/20 backdrop-blur-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                Ver Detalhes
              </span>
            </div>
          )}

          {/* Corner accent on hover */}
          {!isOutOfStock && (
            <div className="absolute top-0 left-0 w-0 h-0 border-t-[40px] border-t-white/90 border-r-[40px] border-r-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100" />
          )}
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

      {!isOutOfStock && (
        <QuickViewModal
          open={quickViewOpen}
          onOpenChange={setQuickViewOpen}
          product={{
            id,
            nome,
            preco,
            preco_promocional,
            imagem_url,
            descricao,
            estoque,
            categoria,
            tipo_material,
          }}
        />
      )}
    </>
  );
}