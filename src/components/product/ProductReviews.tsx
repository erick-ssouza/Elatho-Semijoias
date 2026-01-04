import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, MessageSquare, BadgeCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Review {
  id: string;
  cliente_nome: string;
  cliente_email?: string;
  nota: number;
  titulo: string | null;
  comentario: string | null;
  created_at: string;
}

interface ProductReviewsProps {
  produtoId: string;
  refreshTrigger?: number;
}

const ProductReviews = ({ produtoId, refreshTrigger }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [verifiedIds, setVerifiedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchReviews();
  }, [produtoId, refreshTrigger]);

  const fetchReviews = async () => {
    try {
      // Fetch reviews from the avaliacoes table (admin view has cliente_email)
      const { data, error } = await supabase
        .from("avaliacoes")
        .select("id, cliente_nome, cliente_email, nota, titulo, comentario, created_at")
        .eq("produto_id", produtoId)
        .eq("aprovado", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReviews(data || []);

      if (data && data.length > 0) {
        const avg = data.reduce((acc, r) => acc + r.nota, 0) / data.length;
        setAverageRating(avg);
        
        // Check verified purchases
        checkVerifiedPurchases(data, produtoId);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkVerifiedPurchases = async (reviewData: Review[], productId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("check-verified-purchase", {
        body: {
          reviews: reviewData.map(r => ({ id: r.id, cliente_email: r.cliente_email })),
          produto_id: productId,
        },
      });

      if (error) throw error;
      if (data?.verifiedIds) {
        setVerifiedIds(data.verifiedIds);
      }
    } catch (error) {
      console.error("Error checking verified purchases:", error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "fill-primary text-primary" : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-accent/30 rounded-xl">
        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhuma avaliação ainda.</p>
        <p className="text-sm text-muted-foreground mt-1">Seja o primeiro a avaliar!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-4 p-4 bg-accent/30 rounded-xl">
        <div className="text-center">
          <p className="text-4xl font-bold text-primary">{averageRating.toFixed(1)}</p>
          <div className="flex justify-center mt-1">{renderStars(Math.round(averageRating))}</div>
        </div>
        <div className="text-muted-foreground">
          <p className="font-medium text-foreground">{reviews.length} avaliações</p>
          <p className="text-sm">Média das notas</p>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="p-4 bg-card border border-border rounded-xl space-y-2"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{review.cliente_nome}</p>
                  {verifiedIds.includes(review.id) && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                      <BadgeCheck className="w-3 h-3" />
                      Compra Verificada
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {renderStars(review.nota)}
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(review.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
              </div>
            </div>
            {review.titulo && (
              <p className="font-medium text-primary">{review.titulo}</p>
            )}
            {review.comentario && (
              <p className="text-muted-foreground">{review.comentario}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductReviews;
