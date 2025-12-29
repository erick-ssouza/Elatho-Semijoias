import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Star, Loader2 } from "lucide-react";
import { z } from "zod";

const reviewSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: z.string().email("Email inválido").max(255),
  titulo: z.string().max(100).optional(),
  comentario: z.string().max(1000).optional(),
});

interface ProductReviewFormProps {
  produtoId: string;
  produtoNome: string;
  onSuccess?: () => void;
}

const ProductReviewForm = ({ produtoId, produtoNome, onSuccess }: ProductReviewFormProps) => {
  const [nota, setNota] = useState(5);
  const [hoverNota, setHoverNota] = useState(0);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [titulo, setTitulo] = useState("");
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      reviewSchema.parse({ nome, email, titulo, comentario });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("avaliacoes").insert({
        produto_id: produtoId,
        cliente_nome: nome,
        cliente_email: email,
        nota,
        titulo: titulo || null,
        comentario: comentario || null,
      });

      if (error) throw error;

      toast({
        title: "Avaliação enviada!",
        description: "Sua avaliação será publicada após aprovação.",
      });

      // Reset form
      setNome("");
      setEmail("");
      setTitulo("");
      setComentario("");
      setNota(5);
      
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erro ao enviar avaliação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Sua nota para "{produtoNome}"</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setNota(star)}
              onMouseEnter={() => setHoverNota(star)}
              onMouseLeave={() => setHoverNota(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hoverNota || nota)
                    ? "fill-primary text-primary"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Seu nome *</Label>
          <Input
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Maria Silva"
            className={errors.nome ? "border-destructive" : ""}
          />
          {errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Seu email *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="titulo">Título da avaliação</Label>
        <Input
          id="titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ex: Produto excelente!"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="comentario">Seu comentário</Label>
        <Textarea
          id="comentario"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Conte sua experiência com o produto..."
          rows={4}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Enviando...
          </>
        ) : (
          "Enviar Avaliação"
        )}
      </Button>
    </form>
  );
};

export default ProductReviewForm;
