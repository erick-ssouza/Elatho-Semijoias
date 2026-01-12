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
    <section ref={sectionRef} className="py-6 md:py-12">
      <div className="container px-4 lg:px-12">
        {/* Horizontal scrollable on mobile, centered wrap on desktop */}
        <nav className="flex md:flex-wrap md:justify-center items-center gap-2 md:gap-3 overflow-x-auto scrollbar-hide pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
          {categories.map((category, index) => (
            <div 
              key={category.id} 
              className="flex-shrink-0"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)`,
                transitionDelay: `${index * 80}ms`,
              }}
            >
              <button
                onClick={() => onSelectCategory(category.id)}
                className={`px-3 py-1.5 md:px-5 md:py-2 rounded-full text-[11px] md:text-xs uppercase tracking-[0.1em] md:tracking-[0.15em] font-medium transition-all duration-300 border md:border-2 whitespace-nowrap ${
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