import { Link } from "react-router-dom";
import { X, ShoppingBag } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { gerarDescricaoAutomatica, combinarDescricoes } from "@/lib/productDescriptions";

interface QuickViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    nome: string;
    preco: number;
    preco_promocional?: number | null;
    imagem_url: string | null;
    descricao?: string | null;
    estoque?: number | null;
    categoria?: string;
    tipo_material?: string | null;
  };
}

export function QuickViewModal({ open, onOpenChange, product }: QuickViewModalProps) {
  const { addItem } = useCart();

  const formatPrice = (price: number) =>
    price.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  const finalPrice = product.preco_promocional || product.preco;
  const hasDiscount = product.preco_promocional && product.preco_promocional < product.preco;
  const isOutOfStock = product.estoque !== null && product.estoque !== undefined && product.estoque <= 0;

  // Gerar descrição dinamicamente se tiver tipo_material
  const descricaoGerada = product.tipo_material && product.categoria
    ? gerarDescricaoAutomatica(product.categoria, product.tipo_material)
    : null;
  const descricaoFinal = descricaoGerada 
    ? combinarDescricoes(descricaoGerada, product.descricao)
    : product.descricao;
  
  // Pegar apenas a frase de valorização (primeira linha)
  const fraseValorizacao = descricaoFinal?.split('\n\n')[0].split('\n')[0] || null;

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    addItem({
      id: product.id,
      nome: product.nome,
      preco: finalPrice,
      imagem_url: product.imagem_url || "",
      variacao: "Padrão",
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

            {fraseValorizacao && (
              <p className="text-sm text-muted-foreground mt-4 line-clamp-2 italic">
                {fraseValorizacao}
              </p>
            )}

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
