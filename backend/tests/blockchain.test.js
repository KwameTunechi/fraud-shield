// backend/tests/blockchain.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../src/app.js';
import { pool } from '../src/db/pool.js';
import { redis } from '../src/db/redis.js';
import { appendEntry, verifyChain } from '../src/services/blockchain/ledger.js';
import { signAccessToken } from '../src/services/auth/tokens.js';

let adminToken;

beforeAll(async () => {
  const pwHash = await bcrypt.hash('Password123!', 4);
  const { rows } = await pool.query(
    `INSERT INTO admins (email, password_hash, full_name, role)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id`,
    ['test-admin-bc@fraudshield.test', pwHash, 'Blockchain Admin', 'supervisor']
  );
  adminToken = signAccessToken({
    sub: rows[0].id, type: 'admin', role: 'supervisor',
    email: 'test-admin-bc@fraudshield.test',
  });
});

afterAll(async () => {
  await pool.query("DELETE FROM blockchain_entries WHERE event_type = 'test'");
  await pool.query('DELETE FROM admins WHERE email = $1', ['test-admin-bc@fraudshield.test']);
});

// ─── appendEntry & verifyChain unit tests ─────────────────────────────────────

describe('blockchain ledger — appendEntry', () => {
  it('inserts an entry and returns a 64-char hex hash', async () => {
    const hash = await appendEntry({
      eventType: 'test',
      payload:   { msg: 'first entry', ts: Date.now() },
    });
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('each entry has a different hash', async () => {
    const h1 = await appendEntry({ eventType: 'test', payload: { n: 1 } });
    const h2 = await appendEntry({ eventType: 'test', payload: { n: 2 } });
    expect(h1).not.toBe(h2);
  });

  it('stores the previous entry\'s hash in previous_hash', async () => {
    const { rows } = await pool.query(
      `SELECT hash, previous_hash FROM blockchain_entries
       WHERE event_type = 'test' ORDER BY id DESC LIMIT 2`
    );
    // rows[0] is the most-recent entry; rows[1] is the one before it
    expect(rows[0].previous_hash).toBe(rows[1].hash);
  });
});

describe('blockchain ledger — verifyChain', () => {
  it('returns ok:true for an intact chain', async () => {
    const result = await verifyChain();
    expect(result.ok).toBe(true);
    expect(result.entries).toBeGreaterThan(0);
  });

  it('returns ok:false when a hash is tampered with', async () => {
    // Insert a fresh entry we can safely corrupt and delete
    await appendEntry({ eventType: 'test', payload: { n: 'to_tamper' } });

    // Corrupt its payload directly in the DB (without changing the hash)
    const { rows: [target] } = await pool.query(
      `SELECT id FROM blockchain_entries
       WHERE event_type = 'test' ORDER BY id DESC LIMIT 1`
    );
    await pool.query(
      `UPDATE blockchain_entries SET payload = '{"tampered":true}' WHERE id = $1`,
      [target.id]
    );
    const result = await verifyChain();
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('hash_mismatch');

    // Remove the corrupted entry so the chain is intact for subsequent tests
    await pool.query('DELETE FROM blockchain_entries WHERE id = $1', [target.id]);
  });
});

// ─── GET /api/blockchain REST routes ─────────────────────────────────────────

describe('GET /api/blockchain', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/blockchain');
    expect(res.status).toBe(401);
  });

  it('returns a paginated entry list for admins', async () => {
    const res = await request(app)
      .get('/api/blockchain?limit=5')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.entries)).toBe(true);
    expect(res.body).toHaveProperty('total');
  });
});

describe('GET /api/blockchain/verify', () => {
  it('reports ok:true after restoring chain integrity', async () => {
    const res = await request(app)
      .get('/api/blockchain/verify')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

// ─── Transaction → blockchain integration ────────────────────────────────────

describe('POST /api/transactions writes to blockchain', () => {
  it('returns a blockchain_hash on the created transaction', async () => {
    // Create a test customer with enough balance
    const pinHash = await bcrypt.hash('1234', 4);
    const { rows: uRows } = await pool.query(
      `INSERT INTO users (phone_number, pin_hash, full_name, balance)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (phone_number) DO UPDATE SET balance = 2000
       RETURNING id`,
      ['+233200888001', pinHash, 'BC Test Sender', 2000]
    );
    await pool.query(
      `INSERT INTO users (phone_number, pin_hash, full_name)
       VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
      ['+233200888002', pinHash, 'BC Test Recipient']
    );

    const userToken = signAccessToken({
      sub: uRows[0].id, type: 'user', phone: '+233200888001',
    });

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ recipientPhone: '+233200888002', amount: 100 });

    expect(res.status).toBe(201);
    expect(res.body.transaction.blockchain_hash).toBeTruthy();
    expect(res.body.transaction.blockchain_hash).toHaveLength(64);

    // Clean up
    const txId = res.body.transaction.id;
    await pool.query('DELETE FROM alerts WHERE transaction_id = $1', [txId]);
    await pool.query('DELETE FROM blockchain_entries WHERE transaction_id = $1', [txId]);
    await pool.query('DELETE FROM transactions WHERE id = $1', [txId]);
    await pool.query(
      'DELETE FROM users WHERE phone_number IN ($1,$2)',
      ['+233200888001', '+233200888002']
    );
  });
});
