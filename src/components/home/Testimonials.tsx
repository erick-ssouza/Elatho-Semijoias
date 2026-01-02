import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
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
  const [showAll, setShowAll] = useState(false);
  
  // Touch/swipe state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const changeSlide = useCallback((newIndex: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning]);

  const nextSlide = useCallback(() => {
    if (depoimentos.length === 0) return;
    changeSlide((currentIndex + 1) % depoimentos.length);
  }, [currentIndex, depoimentos.length, changeSlide]);

  const prevSlide = useCallback(() => {
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
  };

  // Auto-play every 5 seconds
  useEffect(() => {
    if (depoimentos.length <= 1 || isPaused) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [depoimentos.length, nextSlide, isPaused]);

  const displayedDepoimentos = showAll ? depoimentos : depoimentos.slice(0, 6);

  const renderStars = (nota: number) => (
    <div className="flex gap-0.5 mb-3">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
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

  return (
    <section className="py-20 md:py-32 bg-muted/30">
      <div className="container px-6 lg:px-12">
        <h2 className="font-display text-3xl md:text-4xl text-center mb-4">
          O que nossas clientes dizem
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
          Avaliações reais de quem já experimentou nossas semijoias
        </p>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Depoimentos em Grid */}
          <div className="lg:col-span-2">
            {depoimentos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Seja a primeira a avaliar!</p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  {displayedDepoimentos.map((depoimento: Depoimento) => (
                    <div
                      key={depoimento.id}
                      className="bg-card border border-border rounded-lg p-6 animate-fade-in"
                    >
                      {renderStars(depoimento.nota)}
                      <p className="text-foreground mb-4 leading-relaxed">
                        "{depoimento.texto}"
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{depoimento.cliente_nome}</span>
                        <span className="text-muted-foreground">
                          {format(new Date(depoimento.created_at), "dd 'de' MMMM", { locale: ptBR })}
                        </span>
                      </div>
                      {depoimento.resposta_admin && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-primary">Resposta da Elatho:</span>{' '}
                            {depoimento.resposta_admin}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {depoimentos.length > 6 && !showAll && (
                  <div className="text-center mt-8">
                    <button
                      onClick={() => setShowAll(true)}
                      className="text-sm uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Ver mais avaliações ({depoimentos.length - 6} restantes)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Formulário */}
          <div className="lg:col-span-1">
            <TestimonialForm />
          </div>
        </div>
      </div>
    </section>
  );
}