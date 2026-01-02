import { useState } from 'react';
import { Star, Loader2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function TestimonialForm() {
  const [nome, setNome] = useState('');
  const [texto, setTexto] = useState('');
  const [nota, setNota] = useState(5);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || !texto.trim()) {
      toast({
        title: 'Preencha todos os campos',
        description: 'Nome e avaliação são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    if (texto.trim().length < 10) {
      toast({
        title: 'Avaliação muito curta',
        description: 'Por favor, escreva um pouco mais sobre sua experiência.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('depoimentos').insert({
        cliente_nome: nome.trim(),
        texto: texto.trim(),
        nota,
        aprovado: false,
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: 'Avaliação enviada!',
        description: 'Obrigada! Sua avaliação será publicada após aprovação.',
      });

      // Reset form after 3 seconds
      setTimeout(() => {
        setNome('');
        setTexto('');
        setNota(5);
        setSubmitted(false);
      }, 5000);
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      toast({
        title: 'Erro ao enviar avaliação',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center animate-fade-in">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-display mb-2">Obrigada!</h3>
        <p className="text-muted-foreground">
          Sua avaliação foi enviada e será publicada após aprovação.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 md:p-8">
      <h3 className="text-xl font-display mb-6">Deixe sua avaliação</h3>

      <div className="space-y-4">
        {/* Nome */}
        <div>
          <label htmlFor="nome" className="block text-sm font-medium mb-2">
            Seu nome
          </label>
          <Input
            id="nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Como você gostaria de ser identificada?"
            maxLength={100}
            required
          />
        </div>

        {/* Estrelas */}
        <div>
          <label className="block text-sm font-medium mb-2">Sua nota</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setNota(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(null)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`h-7 w-7 transition-colors ${
                    star <= (hoveredStar ?? nota)
                      ? 'fill-primary text-primary'
                      : 'text-muted-foreground/30'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Texto */}
        <div>
          <label htmlFor="texto" className="block text-sm font-medium mb-2">
            Sua experiência
          </label>
          <Textarea
            id="texto"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Conte como foi sua experiência com a Elatho..."
            rows={4}
            maxLength={500}
            required
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {texto.length}/500
          </p>
        </div>

        {/* Botão */}
        <Button
          type="submit"
          className="w-full bg-gradient-gold hover:opacity-90"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            'Enviar avaliação'
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Sua avaliação será publicada após aprovação da nossa equipe.
        </p>
      </div>
    </form>
  );
}
