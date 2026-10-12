'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart, fmtPKR } from '@/components/CartProvider';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clear, loaded } = useCart();
  const [products, setProducts] = useState({});
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', notes: '' });
  const [payment, setPayment] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [coupon, setCoupon] = useState('');
  const [couponState, setCouponState] = useState(null); // {ok, coupon?, error?}
  const [couponBusy, setCouponBusy] = useState(false);
  const [placed, setPlaced] = useState(null); // server-returned {order_id, subtotal, discount, shipping, total}

  useEffect(() => {
    if (!loaded) return;
    if (items.length === 0) return;
    Promise.all(items.map((i) => fetch(`/api/products/${i.id}`).then((r) => r.json())))
      .then((list) => {
        const map = {};
        list.forEach((p) => { if (p && p.id) map[p.id] = p; });
        setProducts(map);
      })
      .catch(() => {});
  }, [loaded, items]);

  const total = items.reduce((s, i) => s + (products[i.id]?.price || 0) * i.qty, 0);
  // Discount comes from the server (coupon validate). Shipping/total are
  // server-computed and returned by POST /api/orders — never derived here.
  const discount = couponState?.ok && couponState.coupon ? Number(couponState.coupon.discount) || 0 : 0;

  const applyCoupon = async () => {
    const code = coupon.trim();
    if (!code || couponBusy) return;
    setCouponBusy(true);
    setCouponState(null);
    try {
      const r = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: total }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.ok && d.coupon) {
        setCouponState({ ok: true, coupon: d.coupon });
      } else {
        setCouponState({ ok: false, error: d.error || 'Invalid code' });
      }
    } catch {
      setCouponState({ ok: false, error: 'Invalid code' });
    } finally {
      setCouponBusy(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const placeOrder = async (e) => {
    e.preventDefault();
    setError('');
    if (items.length === 0) return;
    // Pakistani mobile: 03xx-xxxxxxx — accept 10–13 digits after stripping separators.
    const digits = form.phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 13) {
      setError('Please enter a valid phone number (e.g. 0300 1234567) so the courier can reach you.');
      return;
    }
    setPlacing(true);
    try {
      const r = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: form.name.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            city: form.city.trim(),
          },
          items: items.map((i) => ({ id: i.id, qty: i.qty, ...(i.color ? { color: i.color } : {}) })),
          payment,
          notes: form.notes.trim() || undefined,
          ...(couponState?.ok && couponState.coupon ? { couponCode: couponState.coupon.code } : {}),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Order failed');
      clear();
      // Server returns the authoritative breakdown: {order_id, subtotal, discount, shipping, total}
      setPlaced({
        order_id: d.order_id,
        subtotal: Number(d.subtotal) || 0,
        discount: Number(d.discount) || 0,
        shipping: Number(d.shipping) || 0,
        total: Number(d.total) || 0,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  if (loaded && items.length === 0 && !placed) {
    return (
      <div className="wrap">
        <div className="empty" style={{ padding: '100px 20px' }}>
          <div className="display">Your bag is empty</div>
          <p>Add something beautiful first.</p>
          <Link href="/shop" className="btn btn-gold" style={{ marginTop: 20 }}>Shop Now</Link>
        </div>
      </div>
    );
  }

  if (placed) {
    return (
      <div className="wrap">
        <div className="shop-head" style={{ textAlign: 'center' }}>
          <div className="eyebrow" style={{ color: '#1E7A46' }}>Order confirmed</div>
          <h1 className="display">Shukriya, {form.name.split(' ')[0] || 'friend'}!</h1>
          <p style={{ color: 'var(--muted)', marginTop: 10 }}>
            Your order <b>#{placed.order_id}</b> is confirmed. We&apos;ll WhatsApp you on dispatch.
          </p>
        </div>
        <div className="co-card" style={{ maxWidth: 520, margin: '0 auto 90px' }}>
          <h3>Order Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 15, marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Subtotal</span><span>{fmtPKR(placed.subtotal)}</span>
            </div>
            {placed.discount > 0 && (
              <div className="discount-line">
                <span>Coupon savings</span><span>−{fmtPKR(placed.discount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Delivery</span>
              <span>{placed.shipping === 0 ? 'FREE' : fmtPKR(placed.shipping)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 600, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
              <span>Total{payment === 'cod' ? ' (pay on delivery)' : ''}</span><span>{fmtPKR(placed.total)}</span>
            </div>
          </div>
          <Link href={`/track?id=${placed.order_id}&new=1`} className="btn btn-gold" style={{ width: '100%', marginTop: 24 }}>
            Track Your Order
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="shop-head">
        <div className="eyebrow">Almost yours</div>
        <h1 className="display">Checkout</h1>
      </div>
      <form className="co-grid" onSubmit={placeOrder}>
        <div className="co-card">
          <h3>Delivery Details</h3>
          <div className="f-row">
            <div className="f-group">
              <label>Full Name</label>
              <input required value={form.name} onChange={set('name')} placeholder="Ayesha Khan" autoComplete="name" />
            </div>
            <div className="f-group">
              <label>Phone</label>
              <input required value={form.phone} onChange={set('phone')} placeholder="03xx xxxxxxx" inputMode="tel" autoComplete="tel" />
            </div>
          </div>
          <div className="f-group">
            <label>Address</label>
            <input required value={form.address} onChange={set('address')} placeholder="House, street, area" autoComplete="street-address" />
          </div>
          <div className="f-row">
            <div className="f-group">
              <label>City</label>
              <input required value={form.city} onChange={set('city')} placeholder="Lahore" autoComplete="address-level2" />
            </div>
            <div className="f-group">
              <label>Notes (optional)</label>
              <input value={form.notes} onChange={set('notes')} placeholder="Any instructions" />
            </div>
          </div>

          <h3 style={{ marginTop: 30 }}>Payment Method</h3>
          <label className={`pay-opt ${payment === 'cod' ? 'on' : ''}`}>
            <input type="radio" name="pay" checked={payment === 'cod'} onChange={() => setPayment('cod')} />
            <div><b>Cash on Delivery</b><small>Pay when your order arrives</small></div>
          </label>
          <label className={`pay-opt ${payment === 'bank' ? 'on' : ''}`}>
            <input type="radio" name="pay" checked={payment === 'bank'} onChange={() => setPayment('bank')} />
            <div><b>Bank Transfer</b><small>We will WhatsApp you the details</small></div>
          </label>

          {error && <p style={{ color: '#B3402E', marginTop: 14 }}>{error}</p>}

          <div className="coupon-row">
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Coupon code"
              aria-label="Coupon code"
              autoComplete="off"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }}
            />
            <button type="button" className="btn btn-outline btn-sm" onClick={applyCoupon} disabled={couponBusy || !coupon.trim()}>
              {couponBusy ? 'Checking…' : 'Apply'}
            </button>
          </div>
          {couponState && (
            <p className={`coupon-msg ${couponState.ok ? 'ok' : 'err'}`} role="status">
              {couponState.ok
                ? `Code “${couponState.coupon.code}” applied — you save ${fmtPKR(discount)}.`
                : couponState.error || 'Invalid code'}
            </p>
          )}

          <button className="btn btn-gold" type="submit" disabled={placing} style={{ width: '100%', marginTop: 20 }}>
            {placing ? 'Placing Order...' : 'Place Order'}
          </button>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', textAlign: 'center', marginTop: 10 }}>
            Final total with delivery is confirmed on the next step.
          </p>
          <div className="trust-badges" aria-label="Why shop with us">
            <span><svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="11" rx="2" /><path d="M3 10h18" /></svg>Cash on Delivery</span>
            <span><svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg>100% Safe Checkout</span>
            <span><svg viewBox="0 0 24 24"><path d="M4 9a8 8 0 0 1 14-3l2 2M20 15a8 8 0 0 1-14 3l-2-2" /><path d="M20 4v4h-4M4 20v-4h4" /></svg>7-Day Exchange</span>
          </div>
        </div>

        <div className="co-card">
          <h3>Order Summary</h3>
          {items.map((i) => {
            const p = products[i.id];
            if (!p) return null;
            return (
              <div className="order-line" key={i.key}>
                <img src={p.image} alt={p.name} />
                <div style={{ flex: 1 }}>
                  <b>{p.name}</b>
                  <span>Qty {i.qty}{i.color ? ` · ${i.color}` : ''}</span>
                </div>
                <b>{fmtPKR(p.price * i.qty)}</b>
              </div>
            );
          })}
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 15 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Subtotal</span><span>{fmtPKR(total)}</span>
            </div>
            {discount > 0 && (
              <div className="discount-line">
                <span>Coupon ({couponState.coupon.code})</span><span>−{fmtPKR(discount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Delivery</span>
              <span style={{ fontSize: 13 }}>Rs 250 · FREE over Rs 5,000</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
