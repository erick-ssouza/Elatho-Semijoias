import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, getSubtotal, itemCount } = useCart();

  const formatPrice = (price: number) => {
    return price.toFixed(2).replace('.', ',');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display text-xl">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Seu Carrinho
            {itemCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({itemCount} {itemCount === 1 ? 'item' : 'itens'})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Seu carrinho está vazio</p>
              <p className="text-sm text-muted-foreground mt-1">
                Adicione itens para continuar comprando
              </p>
            </div>
            <Button
              onClick={() => onOpenChange(false)}
              className="btn-gold mt-4"
            >
              Ver Produtos
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.id}-${item.variacao}`}
                  className="flex gap-4 p-3 rounded-xl bg-accent/50"
                >
                  <img
                    src={item.imagem_url || '/placeholder.svg'}
                    alt={item.nome}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{item.nome}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.variacao}
                    </p>
                    <p className="text-sm font-semibold text-primary mt-1">
                      R$ {formatPrice(item.preco_promocional ?? item.preco)}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.variacao, item.quantidade - 1)}
                          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-medium w-6 text-center">
                          {item.quantidade}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.variacao, item.quantidade + 1)}
                          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={item.estoque != null && item.quantidade >= item.estoque}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id, item.variacao)}
                        className="text-destructive hover:text-destructive/80 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-xl font-display font-semibold">
                  R$ {formatPrice(getSubtotal())}
                </span>
              </div>
              
              <div className="grid gap-2">
                <Link to="/checkout" onClick={() => onOpenChange(false)}>
                  <Button className="w-full btn-gold">
                    Finalizar Compra
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="w-full"
                >
                  Continuar Comprando
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
