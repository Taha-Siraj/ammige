'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { fmtPKR } from '@/components/CartProvider';

const STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];
const STEP_LABEL = {
  pending: ['Order Placed', 'We have received your order.'],
  confirmed: ['Confirmed', 'Your order is being prepared.'],
  shipped: ['Shipped', 'Your order is on its way.'],
  delivered: ['Delivered', 'Enjoy your new AMMIGE piece!'],
  cancelled: ['Cancelled', 'This order was cancelled.'],
};

function TrackInner() {
  const params = useSearchParams();
  const [id, setId] = useState(params.get('id') || '');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isNew = params.get('new') === '1';

  const lookup = async (oid) => {
    if (!oid) return;
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const r = await fetch(`/api/track/${oid}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Not found');
      setOrder(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.get('id')) lookup(params.get('id'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="wrap">
      <div className="track-card">
        <div className="eyebrow">Track Order</div>
        <h1 className="display" style={{ fontSize: 36 }}>Where is my order?</h1>
        {isNew && order === null && !error && (
          <p style={{ color: '#1E7A46', marginTop: 12 }}>
            Thank you! Your order has been placed successfully.
          </p>
        )}
        <form
          className="track-form"
          style={{ display: 'flex', gap: 12, marginTop: 24 }}
          onSubmit={(e) => { e.preventDefault(); lookup(id.trim()); }}
        >
          <input
            placeholder="Enter order ID (e.g. 1024)"
            value={id}
            onChange={(e) => setId(e.target.value)}
            inputMode="numeric"
            aria-label="Order ID"
          />
          <button className="btn btn-dark" type="submit" disabled={loading} style={{ whiteSpace: 'nowrap' }}>
            {loading ? '...' : 'Track'}
          </button>
        </form>

        {error && <p style={{ color: '#B3402E', marginTop: 16 }}>{error}</p>}

        {order && (
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <b style={{ fontSize: 18 }}>Order #{order.id}</b>
                <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>
                  {new Date(order.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {' · '}{fmtPKR(order.total)}
                </div>
              </div>
              <span className={`pill ${order.status}`}>{order.status}</span>
            </div>

            <div className="timeline">
              {(order.status === 'cancelled' ? ['cancelled'] : STEPS).map((s) => {
                const idx = STEPS.indexOf(s);
                const cur = STEPS.indexOf(order.status);
                const done = order.status === 'cancelled' ? s === 'cancelled' : idx <= cur;
                return (
                  <div key={s} className={`t-step ${done ? 'done' : ''}`}>
                    <b>{STEP_LABEL[s][0]}</b>
                    <span>{STEP_LABEL[s][1]}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 8 }}>
              {order.items.map((it, i) => (
                <div className="order-line" key={i}>
                  <img src={it.image} alt={it.name} />
                  <div style={{ flex: 1 }}>
                    <b>{it.name}</b>
                    <span>Qty {it.qty}</span>
                  </div>
                  <b>{fmtPKR(it.price * it.qty)}</b>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="empty"><div className="display">Loading...</div></div>}>
      <TrackInner />
    </Suspense>
  );
}
