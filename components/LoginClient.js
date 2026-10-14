'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/account';
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email.trim() || !form.password) {
      setError('Please enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), password: form.password }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || 'Could not log in.');
      const dest = next.startsWith('/') && !next.startsWith('//') ? next : '/account';
      router.push(dest);
      router.refresh();
    } catch (err) {
      setError(err.message || 'Could not log in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap">
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="eyebrow">Welcome back</div>
      <h1 className="display">Log in</h1>
      <p className="sub">Track orders and check out faster.</p>
      <form onSubmit={onSubmit} noValidate>
        <div className="f-group">
          <label htmlFor="li-email">Email</label>
          <input
            id="li-email"
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>
        <div className="f-group">
          <label htmlFor="li-pass">Password</label>
          <input
            id="li-pass"
            type="password"
            value={form.password}
            onChange={set('password')}
            placeholder="Your password"
            autoComplete="current-password"
            required
          />
        </div>
        {error && <p className="auth-err" role="alert">{error}</p>}
        <button className="btn btn-gold" type="submit" disabled={busy} style={{ width: '100%' }}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="auth-alt">
        New to AMMIGE? <Link href={`/signup${next !== '/account' ? `?next=${encodeURIComponent(next)}` : ''}`}>Create an account</Link>
      </p>
      <Link href="/checkout" className="auth-guest">Continue as guest →</Link>
        </div>
      </div>
    </div>
  );
}
