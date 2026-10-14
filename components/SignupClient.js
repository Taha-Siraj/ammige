'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SignupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/account';
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.name.trim().length < 2) {
      setError('Please enter your name.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          password: form.password,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || 'Could not create your account.');
      const dest = next.startsWith('/') && !next.startsWith('//') ? next : '/account';
      router.push(dest);
      router.refresh();
    } catch (err) {
      setError(err.message || 'Could not create your account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap">
      <div className="auth-wrap">
    <div className="auth-card">
      <div className="eyebrow">Join AMMIGE</div>
      <h1 className="display">Create account</h1>
      <p className="sub">Order history, faster checkout, first dibs on new drops.</p>
      <form onSubmit={onSubmit} noValidate>
        <div className="f-group">
          <label htmlFor="su-name">Full name</label>
          <input
            id="su-name"
            value={form.name}
            onChange={set('name')}
            placeholder="Ayesha Khan"
            autoComplete="name"
            required
          />
        </div>
        <div className="f-group">
          <label htmlFor="su-email">Email</label>
          <input
            id="su-email"
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>
        <div className="f-group">
          <label htmlFor="su-phone">Phone (optional)</label>
          <input
            id="su-phone"
            value={form.phone}
            onChange={set('phone')}
            placeholder="03xx xxxxxxx"
            inputMode="tel"
            autoComplete="tel"
          />
        </div>
        <div className="f-row">
          <div className="f-group">
            <label htmlFor="su-pass">Password</label>
            <input
              id="su-pass"
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              required
            />
          </div>
          <div className="f-group">
            <label htmlFor="su-confirm">Confirm</label>
            <input
              id="su-confirm"
              type="password"
              value={form.confirm}
              onChange={set('confirm')}
              placeholder="Repeat password"
              autoComplete="new-password"
              required
            />
          </div>
        </div>
        {error && <p className="auth-err" role="alert">{error}</p>}
        <button className="btn btn-gold" type="submit" disabled={busy} style={{ width: '100%' }}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="auth-alt">
        Already have an account? <Link href={`/login${next !== '/account' ? `?next=${encodeURIComponent(next)}` : ''}`}>Log in</Link>
      </p>
        </div>
      </div>
    </div>
  );
}
