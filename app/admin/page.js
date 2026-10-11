'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';

const TABS = ['Dashboard', 'Products', 'Orders', 'Settings'];

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState('Dashboard');
  const [pwWeak, setPwWeak] = useState(false);
  const [pwDismissed, setPwDismissed] = useState(false);

  useEffect(() => {
    if (!authed) return;
    fetch('/api/admin/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.password_weak) setPwWeak(true);
      })
      .catch(() => {});
  }, [authed]);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => {
        if (r.ok) setAuthed(true);
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setLoginError('');
    const r = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (r.ok) {
      setAuthed(true);
      setPassword('');
    } else {
      const d = await r.json().catch(() => ({}));
      setLoginError(d.error || 'Login failed');
    }
  };

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAuthed(false);
  };

  if (checking) {
    return <div className="admin-wrap"><div className="empty"><div className="display">Loading...</div></div></div>;
  }

  if (!authed) {
    return (
      <div className="admin-wrap" style={{ maxWidth: 440 }}>
        <div className="admin-card" style={{ marginTop: 60 }}>
          <div className="eyebrow">AMMIGE Admin</div>
          <h1 className="display" style={{ fontSize: 32, marginBottom: 8 }}>Welcome back</h1>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Sign in to manage your store.</p>
          <form onSubmit={login}>
            <div className="f-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin password"
                autoFocus
              />
            </div>
            {loginError && <p style={{ color: '#B3402E', marginBottom: 12 }}>{loginError}</p>}
            <button className="btn btn-dark" type="submit" style={{ width: '100%' }}>Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="eyebrow">AMMIGE Admin</div>
          <h1 className="display" style={{ fontSize: 36 }}>Store Manager</h1>
        </div>
        <button className="btn btn-outline btn-sm" onClick={logout}>Logout</button>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`chip ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {pwWeak && !pwDismissed && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: '#FDF3E3',
            border: '1px solid #E8C87A',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 18,
            fontSize: 14,
          }}
        >
          <span style={{ flex: 1 }}>
            ⚠️ Your admin password looks weak. Please change it in{' '}
            <button
              onClick={() => setTab('Settings')}
              style={{ textDecoration: 'underline', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', font: 'inherit', padding: 0 }}
            >
              Settings
            </button>
            .
          </span>
          <button
            onClick={() => setPwDismissed(true)}
            aria-label="Dismiss"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
      )}

      {tab === 'Dashboard' && <Dashboard />}
      {tab === 'Products' && <Products />}
      {tab === 'Orders' && <Orders />}
      {tab === 'Settings' && <Settings />}
    </div>
  );
}

function Dashboard() {
  const [s, setS] = useState(null);
  useEffect(() => {
    fetch('/api/admin/stats').then((r) => r.json()).then(setS).catch(() => {});
  }, []);
  if (!s) return <div className="empty"><div className="display">Loading...</div></div>;
  const fmt = (n) => 'Rs ' + Number(n || 0).toLocaleString('en-PK');
  return (
    <div className="stat-grid">
      <div className="stat"><small>Revenue</small><b>{fmt(s.revenue)}</b></div>
      <div className="stat"><small>Orders</small><b>{s.orders_count}</b></div>
      <div className="stat"><small>Products</small><b>{s.products_count}</b></div>
      <div className="stat"><small>Pending Orders</small><b>{s.pending_orders}</b></div>
    </div>
  );
}

function Products() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [collection, setCollection] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [editing, setEditing] = useState(null); // product object or 'new'
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), ...(collection ? { collection } : {}), ...(q ? { q } : {}) });
    const r = await fetch(`/api/admin/products?${qs}`);
    const d = await r.json();
    setItems(d.items || []);
    setPages(d.pages || 1);
    setLoading(false);
  }, [page, collection, q]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [collection, q]);

  const remove = async (id) => {
    if (!confirm('Deactivate this product?')) return;
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <>
      <div className="toolbar" style={{ marginTop: 0 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="search">
            <input placeholder="Search products..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
          </div>
          <select value={collection} onChange={(e) => setCollection(e.target.value)} aria-label="Collection">
            <option value="">All collections</option>
            <option value="everyday">Everyday</option>
            <option value="signature">Signature</option>
            <option value="leather">Leather</option>
          </select>
        </div>
        <button className="btn btn-gold btn-sm" onClick={() => setEditing('new')}>+ Add Product</button>
      </div>

      <div className="admin-card" style={{ overflowX: 'auto', padding: 12 }}>
        <table className="tbl">
          <thead>
            <tr><th>Product</th><th>SKU</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <img src={p.image} alt="" style={{ width: 44, height: 52, objectFit: 'cover', borderRadius: 8 }} />
                    <span>{p.name}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--muted)' }}>{p.sku}</td>
                <td>Rs {p.price.toLocaleString('en-PK')}</td>
                <td>{p.stock}</td>
                <td><span className="pill" style={p.active ? { background: '#D9F2E2', color: '#1E7A46' } : {}}>{p.active ? 'Active' : 'Hidden'}</span></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn btn-outline btn-sm" style={{ marginRight: 8 }} onClick={() => setEditing(p)}>Edit</button>
                  <button className="btn btn-outline btn-sm" onClick={() => remove(p.id)}>Hide</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="empty"><div className="display">Loading...</div></div>}
      </div>

      {pages > 1 && (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span style={{ alignSelf: 'center' }}>Page {page} of {pages}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      {editing && (
        <ProductEditor
          product={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </>
  );
}

function ProductEditor({ product, onClose, onSaved }) {
  const [f, setF] = useState({
    name: product?.name || '',
    collection: product?.collection || 'everyday',
    price: product?.price || '',
    old_price: product?.old_price || '',
    material: product?.material || '',
    description: product?.description || '',
    image: product?.image || '',
    stock: product?.stock ?? 50,
    badge: product?.badge || '',
    active: product ? (product.active ? 1 : 0) : 1,
    sku: product?.sku || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...f,
        price: Number(f.price),
        old_price: f.old_price ? Number(f.old_price) : null,
        stock: Number(f.stock),
        active: Number(f.active),
      };
      const url = product ? `/api/admin/products/${product.id}` : '/api/admin/products';
      const r = await fetch(url, {
        method: product ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Save failed');
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cart-overlay open" onClick={onClose}>
      <div
        className="admin-card"
        style={{ maxWidth: 640, margin: '40px auto', maxHeight: '86vh', overflowY: 'auto', position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="display" style={{ fontSize: 28, marginBottom: 20 }}>
          {product ? 'Edit Product' : 'New Product'}
        </h2>
        <form onSubmit={save}>
          <div className="f-group"><label>Name</label><input required value={f.name} onChange={set('name')} /></div>
          <div className="f-row">
            <div className="f-group">
              <label>Collection</label>
              <select value={f.collection} onChange={set('collection')}>
                <option value="everyday">Everyday</option>
                <option value="signature">Signature</option>
                <option value="leather">Leather</option>
              </select>
            </div>
            <div className="f-group"><label>SKU (optional)</label><input value={f.sku} onChange={set('sku')} placeholder="Auto-generated" /></div>
          </div>
          <div className="f-row">
            <div className="f-group"><label>Price (PKR)</label><input required type="number" min="1" value={f.price} onChange={set('price')} /></div>
            <div className="f-group"><label>Old Price (sale)</label><input type="number" min="0" value={f.old_price} onChange={set('old_price')} placeholder="Optional" /></div>
          </div>
          <div className="f-row">
            <div className="f-group"><label>Stock</label><input type="number" min="0" value={f.stock} onChange={set('stock')} /></div>
            <div className="f-group"><label>Badge</label><input value={f.badge} onChange={set('badge')} placeholder="New / Bestseller / Sale" /></div>
          </div>
          <div className="f-group"><label>Material</label><input value={f.material} onChange={set('material')} /></div>
          <div className="f-group"><label>Image URL</label><input value={f.image} onChange={set('image')} placeholder="/images/products/..." /></div>
          <div className="f-group"><label>Description</label><textarea rows={4} value={f.description} onChange={set('description')} /></div>
          <div className="f-group">
            <label>Status</label>
            <select value={f.active} onChange={set('active')}>
              <option value={1}>Active</option>
              <option value={0}>Hidden</option>
            </select>
          </div>
          {error && <p style={{ color: '#B3402E', marginBottom: 12 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button className="btn btn-gold" type="submit" disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Saving...' : 'Save Product'}
            </button>
            <button className="btn btn-outline" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Orders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    const qs = status ? `?status=${status}` : '';
    const r = await fetch(`/api/admin/orders${qs}`);
    const d = await r.json();
    setOrders(Array.isArray(d) ? d : []);
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const setStatusOf = async (id, st) => {
    const r = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: st }),
    });
    if (r.ok) load();
  };

  const fmt = (n) => 'Rs ' + Number(n || 0).toLocaleString('en-PK');

  return (
    <div className="admin-card" style={{ overflowX: 'auto', padding: 12 }}>
      <div className="toolbar" style={{ marginTop: 0 }}>
        <div className="chips">
          {['', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => (
            <button key={s} className={`chip ${status === s ? 'on' : ''}`} onClick={() => setStatus(s)}>
              {s === '' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>
      <table className="tbl">
        <thead>
          <tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <Fragment key={o.id}>
              <tr>
                <td><b>#{o.id}</b><br /><small style={{ color: 'var(--muted)' }}>{new Date(o.created_at).toLocaleDateString('en-PK')}</small></td>
                <td>{o.customer?.name}<br /><small style={{ color: 'var(--muted)' }}>{o.customer?.phone} · {o.customer?.city}</small></td>
                <td>{o.items?.reduce((s, i) => s + i.qty, 0)}</td>
                <td>{fmt(o.total)}</td>
                <td><span className={`pill ${o.status}`}>{o.status}</span></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn btn-outline btn-sm" style={{ marginRight: 8 }} onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                    {expanded === o.id ? 'Hide' : 'View'}
                  </button>
                  <select
                    value={o.status}
                    onChange={(e) => setStatusOf(o.id, e.target.value)}
                    style={{ width: 'auto', padding: '8px 12px', fontSize: 13 }}
                    aria-label="Change status"
                  >
                    {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
              {expanded === o.id && (
                <tr>
                  <td colSpan={6} style={{ background: '#FDFAF3' }}>
                    <div style={{ fontSize: 13.5, marginBottom: 8 }}>
                      <b>Address:</b> {o.customer?.address}, {o.customer?.city}<br />
                      <b>Payment:</b> {o.payment}{o.notes ? <><br /><b>Notes:</b> {o.notes}</> : null}
                    </div>
                    {o.items?.map((it, i) => (
                      <div key={i} className="order-line">
                        <img src={it.image} alt={it.name} />
                        <div style={{ flex: 1 }}><b>{it.name}</b><span>Qty {it.qty}</span></div>
                        <b>{fmt(it.price * it.qty)}</b>
                      </div>
                    ))}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && <div className="empty"><div className="display">No orders yet</div></div>}
    </div>
  );
}

function Settings() {
  const [f, setF] = useState({ admin_password: '', whatsapp: '', announcement: '', tagline: '', brand: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => setF({ admin_password: '', whatsapp: d.whatsapp || '', announcement: d.announcement || '', tagline: d.tagline || '', brand: d.brand || '' }))
      .catch(() => {});
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    const payload = {
      whatsapp: f.whatsapp,
      announcement: f.announcement,
      tagline: f.tagline,
      brand: f.brand,
      ...(f.admin_password ? { admin_password: f.admin_password } : {}),
    };
    const r = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const d = await r.json();
    if (r.ok) {
      setMsg('Settings saved.');
      setF({ ...f, admin_password: '' });
    } else {
      setError(d.error || 'Save failed');
    }
  };

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="admin-card" style={{ maxWidth: 640 }}>
      <form onSubmit={save}>
        <div className="f-group"><label>Brand Name</label><input value={f.brand} onChange={set('brand')} /></div>
        <div className="f-group"><label>Tagline</label><input value={f.tagline} onChange={set('tagline')} /></div>
        <div className="f-group"><label>Announcement Bar</label><input value={f.announcement} onChange={set('announcement')} /></div>
        <div className="f-group"><label>WhatsApp Number (with country code)</label><input value={f.whatsapp} onChange={set('whatsapp')} placeholder="923001234567" /></div>
        <div className="f-group">
          <label>New Admin Password (leave empty to keep current)</label>
          <input type="password" value={f.admin_password} onChange={set('admin_password')} placeholder="Min 6 characters" />
        </div>
        {msg && <p style={{ color: '#1E7A46', marginBottom: 12 }}>{msg}</p>}
        {error && <p style={{ color: '#B3402E', marginBottom: 12 }}>{error}</p>}
        <button className="btn btn-gold" type="submit">Save Settings</button>
      </form>
    </div>
  );
}
