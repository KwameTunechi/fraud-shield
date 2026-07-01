// backend/src/middleware/authenticate.js
import { verifyAccessToken, isSessionActive } from '../services/auth/tokens.js';

export async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : (req.query.token || null);
  if (!token) return res.status(401).json({ error: 'Missing access token' });

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired access token' });
  }

  if (payload.type !== 'admin' && payload.type !== 'user') {
    return res.status(401).json({ error: 'Wrong token type' });
  }

  // Customer tokens carry a session id (sid). If another device has since logged
  // in, the session is deleted from Redis and this check rejects the old device.
  if (payload.type === 'user' && payload.sid) {
    const active = await isSessionActive(payload.sid);
    if (!active) {
      return res.status(401).json({ error: 'Session replaced by a new login. Please sign in again.' });
    }
  }

  req.principal = payload;
  next();
}

export function requireAdmin(req, res, next) {
  if (req.principal?.type !== 'admin') {
    return res.status(403).json({ error: 'Admins only' });
  }
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.principal?.role)) {
      return res.status(403).json({ error: 'Insufficient role' });
    }
    next();
  };
}
