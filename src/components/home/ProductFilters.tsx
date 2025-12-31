import { useState } from 'react';
import { X, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';

export interface FilterState {
  priceRanges: string[];
  colors: string[];
  sortBy: string;
}

interface ProductFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  totalProducts: number;
}

const priceRanges = [
  { id: 'ate50', label: 'Até R$50', min: 0, max: 50 },
  { id: '50-100', label: 'R$50 - R$100', min: 50, max: 100 },
  { id: '100-150', label: 'R$100 - R$150', min: 100, max: 150 },
  { id: 'acima150', label: 'Acima de R$150', min: 150, max: Infinity },
];

const colors = [
  { id: 'ouro18k', label: 'Banho de Ouro 18k' },
  { id: 'rodio', label: 'Banho de Ródio' },
];

const sortOptions = [
  { value: 'recentes', label: 'Mais Recentes' },
  { value: 'menor', label: 'Menor Preço' },
  { value: 'maior', label: 'Maior Preço' },
  { value: 'vendidos', label: 'Mais Vendidos' },
];

export default function ProductFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  totalProducts,
}: ProductFiltersProps) {
  const [priceOpen, setPriceOpen] = useState(true);
  const [colorOpen, setColorOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeFiltersCount = filters.priceRanges.length + filters.colors.length;

  const togglePriceRange = (rangeId: string) => {
    const newRanges = filters.priceRanges.includes(rangeId)
      ? filters.priceRanges.filter((r) => r !== rangeId)
      : [...filters.priceRanges, rangeId];
    onFiltersChange({ ...filters, priceRanges: newRanges });
  };

  const toggleColor = (colorId: string) => {
    const newColors = filters.colors.includes(colorId)
      ? filters.colors.filter((c) => c !== colorId)
      : [...filters.colors, colorId];
    onFiltersChange({ ...filters, colors: newColors });
  };

  const setSortBy = (value: string) => {
    onFiltersChange({ ...filters, sortBy: value });
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Ordenar
          </span>
        </div>
        <div className="space-y-2">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSortBy(option.value)}
              className={`block w-full text-left text-sm py-1.5 transition-colors ${
                filters.sortBy === option.value
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <button
          onClick={() => setPriceOpen(!priceOpen)}
          className="flex items-center justify-between w-full mb-3"
        >
          <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Preço
          </span>
          {priceOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {priceOpen && (
          <div className="space-y-3">
            {priceRanges.map((range) => (
              <label
                key={range.id}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <Checkbox
                  checked={filters.priceRanges.includes(range.id)}
                  onCheckedChange={() => togglePriceRange(range.id)}
                  className="border-border"
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  {range.label}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Color */}
      <div>
        <button
          onClick={() => setColorOpen(!colorOpen)}
          className="flex items-center justify-between w-full mb-3"
        >
          <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
            Cor
          </span>
          {colorOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {colorOpen && (
          <div className="space-y-3">
            {colors.map((color) => (
              <label
                key={color.id}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <Checkbox
                  checked={filters.colors.includes(color.id)}
                  onCheckedChange={() => toggleColor(color.id)}
                  className="border-border"
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  {color.label}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="w-full text-sm"
        >
          Limpar filtros ({activeFiltersCount})
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden lg:block w-56 flex-shrink-0">
        <div className="sticky top-28">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs uppercase tracking-[0.15em]">Filtros</span>
            <span className="text-xs text-muted-foreground">
              {totalProducts} produto{totalProducts !== 1 ? 's' : ''}
            </span>
          </div>
          <FilterContent />
        </div>
      </div>

      {/* Mobile Filters */}
      <div className="lg:hidden mb-4">
        <div className="flex items-center justify-between gap-4">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
                {activeFiltersCount > 0 && (
                  <span className="bg-foreground text-background text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>

          {/* Mobile Sort */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Ordenar:</span>
            <select
              value={filters.sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none text-foreground text-xs focus:outline-none cursor-pointer"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filters chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {filters.priceRanges.map((rangeId) => {
              const range = priceRanges.find((r) => r.id === rangeId);
              return (
                <button
                  key={rangeId}
                  onClick={() => togglePriceRange(rangeId)}
                  className="flex items-center gap-1 px-2 py-1 bg-muted text-xs rounded-full"
                >
                  {range?.label}
                  <X className="h-3 w-3" />
                </button>
              );
            })}
            {filters.colors.map((colorId) => {
              const color = colors.find((c) => c.id === colorId);
              return (
                <button
                  key={colorId}
                  onClick={() => toggleColor(colorId)}
                  className="flex items-center gap-1 px-2 py-1 bg-muted text-xs rounded-full"
                >
                  {color?.label}
                  <X className="h-3 w-3" />
                </button>
              );
            })}
            <button
              onClick={onClearFilters}
              className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Limpar tudo
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export { priceRanges, colors };
