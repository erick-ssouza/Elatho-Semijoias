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
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-champagne/30 via-background to-background" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-40 right-10 w-48 h-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full bg-champagne/50 blur-2xl animate-float" />

      <div className="container relative z-10 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-primary/20 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-foreground/80">
              Coleção Exclusiva 2025
            </span>
          </div>

          {/* Title */}
          <h1 
            className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-tight animate-fade-in-up"
            style={{ animationDelay: '100ms' }}
          >
            Elegância que você{' '}
            <span className="text-gradient-gold">merece</span>
          </h1>

          {/* Subtitle */}
          <p 
            className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto animate-fade-in-up"
            style={{ animationDelay: '200ms' }}
          >
            Semijoias exclusivas com acabamento em ouro 18k. 
            Peças únicas que realçam sua beleza natural.
          </p>

          {/* CTA */}
          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up"
            style={{ animationDelay: '300ms' }}
          >
            <Button 
              onClick={scrollToProducts}
              className="btn-gold text-lg px-8 py-6"
            >
              Ver Coleção
            </Button>
            <Button 
              variant="outline"
              className="btn-gold-outline text-lg px-8 py-6"
              asChild
            >
              <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                Fale Conosco
              </a>
            </Button>
          </div>

          {/* Trust badges */}
          <div 
            className="flex flex-wrap items-center justify-center gap-6 pt-8 animate-fade-in-up"
            style={{ animationDelay: '400ms' }}
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-5 h-5 rounded-full bg-gradient-gold flex items-center justify-center">
                <span className="text-[10px] text-primary-foreground">✓</span>
              </span>
              Garantia de 1 ano
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-5 h-5 rounded-full bg-gradient-gold flex items-center justify-center">
                <span className="text-[10px] text-primary-foreground">✓</span>
              </span>
              Frete grátis +R$299
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-5 h-5 rounded-full bg-gradient-gold flex items-center justify-center">
                <span className="text-[10px] text-primary-foreground">✓</span>
              </span>
              Parcelamos em 3x
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <button 
          onClick={scrollToProducts}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce"
        >
          <ArrowDown className="h-6 w-6 text-primary" />
        </button>
      </div>
    </section>
  );
}
