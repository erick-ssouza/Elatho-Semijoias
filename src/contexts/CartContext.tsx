import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  id: string;
  nome: string;
  preco: number;
  preco_promocional?: number | null;
  imagem_url: string;
  variacao: string;
  quantidade: number;
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
        updated[existingIndex].quantidade += quantidade;
        return updated;
      }
      
      return [...prev, { ...item, quantidade }];
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
      prev.map(i =>
        i.id === id && i.variacao === variacao ? { ...i, quantidade } : i
      )
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
