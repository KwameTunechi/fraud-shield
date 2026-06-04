// backend/tests/customer-auth.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { pool } from '../src/db/pool.js';
import { redis } from '../src/db/redis.js';

const TEST_PHONE    = '+233200111222';
const TEST_PHONE_2  = '+233200111223';
const OTP_REDIS_KEY = `otp:signin:${TEST_PHONE}`;

beforeAll(async () => {
  // Clear any leftover state from previous runs (delete sessions before users — FK)
  await pool.query(
    `DELETE FROM sessions WHERE user_id IN (
       SELECT id FROM users WHERE phone_number IN ($1, $2)
     )`,
    [TEST_PHONE, TEST_PHONE_2]
  );
  await pool.query('DELETE FROM users WHERE phone_number IN ($1, $2)', [TEST_PHONE, TEST_PHONE_2]);
  await redis.del(OTP_REDIS_KEY);
  await redis.del(`rl:customer_otp:${TEST_PHONE}`);
});

afterAll(async () => {
  // Delete sessions first (FK constraint) then users
  await pool.query(
    `DELETE FROM sessions WHERE user_id IN (
       SELECT id FROM users WHERE phone_number IN ($1, $2)
     )`,
    [TEST_PHONE, TEST_PHONE_2]
  );
  await pool.query('DELETE FROM users WHERE phone_number IN ($1, $2)', [TEST_PHONE, TEST_PHONE_2]);
  await redis.del(OTP_REDIS_KEY);
  await redis.del(`rl:customer_otp:${TEST_PHONE}`);
  await pool.end();
  await redis.quit();
});

// ─── POST /api/auth/customer/request-otp ────────────────────────────────────

describe('POST /api/auth/customer/request-otp', () => {
  it('returns 400 for an invalid phone format', async () => {
    const res = await request(app)
      .post('/api/auth/customer/request-otp')
      .send({ phone: '0200111222' }); // missing +233
    expect(res.status).toBe(400);
  });

  it('returns 400 for a non-Ghana number', async () => {
    const res = await request(app)
      .post('/api/auth/customer/request-otp')
      .send({ phone: '+447700900000' }); // UK number
    expect(res.status).toBe(400);
  });

  it('returns 200 and sends OTP for a valid Ghana number', async () => {
    const res = await request(app)
      .post('/api/auth/customer/request-otp')
      .send({ phone: TEST_PHONE });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    // In dev mode the OTP is printed to console, not sent via SMS
  });

  it('stores a hashed OTP in Redis', async () => {
    const stored = await redis.get(OTP_REDIS_KEY);
    expect(stored).toBeTruthy(); // hash was stored by the previous test
  });
});

// ─── POST /api/auth/customer/verify-otp ─────────────────────────────────────

describe('POST /api/auth/customer/verify-otp', () => {
  it('returns 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/auth/customer/verify-otp')
      .send({ phone: TEST_PHONE }); // no code
    expect(res.status).toBe(400);
  });

  it('returns 401 for a wrong OTP code', async () => {
    // Ensure a fresh OTP exists for this test
    await request(app)
      .post('/api/auth/customer/request-otp')
      .send({ phone: TEST_PHONE });

    const res = await request(app)
      .post('/api/auth/customer/verify-otp')
      .send({ phone: TEST_PHONE, code: '000000', pin: '1234', fullName: 'Test User' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid or expired/i);
  });

  it('creates a new user and returns tokens on correct OTP (first signup)', async () => {
    // Plant a known OTP hash directly in Redis so we know the code
    const bcrypt = (await import('bcrypt')).default;
    const knownCode = '123456';
    const hash = await bcrypt.hash(knownCode, 4);
    await redis.set(OTP_REDIS_KEY, hash, 'EX', 300);

    const res = await request(app)
      .post('/api/auth/customer/verify-otp')
      .send({ phone: TEST_PHONE, code: knownCode, pin: '1234', fullName: 'Akua Mensah' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.phone).toBe(TEST_PHONE);
    expect(res.body.user.fullName).toBe('Akua Mensah');
  });

  it('OTP is consumed after successful verification (one-time use)', async () => {
    // The OTP from the previous test was verified and deleted
    const stored = await redis.get(OTP_REDIS_KEY);
    expect(stored).toBeNull();
  });

  it('returns tokens for a returning user with the correct OTP', async () => {
    // User now exists — plant a fresh OTP and verify again
    const bcrypt = (await import('bcrypt')).default;
    const knownCode = '654321';
    const hash = await bcrypt.hash(knownCode, 4);
    await redis.set(OTP_REDIS_KEY, hash, 'EX', 300);

    const res = await request(app)
      .post('/api/auth/customer/verify-otp')
      .send({ phone: TEST_PHONE, code: knownCode }); // no PIN needed — already set

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('returns 400 when new user omits PIN or fullName', async () => {
    // Use a phone that has no user record
    const bcrypt = (await import('bcrypt')).default;
    const hash = await bcrypt.hash('999999', 4);
    await redis.set(`otp:signin:${TEST_PHONE_2}`, hash, 'EX', 300);

    const res = await request(app)
      .post('/api/auth/customer/verify-otp')
      .send({ phone: TEST_PHONE_2, code: '999999' }); // no PIN or fullName

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/PIN and full name required/i);
  });
});

// ─── Phone validation schema ─────────────────────────────────────────────────

describe('Ghana phone number validation', () => {
  const cases = [
    { phone: '+233244567890', valid: true  },
    { phone: '+233201234567', valid: true  },
    { phone: '+233551234567', valid: true  },
    { phone: '0244567890',    valid: false }, // no country code
    { phone: '+23324456789',  valid: false }, // too short
    { phone: '+2332445678901',valid: false }, // too long
    { phone: '+44207000001',  valid: false }, // UK number
  ];

  for (const { phone, valid } of cases) {
    it(`${phone} → ${valid ? 'accepted' : 'rejected'}`, async () => {
      const res = await request(app)
        .post('/api/auth/customer/request-otp')
        .send({ phone });
      expect(res.status).toBe(valid ? 200 : 400);
    });
  }
});
