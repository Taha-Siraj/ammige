'use client';

import { useState } from 'react';

export default function FaqAccordion({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="faq">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className={`faq-item ${isOpen ? 'open' : ''}`}>
            <h2 className="faq-h">
              <button
                className="faq-q"
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-a-${i}`}
              >
                <span>{it.q}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </h2>
            <div className="faq-a" id={`faq-a-${i}`} aria-hidden={!isOpen}>
              <div className="faq-a-inner">
                <p>{it.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
