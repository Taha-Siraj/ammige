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
  CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('percent','flat')),
    value INTEGER NOT NULL,
    min_order INTEGER NOT NULL DEFAULT 0,
    usage_limit INTEGER NULL,
    used_count INTEGER NOT NULL DEFAULT 0,
    expires_at TEXT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );
`;

// Columns added after launch — applied idempotently via guarded ALTERs.
const ORDER_MIGRATIONS = [
  'ALTER TABLE orders ADD COLUMN discount INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE orders ADD COLUMN coupon_code TEXT NULL',
  'ALTER TABLE orders ADD COLUMN tracking_number TEXT NULL',
  'ALTER TABLE orders ADD COLUMN courier TEXT NULL',
  'ALTER TABLE orders ADD COLUMN admin_notes TEXT NULL',
];

const DEFAULT_SETTINGS = {
  admin_password: process.env.AMMIGE_ADMIN_PASSWORD || 'ammige123',
  whatsapp: '923162852167',
  brand: 'AMMIGE',
  tagline: 'Carry Grace Everywhere',
  announcement: 'Free delivery across Pakistan on orders over Rs 5,000',
  shipping_flat: '250',
  free_shipping_threshold: '5000',
  payment_cod: '1',
  payment_bank: '1',
};

let _ready = null;
async function ready() {
  if (!_ready) {
    _ready = (async () => {
      const c = client();
      await c.executeMultiple(SCHEMA);
      // Idempotent column migrations for tables created before these
      // columns existed. SQLite has no ADD COLUMN IF NOT EXISTS, so we
      // ignore "duplicate column name" errors.
      for (const sql of ORDER_MIGRATIONS) {
        try {
          await c.execute(sql);
        } catch (e) {
          const msg = String(e && e.message || '');
          if (!/duplicate column name/i.test(msg)) throw e;
        }
      }
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
    discount: Number(row.discount || 0),
    coupon_code: row.coupon_code || null,
    tracking_number: row.tracking_number || null,
    courier: row.courier || null,
    admin_notes: row.admin_notes || null,
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

// ---------------------------------------------------------------- coupons

function parseCoupon(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: row.value,
    min_order: row.min_order,
    usage_limit: row.usage_limit,
    used_count: row.used_count,
    expires_at: row.expires_at,
    active: row.active === 1,
    created_at: row.created_at,
  };
}

async function getCouponByCode(code) {
  await ready();
  if (!isNonEmptyString(code)) return null;
  const r = await client().execute({
    sql: 'SELECT * FROM coupons WHERE UPPER(code) = UPPER(?) LIMIT 1',
    args: [code.trim()],
  });
  return r.rows.length ? parseCoupon(r.rows[0]) : null;
}

/**
 * Validate a coupon against a cart subtotal.
 * Returns { ok:true, discount } or { ok:false, error }.
 * Discount is always capped at the subtotal.
 */
function checkCoupon(coupon, subtotal) {
  if (!coupon) return { ok: false, error: 'Invalid coupon code.' };
  if (!coupon.active) return { ok: false, error: 'This coupon is no longer active.' };
  if (coupon.expires_at) {
    const exp = new Date(coupon.expires_at);
    if (!Number.isNaN(exp.getTime()) && exp.getTime() < Date.now()) {
      return { ok: false, error: 'This coupon has expired.' };
    }
  }
  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) {
    return { ok: false, error: 'This coupon has reached its usage limit.' };
  }
  if (subtotal < coupon.min_order) {
    return {
      ok: false,
      error: `This coupon needs a minimum order of Rs ${Number(coupon.min_order).toLocaleString('en-PK')}.`,
    };
  }
  let discount = 0;
  if (coupon.type === 'percent') {
    discount = Math.floor((subtotal * coupon.value) / 100);
  } else {
    discount = coupon.value;
  }
  discount = Math.max(0, Math.min(discount, subtotal));
  return { ok: true, discount };
}

/** Shipping for a (discounted) subtotal, from settings. */
async function shippingFor(subtotal) {
  const flat = parseInt((await getSetting('shipping_flat')) || '250', 10);
  const threshold = parseInt((await getSetting('free_shipping_threshold')) || '5000', 10);
  if (subtotal <= 0) return 0;
  return subtotal >= threshold ? 0 : Math.max(0, flat);
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
  parseCoupon,
  getCouponByCode,
  checkCoupon,
  shippingFor,
};
