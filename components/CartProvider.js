'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // [{id, qty}]
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [wishlist, setWishlist] = useState([]); // [id]

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ammige_cart');
      if (raw) setItems(JSON.parse(raw));
      const w = localStorage.getItem('ammige_wishlist');
      if (w) setWishlist(JSON.parse(w));
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      try { localStorage.setItem('ammige_cart', JSON.stringify(items)); } catch { /* ignore */ }
    }
  }, [items, loaded]);

  useEffect(() => {
    if (loaded) {
      try { localStorage.setItem('ammige_wishlist', JSON.stringify(wishlist)); } catch { /* ignore */ }
    }
  }, [wishlist, loaded]);

  const add = (id, qty = 1) =>
    setItems((prev) => {
      const found = prev.find((i) => i.id === id);
      if (found) return prev.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i));
      return [...prev, { id, qty }];
    });
  const setQty = (id, qty) =>
    setItems((prev) =>
      qty <= 0 ? prev.filter((i) => i.id !== id) : prev.map((i) => (i.id === id ? { ...i, qty } : i))
    );
  const remove = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clear = () => setItems([]);
  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);

  const toggleWish = (id) =>
    setWishlist((prev) => (prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]));
  const isWished = (id) => wishlist.includes(id);
  const wishCount = wishlist.length;

  const value = useMemo(
    () => ({ items, add, setQty, remove, clear, count, open, setOpen, loaded,
             wishlist, toggleWish, isWished, wishCount }),
    [items, count, open, loaded, wishlist]
  );
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

export const fmtPKR = (n) => 'Rs ' + Number(n || 0).toLocaleString('en-PK');
