"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Product = { _id: string; name: string; price?: number; image?: string; stock?: number };
type Order = any;

interface CartContextType {
  cartItems: { [key: string]: number };
  addToCart: (productId: string | number, quantity?: number) => Promise<boolean> | boolean; // returns false if cannot add due to stock
  removeFromCart: (productId: string | number) => void;
    setQuantity: (productId: string | number, quantity: number) => void;
  getQuantity: (productId: string | number) => number;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getCartItems: () => CartItem[];
  placeOrder: (userId?: string | null) => Promise<Order>;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock?: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<{ [key: string]: number }>({});
  const [productCache, setProductCache] = useState<Record<string, Product>>({});

  // preload products once to have stock/price info locally
  useEffect(() => {
    let mounted = true;
    fetch('/api/products')
      .then(r => r.json())
      .then((data: Product[]) => { if (!mounted) return; const map: Record<string, Product> = {}; data.forEach(p => { if (p && p._id) map[p._id] = p; }); setProductCache(map); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  // subscribe to SSE product changes to keep productCache updated in realtime
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/events');
      es.addEventListener('product.changed', (ev: MessageEvent) => {
        try {
          const d = JSON.parse(ev.data);
          if (d && d.product && d.product._id) {
            setProductCache(prev => ({ ...prev, [d.product._id]: d.product }));
          }
        } catch (e) {}
      });
    } catch (e) {}
    return () => { if (es) es.close(); };
  }, []);
  // useToast is a hook; to use it we create an internal component wrapper below.

  const addToCart = (productId: string | number, quantity: number = 1) => {
    const id = String(productId);
    const product = productCache[id];
    const current = cartItems[id] || 0;
    if (product && typeof product.stock === 'number' && current + quantity > product.stock) {
      return false;
    }
    setCartItems((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + quantity,
    }));
    return true;
  };

  const removeFromCart = (productId: string | number) => {
    const id = String(productId);
    setCartItems((prev) => {
      const newItems = { ...prev };
      if (newItems[id] > 0) {
        newItems[id] -= 1;
        if (newItems[id] === 0) {
          delete newItems[id];
        }
      }
      return newItems;
    });
  };

  const setQuantity = (productId: string | number, quantity: number) => {
    const id = String(productId);
    setCartItems(prev => {
      const next = { ...prev };
      if (quantity <= 0) {
        delete next[id];
      } else {
        next[id] = quantity;
      }
      return next;
    });
  };

  const getQuantity = (productId: string | number) => cartItems[String(productId)] || 0;

  const getTotalItems = () => {
    return Object.values(cartItems).reduce((sum, quantity) => sum + quantity, 0);
  };

  const getCartItems = (): CartItem[] => {
    return Object.entries(cartItems)
      .filter(([, quantity]) => quantity > 0)
      .map(([ productIdStr, quantity ]) => {
        const id = productIdStr;
        const product = productCache[id];
        if (!product) return { id, name: 'Unknown', price: 0, image: '', quantity };
  return { id, name: product.name, price: product.price || 0, image: product.image || '', quantity, stock: product.stock };
      });
  };

  const getTotalPrice = () => {
    return getCartItems().reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const placeOrder = async (userId?: string | null) => {
  const items = getCartItems().map((i) => ({ productId: i.id, qty: i.quantity, unitPriceCents: Math.round(i.price * 100) }));
    const subtotal = getTotalPrice();
    const shipping = 8;
    const total = subtotal + shipping;
    const resp = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userId ?? null, items, subtotal, shipping, total }),
    });
    if (resp.status === 409) {
      const j = await resp.json();
      throw new Error(j.error || 'Insufficient stock');
    }
    if (!resp.ok) {
      const j = await resp.json();
      throw new Error(j.error || 'Order failed');
    }
    const order = await resp.json();
    // clear cart after successful order
    setCartItems({});
    return order;
  };

  return (
    <CartContext.Provider
      value={{
  cartItems,
  addToCart,
  removeFromCart,
  setQuantity,
        getQuantity,
        getTotalItems,
        getTotalPrice,
        getCartItems,
          placeOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

