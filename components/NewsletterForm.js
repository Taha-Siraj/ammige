'use client';

import { useState } from 'react';

export default function NewsletterForm() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    const email = new FormData(e.currentTarget).get('email');
    setBusy(true);
    try {
      const r = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || 'Please try again.');
      setDone(true);
    } catch (err) {
      setError(err.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p style={{ marginTop: 30, color: 'var(--champagne)', position: 'relative' }}>
        Welcome to the circle — check your inbox soon.
      </p>
    );
  }
  return (
    <form className="nl-form" onSubmit={onSubmit} noValidate>
      <input
        type="email"
        name="email"
        placeholder="Your email address"
        required
        aria-label="Email address"
        disabled={busy}
      />
      <button className="btn btn-gold" type="submit" disabled={busy}>
        {busy ? 'Joining…' : 'Subscribe'}
      </button>
      {error ? (
        <p style={{ color: '#E8A0A0', fontSize: 13, marginTop: 10, position: 'relative' }}>{error}</p>
      ) : null}
    </form>
  );
}
