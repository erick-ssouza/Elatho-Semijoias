import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Instagram, MessageCircle, ShieldCheck, Lock } from 'lucide-react';
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

      <div className="container px-6 lg:px-12 pt-10 pb-10">
        {/* Logo & Tagline */}
        <div 
          className="text-center mb-10"
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
              className="h-[180px] md:h-[210px] w-auto mx-auto brightness-0 invert"
            />
          </Link>
          <p 
            className="font-display italic text-sm mt-3"
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
                (19) 99822-9202
              </a>
              <a
                href="mailto:elathosemijoias@gmail.com"
                className="text-sm transition-colors duration-300"
                style={{ color: '#CCCCCC' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#CCCCCC'}
              >
                elathosemijoias@gmail.com
              </a>
              <p 
                className="text-sm"
                style={{ color: '#999999' }}
              >
                Seg a Sex, 9h às 18h
              </p>
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

        {/* Payment methods with icons */}
        <div 
          className="text-center mb-6"
          style={{
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.6s ease-out',
            transitionDelay: '400ms',
          }}
        >
          <p 
            className="text-[11px] uppercase tracking-[0.15em] mb-4"
            style={{ color: '#D4AF37', letterSpacing: '2px' }}
          >
            Formas de Pagamento
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            {/* PIX */}
            <div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded"
              style={{ backgroundColor: '#2A2A2A' }}
            >
              <svg viewBox="0 0 512 512" className="w-5 h-5" fill="#32BCAD">
                <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 488.6C280.3 518.9 231.1 518.9 200.8 488.6L103.3 391.2H112.6C132.6 391.2 151.5 383.4 165.7 369.2L242.4 292.5zM262.5 218.9C257.1 224.4 247.9 224.5 242.4 218.9L165.7 142.2C151.5 128 132.6 120.2 112.6 120.2H103.3L200.7 22.8C231.1-7.6 280.3-7.6 310.6 22.8L407.8 119.9H392.6C372.6 119.9 353.7 127.7 339.5 141.9L262.5 218.9zM112.6 142.7C126.4 142.7 139.1 148.3 149.7 158.8L226.4 235.5C233.6 242.7 243.2 246.6 253.3 246.6C263.4 246.6 273 242.7 280.2 235.5L356.9 158.8C367.5 148.2 380.2 142.6 394 142.6H430.3L488.6 200.8C518.9 231.1 518.9 280.3 488.6 310.6L430.3 369H394C380.2 369 367.5 363.4 356.9 352.8L280.2 276C266 261.7 240.5 261.6 226.4 275.8L## L149.7 352.6C139.1 363.2 126.4 368.8 112.6 368.8H77L22.8 310.6C-7.6 280.3-7.6 231.1 22.8 200.8L77 142.6H112.6z"/>
              </svg>
              <span className="text-xs font-medium" style={{ color: '#CCCCCC' }}>PIX</span>
            </div>
            
            {/* Visa */}
            <div 
              className="flex items-center justify-center px-3 py-1.5 rounded"
              style={{ backgroundColor: '#2A2A2A' }}
            >
              <svg viewBox="0 0 48 48" className="w-8 h-5">
                <path fill="#1565C0" d="M45,35c0,2.209-1.791,4-4,4H7c-2.209,0-4-1.791-4-4V13c0-2.209,1.791-4,4-4h34c2.209,0,4,1.791,4,4V35z"/>
                <path fill="#FFF" d="M15.186 19l-2.626 7.832c0 0-.667-3.313-.733-3.729-1.495-3.411-3.701-3.221-3.701-3.221L10.726 30v-.002h3.161L18.258 19H15.186zM17.689 30L20.56 30 22.296 19 19.389 19zM38.008 19h-3.021l-4.71 11h2.852l.588-1.571h3.596L37.619 30h2.613L38.008 19zM34.513 26.328l1.563-4.157.818 4.157H34.513zM26.369 22.206c0-.606.498-1.057 1.926-1.057.928 0 1.991.674 1.991.674l.466-2.309c0 0-1.358-.515-2.691-.515-3.019 0-4.576 1.444-4.576 3.272 0 3.306 3.979 2.853 3.979 4.551 0 .291-.231.964-1.888.964-1.662 0-2.759-.609-2.759-.609l-.495 2.216c0 0 1.063.606 3.117.606 2.059 0 4.915-1.54 4.915-3.752C30.354 23.586 26.369 23.394 26.369 22.206z"/>
                <path fill="#FFC107" d="M12.212,24.945l-0.966-4.748c0,0-0.437-1.029-1.573-1.029c-1.136,0-4.44,0-4.44,0S10.894,20.84,12.212,24.945z"/>
              </svg>
            </div>
            
            {/* Mastercard */}
            <div 
              className="flex items-center justify-center px-3 py-1.5 rounded"
              style={{ backgroundColor: '#2A2A2A' }}
            >
              <svg viewBox="0 0 48 48" className="w-8 h-5">
                <path fill="#3F51B5" d="M45,35c0,2.209-1.791,4-4,4H7c-2.209,0-4-1.791-4-4V13c0-2.209,1.791-4,4-4h34c2.209,0,4,1.791,4,4V35z"/>
                <circle cx="19" cy="24" r="7" fill="#E53935"/>
                <circle cx="29" cy="24" r="7" fill="#FF9800"/>
                <path fill="#FF5722" d="M24,19c1.335,1.231,2.178,2.991,2.178,4.949c0,1.958-0.843,3.718-2.178,4.949c-1.335-1.231-2.178-2.991-2.178-4.949C21.822,21.991,22.665,20.231,24,19z"/>
              </svg>
            </div>
            
            {/* Elo */}
            <div 
              className="flex items-center justify-center px-3 py-1.5 rounded"
              style={{ backgroundColor: '#2A2A2A' }}
            >
              <svg viewBox="0 0 48 48" className="w-8 h-5">
                <path fill="#263238" d="M45,35c0,2.209-1.791,4-4,4H7c-2.209,0-4-1.791-4-4V13c0-2.209,1.791-4,4-4h34c2.209,0,4,1.791,4,4V35z"/>
                <path fill="#FFCA28" d="M16,24c0-2.761,2.239-5,5-5c1.694,0,3.191,0.843,4.096,2.133l3.311-1.911C27.041,16.93,24.691,15,21,15c-4.971,0-9,4.029-9,9c0,4.971,4.029,9,9,9c3.691,0,6.041-1.93,7.407-4.222l-3.311-1.911C24.191,28.157,22.694,29,21,29C18.239,29,16,26.761,16,24z"/>
                <path fill="#00BCD4" d="M32,24c0,2.761-2.239,5-5,5c-1.694,0-3.191-0.843-4.096-2.133l-3.311,1.911C20.959,31.07,23.309,33,27,33c4.971,0,9-4.029,9-9c0-4.971-4.029-9-9-9c-3.691,0-6.041,1.93-7.407,4.222l3.311,1.911C23.809,19.843,25.306,19,27,19C29.761,19,32,21.239,32,24z"/>
                <path fill="#E53935" d="M21,19c1.694,0,3.191,0.843,4.096,2.133c0.905-1.29,2.402-2.133,4.096-2.133c-1.368-2.292-3.718-4.222-7.407-4.222C17.786,14.778,15.241,17.017,14.092,20.133C15.191,19.431,18.047,19,21,19z"/>
              </svg>
            </div>
            
            {/* American Express */}
            <div 
              className="flex items-center justify-center px-3 py-1.5 rounded"
              style={{ backgroundColor: '#2A2A2A' }}
            >
              <svg viewBox="0 0 48 48" className="w-8 h-5">
                <path fill="#1976D2" d="M45,35c0,2.209-1.791,4-4,4H7c-2.209,0-4-1.791-4-4V13c0-2.209,1.791-4,4-4h34c2.209,0,4,1.791,4,4V35z"/>
                <path fill="#FFF" d="M22.255 20l-2.113 4.683L18.039 20h-2.695v6.726L12.341 20h-2.274L7 28h1.917l.635-1.549h3.66L13.847 28h3.523v-5.025L19.381 28h1.743l2.018-5.025V28H25v-8H22.255zM9.132 25.139l1.299-3.166 1.276 3.166H9.132zM40.087 28l-2.597-2.843L40.015 22h-2.512l-1.654 2.002L34.218 22h-2.534l2.521 3.157L31.679 28h2.579l1.657-2.009L37.542 28H40.087zM36.102 24.069l.014-.016-.014.016zM28 22v6h5.96v-1.344H29.59v-1.139h4.259V24.17H29.59v-1.012h4.37V22H28z"/>
              </svg>
            </div>
            
            {/* Hipercard */}
            <div 
              className="flex items-center justify-center px-3 py-1.5 rounded"
              style={{ backgroundColor: '#2A2A2A' }}
            >
              <svg viewBox="0 0 48 48" className="w-8 h-5">
                <path fill="#B71C1C" d="M45,35c0,2.209-1.791,4-4,4H7c-2.209,0-4-1.791-4-4V13c0-2.209,1.791-4,4-4h34c2.209,0,4,1.791,4,4V35z"/>
                <path fill="#FFF" d="M23.5 24c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5-2.015 4.5-4.5 4.5S23.5 26.485 23.5 24zM15.5 24c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5-2.015 4.5-4.5 4.5S15.5 26.485 15.5 24z"/>
                <path fill="#FFEB3B" d="M28,19.5c-1.283,0-2.457,0.443-3.4,1.175c0.943,0.732,1.9,1.825,1.9,3.325s-0.957,2.593-1.9,3.325c0.943,0.732,2.117,1.175,3.4,1.175c2.485,0,4.5-2.015,4.5-4.5S30.485,19.5,28,19.5z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Security seals */}
        <div 
          className="text-center mb-8"
          style={{
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.6s ease-out',
            transitionDelay: '450ms',
          }}
        >
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Site Seguro SSL */}
            <div 
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{ backgroundColor: '#2A2A2A', border: '1px solid #3A3A3A' }}
            >
              <Lock className="w-4 h-4" style={{ color: '#4CAF50' }} />
              <div className="text-left">
                <p className="text-[10px] font-medium" style={{ color: '#4CAF50' }}>Site Seguro</p>
                <p className="text-[9px]" style={{ color: '#888888' }}>SSL Certificado</p>
              </div>
            </div>
            
            {/* Compra Segura */}
            <div 
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{ backgroundColor: '#2A2A2A', border: '1px solid #3A3A3A' }}
            >
              <ShieldCheck className="w-4 h-4" style={{ color: '#D4AF37' }} />
              <div className="text-left">
                <p className="text-[10px] font-medium" style={{ color: '#D4AF37' }}>Compra Segura</p>
                <p className="text-[9px]" style={{ color: '#888888' }}>Dados Protegidos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Separator line */}
        <div 
          className="h-[1px] max-w-xl mx-auto mb-6"
          style={{ backgroundColor: '#333333' }}
        />

        {/* Legal info - Required by Decreto 7.962/2013 */}
        <div 
          className="text-center mb-6"
          style={{
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.6s ease-out',
            transitionDelay: '500ms',
          }}
        >
          <p 
            className="text-[11px] font-medium mb-1"
            style={{ color: '#999999' }}
          >
            Elatho Semijoias
          </p>
          <p 
            className="text-[10px]"
            style={{ color: '#666666' }}
          >
            Erica Cristina Marques Bortolin · CPF: 337.645.358-65
          </p>
          <p 
            className="text-[10px]"
            style={{ color: '#666666' }}
          >
            Rio Claro - SP
          </p>
        </div>

        {/* Copyright */}
        <div 
          className="text-center"
          style={{
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.6s ease-out',
            transitionDelay: '550ms',
          }}
        >
          <p 
            className="text-[11px]"
            style={{ color: '#555555' }}
          >
            © 2025 Elatho Semijoias. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}