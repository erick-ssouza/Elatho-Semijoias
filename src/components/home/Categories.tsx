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
  return (
    <section className="py-12 md:py-16">
      <div className="container px-6 lg:px-12">
        {/* Horizontal text categories with dot separators */}
        <nav className="flex flex-wrap justify-center items-center gap-x-2 gap-y-3">
          {categories.map((category, index) => (
            <div key={category.id} className="flex items-center">
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
                <span className="text-muted-foreground/50 mx-4">·</span>
              )}
            </div>
          ))}
        </nav>
      </div>
    </section>
  );
}