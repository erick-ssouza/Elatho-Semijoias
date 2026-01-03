import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Instagram, MessageCircle } from 'lucide-react';
import logoElatho from '@/assets/logo-elatho-new.png';

export default function Footer() {
  const [isVisible, setIsVisible] = useState(false);
  const footerRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

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

  const handleCategoryClick = (categoria: string) => {
    navigate(`/?categoria=${categoria}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const shopLinks = [
    { label: 'Todos os produtos', categoria: 'todos' },
    { label: 'Anéis', categoria: 'aneis' },
    { label: 'Brincos', categoria: 'brincos' },
    { label: 'Colares', categoria: 'colares' },
    { label: 'Pulseiras', categoria: 'pulseiras' },
    { label: 'Conjuntos', categoria: 'conjuntos' },
  ];

  return (
    <footer 
      ref={footerRef} 
      className="relative overflow-hidden"
      style={{ backgroundColor: '#1A1A1A' }}
    >
      {/* Golden top line */}
      <div 
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ backgroundColor: '#D4AF37' }}
      />

      <div className="container px-6 lg:px-12 pt-16 pb-10">
        {/* Logo & Tagline */}
        <div 
          className="text-center mb-14"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <Link 
            to="/" 
            className="inline-block"
          >
            <img 
              src={logoElatho} 
              alt="Elatho Semijoias" 
              className="h-[72px] md:h-[84px] w-auto mx-auto brightness-0 invert"
            />
          </Link>
          <p 
            className="font-display italic text-sm mt-2"
            style={{ color: '#999999' }}
          >
            Elegância que você merece
          </p>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-16 max-w-3xl mx-auto mb-14">
          {/* Shop */}
          <div
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(25px)',
              transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
              transitionDelay: '100ms',
            }}
          >
            <h3 
              className="text-[11px] uppercase tracking-[0.15em] mb-6"
              style={{ color: '#D4AF37', letterSpacing: '2px' }}
            >
              Shop
            </h3>
            <nav className="flex flex-col gap-3">
              {shopLinks.map((item) => (
                <button 
                  key={item.categoria}
                  onClick={() => handleCategoryClick(item.categoria)}
                  className="text-sm transition-colors duration-300 text-left"
                  style={{ color: '#CCCCCC' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#CCCCCC'}
                >
                  {item.label}
                </button>
              ))}
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
            <h3 
              className="text-[11px] uppercase mb-6"
              style={{ color: '#D4AF37', letterSpacing: '2px' }}
            >
              Ajuda
            </h3>
            <nav className="flex flex-col gap-3">
              {[
                { label: 'Sobre Nós', to: '/sobre' },
                { label: 'FAQ', to: '/faq' },
                { label: 'Trocas e Devoluções', to: '/trocas' },
                { label: 'Cuidados', to: '/cuidados' },
                { label: 'Rastrear Pedido', to: '/rastreio' },
                { label: 'Privacidade', to: '/privacidade' },
              ].map((item) => (
                <Link 
                  key={item.label}
                  to={item.to} 
                  className="text-sm transition-colors duration-300"
                  style={{ color: '#CCCCCC' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#CCCCCC'}
                >
                  {item.label}
                </Link>
              ))}
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
            <h3 
              className="text-[11px] uppercase mb-6"
              style={{ color: '#D4AF37', letterSpacing: '2px' }}
            >
              Contato
            </h3>
            <nav className="flex flex-col gap-3 mb-6">
              <a
                href="https://wa.me/5519998229202"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm transition-colors duration-300"
                style={{ color: '#CCCCCC' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#CCCCCC'}
              >
                WhatsApp
              </a>
              <a
                href="https://instagram.com/elathosemijoias"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm transition-colors duration-300"
                style={{ color: '#CCCCCC' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#CCCCCC'}
              >
                Instagram
              </a>
              <a
                href="mailto:elathosemijoias@gmail.com"
                className="text-sm transition-colors duration-300"
                style={{ color: '#CCCCCC' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#CCCCCC'}
              >
                Email
              </a>
            </nav>

            {/* Social Icons */}
            <div className="flex gap-4">
              <a
                href="https://instagram.com/elathosemijoias"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors duration-300"
                style={{ color: '#FFFFFF' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#D4AF37'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#FFFFFF'}
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://wa.me/5519998229202"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors duration-300"
                style={{ color: '#FFFFFF' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#D4AF37'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#FFFFFF'}
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Payment methods */}
        <div 
          className="text-center mb-8"
          style={{
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.6s ease-out',
            transitionDelay: '400ms',
          }}
        >
          <p 
            className="text-[11px] uppercase tracking-[0.15em]"
            style={{ color: '#666666' }}
          >
            Pix · Visa · Mastercard · Elo
          </p>
        </div>

        {/* Separator line */}
        <div 
          className="h-[1px] max-w-xl mx-auto mb-8"
          style={{ backgroundColor: '#333333' }}
        />

        {/* Copyright */}
        <div 
          className="text-center"
          style={{
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.6s ease-out',
            transitionDelay: '500ms',
          }}
        >
          <p 
            className="text-[11px]"
            style={{ color: '#666666' }}
          >
            © 2025 Elatho Semijoias. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}