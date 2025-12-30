import { useState, useEffect, useCallback } from 'react';

interface RecentProduct {
  id: string;
  nome: string;
  preco: number;
  preco_promocional: number | null;
  imagem_url: string | null;
}

const STORAGE_KEY = 'elatho_recent_products';
const MAX_ITEMS = 8;

export function useRecentlyViewed() {
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentProducts(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading recent products:', error);
    }
  }, []);

  // Add a product to recently viewed
  const addProduct = useCallback((product: RecentProduct) => {
    setRecentProducts((prev) => {
      // Remove if already exists
      const filtered = prev.filter((p) => p.id !== product.id);
      // Add to beginning
      const updated = [product, ...filtered].slice(0, MAX_ITEMS);
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving recent products:', error);
      }
      
      return updated;
    });
  }, []);

  // Get products excluding a specific one (useful for product page)
  const getProductsExcluding = useCallback((excludeId: string, limit = 4) => {
    return recentProducts.filter((p) => p.id !== excludeId).slice(0, limit);
  }, [recentProducts]);

  return {
    recentProducts,
    addProduct,
    getProductsExcluding,
  };
}