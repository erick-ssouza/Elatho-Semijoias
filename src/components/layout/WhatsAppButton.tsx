import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Delay appearance for better UX
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <a
      href="https://wa.me/5519998229202"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
        transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Tooltip */}
      <span
        className="bg-white text-foreground text-sm px-4 py-2 rounded-full shadow-lg whitespace-nowrap"
        style={{
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? 'translateX(0)' : 'translateX(10px)',
          transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
          pointerEvents: 'none',
        }}
      >
        Fale conosco
      </span>

      {/* Button */}
      <div
        className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
        style={{
          backgroundColor: '#25D366',
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Pulse ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            backgroundColor: '#25D366',
            animation: 'whatsapp-pulse 2s ease-out infinite',
          }}
        />
        
        {/* Icon */}
        <MessageCircle className="w-6 h-6 text-white relative z-10 fill-white" />
      </div>

      <style>{`
        @keyframes whatsapp-pulse {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </a>
  );
}