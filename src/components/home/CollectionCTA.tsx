import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function CollectionCTA() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Background with pearl/gold gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, hsl(43, 50%, 96%) 0%, hsl(43, 50%, 91%) 30%, hsl(40, 33%, 98%) 70%, hsl(43, 50%, 94%) 100%)'
        }}
      />
      
      {/* Subtle decorative elements */}
      <div 
        className="absolute top-0 right-0 w-1/2 h-full opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 80% 20%, hsl(43, 74%, 49%, 0.15) 0%, transparent 50%)'
        }}
      />
      <div 
        className="absolute bottom-0 left-0 w-1/3 h-1/2 opacity-20"
        style={{
          background: 'radial-gradient(ellipse at 20% 80%, hsl(43, 74%, 49%, 0.2) 0%, transparent 50%)'
        }}
      />
      
      {/* Content */}
      <div className="container relative mx-auto px-6 lg:px-12">
        <div className="max-w-2xl mx-auto text-center">
          {/* Decorative line */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-12 h-px bg-primary/40" />
            <div className="w-2 h-2 rounded-full bg-primary/60" />
            <div className="w-12 h-px bg-primary/40" />
          </div>
          
          {/* Title */}
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-normal text-foreground mb-4 leading-tight">
            Explore Nossa Coleção Completa
          </h2>
          
          {/* Subtitle */}
          <p className="text-muted-foreground text-lg md:text-xl mb-10 max-w-lg mx-auto">
            Descubra todas as peças exclusivas da Elatho
          </p>
          
          {/* CTA Button */}
          <Link
            to="/loja"
            className="inline-flex items-center gap-3 btn-gold px-10 py-4 text-base group"
          >
            <span>Ver Toda Coleção</span>
            <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          
          {/* Decorative line bottom */}
          <div className="flex items-center justify-center gap-4 mt-12">
            <div className="w-20 h-px bg-primary/20" />
          </div>
        </div>
      </div>
    </section>
  );
}
