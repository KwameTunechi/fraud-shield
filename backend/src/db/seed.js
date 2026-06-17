// backend/src/db/seed.js
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { pool } from './pool.js';

// ── helpers ───────────────────────────────────────────────────────────────────

function ref() {
  return 'FS-' + crypto.randomBytes(6).toString('hex').toUpperCase();
}

function daysAgo(n, hourOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hourOffset, Math.floor(Math.random() * 60), 0, 0);
  return d.toISOString();
}

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── wipe existing data (safe for local dev) ───────────────────────────
    await client.query('DELETE FROM blockchain_entries');
    await client.query('DELETE FROM alerts');
    await client.query('DELETE FROM sessions');
    await client.query('DELETE FROM otp_codes');
    await client.query('DELETE FROM transactions');
    await client.query('DELETE FROM users');
    await client.query('DELETE FROM admins');

    // ── admin ─────────────────────────────────────────────────────────────
    const pwHash = await bcrypt.hash('Password123!', 12);
    await client.query(
      `INSERT INTO admins (email, password_hash, full_name, role)
       VALUES ($1,$2,$3,$4)`,
      ['admin@fraudshield.test', pwHash, 'Evans Adusu', 'super_admin']
    );
    console.log('✓ Admin: admin@fraudshield.test / Password123!');

    // ── customers ─────────────────────────────────────────────────────────
    const pinHash = await bcrypt.hash('1234', 12);

    const customerDefs = [
      { phone: '+233244100001', name: 'Kwame Asante',      balance: 3200.00, trust: 85 },
      { phone: '+233244100002', name: 'Abena Osei',        balance: 1800.00, trust: 72 },
      { phone: '+233244100003', name: 'Kofi Mensah',       balance: 5400.00, trust: 91 },
      { phone: '+233244100004', name: 'Adwoa Boateng',     balance: 760.00,  trust: 60 },
      { phone: '+233244100005', name: 'Yaw Darko',         balance: 2350.00, trust: 78 },
      { phone: '+233244100006', name: 'Akosua Amponsah',   balance: 4100.00, trust: 88 },
      { phone: '+233244100007', name: 'Kojo Frimpong',     balance: 930.00,  trust: 45 },
      { phone: '+233244100008', name: 'Ama Asiedu',        balance: 1550.00, trust: 67 },
      { phone: '+233244100009', name: 'Nana Acheampong',   balance: 6200.00, trust: 95 },
      { phone: '+233244100010', name: 'Efua Owusu',        balance: 2800.00, trust: 82 },
      { phone: '+233244100011', name: 'Kwesi Antwi',       balance: 1120.00, trust: 55 },
      { phone: '+233244100012', name: 'Adjoa Mensah',      balance: 3600.00, trust: 79 },
    ];

    const customers = [];
    for (const c of customerDefs) {
      const r = await client.query(
        `INSERT INTO users (phone_number, pin_hash, full_name, balance, trust_score)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [c.phone, pinHash, c.name, c.balance, c.trust]
      );
      customers.push({ ...c, id: r.rows[0].id });
    }
    console.log(`✓ ${customers.length} customers seeded (all PIN: 1234)`);

    // ── transactions ──────────────────────────────────────────────────────
    // Each entry: [senderIdx, recipientIdx, amount, category, riskScore, daysAgo, hour, status]
    const txDefs = [
      // Kwame (0) sends to several people
      [0,  1,  200,  'P2P',      15, 28, 10, 'completed'],
      [0,  2,  500,  'P2P',      20, 25, 14, 'completed'],
      [0,  3,  150,  'MERCHANT', 10, 22, 9,  'completed'],
      [0,  4, 1200,  'P2P',      65, 18, 23, 'review'],
      [0,  5,  300,  'P2P',      18, 15, 11, 'completed'],

      // Abena (1) transactions
      [1,  0,  100,  'P2P',      10, 27, 8,  'completed'],
      [1,  6,  450,  'P2P',      25, 20, 16, 'completed'],
      [1,  2,  800,  'P2P',      55, 14, 22, 'review'],
      [1,  7,   50,  'MERCHANT',  8, 10, 12, 'completed'],
      [1,  3,  200,  'P2P',      12, 6,  10, 'completed'],

      // Kofi (2) — high value
      [2,  9, 2000,  'P2P',      70, 26, 2,  'blocked'],
      [2,  0,  350,  'P2P',      18, 23, 14, 'completed'],
      [2,  1,  600,  'AGENT',    22, 19, 11, 'completed'],
      [2,  5,  450,  'P2P',      20, 16, 9,  'completed'],
      [2,  8,  900,  'P2P',      45, 12, 17, 'review'],
      [2,  7,  120,  'MERCHANT', 12, 5,  13, 'completed'],

      // Adwoa (3) — smaller transactions
      [3,  1,   80,  'P2P',       8, 29, 9,  'completed'],
      [3,  4,  150,  'MERCHANT', 10, 21, 14, 'completed'],
      [3,  0,  200,  'P2P',      15, 17, 16, 'completed'],
      [3,  6,  100,  'P2P',      12, 11, 10, 'completed'],

      // Yaw (4)
      [4,  2,  400,  'P2P',      22, 24, 11, 'completed'],
      [4,  3,  250,  'MERCHANT', 18, 20, 15, 'completed'],
      [4,  9, 1500,  'P2P',      80, 13, 1,  'blocked'],
      [4,  0,  300,  'P2P',      20, 9,  10, 'completed'],
      [4,  1,  100,  'P2P',      10, 4,  14, 'completed'],

      // Akosua (5)
      [5,  3,  500,  'P2P',      25, 27, 13, 'completed'],
      [5,  2,  750,  'AGENT',    30, 22, 10, 'completed'],
      [5,  0,  200,  'P2P',      15, 18, 9,  'completed'],
      [5,  7,  400,  'P2P',      22, 14, 16, 'completed'],
      [5, 11,  600,  'P2P',      28, 8,  11, 'completed'],

      // Kojo (6) — lower trust, more flagged
      [6,  4,  350,  'P2P',      40, 25, 14, 'completed'],
      [6,  2, 1800,  'P2P',      85, 19, 23, 'blocked'],
      [6,  1,  200,  'P2P',      35, 15, 11, 'review'],
      [6,  9,  100,  'MERCHANT', 12, 10, 9,  'completed'],

      // Ama (7)
      [7,  5,  300,  'P2P',      18, 26, 10, 'completed'],
      [7,  0,   75,  'MERCHANT',  8, 21, 14, 'completed'],
      [7,  3,  450,  'P2P',      22, 16, 11, 'completed'],
      [7,  1,  150,  'P2P',      10, 7,  9,  'completed'],

      // Nana (8) — high trust, large
      [8,  5, 1000,  'P2P',      25, 28, 10, 'completed'],
      [8,  2,  800,  'AGENT',    20, 23, 14, 'completed'],
      [8,  0,  500,  'P2P',      18, 19, 11, 'completed'],
      [8, 10,  300,  'P2P',      15, 14, 9,  'completed'],
      [8, 11,  750,  'P2P',      22, 9,  12, 'completed'],
      [8,  4,  200,  'MERCHANT', 10, 3,  16, 'completed'],

      // Efua (9)
      [9,  8,  400,  'P2P',      18, 27, 10, 'completed'],
      [9,  0,  600,  'P2P',      22, 22, 14, 'completed'],
      [9,  3,  250,  'MERCHANT', 15, 17, 11, 'completed'],
      [9,  6,  100,  'P2P',      10, 12, 9,  'completed'],

      // Kwesi (10) — lower trust
      [10, 4,  200,  'P2P',      38, 24, 10, 'completed'],
      [10, 7,  150,  'MERCHANT', 20, 18, 14, 'completed'],
      [10, 2, 2500,  'P2P',      90, 11, 2,  'blocked'],
      [10, 1,  100,  'P2P',      25, 5,  10, 'completed'],

      // Adjoa (11)
      [11, 0,  500,  'P2P',      20, 29, 10, 'completed'],
      [11, 5,  300,  'AGENT',    15, 25, 14, 'completed'],
      [11, 3,  150,  'P2P',      10, 20, 11, 'completed'],
      [11, 8,  700,  'P2P',      28, 15, 9,  'completed'],
      [11, 9,  400,  'MERCHANT', 18, 8,  12, 'completed'],
      [11, 2, 1100,  'P2P',      58, 2,  19, 'review'],
    ];

    let prevHash = null;
    const txIds = [];

    for (const [si, ri, amount, cat, risk, ago, hour, status] of txDefs) {
      const sender    = customers[si];
      const recipient = customers[ri];
      const txRef     = ref();
      const createdAt = daysAgo(ago, hour);
      const aiFlagged = risk >= 70;

      // Blockchain entry
      const payload = JSON.stringify({ ref: txRef, sender: sender.phone, recipient: recipient.phone, amount, risk });
      const hash    = sha256((prevHash ?? 'GENESIS') + payload);

      const txRes = await client.query(
        `INSERT INTO transactions
           (reference, sender_id, recipient_phone, recipient_id, amount, currency,
            category, risk_score, ai_flagged, status, blockchain_hash, metadata, created_at, completed_at)
         VALUES ($1,$2,$3,$4,$5,'GHS',$6,$7,$8,$9,$10,$11,$12,$12) RETURNING id`,
        [
          txRef, sender.id, recipient.phone, recipient.id, amount,
          cat, risk, aiFlagged, status, hash,
          JSON.stringify({ reasons: [] }), createdAt,
        ]
      );
      const txId = txRes.rows[0].id;
      txIds.push(txId);

      await client.query(
        `INSERT INTO blockchain_entries (hash, previous_hash, event_type, transaction_id, payload, created_at)
         VALUES ($1,$2,'transaction',$3,$4,$5)`,
        [hash, prevHash, txId, payload, createdAt]
      );
      prevHash = hash;

      // Alerts for high-risk and blocked
      if (status === 'blocked' || (status === 'review' && risk >= 60)) {
        const severity = risk >= 80 ? 'critical' : risk >= 65 ? 'high' : 'medium';
        await client.query(
          `INSERT INTO alerts (type, title, description, severity, user_id, transaction_id, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            'high_risk',
            `High-risk transaction flagged`,
            `${sender.name} attempted to send ₵${amount.toLocaleString()} to ${recipient.name}. Risk score: ${risk}.`,
            severity, sender.id, txId, createdAt,
          ]
        );
      }
    }

    await client.query('COMMIT');
    console.log(`✓ ${txDefs.length} transactions seeded`);
    console.log(`✓ Blockchain ledger: ${txDefs.length} entries`);
    const alertCount = txDefs.filter(([,,,,r,,, s]) => s === 'blocked' || (s === 'review' && r >= 60)).length;
    console.log(`✓ ${alertCount} alerts generated`);
    console.log('\nSeed complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
