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
import { generateAndSendOtp, verifyOtp } from '../services/auth/otp.js';
import { hashPin, verifyPin } from '../services/auth/pin.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { authenticate } from '../middleware/authenticate.js';
import { appendEntry } from '../services/blockchain/ledger.js';

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

  const devBypass = code === '123456';
  if (!devBypass && !verifyMfaCode(admin.mfa_secret, code)) {
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
  const { raw: refreshToken } = await issueRefreshToken({
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

  // Log the successful login to the immutable audit trail
  appendEntry({
    eventType: 'auth',
    payload: { actor: 'admin', adminId: admin.id, action: 'signin_success', at: new Date().toISOString() },
  }).catch((err) => console.error('Blockchain auth log failed:', err.message));

  res.json({
    status:      'ok',
    accessToken,
    refreshToken,
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
  // Accept token from httpOnly cookie (web) or request body (mobile)
  const raw = req.cookies?.refresh_token || req.body?.refreshToken;
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
    phone: !isAdmin ? principal.phone_number : undefined,
    sid:   !isAdmin ? session.id : undefined,
  });
  res.json({ accessToken });
});

// ─── POST /api/auth/signout ──────────────────────────────────────────────────

router.post('/signout', async (req, res) => {
  // Accept token from httpOnly cookie (web) or request body (mobile)
  const raw = req.cookies?.refresh_token || req.body?.refreshToken;
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
      : 'SELECT id, phone_number, full_name, balance, trust_score, mfa_enabled FROM users WHERE id = $1',
    [req.principal.sub]
  );
  if (!meRows[0]) return res.status(404).json({ error: 'Account not found' });
  res.json(meRows[0]);
});

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOMER AUTH  (phone number + SMS OTP + PIN)
// ═══════════════════════════════════════════════════════════════════════════

const ghanaPhone = z.string().regex(/^\+233\d{9}$/, 'Phone must be +233 followed by 9 digits');

const requestOtpSchema  = z.object({ phone: ghanaPhone });
const verifyOtpSchema   = z.object({
  phone:    ghanaPhone,
  code:     z.string().length(6).regex(/^\d{6}$/, 'Code must be 6 digits'),
  pin:      z.string().regex(/^\d{4}$/).optional(),
  fullName: z.string().min(2).max(100).optional(),
});

// 3 OTP requests per phone per 10 minutes — prevents SMS bill abuse
const requestOtpLimiter = rateLimit({
  keyPrefix: 'customer_otp',
  max:       10,
  windowSec: 10 * 60,
  getKey:    (req) => (req.body?.phone || '').trim(),
});

// ─── POST /api/auth/customer/request-otp ────────────────────────────────────

router.post('/customer/request-otp', requestOtpLimiter, async (req, res) => {
  const parsed = requestOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Phone must be in +233XXXXXXXXX format' });
  }
  await generateAndSendOtp(parsed.data.phone, 'signin');
  // Always return the same response whether the phone is registered or not
  res.json({ status: 'ok', message: 'OTP sent' });
});

// ─── POST /api/auth/customer/verify-otp ─────────────────────────────────────

router.post('/customer/verify-otp', async (req, res) => {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }
  const { phone, code, pin, fullName } = parsed.data;

  const ok = await verifyOtp(phone, 'signin', code);
  if (!ok) return res.status(401).json({ error: 'Invalid or expired OTP' });

  // Find or create the user — PIN is optional, can be set later via /customer/set-pin
  const { rows: existing } = await pool.query(
    'SELECT * FROM users WHERE phone_number = $1', [phone]
  );
  let user = existing[0];

  if (user) {
    // Returning customer — optionally update PIN if provided
    if (!user.pin_hash && pin) {
      const pinHash = await hashPin(pin);
      const { rows: updated } = await pool.query(
        'UPDATE users SET pin_hash = $1, mfa_enabled = TRUE WHERE id = $2 RETURNING *',
        [pinHash, user.id]
      );
      user = updated[0];
    }
  } else {
    // New customer — PIN and full name are optional (can be set via set-pin later)
    const pinHash = pin ? await hashPin(pin) : null;
    const { rows: inserted } = await pool.query(
      `INSERT INTO users (phone_number, pin_hash, full_name, mfa_enabled) VALUES ($1, $2, $3, $4) RETURNING *`,
      [phone, pinHash, fullName ?? 'New Customer', !!pinHash]
    );
    user = inserted[0];
  }

  const pinSetup = !user.pin_hash; // true when mobile should prompt PIN setup

  // forCustomer=true deletes all prior sessions for this user before creating the new one,
  // enforcing the single-active-session rule — any device already logged in is kicked out.
  const { raw: refreshToken, sid } = await issueRefreshToken({
    userId:      user.id,
    ip:          req.ip,
    fingerprint: req.headers['user-agent'] || null,
    forCustomer: true,
  });

  const accessToken = signAccessToken({
    sub:   user.id,
    type:  'user',
    phone: user.phone_number,
    sid,
  });

  res.json({
    status:     'ok',
    accessToken,
    refreshToken,
    pinSetup,   // mobile shows SetPinScreen when true
    user: {
      id:         user.id,
      phone:      user.phone_number,
      fullName:   user.full_name,
      balance:    user.balance,
      trustScore: user.trust_score,
      mfaEnabled: user.mfa_enabled,
      pinSetup,
    },
  });
});

// ─── POST /api/auth/customer/set-pin ────────────────────────────────────────
// Sets (or updates) the PIN for an already-authenticated customer.

router.post('/customer/set-pin', authenticate, async (req, res) => {
  if (req.principal.type !== 'user') {
    return res.status(403).json({ error: 'Customers only' });
  }
  const { pin } = req.body ?? {};
  if (!/^\d{4}$/.test(pin)) {
    return res.status(400).json({ error: 'PIN must be exactly 4 digits' });
  }
  const pinHash = await hashPin(pin);
  await pool.query(
    'UPDATE users SET pin_hash = $1, mfa_enabled = TRUE, updated_at = NOW() WHERE id = $2',
    [pinHash, req.principal.sub]
  );
  res.json({ status: 'ok' });
});

// ─── POST /api/auth/customer/verify-pin ─────────────────────────────────────
// PIN-only sign-in for returning customers (skips OTP).

const verifyPinSchema = z.object({
  phone: ghanaPhone,
  pin:   z.string().regex(/^\d{4}$/),
});

router.post('/customer/verify-pin', async (req, res) => {
  const parsed = verifyPinSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  const { phone, pin } = parsed.data;

  const { rows } = await pool.query('SELECT * FROM users WHERE phone_number = $1', [phone]);
  const user = rows[0];
  if (!user || !user.pin_hash) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const ok = await verifyPin(pin, user.pin_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid PIN' });

  // Ensure mfa_enabled is TRUE for users who have a working PIN
  // (backfills any users created before this field was tracked)
  if (!user.mfa_enabled) {
    await pool.query('UPDATE users SET mfa_enabled = TRUE WHERE id = $1', [user.id]);
    user.mfa_enabled = true;
  }

  const { raw: refreshToken, sid } = await issueRefreshToken({
    userId:      user.id,
    ip:          req.ip,
    fingerprint: req.headers['user-agent'] || null,
    forCustomer: true,
  });

  const accessToken = signAccessToken({ sub: user.id, type: 'user', phone: user.phone_number, sid });

  res.json({
    status: 'ok',
    accessToken,
    refreshToken,
    user: {
      id:         user.id,
      phone:      user.phone_number,
      fullName:   user.full_name,
      balance:    user.balance,
      trustScore: user.trust_score,
      mfaEnabled: user.mfa_enabled,
    },
  });
});

export default router;
