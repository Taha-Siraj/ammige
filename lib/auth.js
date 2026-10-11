'use strict';

/**
 * Admin session: stateless signed cookies (serverless-safe).
 * Cookie value: "<expiryEpochMs>.<hmac>" where hmac = HMAC_SHA256(secret, expiry).
 */
const crypto = require('crypto');

const COOKIE_NAME = 'ammige_admin';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function secret() {
  return process.env.ADMIN_SECRET || 'ammige-dev-secret-change-in-production';
}

function sign(expiry) {
  return crypto.createHmac('sha256', secret()).update(String(expiry)).digest('hex');
}

function issueSessionCookie() {
  const expiry = Date.now() + SESSION_TTL_MS;
  const value = `${expiry}.${sign(expiry)}`;
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_MS / 1000}${
    process.env.NODE_ENV === 'production' ? '; Secure' : ''
  }`;
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function verifySession(cookieHeader) {
  if (!cookieHeader) return false;
  const m = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!m) return false;
  const [expiryStr, sig] = m[1].split('.');
  const expiry = Number(expiryStr);
  if (!expiry || Number.isNaN(expiry) || expiry < Date.now()) return false;
  if (!sig || sig.length !== 64) return false;
  const expected = sign(expiryStr);
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

module.exports = { COOKIE_NAME, issueSessionCookie, clearSessionCookie, verifySession };
