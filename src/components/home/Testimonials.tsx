import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

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
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-champagne/10 to-background" />
      <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-champagne/30 blur-3xl" />

      <div className="container relative z-10 px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-display font-bold">
            O que nossas <span className="text-gradient-gold">clientes</span> dizem
          </h2>
          <p className="text-muted-foreground mt-2">
            Experiências reais de quem escolheu Elatho
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="relative card-elegant p-8 md:p-12">
            {/* Quote icon */}
            <Quote className="absolute top-6 left-6 h-10 w-10 text-primary/20" />

            <div className="text-center space-y-6">
              {/* Stars */}
              <div className="flex items-center justify-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < currentDepoimento.nota
                        ? 'fill-primary text-primary'
                        : 'text-border'
                    }`}
                  />
                ))}
              </div>

              {/* Text */}
              <blockquote className="text-lg md:text-xl text-foreground leading-relaxed">
                "{currentDepoimento.texto}"
              </blockquote>

              {/* Admin response */}
              {currentDepoimento.resposta_admin && (
                <div className="bg-accent/50 rounded-xl p-4 text-sm text-muted-foreground">
                  <span className="font-medium text-primary">Elatho: </span>
                  {currentDepoimento.resposta_admin}
                </div>
              )}

              {/* Author */}
              <div>
                <p className="font-display font-semibold text-lg">
                  {currentDepoimento.cliente_nome}
                </p>
                <p className="text-sm text-muted-foreground">Cliente Verificada</p>
              </div>
            </div>

            {/* Navigation */}
            {depoimentos.length > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevSlide}
                  className="rounded-full"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-2">
                  {depoimentos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === currentIndex
                          ? 'w-6 bg-primary'
                          : 'bg-border hover:bg-primary/50'
                      }`}
                    />
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextSlide}
                  className="rounded-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
