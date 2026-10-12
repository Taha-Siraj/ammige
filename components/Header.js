'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useCart, fmtPKR } from './CartProvider';

const ANNOUNCEMENTS = [
  'Free delivery across Pakistan on orders over Rs 5,000',
  'Cash on Delivery available nationwide',
  '7-day easy exchange — no questions asked',
];

const NAV = [
  { href: '/shop', label: 'Shop All' },
  { href: '/shop?collection=everyday', label: 'Everyday' },
  { href: '/shop?collection=signature', label: 'Signature' },
  { href: '/shop?collection=leather', label: 'Leather' },
  { href: '/track', label: 'Track Order' },
];

const POPULAR_SEARCHES = ['Tote', 'Crossbody', 'Leather', 'Mini', 'Clutch'];

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
  );
}
function IconHeart({ filled }) {
  return (
    <svg viewBox="0 0 24 24" style={filled ? { fill: 'var(--gold-deep)', stroke: 'var(--gold-deep)' } : undefined}>
      <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8 3.6 5 6.8 5c2 0 3.7 1.1 5.2 3 1.5-1.9 3.2-3 5.2-3 3.2 0 5.3 3 4.1 6.3-1.8 4.6-9.3 9.2-9.3 9.2z" />
    </svg>
  );
}
function IconBag() {
  return (
    <svg viewBox="0 0 24 24"><path d="M6 8h15l-1.5 9h-12z" /><path d="M6 8l-1-4H2" /><circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /></svg>
  );
}

function SearchOverlay({ open, onClose }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 60);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open ]);

  useEffect(() => {
    if (!open || !q.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/products?q=${encodeURIComponent(q.trim())}&limit=6`);
        const d = await r.json();
        setResults(d.items || []);
      } catch { setResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [q, open]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search">
      <div className="search-sheet">
        <button className="icon-btn search-close" aria-label="Close search" onClick={onClose}>
          <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <div className="eyebrow">Search AMMIGE</div>
        <div className="search-big">
          <IconSearch />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Try &quot;tote&quot;, &quot;leather&quot;, &quot;mini&quot;…"
            aria-label="Search products"
          />
        </div>
        {!q.trim() && (
          <div className="search-popular">
            <span>Popular:</span>
            {POPULAR_SEARCHES.map((s) => (
              <button key={s} onClick={() => setQ(s)}>{s}</button>
            ))}
          </div>
        )}
        {q.trim() !== '' && (
          <div className="search-results">
            {results.length === 0 ? (
              <p className="search-none">No matches for “{q}”. Try “tote” or “leather”.</p>
            ) : (
              results.map((p) => (
                <Link key={p.id} href={`/product/${p.id}`} className="search-hit" onClick={onClose}>
                  <img src={p.image} alt={p.name} loading="lazy" />
                  <div className="min-w-0">
                    <b className="clamp-1">{p.name}</b>
                    <span>{fmtPKR(p.price)}</span>
                  </div>
                </Link>
              ))
            )}
            {results.length > 0 && (
              <Link href={`/shop?q=${encodeURIComponent(q.trim())}`} className="btn btn-outline btn-sm search-all" onClick={onClose}>
                View all results
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Header({ announcement }) {
  const { count, setOpen, wishCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [ai, setAi] = useState(0);

  const msgs = announcement ? [announcement, ANNOUNCEMENTS[1], ANNOUNCEMENTS[2]] : ANNOUNCEMENTS;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setAi((i) => (i + 1) % msgs.length), 4500);
    return () => clearInterval(t);
  }, [msgs.length]);

  useEffect(() => {
    document.body.style.overflow = menu ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menu]);

  return (
    <>
      <div className={`announce ${scrolled ? 'hide' : ''}`} aria-live="polite">
        <span key={ai} className="announce-msg">{msgs[ai]}</span>
      </div>
      <header className={`site-header ${scrolled ? 'scrolled slim' : ''}`}>
        <div className="wrap hd-top">
          <div className="hd-left">
            <button className="icon-btn mobile-toggle" aria-label="Open menu" onClick={() => setMenu(true)}>
              <svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
            <button className="icon-btn hd-search-btn" aria-label="Search" onClick={() => setSearchOpen(true)}>
              <IconSearch />
            </button>
          </div>
          <Link href="/" className="logo hd-logo" aria-label="AMMIGE home">AMMI<em>GE</em></Link>
          <div className="hd-icons">
            <button className="icon-btn hd-search-btn-m" aria-label="Search" onClick={() => setSearchOpen(true)}>
              <IconSearch />
            </button>
            <Link href="/wishlist" className="icon-btn" aria-label={`Wishlist, ${wishCount} items`}>
              <IconHeart />
              {wishCount > 0 && <span className="count-badge">{wishCount}</span>}
            </Link>
            <button className="icon-btn" aria-label={`Shopping bag, ${count} items`} onClick={() => setOpen(true)}>
              <IconBag />
              {count > 0 && <span className="count-badge">{count}</span>}
            </button>
          </div>
        </div>
        <nav className="hd-nav" aria-label="Categories">
          <div className="wrap">
            <ul>
              {NAV.map((n) => (
                <li key={n.href}><Link href={n.href}>{n.label}</Link></li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      <div className={`drawer-scrim ${menu ? 'open' : ''}`} onClick={() => setMenu(false)} aria-hidden="true" />
      <aside className={`mobile-drawer ${menu ? 'open' : ''}`} aria-hidden={!menu} aria-label="Menu">
        <div className="drawer-head">
          <span className="logo">AMMI<em>GE</em></span>
          <button className="icon-btn" aria-label="Close menu" onClick={() => setMenu(false)}>
            <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <nav>
          <Link href="/shop" onClick={() => setMenu(false)}>Shop All</Link>
          <div className="drawer-sub">Collections</div>
          <Link href="/shop?collection=everyday" onClick={() => setMenu(false)}>Everyday</Link>
          <Link href="/shop?collection=signature" onClick={() => setMenu(false)}>Signature</Link>
          <Link href="/shop?collection=leather" onClick={() => setMenu(false)}>Leather</Link>
          <div className="drawer-sub">Help</div>
          <Link href="/track" onClick={() => setMenu(false)}>Track Order</Link>
          <Link href="/wishlist" onClick={() => setMenu(false)}>Wishlist{wishCount > 0 ? ` (${wishCount})` : ''}</Link>
          <Link href="/faq" onClick={() => setMenu(false)}>FAQs</Link>
          <Link href="/contact" onClick={() => setMenu(false)}>Contact</Link>
        </nav>
        <div className="drawer-foot">
          <span>Cash on Delivery nationwide</span>
        </div>
      </aside>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

export function WhatsAppFloat({ number }) {
  if (!number) return null;
  return (
    <a
      className="wa-float"
      href={`https://wa.me/${number}?text=${encodeURIComponent('Assalam-o-Alaikum! I have a question about AMMIGE bags.')}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
    >
      <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.6-6.1c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.3-.6.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4 0-.5.1-.7l.4-.5c.1-.2.1-.4 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.2-.7.3-.9.9-1.1 2.2-.2 3.9a11.6 11.6 0 0 0 4.5 4.2c1.7.8 2.4.9 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.1-.4-.2z" /></svg>
    </a>
  );
}

const FREE_SHIP = 5000;

export function CartDrawer() {
  const { items, setQty, remove, open, setOpen } = useCart();
  const [products, setProducts] = useState({});
  const [cross, setCross] = useState([]);

  useEffect(() => {
    if (!open || items.length === 0) return;
    Promise.all(items.map((i) => fetch(`/api/products/${i.id}`).then((r) => r.json())))
      .then((list) => {
        const map = {};
        list.forEach((p) => { if (p && p.id) map[p.id] = p; });
        setProducts(map);
      })
      .catch(() => {});
  }, [open, items]);

  useEffect(() => {
    if (!open) return;
    const ids = items.map((i) => i.id).join(',');
    fetch(`/api/products?limit=100${ids ? '' : ''}`)
      .then((r) => r.json())
      .then((d) => {
        const inCart = new Set(items.map((i) => i.id));
        const pool = (d.items || []).filter((p) => !inCart.has(p.id));
        setCross(pool.slice(0, 3));
      })
      .catch(() => {});
  }, [open, items]);

  const total = items.reduce((s, i) => s + (products[i.id]?.price || 0) * i.qty, 0);
  const away = Math.max(0, FREE_SHIP - total);
  const pct = Math.min(100, Math.round((total / FREE_SHIP) * 100));

  return (
    <>
      <div className={`cart-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`cart-drawer ${open ? 'open' : ''}`} aria-hidden={!open} aria-label="Shopping bag">
        <div className="cart-head">
          <h3>Your Bag ({items.reduce((s, i) => s + i.qty, 0)})</h3>
          <button className="icon-btn" aria-label="Close bag" onClick={() => setOpen(false)}>
            <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        {items.length > 0 && (
          <div className="ship-progress">
            {away > 0 ? (
              <p><b>{fmtPKR(away)}</b> away from <b>FREE</b> nationwide delivery</p>
            ) : (
              <p className="unlocked">You&apos;ve unlocked <b>FREE</b> delivery</p>
            )}
            <div className="ship-bar"><span style={{ width: `${pct}%` }} /></div>
          </div>
        )}
        <div className="cart-items">
          {items.length === 0 && (
            <div className="empty">
              <div className="display">Your bag is empty</div>
              <p>Beautiful things are waiting.</p>
              <Link href="/shop" className="btn btn-dark btn-sm" onClick={() => setOpen(false)} style={{ marginTop: 18 }}>
                Start Shopping
              </Link>
            </div>
          )}
          {items.map((i) => {
            const p = products[i.id];
            if (!p) return null;
            return (
              <div className="cart-item" key={i.key}>
                <img src={p.image} alt={p.name} loading="lazy" />
                <div className="min-w-0">
                  <b className="clamp-2">{p.name}</b>
                  <div className="ci-meta">{fmtPKR(p.price)} each{i.color ? ` · ${i.color}` : ''}</div>
                  <div className="ci-qty">
                    <button onClick={() => setQty(i.key, i.qty - 1)} aria-label="Decrease quantity">−</button>
                    <b>{i.qty}</b>
                    <button onClick={() => setQty(i.key, i.qty + 1)} aria-label="Increase quantity">+</button>
                  </div>
                  <button className="ci-remove" onClick={() => remove(i.key)}>Remove</button>
                </div>
                <b className="ci-total">{fmtPKR(p.price * i.qty)}</b>
              </div>
            );
          })}
        </div>
        {items.length > 0 && cross.length > 0 && (
          <div className="cross-sell">
            <div className="eyebrow">Pairs well with</div>
            {cross.map((p) => (
              <CrossItem key={p.id} p={p} />
            ))}
          </div>
        )}
        {items.length > 0 && (
          <div className="cart-foot">
            <div className="cart-total"><span>Subtotal</span><span>{fmtPKR(total)}</span></div>
            <p className="cart-note">Delivery calculated at checkout · COD available</p>
            <Link href="/checkout" className="btn btn-gold" style={{ width: '100%' }} onClick={() => setOpen(false)}>
              Checkout Securely
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}

function CrossItem({ p }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const quickAdd = () => {
    add(p.id, 1, p.colors?.[0] || null);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };
  return (
    <div className="cross-item">
      <Link href={`/product/${p.id}`}>
        <img src={p.image} alt={p.name} loading="lazy" />
      </Link>
      <div className="min-w-0">
        <Link href={`/product/${p.id}`} className="clamp-2 cross-name">{p.name}</Link>
        <span className="cross-price">{fmtPKR(p.price)}</span>
      </div>
      <button className="btn btn-outline btn-sm" onClick={quickAdd}>{added ? 'Added ✓' : 'Add'}</button>
    </div>
  );
}
