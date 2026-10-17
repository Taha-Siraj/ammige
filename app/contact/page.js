import Link from 'next/link';
import Reveal from '@/components/Reveal';
import ContactForm from '@/components/ContactForm';
import { getSetting } from '@/lib/db';

export const metadata = {
  title: 'Contact Us — AMMIGE',
  description: 'Talk to AMMIGE: WhatsApp, Instagram or the contact form. We usually reply within a few hours.',
};

export default async function ContactPage() {
  const whatsapp = (await getSetting('whatsapp')) || '923162852167';
  const waLink = `https://wa.me/${String(whatsapp).replace(/\D/g, '')}?text=${encodeURIComponent('Assalam-o-Alaikum AMMIGE! I have a question about your bags.')}`;

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <Reveal>
            <div className="eyebrow">Get in touch</div>
            <h1 className="display">We&apos;d love to<br />hear from you</h1>
            <p>Questions about a bag, your order, or exchanges — message us, we reply fast.</p>
          </Reveal>
        </div>
      </section>

      <div className="contact-grid">
        <div>
          <Reveal>
            <div className="contact-card">
              <h3>Fastest: WhatsApp</h3>
              <p>Mon–Sat, 10am–8pm (PKT). Usually replies within a few hours.</p>
              <a className="wa-cta" href={waLink} target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.6-6.1c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.3-.6.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4 0-.5.1-.7l.4-.5c.1-.2.1-.4 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.2-.7.3-.9.9-1.1 2.2-.2 3.9a11.6 11.6 0 0 0 4.5 4.2c1.7.8 2.4.9 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.1-.4-.2z" /></svg>
                <div><b>Chat on WhatsApp</b><span>+92 316 2852167</span></div>
              </a>
            </div>
          </Reveal>
          <Reveal delay="rv-d1">
            <div className="contact-card">
              <h3>Follow along</h3>
              <p>New drops, behind-the-scenes and styling ideas.</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a className="btn btn-outline btn-sm" href="https://www.instagram.com/ammige012" target="_blank" rel="noopener noreferrer">Instagram</a>
                <a className="btn btn-outline btn-sm" href="https://www.tiktok.com/@ammige012" target="_blank" rel="noopener noreferrer">TikTok</a>
                <a className="btn btn-outline btn-sm" href="https://www.facebook.com/share/1KZiNXEgJi/" target="_blank" rel="noopener noreferrer">Facebook</a>
              </div>
            </div>
          </Reveal>
          <Reveal delay="rv-d2">
            <div className="contact-card">
              <h3>Track your order</h3>
              <p>Have your order ID? Check its status instantly.</p>
              <Link className="btn btn-outline btn-sm" href="/track">Track Order</Link>
            </div>
          </Reveal>
        </div>

        <Reveal delay="rv-d1">
          <div className="contact-card">
            <h3>Send us a message</h3>
            <p>Fill this in — it opens WhatsApp with everything prefilled.</p>
            <ContactForm whatsapp={whatsapp} />
          </div>
        </Reveal>
      </div>
    </>
  );
}
