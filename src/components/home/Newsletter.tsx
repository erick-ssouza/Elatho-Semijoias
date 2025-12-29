import { useState, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: '0px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call - in production, this would save to database
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsLoading(false);
    setIsSubmitted(true);
    setEmail('');
    
    toast({
      title: "Inscrição confirmada!",
      description: "Você receberá nossas novidades em primeira mão.",
    });
  };

  return (
    <section 
      ref={sectionRef}
      className="relative py-20 md:py-28 overflow-hidden"
      style={{ backgroundColor: '#F5F5F5' }}
    >
      <div className="container px-6 lg:px-12">
        <div 
          className="max-w-2xl mx-auto text-center"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Title */}
          <h2 
            className="font-display text-3xl md:text-4xl font-normal mb-4"
            style={{ color: '#1A1A1A' }}
          >
            Fique por Dentro
          </h2>
          
          {/* Description */}
          <p 
            className="text-sm md:text-base mb-10"
            style={{ color: '#666666' }}
          >
            Receba em primeira mão nossas novidades, lançamentos exclusivos e ofertas especiais.
          </p>

          {/* Form */}
          {!isSubmitted ? (
            <form 
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
              }}
            >
              <div className="flex-1 relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu melhor email"
                  className="w-full px-5 py-4 text-sm border transition-all duration-300 focus:outline-none"
                  style={{ 
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E5E5',
                    color: '#1A1A1A',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#D4AF37'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#E5E5E5'}
                  disabled={isLoading}
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="group flex items-center justify-center gap-2 px-8 py-4 text-xs uppercase tracking-[0.15em] transition-all duration-300"
                style={{ 
                  backgroundColor: '#1A1A1A',
                  color: '#FFFFFF',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#D4AF37';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1A1A1A';
                }}
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Inscrever
                    <ArrowRight 
                      className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" 
                    />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div 
              className="flex flex-col items-center gap-4"
              style={{
                animation: 'fadeIn 0.5s ease-out',
              }}
            >
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#D4AF37' }}
              >
                <svg 
                  className="w-8 h-8 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </div>
              <p className="text-sm" style={{ color: '#666666' }}>
                Obrigada por se inscrever!
              </p>
            </div>
          )}

          {/* Privacy note */}
          <p 
            className="text-[11px] mt-6"
            style={{ 
              color: '#999999',
              opacity: isVisible ? 1 : 0,
              transition: 'opacity 0.6s ease-out 0.4s',
            }}
          >
            Respeitamos sua privacidade. Cancele a qualquer momento.
          </p>
        </div>
      </div>

      {/* Decorative elements */}
      <div 
        className="absolute top-0 left-0 w-32 h-32 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)',
        }}
      />
      <div 
        className="absolute bottom-0 right-0 w-48 h-48 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
        }}
      />
    </section>
  );
}