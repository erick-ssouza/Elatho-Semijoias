import { ArrowDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function Hero() {
  const [scrollY, setScrollY] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        // Only apply parallax when hero is visible
        if (rect.bottom > 0) {
          setScrollY(window.scrollY);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToProducts = () => {
    const element = document.getElementById('produtos');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Calculate opacity based on scroll (fade out as user scrolls)
  const textOpacity = Math.max(0, 1 - scrollY / 400);
  const textTranslateY = scrollY * 0.2;
  
  // Calculate blur based on scroll (increases as user scrolls)
  const blurAmount = Math.min(10, scrollY / 50);

  return (
    <section ref={sectionRef} className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Background Image - Gold and Silver Jewelry with Parallax and Progressive Blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=2070&auto=format&fit=crop)',
          transform: `translateY(${scrollY * 0.4}px) scale(1.1)`,
          filter: `blur(${blurAmount}px)`,
        }}
      />
      
      {/* Gradient overlay - darker at top for text readability */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 100%)'
        }}
      />
      
      {/* Vignette overlay - darkens edges */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)'
        }}
      />

      {/* Content - Left aligned with fade on scroll */}
      <div 
        className="container relative z-10 px-6 lg:px-12 will-change-transform"
        style={{
          opacity: textOpacity,
          transform: `translateY(${textTranslateY}px)`,
        }}
      >
        <div className="max-w-2xl">
          {/* Subtitle with letter-spacing animation */}
          <p 
            className="text-[10px] uppercase tracking-[0.3em] text-white/70 mb-6 animate-letter-spacing"
          >
            Coleção 2025
          </p>

          {/* Title with staggered reveal */}
          <div className="overflow-hidden mb-10">
            <h1 
              className="font-display text-5xl md:text-6xl lg:text-7xl font-normal leading-[1.1] animate-reveal-text"
              style={{ 
                animationDelay: '200ms',
                color: '#FFFFFF',
                textShadow: '0 2px 10px rgba(0,0,0,0.3)'
              }}
            >
              Bem-vinda à
            </h1>
          </div>
          <div className="overflow-hidden mb-10">
            <h1 
              className="font-display text-5xl md:text-6xl lg:text-7xl font-normal leading-[1.1] animate-reveal-text"
              style={{ 
                animationDelay: '400ms',
                color: '#FFFFFF',
                textShadow: '0 2px 10px rgba(0,0,0,0.3)'
              }}
            >
              Elatho Semijoias
            </h1>
          </div>

          {/* CTA with fade-in-left animation */}
          <button 
            onClick={scrollToProducts}
            className="text-sm text-white underline underline-offset-8 decoration-[0.5px] hover:decoration-2 transition-all duration-300 animate-fade-in-left"
            style={{ animationDelay: '700ms' }}
          >
            Explorar
          </button>
        </div>
      </div>

      {/* Scroll indicator - with subtle bounce and fade on scroll */}
      <button 
        onClick={scrollToProducts}
        className="absolute bottom-12 left-1/2 text-white/60 hover:text-white transition-colors duration-300 animate-bounce-subtle"
        style={{ 
          animationDelay: '1000ms',
          opacity: textOpacity,
        }}
      >
        <ArrowDown className="h-5 w-5 stroke-[1]" />
      </button>
    </section>
  );
}
