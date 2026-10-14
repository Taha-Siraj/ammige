'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fmtPKR } from '@/components/CartProvider';

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function AccountClient() {
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/auth/me');
        const d = await r.json().catch(() => ({}));
        if (!r.ok || !d.ok) {
          router.replace('/login?next=/account');
          return;
        }
        if (cancelled) return;
        setCustomer(d.customer);
        const ro = await fetch('/api/auth/orders');
        const d2 = await ro.json().catch(() => ({}));
        if (!cancelled && ro.ok && d2.ok) setOrders(d2.orders || []);
      } catch {
        if (!cancelled) router.replace('/login?next=/account');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  const logout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch { /* still redirect */ }
    router.push('/');
    router.refresh();
  };

  if (loading || !customer) {
    return (
      <div className="wrap">
        <div className="empty" style={{ padding: '100px 20px' }}>
          <div className="display">Loading…</div>
        </div>
      </div>
    );
  }

  const initial = (customer.name || 'A').trim().charAt(0).toUpperCase();

  return (
    <div className="wrap">
      <div className="shop-head">
        <div className="eyebrow">My account</div>
        <h1 className="display">Assalam-o-Alaikum, {customer.name.split(' ')[0]}!</h1>
      </div>

      <div className="acct-head">
        <div className="acct-avatar" aria-hidden="true">{initial}</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 19 }}>{customer.name}</div>
          <div style={{ color: 'var(--muted)', fontSize: 14.5 }}>{customer.email}</div>
          {customer.phone && <div style={{ color: 'var(--muted)', fontSize: 14.5 }}>{customer.phone}</div>}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-outline btn-sm" onClick={logout} disabled={loggingOut}>
            {loggingOut ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      </div>

      <section className="block" style={{ padding: '20px 0 90px' }}>
        <div className="sec-head" style={{ textAlign: 'left', margin: '0 0 26px', maxWidth: 'none' }}>
          <h2 className="display" style={{ fontSize: 30 }}>My Orders</h2>
        </div>
        {orders.length === 0 ? (
          <div className="co-card" style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)' }}>You haven&apos;t placed any orders yet.</p>
            <Link href="/shop" className="btn btn-gold" style={{ marginTop: 16 }}>Start Shopping</Link>
          </div>
        ) : (
          <div className="acct-orders">
            {orders.map((o) => (
              <div className="acct-order" key={o.id}>
                <div className="acct-order-top">
                  <div>
                    <b>Order #{o.id}</b>
                    <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>{fmtDate(o.created_at)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className={`status-pill ${o.status}`}>{o.status}</span>
                    <b>{fmtPKR(o.total)}</b>
                  </div>
                </div>
                <div className="acct-items">
                  {o.items.map((l, idx) => (
                    <div className="acct-item" key={`${o.id}-${idx}`}>
                      {l.image && <img src={l.image} alt="" loading="lazy" />}
                      <div className="min-w-0">
                        <div className="clamp-1" style={{ fontWeight: 500 }}>{l.name}</div>
                        <small>Qty {l.qty}{l.color ? ` · ${l.color}` : ''}</small>
                      </div>
                      <b style={{ fontSize: 14 }}>{fmtPKR(l.price * l.qty)}</b>
                    </div>
                  ))}
                </div>
                <Link
                  href={`/track?id=${o.id}`}
                  style={{ display: 'inline-block', marginTop: 12, fontSize: 13.5, color: 'var(--gold-deep)', textDecoration: 'underline' }}
                >
                  Track this order →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
