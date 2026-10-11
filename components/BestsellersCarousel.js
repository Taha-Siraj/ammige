'use client';

import { useRef } from 'react';
import ProductCard from './ProductCard';

export default function BestsellersCarousel({ items }) {
  const ref = useRef(null);
  const scroll = (dir) => {
    ref.current?.scrollBy({ left: dir * 660, behavior: 'smooth' });
  };
  return (
    <div className="carousel-shell">
      <button className="car-btn prev" onClick={() => scroll(-1)} aria-label="Previous">
        <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg>
      </button>
      <div className="carousel" ref={ref}>
        {items.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
      <button className="car-btn next" onClick={() => scroll(1)} aria-label="Next">
        <svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  );
}
