// backend/src/services/auth/tokens.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../../db/pool.js';

const ACCESS_SECRET  = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRY  = process.env.JWT_EXPIRY  || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

// Short-lived token sent on every authenticated request.
export function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
}

// Throws JsonWebTokenError / TokenExpiredError if invalid.
export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

// Issues a long-lived refresh token, stores its SHA-256 hash in the sessions table.
// We hash it so a leaked database row can't be replayed.
export async function issueRefreshToken({ adminId, userId, ip, fingerprint }) {
  const raw = crypto.randomBytes(48).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO sessions
       (admin_id, user_id, token_hash, ip_address, device_fingerprint, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [adminId || null, userId || null, hash, ip || null, fingerprint || null, expiresAt]
  );
  return raw;
}

export async function revokeRefreshToken(raw) {
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  await pool.query('DELETE FROM sessions WHERE token_hash = $1', [hash]);
}

export async function findSessionByRefresh(raw) {
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const { rows } = await pool.query(
    'SELECT * FROM sessions WHERE token_hash = $1 AND expires_at > NOW()',
    [hash]
  );
  return rows[0] || null;
}
