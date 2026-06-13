// backend/src/db/seedMobile.js
// Seeds 10 demo mobile users, their past transactions, alerts, and
// pre-flags 4 "scenario phones" so fraud scenario simulations trigger
// real blocked transactions visible in the admin dashboard.
// Run with: node src/db/seedMobile.js

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { pool } from './pool.js';
import { appendEntry } from '../services/blockchain/ledger.js';

const PIN_HASH = await bcrypt.hash('1234', 12);

// ── 10 demo users ──────────────────────────────────────────────────────────────
const USERS = [
  { phone: '+233245678901', name: 'Kwame Asante',   balance: 4820.50, trust: 94 },
  { phone: '+233201234567', name: 'Ama Owusu',       balance: 1250.00, trust: 88 },
  { phone: '+233249876543', name: 'Kofi Mensah',     balance: 3100.75, trust: 91 },
  { phone: '+233274567890', name: 'Akosua Boateng',  balance:  980.00, trust: 72 },
  { phone: '+233502345678', name: 'Yaw Darko',       balance: 2200.50, trust: 85 },
  { phone: '+233241112222', name: 'Abena Frimpong',  balance:  750.00, trust: 65 },
  { phone: '+233271234567', name: 'Nana Adjei',      balance: 5500.00, trust: 96 },
  { phone: '+233201111222', name: 'Efua Quansah',    balance:  320.00, trust: 45 },
  { phone: '+233244444555', name: 'Ebo Asiedu',      balance: 1800.00, trust: 78 },
  { phone: '+233270987654', name: 'Adwoa Boadi',     balance: 6200.00, trust: 93 },
];

// Pre-flagged scenario phones — these will trigger rule 6 (+50 risk points)
// guaranteeing any transaction to them scores ≥70 and is blocked.
const SCENARIO_PHONES = [
  '+233559990001', // FS-1 SIM Swap
  '+233559990002', // FS-2 Phishing
  '+233559990003', // FS-3 Fake Reversal
  '+233559990004', // FS-4 Account Takeover
];

function ref() {
  return 'FS-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

function daysAgo(n, hourOffset = 14) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hourOffset, 0, 0, 0);
  return d.toISOString();
}

async function insertTx(client, { reference, senderId, recipientPhone, amount, category, score, status, reasons, createdAt, completedAt }) {
  const { rows } = await client.query(
    `INSERT INTO transactions
       (reference, sender_id, recipient_phone, amount, category,
        risk_score, ai_flagged, status, metadata, created_at, completed_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (reference) DO NOTHING
     RETURNING *`,
    [
      reference, senderId, recipientPhone, amount, category,
      score, score >= 30, status,
      JSON.stringify({ reasons }),
      createdAt, completedAt ?? null,
    ]
  );
  return rows[0];
}

async function seed() {
  // ── 1. Upsert 10 users ───────────────────────────────────────────────────────
  const userIds = {};
  for (const u of USERS) {
    const { rows } = await pool.query(
      `INSERT INTO users (phone_number, pin_hash, full_name, balance, trust_score, mfa_enabled)
       VALUES ($1,$2,$3,$4,$5,true)
       ON CONFLICT (phone_number) DO UPDATE
         SET full_name = EXCLUDED.full_name,
             balance   = EXCLUDED.balance,
             trust_score = EXCLUDED.trust_score
       RETURNING id`,
      [u.phone, PIN_HASH, u.name, u.balance, u.trust]
    );
    userIds[u.phone] = rows[0].id;
    console.log(`  ✓ ${u.name} (${u.phone})`);
  }

  // ── 2. Past transactions for each user ───────────────────────────────────────
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const kwame = userIds['+233245678901'];
    const ama   = userIds['+233201234567'];
    const kofi  = userIds['+233249876543'];

    // Kwame: mix of safe, review, blocked
    const txs = [
      // safe completed
      { senderId: kwame, recipientPhone: '+233201234567', amount: 250,    category: 'P2P',      score: 4,  status: 'completed', reasons: [],                                          createdAt: daysAgo(0, 14), completedAt: daysAgo(0, 14) },
      { senderId: kwame, recipientPhone: '+233249876543', amount: 80,     category: 'P2P',      score: 8,  status: 'completed', reasons: [],                                          createdAt: daysAgo(1, 10), completedAt: daysAgo(1, 10) },
      { senderId: kwame, recipientPhone: '+233274567890', amount: 42.45,  category: 'MERCHANT', score: 6,  status: 'completed', reasons: [],                                          createdAt: daysAgo(1, 10), completedAt: daysAgo(1, 10) },
      { senderId: kwame, recipientPhone: '+233241112222', amount: 8250,   category: 'P2P',      score: 22, status: 'completed', reasons: ['amount_above_2000_ghs'],                  createdAt: daysAgo(2,  9), completedAt: daysAgo(2,  9) },
      // review
      { senderId: kwame, recipientPhone: '+233502345678', amount: 445.30, category: 'AGENT',    score: 40, status: 'review',    reasons: ['new_recipient','amount_3x_rolling_avg'],   createdAt: daysAgo(3, 16) },
      // blocked
      { senderId: kwame, recipientPhone: '+233559000099', amount: 1499.99,category: 'P2P',      score: 92, status: 'blocked',   reasons: ['late_night','new_recipient','amount_above_2000_ghs'], createdAt: daysAgo(5, 23) },

      // Ama's transactions
      { senderId: ama, recipientPhone: '+233245678901', amount: 150,   category: 'P2P',      score: 5,  status: 'completed', reasons: [],                      createdAt: daysAgo(0, 11), completedAt: daysAgo(0, 11) },
      { senderId: ama, recipientPhone: '+233249876543', amount: 320,   category: 'MERCHANT', score: 12, status: 'completed', reasons: [],                      createdAt: daysAgo(1, 15), completedAt: daysAgo(1, 15) },
      { senderId: ama, recipientPhone: '+233274567890', amount: 2100,  category: 'P2P',      score: 35, status: 'review',    reasons: ['new_recipient','amount_above_2000_ghs'], createdAt: daysAgo(4, 20) },

      // Kofi's transactions
      { senderId: kofi, recipientPhone: '+233201234567', amount: 500,  category: 'P2P',      score: 10, status: 'completed', reasons: [],                      createdAt: daysAgo(0, 13), completedAt: daysAgo(0, 13) },
      { senderId: kofi, recipientPhone: '+233245678901', amount: 1800, category: 'AGENT',    score: 25, status: 'completed', reasons: ['amount_above_2000_ghs'], createdAt: daysAgo(2, 12), completedAt: daysAgo(2, 12) },
      { senderId: kofi, recipientPhone: '+233559000088', amount: 3200, category: 'P2P',      score: 85, status: 'blocked',   reasons: ['late_night','new_recipient','amount_above_2000_ghs'], createdAt: daysAgo(6, 23) },
    ];

    // Remaining users — 3 simple transactions each
    const rest = [
      ['+233274567890', [
        { recipientPhone: '+233245678901', amount: 100,  category: 'P2P',      score: 5,  status: 'completed', reasons: [], createdAt: daysAgo(1, 14), completedAt: daysAgo(1, 14) },
        { recipientPhone: '+233201234567', amount: 60,   category: 'MERCHANT', score: 8,  status: 'completed', reasons: [], createdAt: daysAgo(3, 12), completedAt: daysAgo(3, 12) },
        { recipientPhone: '+233559000077', amount: 2500, category: 'P2P',      score: 75, status: 'blocked',   reasons: ['new_recipient','amount_above_2000_ghs','recipient_flagged_in_alerts'], createdAt: daysAgo(8, 22) },
      ]],
      ['+233502345678', [
        { recipientPhone: '+233245678901', amount: 200,  category: 'P2P',      score: 3,  status: 'completed', reasons: [], createdAt: daysAgo(0, 16), completedAt: daysAgo(0, 16) },
        { recipientPhone: '+233271234567', amount: 750,  category: 'AGENT',    score: 15, status: 'completed', reasons: [], createdAt: daysAgo(2, 11), completedAt: daysAgo(2, 11) },
        { recipientPhone: '+233559000066', amount: 1800, category: 'P2P',      score: 45, status: 'review',    reasons: ['new_recipient','amount_above_2000_ghs'], createdAt: daysAgo(5, 19) },
      ]],
      ['+233241112222', [
        { recipientPhone: '+233201234567', amount: 50,   category: 'P2P',      score: 4,  status: 'completed', reasons: [], createdAt: daysAgo(1, 13), completedAt: daysAgo(1, 13) },
        { recipientPhone: '+233249876543', amount: 120,  category: 'MERCHANT', score: 9,  status: 'completed', reasons: [], createdAt: daysAgo(4, 10), completedAt: daysAgo(4, 10) },
        { recipientPhone: '+233245678901', amount: 200,  category: 'P2P',      score: 6,  status: 'completed', reasons: [], createdAt: daysAgo(7, 15), completedAt: daysAgo(7, 15) },
      ]],
      ['+233271234567', [
        { recipientPhone: '+233201234567', amount: 300,  category: 'P2P',      score: 5,  status: 'completed', reasons: [], createdAt: daysAgo(0, 10), completedAt: daysAgo(0, 10) },
        { recipientPhone: '+233249876543', amount: 1200, category: 'AGENT',    score: 18, status: 'completed', reasons: [], createdAt: daysAgo(2, 14), completedAt: daysAgo(2, 14) },
        { recipientPhone: '+233559000055', amount: 4000, category: 'P2P',      score: 90, status: 'blocked',   reasons: ['late_night','new_recipient','amount_above_2000_ghs'], createdAt: daysAgo(10, 23) },
      ]],
      ['+233201111222', [
        { recipientPhone: '+233245678901', amount: 80,   category: 'P2P',      score: 7,  status: 'completed', reasons: [], createdAt: daysAgo(2, 11), completedAt: daysAgo(2, 11) },
        { recipientPhone: '+233274567890', amount: 45,   category: 'MERCHANT', score: 5,  status: 'completed', reasons: [], createdAt: daysAgo(5, 13), completedAt: daysAgo(5, 13) },
        { recipientPhone: '+233559000044', amount: 900,  category: 'P2P',      score: 38, status: 'review',    reasons: ['new_recipient','amount_3x_rolling_avg'], createdAt: daysAgo(9, 21) },
      ]],
      ['+233244444555', [
        { recipientPhone: '+233201234567', amount: 500,  category: 'P2P',      score: 10, status: 'completed', reasons: [], createdAt: daysAgo(1, 12), completedAt: daysAgo(1, 12) },
        { recipientPhone: '+233274567890', amount: 250,  category: 'MERCHANT', score: 7,  status: 'completed', reasons: [], createdAt: daysAgo(3, 15), completedAt: daysAgo(3, 15) },
        { recipientPhone: '+233559000033', amount: 2800, category: 'P2P',      score: 55, status: 'review',    reasons: ['new_recipient','amount_above_2000_ghs'], createdAt: daysAgo(6, 18) },
      ]],
      ['+233270987654', [
        { recipientPhone: '+233249876543', amount: 400,  category: 'P2P',      score: 6,  status: 'completed', reasons: [], createdAt: daysAgo(0, 14), completedAt: daysAgo(0, 14) },
        { recipientPhone: '+233245678901', amount: 900,  category: 'AGENT',    score: 12, status: 'completed', reasons: [], createdAt: daysAgo(2, 16), completedAt: daysAgo(2, 16) },
        { recipientPhone: '+233241112222', amount: 600,  category: 'P2P',      score: 8,  status: 'completed', reasons: [], createdAt: daysAgo(4, 11), completedAt: daysAgo(4, 11) },
      ]],
    ];

    for (const [phone, restTxs] of rest) {
      for (const t of restTxs) {
        txs.push({ senderId: userIds[phone], ...t });
      }
    }

    // Insert all transactions and append blockchain entries for completed ones
    for (const t of txs) {
      const r = ref();
      const tx = await insertTx(client, { reference: r, ...t });
      if (!tx) continue;

      if (tx.status === 'completed' || tx.status === 'blocked') {
        try {
          const hash = await appendEntry({
            eventType: 'transaction',
            transactionId: tx.id,
            payload: {
              reference: tx.reference,
              senderId: tx.sender_id,
              recipientPhone: tx.recipient_phone,
              amount: Number(tx.amount),
              score: tx.risk_score,
              status: tx.status,
              reasons: t.reasons,
            },
          });
          await client.query('UPDATE transactions SET blockchain_hash = $1 WHERE id = $2', [hash, tx.id]);
        } catch (_) { /* skip blockchain if chain lock conflict */ }
      }

      // Create alert for flagged transactions
      if (tx.risk_score >= 30) {
        await client.query(
          `INSERT INTO alerts (type, title, description, severity, user_id, transaction_id, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT DO NOTHING`,
          [
            tx.risk_score >= 70 ? 'high_risk' : 'review_required',
            tx.risk_score >= 70 ? 'Transaction blocked' : 'Transaction under review',
            `Risk score ${tx.risk_score}. Reasons: ${t.reasons.join(', ')}`,
            tx.risk_score >= 70 ? 'critical' : 'high',
            tx.sender_id,
            tx.id,
            t.createdAt,
          ]
        );
      }
    }

    await client.query('COMMIT');
    console.log(`\n  ✓ ${txs.length} transactions seeded`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // ── 3. Pre-flag scenario phones so rule 6 triggers on demo scenarios ──────────
  // Create a dummy "flagged" transaction + alert for each scenario phone so
  // any future transaction to these numbers scores +50 and is auto-blocked.
  console.log('\n  Flagging scenario phones...');
  const flagSender = userIds['+233245678901']; // Kwame is the "prior victim"
  for (const phone of SCENARIO_PHONES) {
    const c = await pool.connect();
    try {
      await c.query('BEGIN');
      const r = ref();
      const { rows: txRows } = await c.query(
        `INSERT INTO transactions
           (reference, sender_id, recipient_phone, amount, category,
            risk_score, ai_flagged, status, metadata, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,true,'blocked',$7,$8)
         ON CONFLICT (reference) DO NOTHING
         RETURNING *`,
        [r, flagSender, phone, 5000, 'P2P', 95,
         JSON.stringify({ reasons: ['late_night', 'new_recipient', 'amount_above_2000_ghs'] }),
         daysAgo(14, 2)]
      );
      if (txRows[0]) {
        await c.query(
          `INSERT INTO alerts (type, title, description, severity, user_id, transaction_id, created_at)
           VALUES ('high_risk','Known fraud phone flagged','Recipient phone associated with prior fraud attempt','critical',$1,$2,$3)`,
          [flagSender, txRows[0].id, daysAgo(14, 2)]
        );
      }
      await c.query('COMMIT');
      console.log(`  ✓ Flagged ${phone}`);
    } catch (err) {
      await c.query('ROLLBACK');
      console.error(`  ✗ ${phone}: ${err.message}`);
    } finally {
      c.release();
    }
  }

  console.log('\nMobile seed complete.\n');
  console.log('Demo users (all PIN: 1234):');
  USERS.forEach(u => console.log(`  ${u.phone}  ${u.name}  ₵${u.balance}`));
  console.log('\nScenario phones (all pre-flagged → any transaction = blocked):');
  SCENARIO_PHONES.forEach(p => console.log(`  ${p}`));

  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
