'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';

const COLLS = [
  { id: '', name: 'All' },
  { id: 'everyday', name: 'Everyday' },
  { id: 'signature', name: 'Signature' },
  { id: 'leather', name: 'Leather' },
];

const SORTS = [
  { id: 'new', name: 'Newest' },
  { id: 'price_asc', name: 'Price: Low to High' },
  { id: 'price_desc', name: 'Price: High to Low' },
  { id: 'rating', name: 'Top Rated' },
];

function ShopInner() {
  const params = useSearchParams();
  const [collection, setCollection] = useState(params.get('collection') || '');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('new');
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: '24',
        sort,
        ...(collection ? { collection } : {}),
        ...(q.trim() ? { q: q.trim() } : {}),
      });
      const r = await fetch(`/api/products?${qs}`);
      const d = await r.json();
      setItems(d.items || []);
      setTotal(d.total || 0);
      setPages(d.pages || 1);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [collection, q, sort, page]);

  useEffect(() => {
    const t = setTimeout(load, q ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  useEffect(() => { setPage(1); }, [collection, sort, q]);

  return (
    <>
      <div className="wrap">
        <div className="shop-head">
          <div className="eyebrow">The Boutique</div>
          <h1 className="display">Shop AMMIGE</h1>
          <p style={{ color: 'var(--muted)', marginTop: 10 }}>
            {total} {total === 1 ? 'piece' : 'pieces'} · Cash on Delivery nationwide
          </p>
        </div>

        <div className="toolbar">
          <div className="chips">
            {COLLS.map((c) => (
              <button
                key={c.id}
                className={`chip ${collection === c.id ? 'on' : ''}`}
                onClick={() => setCollection(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="search">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
              <input
                placeholder="Search bags..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Search products"
              />
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products">
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="empty"><div className="display">Loading...</div></div>
        ) : items.length === 0 ? (
          <div className="empty">
            <div className="display">Nothing found</div>
            <p>Try a different search or collection.</p>
          </div>
        ) : (
          <div className="prod-grid" style={{ paddingBottom: 40 }}>
            {items.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}

        {pages > 1 && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', paddingBottom: 90 }}>
            <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span style={{ alignSelf: 'center', color: 'var(--muted)', fontSize: 14 }}>
              Page {page} of {pages}
            </span>
            <button className="btn btn-outline btn-sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="empty"><div className="display">Loading...</div></div>}>
      <ShopInner />
    </Suspense>
  );
}
