'use strict';

/**
 * Customer session: stateless signed cookies (serverless-safe), mirroring
 * lib/auth.js but with a SEPARATE cookie so admin and customer sessions
 * never collide.
 * Cookie value: "<customerId>.<expiryEpochMs>.<hmac>"
 * where hmac = HMAC_SHA256(secret, "<customerId>.<expiry>").
 */
const crypto = require('crypto');

const COOKIE_NAME = 'ammige_customer';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function secret() {
  return (
    process.env.CUSTOMER_SECRET ||
    process.env.ADMIN_SECRET ||
    'ammige-dev-secret-change-in-production'
  );
}

function sign(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('hex');
}

function issueCustomerSessionCookie(customerId) {
  const expiry = Date.now() + SESSION_TTL_MS;
  const payload = `${customerId}.${expiry}`;
  const value = `${payload}.${sign(payload)}`;
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${
    process.env.NODE_ENV === 'production' ? '; Secure' : ''
  }`;
}

function clearCustomerSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/** Returns customerId (number) or null. */
function verifyCustomerSession(cookieHeader) {
  if (!cookieHeader) return null;
  const m = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!m) return null;
  const parts = m[1].split('.');
  if (parts.length !== 3) return null;
  const [idStr, expiryStr, sig] = parts;
  const customerId = Number(idStr);
  const expiry = Number(expiryStr);
  if (!Number.isInteger(customerId) || customerId <= 0) return null;
  if (!expiry || Number.isNaN(expiry) || expiry < Date.now()) return null;
  if (!sig || sig.length !== 64) return null;
  const expected = sign(`${idStr}.${expiryStr}`);
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) ? customerId : null;
  } catch {
    return null;
  }
}

module.exports = {
  COOKIE_NAME,
  issueCustomerSessionCookie,
  clearCustomerSessionCookie,
  verifyCustomerSession,
};
