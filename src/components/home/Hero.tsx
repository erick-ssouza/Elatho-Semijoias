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
        {/* Gradient overlay - darker at top for text readability */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 100%)'
          }}
        />
      </div>

      {/* Content - Left aligned */}
      <div className="container relative z-10 px-6 lg:px-12">
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

      {/* Scroll indicator - with subtle bounce */}
      <button 
        onClick={scrollToProducts}
        className="absolute bottom-12 left-1/2 text-white/60 hover:text-white transition-colors duration-300 animate-bounce-subtle"
        style={{ animationDelay: '1000ms' }}
      >
        <ArrowDown className="h-5 w-5 stroke-[1]" />
      </button>
    </section>
  );
}
