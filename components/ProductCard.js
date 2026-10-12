'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { fmtPKR, useCart } from './CartProvider';

/**
 * Per-collection hover pools. `hoverImage` is structured so real 2nd-angle
 * photos can replace the pool entries later without touching the logic.
 */
const HOVER_POOLS = {
  everyday: [
    '/images/products/everyday-01.jpg',
    '/images/products/everyday-02.jpg',
    '/images/products/everyday-03.jpg',
    '/images/products/everyday-04.jpg',
    '/images/products/everyday-05.jpg',
    '/images/products/everyday-06.jpg',
    '/images/products/everyday-07.jpg',
    '/images/products/everyday-08.jpg',
  ],
  signature: [
    '/images/products/signature-01.jpg',
    '/images/products/signature-02.jpg',
    '/images/products/signature-03.jpg',
    '/images/products/signature-04.jpg',
    '/images/products/signature-05.jpg',
    '/images/products/signature-06.jpg',
    '/images/products/signature-07.jpg',
    '/images/products/signature-08.jpg',
  ],
  leather: [
    '/images/products/leather-01.jpg',
    '/images/products/leather-02.jpg',
    '/images/products/leather-03.jpg',
    '/images/products/leather-04.jpg',
    '/images/products/leather-05.jpg',
    '/images/products/leather-06.jpg',
    '/images/products/leather-07.jpg',
    '/images/products/leather-08.jpg',
  ],
};

const LIFESTYLE_SHOTS = new Set([
  '/images/hero-model.jpg',
  '/images/product-mini.jpg',
  '/images/product-medium.jpg',
  '/images/product-large.jpg',
  '/images/product-crossbody.jpg',
]);

/**
 * Pick the hover image: the NEXT image in the same collection pool
 * (cyclical, guaranteed different). If the card currently shows a
 * model/lifestyle shot, hover to a product shot from its collection.
 */
function getHoverImage(p) {
  const pool = HOVER_POOLS[p.collection];
  if (!pool || pool.length === 0) return null;
  const idNum = typeof p.id === 'number' ? p.id : 0;
  if (LIFESTYLE_SHOTS.has(p.image)) {
    return pool[Math.abs(idNum) % pool.length];
  }
  const idx = pool.indexOf(p.image);
  const next = idx === -1 ? Math.abs(idNum) % pool.length : (idx + 1) % pool.length;
  const hoverImage = pool[next];
  return hoverImage === p.image ? pool[(next + 1) % pool.length] : hoverImage;
}

const TILT_MAX = 7;

export default function ProductCard({ p }) {
  const { toggleWish, isWished, add } = useCart();
  const [added, setAdded] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const cardRef = useRef(null);
  const wished = isWished(p.id);
  const discount = p.old_price ? Math.round((1 - p.price / p.old_price) * 100) : 0;
  const hoverImage = getHoverImage(p);

  // Desktop + fine pointer only: hover swap + tilt need a real cursor.
  useEffect(() => {
    setCanHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  }, []);

  // Preload the hover image so the crossfade is instant.
  useEffect(() => {
    if (!canHover || !hoverImage) return;
    const im = new Image();
    im.src = hoverImage;
  }, [canHover, hoverImage]);

  // 3D tilt following the cursor (rAF-throttled, lerped return on leave).
  useEffect(() => {
    const el = cardRef.current;
    if (!el || typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    el.classList.add('tilt-on');
    const st = { rx: 0, ry: 0, trx: 0, try: 0, hovering: false, raf: 0 };

    const loop = () => {
      st.rx += (st.trx - st.rx) * 0.12;
      st.ry += (st.try - st.ry) * 0.12;
      const settled =
        Math.abs(st.trx - st.rx) < 0.02 && Math.abs(st.try - st.ry) < 0.02;
      // Lift eases back as the card settles flat.
      const tiltAmt = Math.min(1, (Math.abs(st.rx) + Math.abs(st.ry)) / (TILT_MAX * 1.4));
      const lift = -6 * (1 - tiltAmt);
      el.style.transform =
        `perspective(900px) rotateX(${st.rx.toFixed(2)}deg) ` +
        `rotateY(${st.ry.toFixed(2)}deg) translateY(${lift.toFixed(1)}px)`;
      if (!settled || st.hovering) {
        st.raf = requestAnimationFrame(loop);
      } else {
        el.style.transform = '';
        st.raf = 0;
      }
    };
    const kick = () => {
      if (!st.raf) st.raf = requestAnimationFrame(loop);
    };

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      st.trx = -py * TILT_MAX;
      st.try = px * TILT_MAX;
      st.hovering = true;
      kick();
    };
    const onLeave = () => {
      st.trx = 0;
      st.try = 0;
      st.hovering = false;
      kick();
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(st.raf);
      el.classList.remove('tilt-on');
      el.style.transform = '';
    };
  }, []);

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
    <div className="prod-card" ref={cardRef}>
      <Link href={`/product/${p.id}`} className="prod-media" aria-label={p.name}>
        <img src={p.image} alt={`${p.name} — AMMIGE ${p.collection} handbag`} loading="lazy" />
        {canHover && hoverImage && (
          <img
            className="prod-img-hover"
            src={hoverImage}
            alt=""
            aria-hidden="true"
            loading="lazy"
          />
        )}
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
