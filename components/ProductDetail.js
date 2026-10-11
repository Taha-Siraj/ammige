'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart, fmtPKR } from './CartProvider';
import ProductCard from './ProductCard';

const COLOR_HEX = {
  'Sand Beige': '#D9C7A7', 'Cognac': '#9A5B33', 'Classic Black': '#1c1c1c',
  'Ivory White': '#F5F0E6', 'Taupe': '#8B7D6B', 'Blush Pink': '#E8B4B8',
  'Olive Green': '#6B7A3F', 'Navy Blue': '#1F2A44', 'Camel': '#C19A6B',
  'Burgundy': '#6D1F2C', 'Charcoal Grey': '#3E3E3E', 'Tan': '#D2B48C',
  'Mustard Yellow': '#D9A62E', 'Teal': '#2A7F7F', 'Maroon': '#5C1A24',
  'Chocolate Brown': '#4A2E1B', 'Dusty Rose': '#C48A8A', 'Sage Green': '#9CAF88',
  'Mauve': '#B784A7', 'Cream': '#FFF8E7', 'Espresso': '#3A2418',
  'Slate Grey': '#5D6D7E', 'Terracotta': '#C1694A', 'Wine Red': '#722F37',
};

export default function ProductDetail({ p, related }) {
  const { add, setOpen } = useCart();
  const [qty, setQtyLocal] = useState(1);
  const [color, setColor] = useState(p.colors?.[0] || null);
  const [added, setAdded] = useState(false);

  const discount = p.old_price ? Math.round((1 - p.price / p.old_price) * 100) : 0;

  const handleAdd = () => {
    add(p.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="wrap">
      <div style={{ paddingTop: 28, fontSize: 13, color: 'var(--muted)' }}>
        <Link href="/">Home</Link> &nbsp;/&nbsp; <Link href="/shop">Shop</Link> &nbsp;/&nbsp; {p.name}
      </div>
      <div className="pd-grid">
        <div className="pd-media">
          <div className="pd-main-img">
            <img src={p.image} alt={p.name} />
          </div>
        </div>
        <div className="pd-info">
          <div className="eyebrow">{p.sku} · {p.collection}</div>
          <h1 className="display">{p.name}</h1>
          <div className="stars" style={{ marginTop: 10 }}>
            {'★'.repeat(Math.round(p.rating || 0))}
            <small> {p.rating} · {p.reviews} reviews</small>
          </div>
          <div className="pd-price">
            <b>{fmtPKR(p.price)}</b>
            {p.old_price && <s>{fmtPKR(p.old_price)}</s>}
            {discount > 0 && <span className="save">Save {discount}%</span>}
          </div>
          <p className="pd-desc">{p.description}</p>

          {p.colors?.length > 0 && (
            <>
              <div style={{ fontSize: 12, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Colour — <b style={{ color: 'var(--espresso)' }}>{color}</b>
              </div>
              <div className="swatches">
                {p.colors.map((c) => (
                  <button
                    key={c}
                    className={`swatch ${color === c ? 'on' : ''}`}
                    title={c}
                    aria-label={c}
                    style={{ background: COLOR_HEX[c] || '#ccc' }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </>
          )}

          <div className="qty-row">
            <div className="qty">
              <button onClick={() => setQtyLocal(Math.max(1, qty - 1))} aria-label="Decrease">−</button>
              <b>{qty}</b>
              <button onClick={() => setQtyLocal(Math.min(p.stock, qty + 1))} aria-label="Increase">+</button>
            </div>
            <button
              className="btn btn-gold"
              style={{ flex: 1 }}
              onClick={handleAdd}
              disabled={p.stock === 0}
            >
              {p.stock === 0 ? 'Out of Stock' : added ? 'Added ✓' : 'Add to Bag'}
            </button>
          </div>
          <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => { add(p.id, qty); setOpen(true); }}>
            Buy Now
          </button>

          <div style={{ display: 'flex', gap: 24, marginTop: 24, fontSize: 13.5, color: 'var(--muted)' }}>
            <span>✓ Cash on Delivery</span>
            <span>✓ 7-day Exchange</span>
            <span>{p.stock > 0 ? `✓ In Stock (${p.stock})` : '✗ Out of Stock'}</span>
          </div>

          <div className="spec">
            <div><span>Material</span><span>{p.material || '—'}</span></div>
            <div><span>Collection</span><span style={{ textTransform: 'capitalize' }}>{p.collection}</span></div>
            <div><span>SKU</span><span>{p.sku}</span></div>
          </div>
        </div>
      </div>

      {related?.length > 0 && (
        <section className="block" style={{ paddingTop: 0 }}>
          <div className="sec-head">
            <div className="eyebrow">You may also love</div>
            <h2 className="display">Complete the look</h2>
          </div>
          <div className="prod-grid">
            {related.map((r) => (
              <ProductCard key={r.id} p={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
