import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const LOCAL_STORAGE_KEY = 'elatho_favorites';

// Get favorites from localStorage
const getLocalFavorites = (): string[] => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save favorites to localStorage
const setLocalFavorites = (favorites: string[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(favorites));
};

export function useFavorites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Sync local favorites to database when user logs in
  const syncLocalToDatabase = useCallback(async (userId: string) => {
    const localFavorites = getLocalFavorites();
    if (localFavorites.length === 0) return;

    setSyncing(true);
    try {
      // Get existing favorites from database
      const { data: existingFavorites } = await supabase
        .from('favoritos')
        .select('produto_id')
        .eq('user_id', userId);

      const existingIds = new Set(existingFavorites?.map(f => f.produto_id) || []);

      // Find new favorites to add
      const newFavorites = localFavorites.filter(id => !existingIds.has(id));

      if (newFavorites.length > 0) {
        // Insert new favorites
        const { error } = await supabase
          .from('favoritos')
          .insert(newFavorites.map(produto_id => ({ user_id: userId, produto_id })));

        if (!error) {
          toast({ title: `${newFavorites.length} favorito(s) sincronizado(s) com sua conta!` });
        }
      }

      // Clear local storage after sync
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (error) {
      console.error('Error syncing favorites:', error);
    } finally {
      setSyncing(false);
    }
  }, [toast]);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      // Not logged in - use localStorage
      setFavorites(getLocalFavorites());
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

  // Initial fetch and sync on user change
  useEffect(() => {
    if (user) {
      // Sync local favorites when user logs in
      syncLocalToDatabase(user.id).then(() => {
        fetchFavorites();
      });
    } else {
      fetchFavorites();
    }
  }, [user, fetchFavorites, syncLocalToDatabase]);

  const addFavorite = async (produtoId: string) => {
    if (!user) {
      // Not logged in - use localStorage
      const localFavs = getLocalFavorites();
      if (!localFavs.includes(produtoId)) {
        const newFavs = [...localFavs, produtoId];
        setLocalFavorites(newFavs);
        setFavorites(newFavs);
        toast({ title: 'Adicionado aos favoritos!' });
      }
      return true;
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
    if (!user) {
      // Not logged in - use localStorage
      const localFavs = getLocalFavorites();
      const newFavs = localFavs.filter(id => id !== produtoId);
      setLocalFavorites(newFavs);
      setFavorites(newFavs);
      toast({ title: 'Removido dos favoritos!' });
      return true;
    }

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
    syncing,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites,
  };
}
