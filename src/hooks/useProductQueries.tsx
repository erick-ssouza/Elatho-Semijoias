import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Produto {
  id: string;
  nome: string;
  preco: number;
  preco_promocional: number | null;
  imagem_url: string | null;
  categoria: string;
  variacoes: string[] | null;
  descricao: string | null;
  imagens: string[] | null;
  estoque: number | null;
  destaque: boolean | null;
}

interface ProductListItem {
  id: string;
  nome: string;
  preco: number;
  preco_promocional: number | null;
  imagem_url: string | null;
  categoria: string;
  variacoes: string[] | null;
  descricao: string | null;
  estoque: number | null;
}

interface ProductWithRating extends ProductListItem {
  mediaAvaliacoes: number | null;
  totalAvaliacoes: number;
}

// Fetch products with ratings (highlighted only by default, or all products)
export function useProducts(category?: string, onlyHighlighted: boolean = true) {
  return useQuery({
    queryKey: ['products', onlyHighlighted ? 'highlighted' : 'all', category || 'todos'],
    queryFn: async () => {
      let query = supabase
        .from('produtos')
        .select('id, nome, preco, preco_promocional, imagem_url, categoria, variacoes, descricao, estoque');

      if (onlyHighlighted) {
        query = query.eq('destaque', true);
      }

      if (category && category !== 'todos') {
        query = query.eq('categoria', category);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch ratings for all products - use public view to exclude sensitive emails
      const { data: avaliacoes } = await supabase
        .from('avaliacoes_publicas')
        .select('produto_id, nota');

      // Calculate average ratings per product
      const ratingsMap = new Map<string, { sum: number; count: number }>();
      
      avaliacoes?.forEach((avaliacao) => {
        const current = ratingsMap.get(avaliacao.produto_id) || { sum: 0, count: 0 };
        ratingsMap.set(avaliacao.produto_id, {
          sum: current.sum + avaliacao.nota,
          count: current.count + 1,
        });
      });

      const productsWithRating: ProductWithRating[] = (data || []).map((produto) => {
        const rating = ratingsMap.get(produto.id);
        return {
          ...produto,
          variacoes: Array.isArray(produto.variacoes) ? produto.variacoes as string[] : null,
          mediaAvaliacoes: rating ? rating.sum / rating.count : null,
          totalAvaliacoes: rating?.count || 0,
        };
      });

      return productsWithRating;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (previously cacheTime)
  });
}

// Hook alias for fetching all products (catalog page)
export function useAllProducts(category?: string) {
  return useProducts(category, false);
}

// Fetch single product
export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) throw new Error('Product ID required');

      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Product not found');

      const variacoes = Array.isArray(data.variacoes) 
        ? data.variacoes as string[]
        : ['Banho de Ouro 18k', 'Banho de Ródio'];
      
      const imagens = Array.isArray(data.imagens) 
        ? data.imagens as string[]
        : [];

      return { ...data, variacoes, imagens } as Produto;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Fetch related products
export function useRelatedProducts(categoria: string, excludeId: string) {
  return useQuery({
    queryKey: ['products', 'related', categoria, excludeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, preco, preco_promocional, imagem_url, categoria')
        .eq('categoria', categoria)
        .neq('id', excludeId)
        .limit(4);

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

// Fetch testimonials
export function useTestimonials() {
  return useQuery({
    queryKey: ['testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('depoimentos')
        .select('*')
        .eq('aprovado', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}

// Fetch product reviews
export function useProductReviews(produtoId: string, refreshTrigger?: number) {
  return useQuery({
    queryKey: ['reviews', produtoId, refreshTrigger],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avaliacoes_publicas')
        .select('*')
        .eq('produto_id', produtoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
}