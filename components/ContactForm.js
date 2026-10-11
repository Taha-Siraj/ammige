'use client';

import { useState } from 'react';

/** Contact form → opens WhatsApp with a prefilled message. */
export default function ContactForm({ whatsapp }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    const text = `Assalam-o-Alaikum AMMIGE!%0A%0AName: ${encodeURIComponent(name)}%0APhone: ${encodeURIComponent(phone)}%0A%0A${encodeURIComponent(message)}`;
    const num = (whatsapp || '923162852167').replace(/\D/g, '');
    window.open(`https://wa.me/${num}?text=${text}`, '_blank', 'noopener');
    setSent(true);
  };

  if (sent) {
    return (
      <div className="contact-done">
        <div className="display" style={{ fontSize: 30 }}>Opening WhatsApp…</div>
        <p>Your message is ready to send — just press send in WhatsApp. We usually reply within a few hours.</p>
        <button className="btn btn-outline btn-sm" onClick={() => setSent(false)}>Write another message</button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="f-row">
        <div className="f-group">
          <label htmlFor="cf-name">Your name</label>
          <input id="cf-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ayesha Khan" required />
        </div>
        <div className="f-group">
          <label htmlFor="cf-phone">Phone / WhatsApp</label>
          <input id="cf-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03xx xxxxxxx" required />
        </div>
      </div>
      <div className="f-group">
        <label htmlFor="cf-msg">Message</label>
        <textarea id="cf-msg" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Assalam-o-Alaikum! I wanted to ask about…" required />
      </div>
      <button className="btn btn-gold" type="submit">Send via WhatsApp</button>
      <p className="contact-note">This opens WhatsApp with your message prefilled — nothing is sent until you press send.</p>
    </form>
  );
}
