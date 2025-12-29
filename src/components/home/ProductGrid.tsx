import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from './ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Produto {
  id: string;
  nome: string;
  preco: number;
  preco_promocional: number | null;
  imagem_url: string | null;
  categoria: string;
}

interface ProductGridProps {
  selectedCategory: string;
}

export default function ProductGrid({ selectedCategory }: ProductGridProps) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recentes');

  useEffect(() => {
    const fetchProdutos = async () => {
      setLoading(true);
      
      let query = supabase
        .from('produtos')
        .select('id, nome, preco, preco_promocional, imagem_url, categoria')
        .eq('destaque', true);

      if (selectedCategory !== 'todos') {
        query = query.eq('categoria', selectedCategory);
      }

      const { data, error } = await query;

      if (!error && data) {
        let sortedData = [...data];
        
        switch (sortBy) {
          case 'menor':
            sortedData.sort((a, b) => (a.preco_promocional || a.preco) - (b.preco_promocional || b.preco));
            break;
          case 'maior':
            sortedData.sort((a, b) => (b.preco_promocional || b.preco) - (a.preco_promocional || a.preco));
            break;
          default:
            // Keep default order (most recent)
            break;
        }
        
        setProdutos(sortedData);
      }
      
      setLoading(false);
    };

    fetchProdutos();
  }, [selectedCategory, sortBy]);

  return (
    <section id="produtos" className="py-12 md:py-16 bg-background-secondary">
      <div className="container px-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold">
              Nossas <span className="text-gradient-gold">Semijoias</span>
            </h2>
            <p className="text-muted-foreground mt-1">
              {produtos.length} produto{produtos.length !== 1 ? 's' : ''} encontrado{produtos.length !== 1 ? 's' : ''}
            </p>
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48 input-elegant">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recentes">Mais Recentes</SelectItem>
              <SelectItem value="menor">Menor Preço</SelectItem>
              <SelectItem value="maior">Maior Preço</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card-elegant overflow-hidden">
                <Skeleton className="aspect-square" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : produtos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Nenhum produto encontrado nesta categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {produtos.map((produto) => (
              <ProductCard key={produto.id} {...produto} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
