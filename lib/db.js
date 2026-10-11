'use strict';

/**
 * Database layer — @libsql/client.
 * Local dev: file database (./ammige.db).
 * Vercel/production: Turso via TURSO_DATABASE_URL + TURSO_AUTH_TOKEN env vars.
 * Same code path, same schema — only the connection string changes.
 */
const path = require('path');
const { createClient } = require('@libsql/client');

function dbUrl() {
  if (process.env.TURSO_DATABASE_URL) return process.env.TURSO_DATABASE_URL;
  // Explicit override (e.g. Hostinger VPS: DB_PATH=/home/user/data/ammige.db)
  if (process.env.DB_PATH) return 'file:' + process.env.DB_PATH;
  // Vercel serverless filesystem is read-only except /tmp
  if (process.env.VERCEL) return 'file:/tmp/ammige.db';
  return 'file:' + path.join(process.cwd(), 'ammige.db');
}

let _client = null;
function client() {
  if (!_client) {
    _client = createClient({
      url: dbUrl(),
      authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    });
  }
  return _client;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT UNIQUE,
    name TEXT NOT NULL,
    collection TEXT NOT NULL CHECK (collection IN ('everyday','signature','leather')),
    price INTEGER NOT NULL,
    old_price INTEGER NULL,
    colors TEXT NOT NULL DEFAULT '[]',
    material TEXT,
    description TEXT,
    image TEXT,
    rating REAL DEFAULT 0,
    reviews INTEGER DEFAULT 0,
    badge TEXT NULL,
    stock INTEGER DEFAULT 50,
    active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer TEXT NOT NULL,
    items TEXT NOT NULL,
    total INTEGER NOT NULL,
    payment TEXT DEFAULT 'cod',
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;

const DEFAULT_SETTINGS = {
  admin_password: process.env.AMMIGE_ADMIN_PASSWORD || 'ammige123',
  whatsapp: '923162852167',
  brand: 'AMMIGE',
  tagline: 'Carry Grace Everywhere',
  announcement: 'Free delivery across Pakistan on orders over Rs 5,000',
};

let _ready = null;
async function ready() {
  if (!_ready) {
    _ready = (async () => {
      const c = client();
      await c.executeMultiple(SCHEMA);
      // Seed defaults without overwriting existing settings.
      for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
        await c.execute({
          sql: 'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
          args: [k, v],
        });
      }
      // Auto-seed the catalog when the database is empty
      // (first boot on Vercel / fresh local run).
      try {
        const r = await c.execute('SELECT COUNT(*) AS c FROM products');
        if (Number(r.rows[0].c) === 0) {
          const { seedCatalog } = require('./catalog');
          await seedCatalog(c, false);
        }
      } catch (e) {
        console.error('auto-seed failed', e);
      }
    })();
  }
  return _ready;
}

async function getSetting(key) {
  await ready();
  const r = await client().execute({
    sql: 'SELECT value FROM settings WHERE key = ?',
    args: [key],
  });
  return r.rows.length ? r.rows[0].value : null;
}

function safeParseArray(s) {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function parseProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    collection: row.collection,
    price: row.price,
    old_price: row.old_price,
    colors: safeParseArray(row.colors),
    material: row.material,
    description: row.description,
    image: row.image,
    rating: row.rating,
    reviews: row.reviews,
    badge: row.badge,
    stock: row.stock,
    active: row.active === 1,
    created_at: row.created_at,
  };
}

function parseOrder(row) {
  if (!row) return null;
  let customer = {};
  let items = [];
  try { customer = JSON.parse(row.customer); } catch { /* keep {} */ }
  try { items = JSON.parse(row.items); } catch { /* keep [] */ }
  return {
    id: row.id, customer, items,
    total: row.total, payment: row.payment,
    notes: row.notes, status: row.status,
    created_at: row.created_at,
  };
}

const COLLECTIONS = {
  everyday: {
    id: 'everyday',
    name: 'Everyday Collection',
    tagline: 'Effortless pieces for every day, made to be carried on repeat.',
    image: '/images/collection-everyday.jpg',
  },
  signature: {
    id: 'signature',
    name: 'Signature Collection',
    tagline: 'Statement pieces for evenings that matter.',
    image: '/images/collection-signature.jpg',
  },
  leather: {
    id: 'leather',
    name: 'Leather Collection',
    tagline: 'Full-grain leather that ages beautifully with you.',
    image: '/images/collection-leather.jpg',
  },
};

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

function normalizeCollection(v) {
  if (typeof v !== 'string') return null;
  const s = v.trim().toLowerCase().replace(/\s*collections?$/, '').trim();
  return COLLECTIONS[s] ? s : null;
}

const nowISO = () => new Date().toISOString();
const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
const isPositiveInt = (v) => Number.isInteger(v) && v > 0;

/**
 * Strip angle brackets + control chars from stored text.
 * Defense-in-depth against stored XSS: product fields are rendered into
 * JSON-LD <script> blocks where `</script>` would break out, and React
 * escapes the rest. Product/store text never legitimately needs < or >.
 */
function sanitizeText(v, maxLen = 500) {
  if (typeof v !== 'string') return '';
  return v
    .replace(/[<>\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLen);
}

function sanitizeStringArray(arr, maxItems = 12, maxLen = 40) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  for (const v of arr.slice(0, maxItems)) {
    const s = sanitizeText(v, maxLen);
    if (s) out.push(s);
  }
  return out;
}

/** Only allow relative paths or http(s) URLs for product images. */
function isSafeImageUrl(u) {
  return typeof u === 'string' && /^(https?:\/\/|\/)/i.test(u.trim());
}

const WEAK_PASSWORDS = new Set([
  'ammige123', 'admin123', 'admin', 'password', 'password123',
  '123456', '12345678', 'qwerty', 'letmein', 'changeme',
]);

function isWeakPassword(pw) {
  if (typeof pw !== 'string') return true;
  const s = pw.trim();
  return s.length < 8 || WEAK_PASSWORDS.has(s.toLowerCase());
}

/** WhatsApp number: digits with optional leading +, spaces/dashes. */
function isValidWhatsapp(v) {
  return typeof v === 'string' && /^[+\d][\d\s-]{5,20}$/.test(v.trim());
}

module.exports = {
  client,
  ready,
  getSetting,
  parseProduct,
  parseOrder,
  COLLECTIONS,
  ORDER_STATUSES,
  normalizeCollection,
  nowISO,
  isNonEmptyString,
  isPositiveInt,
  sanitizeText,
  sanitizeStringArray,
  isSafeImageUrl,
  isWeakPassword,
  isValidWhatsapp,
};
