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

  const generalMessage = `Olá! 😊\nVim pelo site da Elatho e gostaria de mais informações.`;
  const whatsappUrl = `https://wa.me/5519998229202?text=${encodeURIComponent(generalMessage)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Fale conosco pelo WhatsApp"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
        transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
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