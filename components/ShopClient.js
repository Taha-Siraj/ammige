'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { COLOR_HEX } from '@/components/colorHex';

const COLLECTIONS = [
  { id: '', name: 'All Collections' },
  { id: 'everyday', name: 'Everyday' },
  { id: 'signature', name: 'Signature' },
  { id: 'leather', name: 'Leather' },
];

const SORTS = [
  { id: 'featured', name: 'Featured' },
  { id: 'new', name: 'Newest' },
  { id: 'price_asc', name: 'Price: Low to High' },
  { id: 'price_desc', name: 'Price: High to Low' },
  { id: 'rating', name: 'Top Rated' },
];

const PRICE_BANDS = [
  { id: 'u8', label: 'Under Rs 8,000', test: (p) => p.price < 8000 },
  { id: 'b1', label: 'Rs 8,000 – 15,000', test: (p) => p.price >= 8000 && p.price <= 15000 },
  { id: 'b2', label: 'Rs 15,000 – 25,000', test: (p) => p.price > 15000 && p.price <= 25000 },
  { id: 'a25', label: 'Above Rs 25,000', test: (p) => p.price > 25000 },
];

const MATERIAL_GROUPS = [
  { id: 'leather', label: 'Genuine Leather', test: (m) => /full-grain|top-grain|genuine leather/i.test(m || '') },
  { id: 'saffiano', label: 'Saffiano & Quilted', test: (m) => /saffiano|quilted/i.test(m || '') },
  { id: 'vegan', label: 'Vegan Leather / PU', test: (m) => /vegan|pebbled pu/i.test(m || '') },
  { id: 'canvas', label: 'Canvas & Nylon', test: (m) => /canvas|nylon/i.test(m || '') },
];

const SIZES = ['Mini', 'Small', 'Medium', 'Large'];

function sizeOf(name) {
  const n = (name || '').toLowerCase();
  if (/\bmini\b/.test(n)) return 'Mini';
  if (/\blarge\b/.test(n)) return 'Large';
  if (/\bsmall\b/.test(n)) return 'Small';
  return 'Medium';
}

const PAGE_SIZE = 24;
const EMPTY_F = { colors: [], sizes: [], prices: [], materials: [] };

function ShopInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);

  const [collection, setCollection] = useState(params.get('collection') || '');
  const [q, setQ] = useState(params.get('q') || '');
  const [sort, setSort] = useState(params.get('sort') || 'featured');
  const [f, setF] = useState(EMPTY_F);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [openPanel, setOpenPanel] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [draft, setDraft] = useState(EMPTY_F);
  const [drawerSec, setDrawerSec] = useState('color');

  // fetch entire catalog once (260 products)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        let page = 1, acc = [];
        for (;;) {
          const r = await fetch(`/api/products?page=${page}&limit=100`);
          const d = await r.json();
          acc = acc.concat(d.items || []);
          if (!d.items || d.items.length < 100 || page >= (d.pages || 1)) break;
          page += 1;
        }
        if (alive) setAll(acc);
      } catch { if (alive) setAll([]); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  // sync from URL (header nav / search)
  const pCollection = params.get('collection') || '';
  const pQ = params.get('q') || '';
  useEffect(() => { setCollection(pCollection); setVisible(PAGE_SIZE); }, [pCollection]);
  useEffect(() => { setQ(pQ); setVisible(PAGE_SIZE); }, [pQ]);

  // write collection/q/sort back to URL
  useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams();
      if (collection) sp.set('collection', collection);
      if (q.trim()) sp.set('q', q.trim());
      if (sort !== 'featured') sp.set('sort', sort);
      const qs = sp.toString();
      router.replace(`/shop${qs ? `?${qs}` : ''}`, { scroll: false });
    }, q ? 400 : 0);
    return () => clearTimeout(t);
  }, [collection, q, sort, router]);

  useEffect(() => { setVisible(PAGE_SIZE); }, [collection, q, sort, f]);

  const colorFreq = useMemo(() => {
    const m = new Map();
    for (const p of all) {
      for (const c of (p.colors || [])) m.set(c, (m.get(c) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 16).map(([c]) => c);
  }, [all]);

  const filtered = useMemo(() => {
    let list = all;
    if (collection) list = list.filter((p) => p.collection === collection);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(needle));
    }
    if (f.colors.length) list = list.filter((p) => (p.colors || []).some((c) => f.colors.includes(c)));
    if (f.sizes.length) list = list.filter((p) => f.sizes.includes(sizeOf(p.name)));
    if (f.prices.length) {
      const bands = PRICE_BANDS.filter((b) => f.prices.includes(b.id));
      list = list.filter((p) => bands.some((b) => b.test(p)));
    }
    if (f.materials.length) {
      const groups = MATERIAL_GROUPS.filter((g) => f.materials.includes(g.id));
      list = list.filter((p) => groups.some((g) => g.test(p.material)));
    }
    const arr = [...list];
    switch (sort) {
      case 'price_asc': arr.sort((a, b) => a.price - b.price); break;
      case 'price_desc': arr.sort((a, b) => b.price - a.price); break;
      case 'rating': arr.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'new': arr.sort((a, b) => b.id - a.id); break;
      default: arr.sort((a, b) =>
        ((b.badge === 'Bestseller') - (a.badge === 'Bestseller')) || ((b.rating || 0) - (a.rating || 0)));
    }
    return arr;
  }, [all, collection, q, f, sort]);

  const activeCount = f.colors.length + f.sizes.length + f.prices.length + f.materials.length;

  const toggleArr = (setter) => (id) =>
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleColor = toggleArr((fn) => setF((p) => ({ ...p, colors: fn(p.colors) })));
  const toggleSize = toggleArr((fn) => setF((p) => ({ ...p, sizes: fn(p.sizes) })));
  const togglePrice = toggleArr((fn) => setF((p) => ({ ...p, prices: fn(p.prices) })));
  const toggleMaterial = toggleArr((fn) => setF((p) => ({ ...p, materials: fn(p.materials) })));

  const clearAll = () => { setF(EMPTY_F); setCollection(''); setQ(''); };

  const chips = [
    ...f.colors.map((c) => ({ label: c, clear: () => toggleColor(c) })),
    ...f.sizes.map((s) => ({ label: `${s} size`, clear: () => toggleSize(s) })),
    ...f.prices.map((id) => ({ label: PRICE_BANDS.find((b) => b.id === id)?.label || id, clear: () => togglePrice(id) })),
    ...f.materials.map((id) => ({ label: MATERIAL_GROUPS.find((g) => g.id === id)?.label || id, clear: () => toggleMaterial(id) })),
  ];

  const openDrawer = () => { setDraft(JSON.parse(JSON.stringify(f))); setDrawerSec('color'); setDrawer(true); };
  const applyDrawer = () => { setF(draft); setDrawer(false); };
  const draftCount = draft.colors.length + draft.sizes.length + draft.prices.length + draft.materials.length;
  const draftFiltered = useMemo(() => {
    let list = all;
    if (collection) list = list.filter((p) => p.collection === collection);
    if (q.trim()) list = list.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(q.trim().toLowerCase()));
    if (draft.colors.length) list = list.filter((p) => (p.colors || []).some((c) => draft.colors.includes(c)));
    if (draft.sizes.length) list = list.filter((p) => draft.sizes.includes(sizeOf(p.name)));
    if (draft.prices.length) {
      const bands = PRICE_BANDS.filter((b) => draft.prices.includes(b.id));
      list = list.filter((p) => bands.some((b) => b.test(p)));
    }
    if (draft.materials.length) {
      const groups = MATERIAL_GROUPS.filter((g) => draft.materials.includes(g.id));
      list = list.filter((p) => groups.some((g) => g.test(p.material)));
    }
    return list;
  }, [all, collection, q, draft]);

  const dToggle = (key) => (id) =>
    setDraft((p) => ({ ...p, [key]: p[key].includes(id) ? p[key].filter((x) => x !== id) : [...p[key], id] }));

  const shown = filtered.slice(0, visible);
  const collName = COLLECTIONS.find((c) => c.id === collection)?.name || 'All Collections';

  const panel = (id, title, activeN, body) => (
    <div className="f-panel">
      <button className={`f-pill ${activeN > 0 ? 'on' : ''}`} onClick={() => setOpenPanel(openPanel === id ? null : id)} aria-expanded={openPanel === id}>
        {title}{activeN > 0 && <span className="n">{activeN}</span>}
      </button>
      {openPanel === id && <div className="f-dropdown">{body}</div>}
    </div>
  );

  return (
    <div className="wrap">
      <div className="shop-head">
        <div className="eyebrow">The Boutique</div>
        <h1 className="display">Shop {collection ? COLLECTIONS.find((c) => c.id === collection)?.name : 'AMMIGE'}</h1>
        <p style={{ color: 'var(--muted)', marginTop: 10 }}>
          Handbags for every plan — office days in Karachi, shaadis in Lahore, evenings in Islamabad. Cash on Delivery nationwide.
        </p>
      </div>

      <div className="filter-bar">
        <div className="f-pills">
          {panel('collection', `Collection: ${collName}`, collection ? 1 : 0, (
            <div className="f-opts">
              {COLLECTIONS.map((c) => (
                <button key={c.id} className={`f-opt ${collection === c.id ? 'on' : ''}`} onClick={() => { setCollection(c.id); setOpenPanel(null); }}>
                  <span className="tick">✓</span>{c.name}
                </button>
              ))}
            </div>
          ))}
          {panel('color', 'Colour', f.colors.length, (
            <div className="f-swatches">
              {colorFreq.map((c) => (
                <button
                  key={c}
                  className={`f-swatch ${f.colors.includes(c) ? 'on' : ''}`}
                  style={{ background: COLOR_HEX[c] || '#ccc' }}
                  title={c}
                  aria-label={`Filter by ${c}`}
                  aria-pressed={f.colors.includes(c)}
                  onClick={() => toggleColor(c)}
                />
              ))}
            </div>
          ))}
          {panel('size', 'Size', f.sizes.length, (
            <div className="f-opts">
              {SIZES.map((s) => (
                <button key={s} className={`f-opt ${f.sizes.includes(s) ? 'on' : ''}`} onClick={() => toggleSize(s)}>
                  <span className="tick">✓</span>{s}
                </button>
              ))}
            </div>
          ))}
          {panel('price', 'Price', f.prices.length, (
            <div className="f-opts">
              {PRICE_BANDS.map((b) => (
                <button key={b.id} className={`f-opt ${f.prices.includes(b.id) ? 'on' : ''}`} onClick={() => togglePrice(b.id)}>
                  <span className="tick">✓</span>{b.label}
                </button>
              ))}
            </div>
          ))}
          {panel('material', 'Material', f.materials.length, (
            <div className="f-opts">
              {MATERIAL_GROUPS.map((g) => (
                <button key={g.id} className={`f-opt ${f.materials.includes(g.id) ? 'on' : ''}`} onClick={() => toggleMaterial(g.id)}>
                  <span className="tick">✓</span>{g.label}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="sort-wrap">
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products">
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <button className="btn btn-outline btn-sm filters-btn-mobile" onClick={openDrawer}>
        Filters{activeCount > 0 ? ` (${activeCount})` : ''}
      </button>

      {(chips.length > 0 || q.trim()) && (
        <div className="filter-chips">
          {q.trim() && <span className="f-chip">“{q.trim()}”<button onClick={() => setQ('')} aria-label="Clear search">✕</button></span>}
          {chips.map((c, i) => (
            <span key={i} className="f-chip">{c.label}<button onClick={c.clear} aria-label={`Remove ${c.label} filter`}>✕</button></span>
          ))}
          <button className="f-clear" onClick={clearAll}>Clear all</button>
        </div>
      )}

      <p className="results-count" aria-live="polite">
        {loading ? 'Loading the boutique…' : `${filtered.length} ${filtered.length === 1 ? 'piece' : 'pieces'}${collection ? ` in ${collName}` : ''}`}
      </p>

      {loading ? (
        <div className="empty"><div className="display">Loading...</div></div>
      ) : filtered.length === 0 ? (
        <div className="empty" style={{ paddingBottom: 90 }}>
          <div className="display">No matches</div>
          <p>Try removing a filter or two — your bag is here somewhere.</p>
          <button className="btn btn-gold" style={{ marginTop: 20 }} onClick={clearAll}>Clear all filters</button>
        </div>
      ) : (
        <>
          <div className="prod-grid" style={{ paddingBottom: 40 }}>
            {shown.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
          {visible < filtered.length && (
            <div style={{ textAlign: 'center', paddingBottom: 90 }}>
              <button className="btn btn-outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                Load more ({filtered.length - visible} remaining)
              </button>
            </div>
          )}
          {visible >= filtered.length && <div style={{ paddingBottom: 90 }} />}
        </>
      )}

      {openPanel && <div className="f-backdrop" onClick={() => setOpenPanel(null)} aria-hidden="true" />}

      <div className={`filter-drawer ${drawer ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="Filters" aria-hidden={!drawer}>
        <div className="fd-head">
          <h3>Filters</h3>
          <button className="icon-btn" aria-label="Close filters" onClick={() => setDrawer(false)}>
            <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className="fd-body">
          {[
            { id: 'color', label: 'Colour', body: (
              <div className="f-swatches">
                {colorFreq.map((c) => (
                  <button key={c} className={`f-swatch ${draft.colors.includes(c) ? 'on' : ''}`}
                    style={{ background: COLOR_HEX[c] || '#ccc' }} title={c}
                    aria-label={`Filter by ${c}`} onClick={() => dToggle('colors')(c)} />
                ))}
              </div>
            )},
            { id: 'size', label: 'Size', body: (
              <div className="f-opts">{SIZES.map((s) => (
                <button key={s} className={`f-opt ${draft.sizes.includes(s) ? 'on' : ''}`} onClick={() => dToggle('sizes')(s)}>
                  <span className="tick">✓</span>{s}
                </button>))}</div>
            )},
            { id: 'price', label: 'Price', body: (
              <div className="f-opts">{PRICE_BANDS.map((b) => (
                <button key={b.id} className={`f-opt ${draft.prices.includes(b.id) ? 'on' : ''}`} onClick={() => dToggle('prices')(b.id)}>
                  <span className="tick">✓</span>{b.label}
                </button>))}</div>
            )},
            { id: 'material', label: 'Material', body: (
              <div className="f-opts">{MATERIAL_GROUPS.map((g) => (
                <button key={g.id} className={`f-opt ${draft.materials.includes(g.id) ? 'on' : ''}`} onClick={() => dToggle('materials')(g.id)}>
                  <span className="tick">✓</span>{g.label}
                </button>))}</div>
            )},
          ].map((s) => (
            <div key={s.id} className={`fd-section ${drawerSec === s.id ? 'open' : ''}`}>
              <button className="fd-sec-btn" onClick={() => setDrawerSec(drawerSec === s.id ? '' : s.id)} aria-expanded={drawerSec === s.id}>
                {s.label}
                <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              <div className="fd-sec-body"><div className="fd-sec-inner">{s.body}</div></div>
            </div>
          ))}
        </div>
        <div className="fd-foot">
          <button className="btn btn-gold" onClick={applyDrawer}>
            Show {draftFiltered.length} result{draftFiltered.length === 1 ? '' : 's'}{draftCount > 0 ? ` (${draftCount} filter${draftCount === 1 ? '' : 's'})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ShopClient() {
  return (
    <Suspense fallback={<div className="wrap"><div className="empty"><div className="display">Loading...</div></div></div>}>
      <ShopInner />
    </Suspense>
  );
}
