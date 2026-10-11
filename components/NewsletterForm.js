'use client';

import { useState } from 'react';

export default function NewsletterForm() {
  const [done, setDone] = useState(false);
  return done ? (
    <p style={{ marginTop: 30, color: 'var(--champagne)', position: 'relative' }}>
      Welcome to the circle — check your inbox soon.
    </p>
  ) : (
    <form
      className="nl-form"
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
    >
      <input type="email" placeholder="Your email address" required aria-label="Email address" />
      <button className="btn btn-gold" type="submit">Subscribe</button>
    </form>
  );
}
