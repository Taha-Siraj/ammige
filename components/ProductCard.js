import Link from 'next/link';
import { fmtPKR } from './CartProvider';

export default function ProductCard({ p }) {
  const discount = p.old_price ? Math.round((1 - p.price / p.old_price) * 100) : 0;
  return (
    <Link href={`/product/${p.id}`} className="prod-card">
      <div className="prod-media">
        <img src={p.image} alt={p.name} loading="lazy" />
        {p.badge && (
          <span className={`prod-badge ${p.badge === 'Sale' ? 'sale' : ''}`}>{p.badge}</span>
        )}
      </div>
      <div className="prod-info">
        <div className="prod-meta">{p.sku}</div>
        <div className="prod-name">{p.name}</div>
        <div className="stars">
          {'★'.repeat(Math.round(p.rating || 0))}
          <small> ({p.reviews})</small>
        </div>
        <div className="prod-price">
          <b>{fmtPKR(p.price)}</b>
          {p.old_price && <s>{fmtPKR(p.old_price)}</s>}
          {discount > 0 && <span className="pill" style={{ background: '#FBDfD9', color: '#A33327' }}>-{discount}%</span>}
        </div>
      </div>
    </Link>
  );
}
