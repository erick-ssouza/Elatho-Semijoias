import { useState, useEffect, useRef } from 'react';

interface CategoriesProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const categories = [
  { id: 'todos', name: 'Todos' },
  { id: 'aneis', name: 'Anéis' },
  { id: 'brincos', name: 'Brincos' },
  { id: 'colares', name: 'Colares' },
  { id: 'pulseiras', name: 'Pulseiras' },
  { id: 'conjuntos', name: 'Conjuntos' },
];

export default function Categories({ selectedCategory, onSelectCategory }: CategoriesProps) {
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
      { threshold: 0.3, rootMargin: '0px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-12 md:py-16">
      <div className="container px-6 lg:px-12">
        {/* Horizontal text categories with dot separators */}
        <nav className="flex flex-wrap justify-center items-center gap-x-2 gap-y-3">
          {categories.map((category, index) => (
            <div 
              key={category.id} 
              className="flex items-center"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)`,
                transitionDelay: `${index * 80}ms`,
              }}
            >
              <button
                onClick={() => onSelectCategory(category.id)}
                className={`text-xs uppercase tracking-[0.2em] transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'text-foreground underline underline-offset-8'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {category.name}
              </button>
              {index < categories.length - 1 && (
                <span 
                  className="text-muted-foreground/50 mx-4"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transition: 'opacity 0.4s ease-out',
                    transitionDelay: `${index * 80 + 200}ms`,
                  }}
                >
                  ·
                </span>
              )}
            </div>
          ))}
        </nav>
      </div>
    </section>
  );
}