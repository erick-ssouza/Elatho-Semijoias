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
                className={`px-5 py-2 rounded-full text-xs uppercase tracking-[0.15em] font-medium transition-all duration-300 border-2 ${
                  selectedCategory === category.id
                    ? 'bg-primary border-primary text-primary-foreground shadow-lg'
                    : 'bg-primary/90 border-primary text-primary-foreground hover:bg-primary hover:shadow-md'
                }`}
                style={{
                  boxShadow: selectedCategory === category.id ? '0 4px 20px -3px rgba(212, 168, 70, 0.5)' : 'none'
                }}
              >
                {category.name}
              </button>
            </div>
          ))}
        </nav>
      </div>
    </section>
  );
}