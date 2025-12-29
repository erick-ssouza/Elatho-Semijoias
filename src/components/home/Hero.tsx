import { ArrowDown } from 'lucide-react';

export default function Hero() {
  const scrollToProducts = () => {
    const element = document.getElementById('produtos');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image - Gold and Silver Jewelry */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=2070&auto=format&fit=crop)',
        }}
      >
        {/* Subtle gradient overlay - only at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Content - Left aligned */}
      <div className="container relative z-10 px-6 lg:px-12">
        <div className="max-w-2xl">
          {/* Subtitle */}
          <p 
            className="text-[10px] uppercase tracking-[0.3em] text-white/70 mb-6 animate-fade-in"
          >
            Coleção 2025
          </p>

          {/* Title */}
          <h1 
            className="font-display text-5xl md:text-6xl lg:text-7xl font-normal text-white leading-[1.1] mb-10 animate-fade-in-up"
            style={{ animationDelay: '100ms' }}
          >
            Elegância<br />
            Atemporal
          </h1>

          {/* CTA - Simple underlined text */}
          <button 
            onClick={scrollToProducts}
            className="text-sm text-white underline underline-offset-8 decoration-[0.5px] hover:decoration-2 transition-all duration-300 animate-fade-in-up"
            style={{ animationDelay: '200ms' }}
          >
            Explorar
          </button>
        </div>
      </div>

      {/* Scroll indicator - Minimal */}
      <button 
        onClick={scrollToProducts}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/60 hover:text-white transition-colors duration-300"
      >
        <ArrowDown className="h-5 w-5 stroke-[1]" />
      </button>
    </section>
  );
}
