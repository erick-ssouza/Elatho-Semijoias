import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  id: string;
  nome: string;
  preco: number;
  preco_promocional?: number | null;
  imagem_url: string;
  variacao: string;
  quantidade: number;
  estoque?: number | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantidade'>, quantidade?: number) => void;
  removeItem: (id: string, variacao: string) => void;
  updateQuantity: (id: string, variacao: string, quantidade: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getSubtotal: () => number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('elatho-cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('elatho-cart', JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CartItem, 'quantidade'>, quantidade = 1) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(
        i => i.id === item.id && i.variacao === item.variacao
      );
      
      if (existingIndex > -1) {
        const updated = [...prev];
        const currentQty = updated[existingIndex].quantidade;
        const estoque = item.estoque ?? updated[existingIndex].estoque;
        // Respeitar limite de estoque se disponível
        const newQty = estoque != null 
          ? Math.min(currentQty + quantidade, estoque) 
          : currentQty + quantidade;
        updated[existingIndex].quantidade = newQty;
        updated[existingIndex].estoque = estoque;
        return updated;
      }
      
      // Respeitar limite de estoque no primeiro add também
      const initialQty = item.estoque != null 
        ? Math.min(quantidade, item.estoque) 
        : quantidade;
      return [...prev, { ...item, quantidade: initialQty }];
    });
  };

  const removeItem = (id: string, variacao: string) => {
    setItems(prev => prev.filter(i => !(i.id === id && i.variacao === variacao)));
  };

  const updateQuantity = (id: string, variacao: string, quantidade: number) => {
    if (quantidade < 1) {
      removeItem(id, variacao);
      return;
    }
    setItems(prev =>
      prev.map(i => {
        if (i.id === id && i.variacao === variacao) {
          // Respeitar limite de estoque se disponível
          const maxQuantidade = i.estoque != null ? Math.min(quantidade, i.estoque) : quantidade;
          return { ...i, quantidade: maxQuantidade };
        }
        return i;
      })
    );
  };

  const clearCart = () => setItems([]);

  const getSubtotal = () =>
    items.reduce((sum, item) => {
      const price = item.preco_promocional ?? item.preco;
      return sum + price * item.quantidade;
    }, 0);

  const getTotal = () => getSubtotal();

  const itemCount = items.reduce((sum, item) => sum + item.quantidade, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotal,
        getSubtotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
