import { useState } from "react";
import { Link } from "react-router-dom";
import { X, ShoppingBag } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface QuickViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    nome: string;
    preco: number;
    preco_promocional?: number | null;
    imagem_url: string | null;
    variacoes?: string[] | null;
    descricao?: string | null;
    estoque?: number | null;
  };
}

export function QuickViewModal({ open, onOpenChange, product }: QuickViewModalProps) {
  const [selectedVariacao, setSelectedVariacao] = useState<string | null>(null);
  const { addItem } = useCart();

  const formatPrice = (price: number) =>
    price.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  const finalPrice = product.preco_promocional || product.preco;
  const hasDiscount = product.preco_promocional && product.preco_promocional < product.preco;
  const variacoes = product.variacoes || ["Dourado", "Prateado", "Rosé"];
  const isOutOfStock = product.estoque !== null && product.estoque !== undefined && product.estoque <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    
    if (!selectedVariacao) {
      toast.error("Selecione uma variação");
      return;
    }

    addItem({
      id: product.id,
      nome: product.nome,
      preco: finalPrice,
      imagem_url: product.imagem_url || "",
      variacao: selectedVariacao,
      estoque: product.estoque,
    }, 1);

    toast.success("Produto adicionado ao carrinho!");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 bg-background border border-border overflow-hidden">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-10 p-2 bg-background/80 hover:bg-background transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid md:grid-cols-2">
          {/* Image */}
          <div className="aspect-square bg-muted">
            <img
              src={product.imagem_url || "/placeholder.svg"}
              alt={product.nome}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="p-6 flex flex-col">
            <h2 className="text-xl font-display">{product.nome}</h2>
            
            <div className="flex items-baseline gap-2 mt-2">
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  R$ {formatPrice(product.preco)}
                </span>
              )}
              <span className="text-2xl">R$ {formatPrice(finalPrice)}</span>
            </div>

            {product.descricao && (
              <p className="text-sm text-muted-foreground mt-4 line-clamp-3">
                {product.descricao}
              </p>
            )}

            {/* Variations */}
            <div className="mt-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Variação
              </p>
              <div className="flex flex-wrap gap-2">
                {variacoes.map((v) => (
                  <button
                    key={v}
                    onClick={() => setSelectedVariacao(v)}
                    className={`px-4 py-2 text-xs uppercase tracking-wider border transition-all ${
                      selectedVariacao === v
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-6 space-y-3">
              {isOutOfStock ? (
                <div className="w-full py-3 text-center border border-border bg-muted text-muted-foreground cursor-not-allowed">
                  <span className="text-xs uppercase tracking-[0.15em]">Produto Esgotado</span>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="btn-minimal w-full flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Adicionar ao Carrinho
                </button>
              )}

              <Link
                to={`/produto/${product.id}`}
                onClick={() => onOpenChange(false)}
                className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
              >
                Ver detalhes completos
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
