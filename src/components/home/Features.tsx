import { useState, useEffect, useRef } from 'react';

const features = [
  'Garantia 1 ano',
  'Frete grátis +R$299',
  'Parcelamos 3x',
  'Atendimento exclusivo',
];

export default function Features() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5, rootMargin: '0px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-12 border-y border-border overflow-hidden">
      <div className="container px-6 lg:px-12">
        {/* Horizontal layout - text only with staggered animation */}
        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-center">
          {features.map((feature, index) => (
            <div key={feature} className="flex items-center">
              <span 
                className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(15px)',
                  transition: `opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)`,
                  transitionDelay: `${index * 100}ms`,
                }}
              >
                {feature}
              </span>
              {index < features.length - 1 && (
                <span 
                  className="text-muted-foreground/30 ml-4"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transition: 'opacity 0.4s ease-out',
                    transitionDelay: `${index * 100 + 150}ms`,
                  }}
                >
                  ·
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}