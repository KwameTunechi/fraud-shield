// backend/src/services/auth/tokens.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../../db/pool.js';
import { redis } from '../../db/redis.js';

const ACCESS_SECRET  = process.env.JWT_SECRET;
const ACCESS_EXPIRY  = process.env.JWT_EXPIRY  || '15m';
const REFRESH_TTL_S  = 7 * 24 * 60 * 60; // 7 days in seconds

// Redis key that marks a session as the active one for a customer user.
// When a new login creates a new session, the old key is deleted — any
// access token still carrying the old sid immediately gets rejected.
function sessionKey(sid) { return `session:${sid}`; }

// Short-lived token sent on every authenticated request.
export function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
}

// Throws JsonWebTokenError / TokenExpiredError if invalid.
export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

// Returns true if the session is still the active one for this user.
// Only enforced for customer (type: 'user') tokens.
export async function isSessionActive(sid) {
  const val = await redis.get(sessionKey(sid));
  return val === '1';
}

// Issues a long-lived refresh token, stores its SHA-256 hash in the sessions table,
// and caches the session in Redis.
// When forCustomer=true, ALL previous sessions for that user are deleted first,
// enforcing the single-active-session constraint.
export async function issueRefreshToken({ adminId, userId, ip, fingerprint, forCustomer = false }) {
  const raw = crypto.randomBytes(48).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TTL_S * 1000);

  if (forCustomer && userId) {
    // Kick any existing sessions for this user out of Redis before deleting from DB,
    // so in-flight requests with old sids get rejected immediately.
    const { rows: old } = await pool.query(
      'SELECT id FROM sessions WHERE user_id = $1', [userId]
    );
    if (old.length > 0) {
      const pipeline = redis.pipeline();
      old.forEach(s => pipeline.del(sessionKey(s.id)));
      await pipeline.exec();
      await pool.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
    }
  }

  const { rows } = await pool.query(
    `INSERT INTO sessions
       (admin_id, user_id, token_hash, ip_address, device_fingerprint, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [adminId || null, userId || null, hash, ip || null, fingerprint || null, expiresAt]
  );
  const sid = rows[0].id;

  // Cache the session in Redis so authenticate() can validate it without a DB round-trip.
  if (forCustomer) {
    await redis.set(sessionKey(sid), '1', 'EX', REFRESH_TTL_S);
  }

  return { raw, sid };
}

export async function revokeRefreshToken(raw) {
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const { rows } = await pool.query(
    'DELETE FROM sessions WHERE token_hash = $1 RETURNING id, user_id',
    [hash]
  );
  if (rows[0]) {
    await redis.del(sessionKey(rows[0].id));
  }
}

export async function findSessionByRefresh(raw) {
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const { rows } = await pool.query(
    'SELECT * FROM sessions WHERE token_hash = $1 AND expires_at > NOW()',
    [hash]
  );
  return rows[0] || null;
}
