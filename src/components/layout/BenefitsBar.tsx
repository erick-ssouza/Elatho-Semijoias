import { useState, useEffect } from 'react';
import { X, Percent, CreditCard, Truck } from 'lucide-react';

const benefits = [
  { icon: Percent, text: '5% OFF no PIX' },
  { icon: CreditCard, text: '4x sem juros' },
  { icon: Truck, text: 'Frete grátis +R$299' },
];

export default function BenefitsBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Check localStorage on mount
  useEffect(() => {
    const hidden = localStorage.getItem('benefitsBarHidden');
    if (hidden === 'true') {
      setIsVisible(false);
    }
  }, []);

  // Carousel for mobile
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % benefits.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('benefitsBarHidden', 'true');
  };

  if (!isVisible) return null;

  return (
    <div 
      className="bg-primary text-primary-foreground sticky top-0 z-[60] animate-fade-in-up"
      style={{ animationDuration: '0.3s' }}
    >
      <div className="container mx-auto px-4 py-2 md:py-2.5 relative">
        {/* Desktop - All benefits visible */}
        <div className="hidden md:flex items-center justify-center gap-8 text-xs md:text-[13px] font-medium tracking-wide">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-2">
              <benefit.icon className="h-4 w-4" />
              <span>{benefit.text}</span>
              {index < benefits.length - 1 && (
                <span className="ml-8 text-primary-foreground/50">•</span>
              )}
            </div>
          ))}
        </div>

        {/* Mobile - Carousel */}
        <div className="flex md:hidden items-center justify-center text-[11px] font-medium tracking-wide">
          <div className="flex items-center gap-2 transition-all duration-300">
            {(() => {
              const CurrentIcon = benefits[currentIndex].icon;
              return (
                <>
                  <CurrentIcon className="h-3.5 w-3.5" />
                  <span>{benefits[currentIndex].text}</span>
                </>
              );
            })()}
          </div>
          
          {/* Carousel indicators */}
          <div className="flex gap-1 ml-4">
            {benefits.map((_, index) => (
              <div
                key={index}
                className={`w-1 h-1 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'bg-primary-foreground' : 'bg-primary-foreground/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-primary-foreground/10 rounded-full transition-colors"
          aria-label="Fechar barra de benefícios"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
