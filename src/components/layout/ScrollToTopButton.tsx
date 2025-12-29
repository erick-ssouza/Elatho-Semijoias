import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button when scrolled past 500px
      setIsVisible(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible 
          ? `translateY(0) scale(${isHovered ? 1.1 : 1})` 
          : 'translateY(20px) scale(0.8)',
        transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
      aria-label="Voltar ao topo"
    >
      <ArrowUp 
        className="w-5 h-5 stroke-[1.5]"
        style={{
          transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
          transition: 'transform 0.3s ease-out',
        }}
      />
      
      {/* Progress ring */}
      <svg
        className="absolute inset-0 w-full h-full -rotate-90"
        style={{
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease-out',
        }}
      >
        <circle
          cx="24"
          cy="24"
          r="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="138"
          strokeDashoffset={isHovered ? 0 : 138}
          className="text-background/30"
          style={{
            transition: 'stroke-dashoffset 0.5s ease-out',
          }}
        />
      </svg>
    </button>
  );
}