// backend/src/middleware/authenticate.js
import { verifyAccessToken } from '../services/auth/tokens.js';

// Reads Authorization: Bearer <token>, verifies it, and attaches req.principal.
// Use on any route that requires a logged-in user.
export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  // req.query.token is a fallback for SSE clients — EventSource cannot send headers
  const token = header.startsWith('Bearer ') ? header.slice(7) : (req.query.token || null);
  if (!token) return res.status(401).json({ error: 'Missing access token' });

  try {
    const payload = verifyAccessToken(token);
    if (payload.type !== 'admin' && payload.type !== 'user') {
      return res.status(401).json({ error: 'Wrong token type' });
    }
    req.principal = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired access token' });
  }
}

// Use after authenticate() to restrict a route to admins only.
export function requireAdmin(req, res, next) {
  if (req.principal?.type !== 'admin') {
    return res.status(403).json({ error: 'Admins only' });
  }
  next();
}

// Use after authenticate() to restrict a route to specific roles.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.principal?.role)) {
      return res.status(403).json({ error: 'Insufficient role' });
    }
    next();
  };
}
