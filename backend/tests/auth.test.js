// backend/tests/auth.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../src/app.js';
import { pool } from '../src/db/pool.js';
import { redis } from '../src/db/redis.js';

const TEST_EMAIL = 'test-admin@fraudshield.test';

beforeAll(async () => {
  // Clear any leftover rate-limit keys from previous interrupted test runs
  await redis.del(`rl:admin_signin:${TEST_EMAIL}`);

  // UPSERT so re-runs always get the correct password hash (rounds=4 = fast in tests)
  const passwordHash = await bcrypt.hash('TestPassword123!', 4);
  await pool.query(
    `INSERT INTO admins (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'active'`,
    [TEST_EMAIL, passwordHash, 'Test Admin', 'analyst']
  );
});

afterAll(async () => {
  await pool.query('DELETE FROM admins WHERE email = $1', [TEST_EMAIL]);
  await redis.del(`rl:admin_signin:${TEST_EMAIL}`);
});

// ─── POST /api/auth/admin/signin ─────────────────────────────────────────────

describe('POST /api/auth/admin/signin', () => {
  it('returns 400 for malformed input', async () => {
    const res = await request(app)
      .post('/api/auth/admin/signin')
      .send({ email: 'not-an-email', password: 'x' });
    expect(res.status).toBe(400);
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/admin/signin')
      .send({ email: TEST_EMAIL, password: 'WrongPassword!' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid email or password/i);
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/admin/signin')
      .send({ email: 'nobody@fraudshield.test', password: 'TestPassword123!' });
    expect(res.status).toBe(401);
  });

  it('returns mfa_setup_required with a pendingToken for a new admin', async () => {
    const res = await request(app)
      .post('/api/auth/admin/signin')
      .send({ email: TEST_EMAIL, password: 'TestPassword123!' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('mfa_setup_required');
    expect(res.body.pendingToken).toBeDefined();
    expect(res.body.otpauthUrl).toBeDefined();
  });

  it('returns mfa_required (no otpauthUrl) for an admin who already set up MFA', async () => {
    // Simulate an admin that already has mfa_secret set and mfa_enabled = true
    await pool.query(
      `UPDATE admins SET mfa_secret = 'JBSWY3DPEHPK3PXP', mfa_enabled = TRUE
       WHERE email = $1`,
      [TEST_EMAIL]
    );

    const res = await request(app)
      .post('/api/auth/admin/signin')
      .send({ email: TEST_EMAIL, password: 'TestPassword123!' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('mfa_required');
    expect(res.body.pendingToken).toBeDefined();
    expect(res.body.otpauthUrl).toBeUndefined();

    // Reset for other tests
    await pool.query(
      'UPDATE admins SET mfa_secret = NULL, mfa_enabled = FALSE WHERE email = $1',
      [TEST_EMAIL]
    );
  });
});

// ─── POST /api/auth/admin/verify-mfa ────────────────────────────────────────

describe('POST /api/auth/admin/verify-mfa', () => {
  it('returns 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/admin/verify-mfa')
      .send({ code: '123456' });
    expect(res.status).toBe(400);
  });

  it('returns 401 for an expired or invalid pendingToken', async () => {
    const res = await request(app)
      .post('/api/auth/admin/verify-mfa')
      .send({ pendingToken: 'not.a.jwt', code: '123456' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for a wrong MFA code', async () => {
    // Set up a known secret so we can compute the right code
    const secret = 'JBSWY3DPEHPK3PXP';
    await pool.query(
      `UPDATE admins SET mfa_secret = $1, mfa_enabled = TRUE WHERE email = $2`,
      [secret, TEST_EMAIL]
    );

    // Get a valid pendingToken first
    const signinRes = await request(app)
      .post('/api/auth/admin/signin')
      .send({ email: TEST_EMAIL, password: 'TestPassword123!' });
    const { pendingToken } = signinRes.body;

    const res = await request(app)
      .post('/api/auth/admin/verify-mfa')
      .send({ pendingToken, code: '000000' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid MFA code/i);

    // Clean up
    await pool.query(
      'UPDATE admins SET mfa_secret = NULL, mfa_enabled = FALSE WHERE email = $1',
      [TEST_EMAIL]
    );
  });
});

// ─── GET /api/auth/me ────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with a malformed token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.real.token');
    expect(res.status).toBe(401);
  });
});

// ─── POST /api/auth/signout ──────────────────────────────────────────────────

describe('POST /api/auth/signout', () => {
  it('returns ok even with no refresh_token cookie', async () => {
    const res = await request(app).post('/api/auth/signout');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
