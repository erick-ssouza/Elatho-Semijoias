import { Link } from 'react-router-dom';

interface RecentProduct {
  id: string;
  nome: string;
  preco: number;
  preco_promocional: number | null;
  imagem_url: string | null;
}

interface RecentlyViewedProps {
  products: RecentProduct[];
}

export function RecentlyViewed({ products }: RecentlyViewedProps) {
  if (products.length === 0) {
    return null;
  }

  const formatPrice = (price: number) => {
    return price.toFixed(2).replace('.', ',');
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {products.map((produto) => {
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