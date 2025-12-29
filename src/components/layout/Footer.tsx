import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

export default function Footer() {
  const [isVisible, setIsVisible] = useState(false);
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px' }
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <footer ref={footerRef} className="bg-background-secondary py-16 md:py-24 overflow-hidden">
      <div className="container px-6 lg:px-12">
        {/* Logo */}
        <div 
          className="text-center mb-16"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <Link to="/" className="font-display text-3xl md:text-4xl text-foreground">
            Elatho
          </Link>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-16 max-w-3xl mx-auto mb-16">
          {/* Shop */}
          <div
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(25px)',
              transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
              transitionDelay: '100ms',
            }}
          >
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-6">
              Shop
            </h3>
            <nav className="flex flex-col gap-3">
              <Link to="/#produtos" className="text-sm text-foreground hover:underline underline-offset-4">
                Todos os produtos
              </Link>
              <Link to="/#produtos" className="text-sm text-foreground hover:underline underline-offset-4">
                Anéis
              </Link>
              <Link to="/#produtos" className="text-sm text-foreground hover:underline underline-offset-4">
                Brincos
              </Link>
              <Link to="/#produtos" className="text-sm text-foreground hover:underline underline-offset-4">
                Colares
              </Link>
              <Link to="/#produtos" className="text-sm text-foreground hover:underline underline-offset-4">
                Pulseiras
              </Link>
            </nav>
          </div>

          {/* Ajuda */}
          <div
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(25px)',
              transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
              transitionDelay: '200ms',
            }}
          >
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-6">
              Ajuda
            </h3>
            <nav className="flex flex-col gap-3">
              <Link to="/faq" className="text-sm text-foreground hover:underline underline-offset-4">
                FAQ
              </Link>
              <Link to="/trocas" className="text-sm text-foreground hover:underline underline-offset-4">
                Trocas e Devoluções
              </Link>
              <Link to="/cuidados" className="text-sm text-foreground hover:underline underline-offset-4">
                Cuidados
              </Link>
              <Link to="/privacidade" className="text-sm text-foreground hover:underline underline-offset-4">
                Privacidade
              </Link>
            </nav>
          </div>

          {/* Contato */}
          <div 
            className="col-span-2 md:col-span-1"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(25px)',
              transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
              transitionDelay: '300ms',
            }}
          >
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-6">
              Contato
            </h3>
            <nav className="flex flex-col gap-3">
              <a
                href="https://wa.me/5519998229202"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground hover:underline underline-offset-4"
              >
                WhatsApp
              </a>
              <a
                href="https://instagram.com/elathosemijoias"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground hover:underline underline-offset-4"
              >
                Instagram
              </a>
              <a
                href="mailto:elathosemijoias@gmail.com"
                className="text-sm text-foreground hover:underline underline-offset-4"
              >
                Email
              </a>
            </nav>
          </div>
        </div>

        {/* Payment methods - text only */}
        <div 
          className="text-center mb-12"
          style={{
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.6s ease-out',
            transitionDelay: '400ms',
          }}
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Pix · Visa · Mastercard · Elo
          </p>
        </div>

        {/* Copyright */}
        <div 
          className="text-center"
          style={{
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.6s ease-out',
            transitionDelay: '500ms',
          }}
        >
          <p className="text-[11px] text-muted-foreground">
            © 2025 Elatho Semijoias. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}