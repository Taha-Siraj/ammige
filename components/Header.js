'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart, fmtPKR } from './CartProvider';

export default function Header({ announcement }) {
  const { count, setOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <div className="announce">{announcement}</div>
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="wrap nav">
          <button
            className="icon-btn mobile-toggle"
            aria-label="Menu"
            onClick={() => setMenu(true)}
          >
            <svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <Link href="/" className="logo">AMMI<em>GE</em></Link>
          <nav>
            <ul className="nav-links">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/shop">Shop</Link></li>
              <li><Link href="/shop?collection=everyday">Everyday</Link></li>
              <li><Link href="/shop?collection=signature">Signature</Link></li>
              <li><Link href="/shop?collection=leather">Leather</Link></li>
              <li><Link href="/track">Track Order</Link></li>
            </ul>
          </nav>
          <div className="nav-icons">
            <button className="icon-btn" aria-label="Cart" onClick={() => setOpen(true)}>
              <svg viewBox="0 0 24 24"><path d="M6 8h15l-1.5 9h-12z" /><path d="M6 8l-1-4H2" /><circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /></svg>
              {count > 0 && <span className="cart-count">{count}</span>}
            </button>
          </div>
        </div>
      </header>
      <div className={`mobile-menu ${menu ? 'open' : ''}`}>
        <button
          className="icon-btn"
          aria-label="Close"
          onClick={() => setMenu(false)}
          style={{ position: 'absolute', top: 24, right: 24 }}
        >
          <svg viewBox="0 0 24 24" style={{ stroke: '#fff' }}><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        {['/', '/shop', '/track'].map((h, i) => (
          <Link key={h} href={h} onClick={() => setMenu(false)}>
            {['Home', 'Shop', 'Track Order'][i]}
          </Link>
        ))}
      </div>
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

export function CartDrawer() {
  const { items, setQty, remove, open, setOpen, clear } = useCart();
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || items.length === 0) return;
    setLoading(true);
    Promise.all(items.map((i) => fetch(`/api/products/${i.id}`).then((r) => r.json())))
      .then((list) => {
        const map = {};
        list.forEach((p) => { if (p && p.id) map[p.id] = p; });
        setProducts(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, items]);

  const total = items.reduce((s, i) => s + (products[i.id]?.price || 0) * i.qty, 0);

  return (
    <>
      <div className={`cart-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`cart-drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="cart-head">
          <h3>Your Bag ({items.reduce((s, i) => s + i.qty, 0)})</h3>
          <button className="icon-btn" aria-label="Close cart" onClick={() => setOpen(false)}>
            <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
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
              <div className="cart-item" key={i.id}>
                <img src={p.image} alt={p.name} />
                <div>
                  <b>{p.name}</b>
                  <div className="ci-meta">{fmtPKR(p.price)} each</div>
                  <div className="ci-qty">
                    <button onClick={() => setQty(i.id, i.qty - 1)} aria-label="Decrease">−</button>
                    <b>{i.qty}</b>
                    <button onClick={() => setQty(i.id, i.qty + 1)} aria-label="Increase">+</button>
                  </div>
                  <button className="ci-remove" onClick={() => remove(i.id)}>Remove</button>
                </div>
                <b>{fmtPKR(p.price * i.qty)}</b>
              </div>
            );
          })}
        </div>
        {items.length > 0 && (
          <div className="cart-foot">
            <div className="cart-total"><span>Total</span><span>{fmtPKR(total)}</span></div>
            <Link href="/checkout" className="btn btn-gold" style={{ width: '100%' }} onClick={() => setOpen(false)}>
              Checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
