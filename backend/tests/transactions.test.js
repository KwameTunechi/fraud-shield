// backend/tests/transactions.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../src/app.js';
import { pool } from '../src/db/pool.js';
import { redis } from '../src/db/redis.js';
import { signAccessToken } from '../src/services/auth/tokens.js';

// ─── Test fixtures ────────────────────────────────────────────────────────────

let senderToken, adminToken;
let senderId, adminId;
const SENDER_PHONE    = '+233200777001';
const RECIPIENT_PHONE = '+233200777002';

beforeAll(async () => {
  const pinHash = await bcrypt.hash('1234', 4);
  const pwHash  = await bcrypt.hash('Password123!', 4);

  // Create sender (customer)
  const { rows: sRows } = await pool.query(
    `INSERT INTO users (phone_number, pin_hash, full_name, balance)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (phone_number) DO UPDATE
       SET balance = 5000, pin_hash = EXCLUDED.pin_hash
     RETURNING id`,
    [SENDER_PHONE, pinHash, 'Test Sender', 5000]
  );
  senderId = sRows[0].id;
  senderToken = signAccessToken({ sub: senderId, type: 'user', phone: SENDER_PHONE });

  // Create recipient (customer)
  await pool.query(
    `INSERT INTO users (phone_number, pin_hash, full_name, balance)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (phone_number) DO NOTHING`,
    [RECIPIENT_PHONE, pinHash, 'Test Recipient', 0]
  );

  // Create admin
  const { rows: aRows } = await pool.query(
    `INSERT INTO admins (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id`,
    ['test-admin-txn@fraudshield.test', pwHash, 'Txn Admin', 'supervisor']
  );
  adminId = aRows[0].id;
  adminToken = signAccessToken({ sub: adminId, type: 'admin', role: 'supervisor', email: 'test-admin-txn@fraudshield.test' });
});

afterAll(async () => {
  await pool.query('DELETE FROM alerts WHERE user_id = $1', [senderId]);
  await pool.query('DELETE FROM sessions WHERE user_id = $1', [senderId]);
  await pool.query('DELETE FROM transactions WHERE sender_id = $1', [senderId]);
  await pool.query('DELETE FROM users WHERE phone_number IN ($1,$2)', [SENDER_PHONE, RECIPIENT_PHONE]);
  await pool.query('DELETE FROM admins WHERE email = $1', ['test-admin-txn@fraudshield.test']);
  await pool.end();
  await redis.quit();
});

// ─── POST /api/transactions ───────────────────────────────────────────────────

describe('POST /api/transactions', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/transactions').send({});
    expect(res.status).toBe(401);
  });

  it('returns 403 when called with an admin token', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ recipientPhone: RECIPIENT_PHONE, amount: 100 });
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid phone format', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({ recipientPhone: '0200777002', amount: 100 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when sending to yourself', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({ recipientPhone: SENDER_PHONE, amount: 50 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/yourself/i);
  });

  it('returns 400 for insufficient balance', async () => {
    // 10,000 > sender balance of 5,000 but within Zod max(50,000)
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({ recipientPhone: RECIPIENT_PHONE, amount: 10000 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/balance/i);
  });

  it('creates a transaction and returns score + status', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({ recipientPhone: RECIPIENT_PHONE, amount: 50, category: 'P2P' });

    expect(res.status).toBe(201);
    expect(res.body.transaction.reference).toMatch(/^FS-/);
    expect(res.body.score).toBeTypeOf('number');
    expect(['safe', 'review', 'blocked']).toContain(res.body.status);
    expect(Array.isArray(res.body.reasons)).toBe(true);
  });

  it('triggers new_recipient rule for a first-time recipient', async () => {
    // The previous test created the first ever transaction to RECIPIENT_PHONE.
    // A DIFFERENT new recipient should trigger new_recipient.
    const freshPhone = '+233200777099';
    await pool.query(
      `INSERT INTO users (phone_number, pin_hash, full_name)
       VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [freshPhone, await bcrypt.hash('1234', 4), 'Fresh Recipient']
    );

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({ recipientPhone: freshPhone, amount: 100 });

    expect(res.status).toBe(201);
    expect(res.body.reasons).toContain('new_recipient');

    // Delete the transaction to freshPhone before deleting the user (FK)
    await pool.query('DELETE FROM transactions WHERE recipient_phone = $1', [freshPhone]);
    await pool.query('DELETE FROM users WHERE phone_number = $1', [freshPhone]);
  });
});

// ─── GET /api/transactions ────────────────────────────────────────────────────

describe('GET /api/transactions', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.status).toBe(401);
  });

  it('returns the sender\'s own transactions', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${senderToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.transactions)).toBe(true);
    // All returned rows belong to the sender
    res.body.transactions.forEach(tx => {
      expect(tx.sender_id).toBe(senderId);
    });
  });

  it('admins can see all transactions', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.transactions)).toBe(true);
  });

  it('respects the limit query parameter', async () => {
    const res = await request(app)
      .get('/api/transactions?limit=1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.transactions.length).toBeLessThanOrEqual(1);
  });
});

// ─── GET /api/risk/summary ────────────────────────────────────────────────────

describe('GET /api/risk/summary', () => {
  it('returns 403 for customers', async () => {
    const res = await request(app)
      .get('/api/risk/summary')
      .set('Authorization', `Bearer ${senderToken}`);
    expect(res.status).toBe(403);
  });

  it('returns summary KPIs for admins', async () => {
    const res = await request(app)
      .get('/api/risk/summary')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tx_24h');
    expect(res.body).toHaveProperty('blocked_24h');
    expect(res.body).toHaveProperty('open_alerts');
    expect(res.body).toHaveProperty('avg_risk_7d');
  });
});

// ─── Risk scorer unit behaviour ───────────────────────────────────────────────

describe('Risk scorer — rule thresholds', () => {
  it('scores 0 for a small daytime P2P transfer to a known recipient', async () => {
    const { scoreTransaction } = await import('../src/services/risk/scorer.js');

    // Plant a prior transaction so "new_recipient" doesn't fire
    await pool.query(
      `INSERT INTO transactions
         (reference, sender_id, recipient_phone, amount, risk_score, status)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      ['FS-PRIOR', senderId, RECIPIENT_PHONE, 50, 0, 'completed']
    );

    // Midday, small amount, known recipient, low balance usage
    const result = await scoreTransaction({
      senderId,
      recipientPhone: RECIPIENT_PHONE,
      amount:    50,
      createdAt: new Date('2026-06-04T12:00:00Z').toISOString(),
    });

    expect(result.score).toBe(0);
    expect(result.status).toBe('safe');
    expect(result.reasons).toHaveLength(0);
  });

  it('fires late_night rule for a transaction at 23:00 UTC', async () => {
    const { scoreTransaction } = await import('../src/services/risk/scorer.js');
    const result = await scoreTransaction({
      senderId,
      recipientPhone: RECIPIENT_PHONE,
      amount:    50,
      createdAt: new Date('2026-06-04T23:00:00Z').toISOString(),
    });
    expect(result.reasons).toContain('late_night');
  });

  it('fires amount_above_2000_ghs rule for a large transfer', async () => {
    const { scoreTransaction } = await import('../src/services/risk/scorer.js');
    const result = await scoreTransaction({
      senderId,
      recipientPhone: RECIPIENT_PHONE,
      amount:    2500,
      createdAt: new Date('2026-06-04T12:00:00Z').toISOString(),
    });
    expect(result.reasons).toContain('amount_above_2000_ghs');
  });
});
