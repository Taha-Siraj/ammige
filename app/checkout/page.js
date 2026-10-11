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
  const delivery = total >= 5000 || total === 0 ? 0 : 250;
  const grand = total + delivery;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const placeOrder = async (e) => {
    e.preventDefault();
    setError('');
    if (items.length === 0) return;
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
          items: items.map((i) => ({ id: i.id, qty: i.qty })),
          payment,
          notes: form.notes.trim() || undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Order failed');
      clear();
      router.push(`/track?id=${d.order_id}&new=1`);
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  if (loaded && items.length === 0) {
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
              <input required value={form.name} onChange={set('name')} placeholder="Ayesha Khan" />
            </div>
            <div className="f-group">
              <label>Phone</label>
              <input required value={form.phone} onChange={set('phone')} placeholder="03xx xxxxxxx" inputMode="tel" />
            </div>
          </div>
          <div className="f-group">
            <label>Address</label>
            <input required value={form.address} onChange={set('address')} placeholder="House, street, area" />
          </div>
          <div className="f-row">
            <div className="f-group">
              <label>City</label>
              <input required value={form.city} onChange={set('city')} placeholder="Lahore" />
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
          <button className="btn btn-gold" type="submit" disabled={placing} style={{ width: '100%', marginTop: 20 }}>
            {placing ? 'Placing Order...' : `Place Order · ${fmtPKR(grand)}`}
          </button>
        </div>

        <div className="co-card">
          <h3>Order Summary</h3>
          {items.map((i) => {
            const p = products[i.id];
            if (!p) return null;
            return (
              <div className="order-line" key={i.id}>
                <img src={p.image} alt={p.name} />
                <div style={{ flex: 1 }}>
                  <b>{p.name}</b>
                  <span>Qty {i.qty}</span>
                </div>
                <b>{fmtPKR(p.price * i.qty)}</b>
              </div>
            );
          })}
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 15 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Subtotal</span><span>{fmtPKR(total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Delivery</span>
              <span>{delivery === 0 ? 'FREE' : fmtPKR(delivery)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 600, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
              <span>Total</span><span>{fmtPKR(grand)}</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
