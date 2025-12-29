import { CircleDot, Gem, Heart, Link2, Sparkles } from 'lucide-react';

interface CategoriesProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const categories = [
  { id: 'todos', name: 'Todos', icon: Sparkles },
  { id: 'aneis', name: 'Anéis', icon: CircleDot },
  { id: 'brincos', name: 'Brincos', icon: Gem },
  { id: 'colares', name: 'Colares', icon: Heart },
  { id: 'pulseiras', name: 'Pulseiras', icon: Link2 },
  { id: 'conjuntos', name: 'Conjuntos', icon: Sparkles },
];

export default function Categories({ selectedCategory, onSelectCategory }: CategoriesProps) {
  return (
    <section className="py-12 md:py-16">
      <div className="container px-4">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-8">
          Explore por <span className="text-gradient-gold">Categoria</span>
        </h2>

        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-300 ${
                  isSelected
                    ? 'bg-gradient-gold text-primary-foreground shadow-gold'
                    : 'bg-card border border-border hover:border-primary/30 hover:shadow-sm'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
