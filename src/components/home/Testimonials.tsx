import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import { useTestimonials } from '@/hooks/useProductQueries';
import { TestimonialSkeleton } from '@/components/ui/skeletons';
import TestimonialForm from './TestimonialForm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Depoimento {
  id: string;
  cliente_nome: string;
  texto: string;
  nota: number;
  resposta_admin: string | null;
  created_at: string;
}

export default function Testimonials() {
  const { data: depoimentos = [], isLoading: loading } = useTestimonials();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Touch/swipe state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const changeSlide = useCallback((newIndex: number) => {
    if (isTransitioning || depoimentos.length === 0) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning, depoimentos.length]);

  const nextSlide = useCallback(() => {
    if (depoimentos.length === 0) return;
    changeSlide((currentIndex + 1) % depoimentos.length);
  }, [currentIndex, depoimentos.length, changeSlide]);

  const prevSlide = useCallback(() => {
    if (depoimentos.length === 0) return;
    changeSlide((currentIndex - 1 + depoimentos.length) % depoimentos.length);
  }, [currentIndex, depoimentos.length, changeSlide]);

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
    setTimeout(() => setIsPaused(false), 3000);
  };

  // Auto-play every 5 seconds
  useEffect(() => {
    if (depoimentos.length <= 1 || isPaused) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [depoimentos.length, nextSlide, isPaused]);

  const renderStars = (nota: number) => (
    <div className="flex gap-1 justify-center mb-4">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-5 w-5 ${
            star <= nota ? 'fill-primary text-primary' : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <section className="py-20 md:py-32">
        <div className="container px-6 lg:px-12">
          <TestimonialSkeleton />
        </div>
      </section>
    );
  }

  const currentDepoimento = depoimentos[currentIndex] as Depoimento | undefined;

  return (
    <section className="py-20 md:py-32 bg-muted/30">
      <div className="container px-6 lg:px-12">
        <h2 className="font-display text-3xl md:text-4xl text-center mb-4">
          O que nossas clientes dizem
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
          Avaliações reais de quem já experimentou nossas semijoias
        </p>

        {/* Carousel */}
        <div className="max-w-3xl mx-auto mb-16">
          {depoimentos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Seja a primeira a avaliar!</p>
            </div>
          ) : (
            <div 
              className="relative"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Navigation Arrows */}
              {depoimentos.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-background border border-border shadow-md hover:bg-muted transition-colors"
                    aria-label="Depoimento anterior"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-background border border-border shadow-md hover:bg-muted transition-colors"
                    aria-label="Próximo depoimento"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Card */}
              <div 
                className={`bg-card border border-border rounded-xl p-8 md:p-12 text-center transition-opacity duration-300 ${
                  isTransitioning ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {currentDepoimento && (
                  <>
                    <Quote className="h-10 w-10 text-primary/30 mx-auto mb-6" />
                    <p className="text-lg md:text-xl italic text-foreground mb-6 leading-relaxed">
                      "{currentDepoimento.texto}"
                    </p>
                    <p className="font-medium text-foreground mb-2">
                      {currentDepoimento.cliente_nome}
                    </p>
                    {renderStars(currentDepoimento.nota)}
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(currentDepoimento.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    {currentDepoimento.resposta_admin && (
                      <div className="mt-6 pt-6 border-t border-border">
                        <p className="text-sm text-muted-foreground italic">
                          <span className="font-medium text-primary not-italic">Resposta da Elatho:</span>{' '}
                          {currentDepoimento.resposta_admin}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Pagination Dots */}
              {depoimentos.length > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {depoimentos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => changeSlide(index)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        index === currentIndex 
                          ? 'bg-primary w-6' 
                          : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                      }`}
                      aria-label={`Ir para depoimento ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="max-w-md mx-auto">
          <TestimonialForm />
        </div>
      </div>
    </section>
  );
}