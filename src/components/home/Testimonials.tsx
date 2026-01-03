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
    <div className="flex gap-1 justify-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= nota ? 'fill-[#B8860B] text-[#B8860B]' : 'text-[#B8860B]/20'
          }`}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <section className="py-24 md:py-32">
        <div className="container px-6 lg:px-12">
          <TestimonialSkeleton />
        </div>
      </section>
    );
  }

  const currentDepoimento = depoimentos[currentIndex] as Depoimento | undefined;

  return (
    <section className="py-24 md:py-36">
      <div className="container px-6 lg:px-12">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl text-foreground mb-3">
            O que nossas clientes dizem
          </h2>
          <div className="w-12 h-[1px] bg-[#B8860B] mx-auto" />
        </div>

        {/* Carousel */}
        <div className="max-w-3xl mx-auto mb-24 md:mb-32">
          {depoimentos.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="font-display italic text-lg">Seja a primeira a avaliar!</p>
            </div>
          ) : (
            <div 
              className="relative px-4 md:px-16"
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
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full border border-[#B8860B]/40 text-[#B8860B] hover:border-[#B8860B] hover:bg-[#B8860B]/5 transition-all duration-300"
                    aria-label="Depoimento anterior"
                  >
                    <ChevronLeft className="h-5 w-5 stroke-[1.5]" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full border border-[#B8860B]/40 text-[#B8860B] hover:border-[#B8860B] hover:bg-[#B8860B]/5 transition-all duration-300"
                    aria-label="Próximo depoimento"
                  >
                    <ChevronRight className="h-5 w-5 stroke-[1.5]" />
                  </button>
                </>
              )}

              {/* Testimonial Content */}
              <div 
                className={`relative text-center py-8 md:py-12 transition-opacity duration-300 ${
                  isTransitioning ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {currentDepoimento && (
                  <>
                    {/* Decorative Quote */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 pointer-events-none select-none">
                      <span 
                        className="font-display text-[120px] md:text-[180px] leading-none"
                        style={{ color: 'rgba(184, 134, 11, 0.12)' }}
                      >
                        "
                      </span>
                    </div>

                    {/* Testimonial Text */}
                    <p className="font-display text-xl md:text-2xl lg:text-[1.7rem] italic text-[#333] dark:text-foreground/90 leading-relaxed mb-8 px-4 relative z-10">
                      "{currentDepoimento.texto}"
                    </p>

                    {/* Client Name */}
                    <p className="text-xs tracking-[0.25em] uppercase font-medium text-foreground/80 mb-3">
                      {currentDepoimento.cliente_nome}
                    </p>

                    {/* Stars */}
                    <div className="mb-4">
                      {renderStars(currentDepoimento.nota)}
                    </div>

                    {/* Date */}
                    <p className="text-xs text-muted-foreground/60">
                      {format(new Date(currentDepoimento.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>

                    {/* Admin Response */}
                    {currentDepoimento.resposta_admin && (
                      <div className="mt-8 pt-6 border-t border-border/50 max-w-lg mx-auto">
                        <p className="text-sm text-muted-foreground italic">
                          <span className="font-medium text-[#B8860B] not-italic">Resposta da Elatho:</span>{' '}
                          {currentDepoimento.resposta_admin}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Pagination Indicators - Horizontal dashes */}
              {depoimentos.length > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {depoimentos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => changeSlide(index)}
                      className={`h-[2px] rounded-full transition-all duration-300 ${
                        index === currentIndex 
                          ? 'bg-[#B8860B] w-8' 
                          : 'bg-muted-foreground/20 w-4 hover:bg-muted-foreground/40'
                      }`}
                      aria-label={`Ir para depoimento ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Decorative Separator */}
        <div className="flex items-center justify-center gap-4 mb-16 md:mb-20">
          <div className="w-12 h-[1px] bg-border" />
          <div className="w-1.5 h-1.5 rotate-45 border border-[#B8860B]/40" />
          <div className="w-12 h-[1px] bg-border" />
        </div>

        {/* Form */}
        <div className="max-w-md mx-auto">
          <TestimonialForm />
        </div>
      </div>
    </section>
  );
}