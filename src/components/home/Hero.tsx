import { ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Hero() {
  const scrollToProducts = () => {
    const element = document.getElementById('produtos');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2070&auto=format&fit=crop)',
        }}
      >
        <div className="absolute inset-0 bg-foreground/40" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-6 lg:px-12">
        <div className="max-w-3xl">
          {/* Subtitle */}
          <p 
            className="text-sm tracking-[0.3em] text-background/80 uppercase mb-6 animate-fade-in"
          >
            Bem-vinda à
          </p>

          {/* Title */}
          <h1 
            className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-background leading-[0.9] mb-8 animate-fade-in-up"
            style={{ animationDelay: '100ms' }}
          >
            Elatho<br />
            <span className="text-primary">Semijoias</span>
          </h1>

          {/* CTA */}
          <div 
            className="animate-fade-in-up"
            style={{ animationDelay: '200ms' }}
          >
            <Button 
              onClick={scrollToProducts}
              variant="outline"
              className="h-14 px-10 text-sm tracking-[0.2em] uppercase border-background/50 text-background hover:bg-background hover:text-foreground rounded-none transition-all duration-300"
            >
              Ver Coleção
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <button 
        onClick={scrollToProducts}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce text-background/70 hover:text-background transition-colors"
      >
        <span className="text-xs tracking-[0.3em] uppercase block mb-2">Scroll</span>
        <ArrowDown className="h-5 w-5 mx-auto" />
      </button>
    </section>
  );
}
