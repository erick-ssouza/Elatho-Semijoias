import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useFavorites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('favoritos')
        .select('produto_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setFavorites(data?.map((f) => f.produto_id) || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = async (produtoId: string) => {
    if (!user) {
      toast({
        title: 'Faça login',
        description: 'Você precisa estar logado para adicionar favoritos.',
        variant: 'destructive',
      });
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('favoritos')
        .insert({ user_id: user.id, produto_id: produtoId });

      if (error) throw error;

      setFavorites((prev) => [...prev, produtoId]);
      toast({ title: 'Adicionado aos favoritos!' });
      return true;
    } catch (error: any) {
      console.error('Error adding favorite:', error);
      toast({
        title: 'Erro ao adicionar favorito',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (produtoId: string) => {
    if (!user) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('favoritos')
        .delete()
        .eq('user_id', user.id)
        .eq('produto_id', produtoId);

      if (error) throw error;

      setFavorites((prev) => prev.filter((id) => id !== produtoId));
      toast({ title: 'Removido dos favoritos!' });
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        title: 'Erro ao remover favorito',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (produtoId: string) => {
    if (favorites.includes(produtoId)) {
      return removeFavorite(produtoId);
    } else {
      return addFavorite(produtoId);
    }
  };

  const isFavorite = (produtoId: string) => favorites.includes(produtoId);

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites,
  };
}
