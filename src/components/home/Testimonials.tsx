import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Depoimento {
  id: string;
  cliente_nome: string;
  texto: string;
  nota: number;
  resposta_admin: string | null;
}

export default function Testimonials() {
  const [depoimentos, setDepoimentos] = useState<Depoimento[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepoimentos = async () => {
      const { data, error } = await supabase
        .from('depoimentos')
        .select('*')
        .eq('aprovado', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setDepoimentos(data);
      }
      setLoading(false);
    };

    fetchDepoimentos();
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % depoimentos.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + depoimentos.length) % depoimentos.length);
  };

  if (loading || depoimentos.length === 0) {
    return null;
  }

  const currentDepoimento = depoimentos[currentIndex];

  return (
    <section className="py-20 md:py-32">
      <div className="container px-6 lg:px-12">
        <div className="max-w-3xl mx-auto text-center">
          {/* Large decorative quote */}
          <span className="text-6xl md:text-8xl font-display text-border leading-none select-none">
            "
          </span>

          {/* Testimonial text */}
          <blockquote className="font-display text-xl md:text-2xl lg:text-3xl font-normal italic text-foreground leading-relaxed -mt-8 mb-8">
            {currentDepoimento.texto}
          </blockquote>

          {/* Author */}
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            — {currentDepoimento.cliente_nome}
          </p>

          {/* Navigation */}
          {depoimentos.length > 1 && (
            <div className="flex items-center justify-center gap-8 mt-12">
              <button
                onClick={prevSlide}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-5 w-5 stroke-[1]" />
              </button>
              
              <div className="flex items-center gap-2">
                {depoimentos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      i === currentIndex
                        ? 'bg-foreground'
                        : 'bg-border hover:bg-muted-foreground'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight className="h-5 w-5 stroke-[1]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}