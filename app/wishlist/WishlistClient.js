'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/components/CartProvider';
import ProductCard from '@/components/ProductCard';

export default function WishlistInner() {
  const { wishlist, loaded } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loaded) return;
    if (wishlist.length === 0) { setProducts([]); setLoading(false); return; }
    setLoading(true);
    Promise.all(wishlist.map((id) => fetch(`/api/products/${id}`).then((r) => r.json()).catch(() => null)))
      .then((list) => setProducts(list.filter((p) => p && p.id)))
      .finally(() => setLoading(false));
  }, [loaded, wishlist]);

  return (
    <div className="wrap">
      <div className="shop-head">
        <div className="eyebrow">Saved for later</div>
        <h1 className="display">Your Wishlist</h1>
        <p style={{ color: 'var(--muted)', marginTop: 10 }}>
          {wishlist.length} {wishlist.length === 1 ? 'piece' : 'pieces'} you&apos;ve loved
        </p>
      </div>
      {loading ? (
        <div className="empty"><div className="display">Loading...</div></div>
      ) : products.length === 0 ? (
        <div className="empty" style={{ paddingBottom: 90 }}>
          <div className="display">Nothing saved yet</div>
          <p>Tap the heart on any bag to keep it here.</p>
          <Link href="/shop" className="btn btn-gold" style={{ marginTop: 20 }}>Discover Bags</Link>
        </div>
      ) : (
        <div className="prod-grid" style={{ paddingBottom: 90 }}>
          {products.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
