'use client';

import Link from 'next/link';
import { useState } from 'react';
import { fmtPKR, useCart } from './CartProvider';

export default function ProductCard({ p }) {
  const { toggleWish, isWished, add } = useCart();
  const [added, setAdded] = useState(false);
  const wished = isWished(p.id);
  const discount = p.old_price ? Math.round((1 - p.price / p.old_price) * 100) : 0;

  const quickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    add(p.id, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1300);
  };

  const toggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWish(p.id);
  };

  return (
    <div className="prod-card">
      <Link href={`/product/${p.id}`} className="prod-media" aria-label={p.name}>
        <img src={p.image} alt={`${p.name} — AMMIGE ${p.collection} handbag`} loading="lazy" />
        {p.badge && (
          <span className={`prod-badge ${p.badge === 'Sale' ? 'sale' : ''}`}>{p.badge}</span>
        )}
        <button
          className={`prod-wish ${wished ? 'on' : ''}`}
          onClick={toggle}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wished}
        >
          <svg viewBox="0 0 24 24">
            <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8 3.6 5 6.8 5c2 0 3.7 1.1 5.2 3 1.5-1.9 3.2-3 5.2-3 3.2 0 5.3 3 4.1 6.3-1.8 4.6-9.3 9.2-9.3 9.2z" />
          </svg>
        </button>
        <button className="prod-quickadd" onClick={quickAdd}>
          {added ? 'Added ✓' : 'Add to Bag'}
        </button>
      </Link>
      <div className="prod-info">
        <div className="prod-meta">{p.sku}</div>
        <Link href={`/product/${p.id}`} className="prod-name clamp-2">{p.name}</Link>
        <div className="stars" aria-label={`Rated ${p.rating} out of 5`}>
          {'★'.repeat(Math.round(p.rating || 0))}
          <small> ({p.reviews})</small>
        </div>
        <div className="prod-price">
          <b>{fmtPKR(p.price)}</b>
          {p.old_price && <s>{fmtPKR(p.old_price)}</s>}
          {discount > 0 && <span className="pill" style={{ background: '#FBDfD9', color: '#A33327' }}>-{discount}%</span>}
        </div>
      </div>
    </div>
  );
}
