import { Link } from 'react-router-dom';
import { Eye, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  id: string;
  nome: string;
  preco: number;
  preco_promocional?: number | null;
  imagem_url: string | null;
  categoria: string;
  mediaAvaliacoes?: number | null;
  totalAvaliacoes?: number;
}

export default function ProductCard({
  id,
  nome,
  preco,
  preco_promocional,
  imagem_url,
  categoria,
  mediaAvaliacoes,
  totalAvaliacoes = 0,
}: ProductCardProps) {
  const formatPrice = (price: number) => {
    return price.toFixed(2).replace('.', ',');
  };

  const hasDiscount = preco_promocional && preco_promocional < preco;
  const discountPercent = hasDiscount
    ? Math.round(((preco - preco_promocional) / preco) * 100)
    : 0;

  return (
    <div className="group card-elegant overflow-hidden">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-accent/30">
        <img
          src={imagem_url || '/placeholder.svg'}
          alt={nome}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-gradient-gold text-xs font-bold text-primary-foreground">
            -{discountPercent}%
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-background/80 backdrop-blur-sm text-xs font-medium capitalize">
          {categoria}
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Link to={`/produto/${id}`}>
            <Button className="btn-gold gap-2">
              <Eye className="h-4 w-4" />
              Ver Detalhes
            </Button>
          </Link>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <Link to={`/produto/${id}`}>
          <h3 className="font-display font-semibold text-lg mb-2 hover:text-primary transition-colors line-clamp-1">
            {nome}
          </h3>
        </Link>

        {/* Rating */}
        {totalAvaliacoes > 0 && mediaAvaliacoes !== null && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3.5 w-3.5 ${
                    star <= Math.round(mediaAvaliacoes)
                      ? 'fill-primary text-primary'
                      : 'text-muted-foreground/40'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              ({totalAvaliacoes})
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          {hasDiscount ? (
            <>
              <span className="text-sm text-muted-foreground line-through">
                R$ {formatPrice(preco)}
              </span>
              <span className="text-lg font-bold text-primary">
                R$ {formatPrice(preco_promocional)}
              </span>
            </>
          ) : (
            <span className="text-lg font-bold text-primary">
              R$ {formatPrice(preco)}
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-1">
          ou 3x de R$ {formatPrice((preco_promocional || preco) / 3)}
        </p>
      </div>
    </div>
  );
}
