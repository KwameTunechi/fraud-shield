// backend/src/routes/auth.js
import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { verifyPassword } from '../services/auth/password.js';
import {
  signAccessToken, verifyAccessToken,
  issueRefreshToken, revokeRefreshToken, findSessionByRefresh,
} from '../services/auth/tokens.js';
import { generateMfaSecret, verifyMfaCode } from '../services/auth/mfa.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

// ─── Schemas ────────────────────────────────────────────────────────────────

const signinSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
});

const verifyMfaSchema = z.object({
  pendingToken: z.string(),
  code:         z.string().length(6),
});

// ─── Rate limiters ───────────────────────────────────────────────────────────

// 5 attempts per email per 15 minutes
const signinLimiter = rateLimit({
  keyPrefix:  'admin_signin',
  max:        5,
  windowSec:  15 * 60,
  getKey:     (req) => (req.body?.email || '').toLowerCase().trim(),
});

// ─── POST /api/auth/admin/signin ─────────────────────────────────────────────

router.post('/admin/signin', signinLimiter, async (req, res) => {
  const parsed = signinSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const { rows } = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
  const admin = rows[0];

  // Always run bcrypt even when the user doesn't exist — prevents timing attacks
  // that would let an attacker enumerate valid email addresses.
  // Pre-hashed constant — ensures bcrypt always runs even when the account doesn't
  // exist, preventing timing attacks that enumerate valid email addresses.
  const dummyHash = '$2b$12$8Vf7CuTEKZIi4E6LydbV7.vq0fx2L5SsuGDqcNcTaFUx9Kt7NkmOW';
  const ok = await verifyPassword(password, admin?.password_hash || dummyHash);

  if (!admin || !ok || admin.status !== 'active') {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // First login: generate the TOTP secret and return the QR code URL
  if (!admin.mfa_enabled || !admin.mfa_secret) {
    const secret = generateMfaSecret(admin.email);
    await pool.query('UPDATE admins SET mfa_secret = $1 WHERE id = $2', [secret.base32, admin.id]);
    return res.json({
      status:       'mfa_setup_required',
      otpauthUrl:   secret.otpauth_url,
      pendingToken: signAccessToken({ sub: admin.id, type: 'mfa_pending' }),
    });
  }

  // Subsequent logins: just ask for the current 6-digit code
  return res.json({
    status:       'mfa_required',
    pendingToken: signAccessToken({ sub: admin.id, type: 'mfa_pending' }),
  });
});

// ─── POST /api/auth/admin/verify-mfa ────────────────────────────────────────

router.post('/admin/verify-mfa', async (req, res) => {
  const parsed = verifyMfaSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });
  const { pendingToken, code } = parsed.data;

  let payload;
  try { payload = verifyAccessToken(pendingToken); }
  catch { return res.status(401).json({ error: 'Pending token invalid or expired' }); }

  if (payload.type !== 'mfa_pending') {
    return res.status(401).json({ error: 'Wrong token type' });
  }

  const { rows: adminRows } = await pool.query('SELECT * FROM admins WHERE id = $1', [payload.sub]);
  const admin = adminRows[0];
  if (!admin) return res.status(401).json({ error: 'Admin not found' });

  if (!verifyMfaCode(admin.mfa_secret, code)) {
    return res.status(401).json({ error: 'Invalid MFA code' });
  }

  // First successful verification activates MFA for the account
  if (!admin.mfa_enabled) {
    await pool.query('UPDATE admins SET mfa_enabled = TRUE WHERE id = $1', [admin.id]);
  }
  await pool.query('UPDATE admins SET last_login_at = NOW() WHERE id = $1', [admin.id]);

  const accessToken = signAccessToken({
    sub:   admin.id,
    type:  'admin',
    role:  admin.role,
    email: admin.email,
  });
  const refreshToken = await issueRefreshToken({
    adminId:     admin.id,
    ip:          req.ip,
    fingerprint: req.headers['user-agent'] || null,
  });

  // Refresh token lives in an httpOnly cookie — JS on the page can't read it,
  // which defends against XSS stealing long-lived credentials.
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000,
    path:     '/api/auth',
  });

  res.json({
    status:      'ok',
    accessToken,
    admin: {
      id:       admin.id,
      email:    admin.email,
      fullName: admin.full_name,
      role:     admin.role,
    },
  });
});

// ─── POST /api/auth/refresh ──────────────────────────────────────────────────

router.post('/refresh', async (req, res) => {
  const raw = req.cookies?.refresh_token;
  if (!raw) return res.status(401).json({ error: 'No refresh token' });

  const session = await findSessionByRefresh(raw);
  if (!session) return res.status(401).json({ error: 'Invalid or expired refresh token' });

  const isAdmin = !!session.admin_id;
  const { rows: principalRows } = await pool.query(
    isAdmin
      ? 'SELECT * FROM admins WHERE id = $1'
      : 'SELECT * FROM users  WHERE id = $1',
    [session.admin_id || session.user_id]
  );
  const principal = principalRows[0];
  if (!principal) return res.status(401).json({ error: 'Account no longer exists' });

  const accessToken = signAccessToken({
    sub:   principal.id,
    type:  isAdmin ? 'admin' : 'user',
    role:  principal.role,
    email: principal.email,
  });
  res.json({ accessToken });
});

// ─── POST /api/auth/signout ──────────────────────────────────────────────────

router.post('/signout', async (req, res) => {
  const raw = req.cookies?.refresh_token;
  if (raw) await revokeRefreshToken(raw);
  res.clearCookie('refresh_token', { path: '/api/auth' });
  res.json({ status: 'ok' });
});

// ─── GET /api/auth/me ────────────────────────────────────────────────────────

router.get('/me', authenticate, async (req, res) => {
  const isAdmin = req.principal.type === 'admin';
  const { rows: meRows } = await pool.query(
    isAdmin
      ? 'SELECT id, email, full_name, role, last_login_at FROM admins WHERE id = $1'
      : 'SELECT id, phone_number, full_name, balance, trust_score FROM users WHERE id = $1',
    [req.principal.sub]
  );
  if (!meRows[0]) return res.status(404).json({ error: 'Account not found' });
  res.json(meRows[0]);
});

export default router;
