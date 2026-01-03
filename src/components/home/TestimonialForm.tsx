import { useState } from 'react';
import { Star, Loader2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

      // Reset form after 5 seconds
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
      <div className="text-center py-12 animate-fade-in">
        <div className="w-16 h-16 bg-[#B8860B]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="h-8 w-8 text-[#B8860B]" />
        </div>
        <h3 className="font-display text-2xl mb-2">Obrigada!</h3>
        <p className="text-muted-foreground">
          Sua avaliação foi enviada e será publicada após aprovação.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      {/* Title with ornament */}
      <h3 className="font-display text-2xl md:text-3xl mb-3">
        Deixe sua avaliação
      </h3>
      <div className="w-12 h-[1px] bg-[#B8860B] mx-auto mb-10" />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Name Input - Underline style */}
        <div className="text-left">
          <label 
            htmlFor="nome" 
            className="block text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3"
          >
            Seu nome
          </label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Como você gostaria de ser identificada?"
            maxLength={100}
            required
            className="w-full bg-transparent border-0 border-b border-border/60 px-0 py-3 text-foreground placeholder:text-muted-foreground/40 focus:border-[#B8860B] focus:ring-0 focus:outline-none transition-colors"
          />
        </div>

        {/* Star Rating */}
        <div className="text-left">
          <label className="block text-xs uppercase tracking-[0.15em] text-muted-foreground mb-4">
            Sua nota
          </label>
          <div className="flex gap-2 justify-start">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setNota(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(null)}
                className="p-1 transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    star <= (hoveredStar ?? nota)
                      ? 'fill-[#B8860B] text-[#B8860B]'
                      : 'text-[#B8860B]/30 stroke-[1.5]'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Text Input - Underline style */}
        <div className="text-left">
          <label 
            htmlFor="texto" 
            className="block text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3"
          >
            Sua experiência
          </label>
          <textarea
            id="texto"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Conte como foi sua experiência com a Elatho..."
            rows={4}
            maxLength={500}
            required
            className="w-full bg-transparent border-0 border-b border-border/60 px-0 py-3 text-foreground placeholder:text-muted-foreground/40 focus:border-[#B8860B] focus:ring-0 focus:outline-none transition-colors resize-none"
          />
          <p className="text-xs text-muted-foreground/50 mt-2 text-right">
            {texto.length}/500
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#B8860B] hover:bg-[#9A7209] text-white py-4 rounded-lg font-medium transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </span>
          ) : (
            'Enviar avaliação'
          )}
        </button>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground/50 italic">
          Sua avaliação será publicada após aprovação da nossa equipe.
        </p>
      </form>
    </div>
  );
}