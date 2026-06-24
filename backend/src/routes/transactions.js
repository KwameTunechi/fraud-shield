// backend/src/routes/transactions.js
import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { pool, withTransaction } from '../db/pool.js';
import { authenticate, requireAdmin } from '../middleware/authenticate.js';
import { scoreTransaction } from '../services/risk/scorer.js';
import { publish } from '../services/events/bus.js';
import { appendEntry } from '../services/blockchain/ledger.js';

const router = Router();

const createSchema = z.object({
  recipientPhone: z.string().regex(/^\+233\d{9}$/),
  amount:         z.number().positive().max(50000),
  category:       z.enum(['P2P', 'AGENT', 'MERCHANT']).default('P2P'),
});

// ─── POST /api/transactions — submit a transaction (customers only) ───────────

router.post('/', authenticate, async (req, res) => {
  if (req.principal.type !== 'user') {
    return res.status(403).json({ error: 'Customers only' });
  }

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }
  const { recipientPhone, amount, category } = parsed.data;

  const { rows: senderRows } = await pool.query(
    'SELECT * FROM users WHERE id = $1', [req.principal.sub]
  );
  const sender = senderRows[0];
  if (!sender) return res.status(404).json({ error: 'Sender not found' });
  if (sender.phone_number === recipientPhone) {
    return res.status(400).json({ error: 'Cannot send to yourself' });
  }
  if (Number(sender.balance) < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  // Score before saving — blocked transactions are recorded but money doesn't move
  const { score, status, reasons } = await scoreTransaction({
    senderId: sender.id,
    recipientPhone,
    amount,
    createdAt: new Date().toISOString(),
  });

  const reference = 'FS-' + crypto.randomBytes(6).toString('hex').toUpperCase();

  const inserted = await withTransaction(async (client) => {
    const finalStatus = status === 'blocked' ? 'blocked'
                      : status === 'review'  ? 'review'
                      : 'completed';

    // Only move money when the transaction is not blocked
    if (finalStatus !== 'blocked') {
      await client.query(
        'UPDATE users SET balance = balance - $1 WHERE id = $2',
        [amount, sender.id]
      );
      await client.query(
        'UPDATE users SET balance = balance + $1 WHERE phone_number = $2',
        [amount, recipientPhone]
      );
    }

    const { rows: recipientRows } = await client.query(
      'SELECT id FROM users WHERE phone_number = $1', [recipientPhone]
    );

    const { rows: txRows } = await client.query(
      `INSERT INTO transactions
         (reference, sender_id, recipient_phone, recipient_id, amount, category,
          risk_score, ai_flagged, status, metadata, completed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        reference,
        sender.id,
        recipientPhone,
        recipientRows[0]?.id || null,
        amount,
        category,
        score,
        score >= REVIEW_THRESHOLD,
        finalStatus,
        JSON.stringify({ reasons }),
        finalStatus === 'completed' ? new Date() : null,
      ]
    );
    const tx = txRows[0];

    // Create an alert for any transaction that needs attention
    if (score >= REVIEW_THRESHOLD) {
      await client.query(
        `INSERT INTO alerts (type, title, description, severity, user_id, transaction_id)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          score >= BLOCK_THRESHOLD ? 'high_risk'        : 'review_required',
          score >= BLOCK_THRESHOLD ? 'Transaction blocked' : 'Transaction under review',
          `Risk score: ${score}. Reasons: ${reasons.join(', ')}`,
          score >= BLOCK_THRESHOLD ? 'critical'         : 'high',
          sender.id,
          tx.id,
        ]
      );
    }
    return tx;
  });

  // Publish live event so the admin SSE stream updates immediately
  publish('transaction.new', {
    id: inserted.id, reference: inserted.reference,
    amount, recipientPhone, score, status: inserted.status,
    createdAt: inserted.created_at,
  });
  if (score >= REVIEW_THRESHOLD) {
    publish('alert.new', { transactionId: inserted.id, score, reasons });
  }

  // Append to the blockchain audit trail AFTER the DB commit so we never
  // log a transaction that did not actually persist
  try {
    const blockchainHash = await appendEntry({
      eventType:     'transaction',
      transactionId: inserted.id,
      payload: {
        reference:      inserted.reference,
        senderId:       inserted.sender_id,
        recipientPhone: inserted.recipient_phone,
        amount:         inserted.amount,
        score,
        status:         inserted.status,
        reasons,
      },
    });
    // Back-fill the blockchain_hash column on the transaction row
    await pool.query(
      'UPDATE transactions SET blockchain_hash = $1 WHERE id = $2',
      [blockchainHash, inserted.id]
    );
    inserted.blockchain_hash = blockchainHash;
  } catch (err) {
    // Blockchain append failure must not roll back the financial transaction
    console.error('Blockchain append failed:', err.message);
  }

  res.status(201).json({ transaction: inserted, score, status, reasons });
});

const REVIEW_THRESHOLD = 30;
const BLOCK_THRESHOLD  = 70;

// ─── GET /api/transactions — paginated list ───────────────────────────────────

router.get('/', authenticate, async (req, res) => {
  const limit    = Math.min(Number(req.query.limit)  || 25, 100);
  const offset   = Number(req.query.offset) || 0;
  const status   = req.query.status;
  const minRisk  = Number(req.query.minRisk) || 0;

  const where  = [];
  const params = [];

  // Customers see only their own transactions
  if (req.principal.type === 'user') {
    params.push(req.principal.sub);
    where.push(`sender_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (minRisk) {
    params.push(minRisk);
    where.push(`risk_score >= $${params.length}`);
  }

  params.push(limit, offset);
  const sql = `
    SELECT * FROM transactions
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const { rows } = await pool.query(sql, params);
  res.json({ transactions: rows, limit, offset });
});

// ─── GET /api/transactions/:id ────────────────────────────────────────────────

router.get('/:id', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM transactions WHERE id = $1', [req.params.id]
  );
  const tx = rows[0];
  if (!tx) return res.status(404).json({ error: 'Transaction not found' });
  if (req.principal.type === 'user' && tx.sender_id !== req.principal.sub) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(tx);
});

// ─── PUT /api/transactions/:id/status — admin review decision ─────────────────

router.put('/:id/status', authenticate, requireAdmin, async (req, res) => {
  const allowed = ['completed', 'blocked', 'review'];
  if (!allowed.includes(req.body?.status)) {
    return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });
  }

  const updated = await withTransaction(async (client) => {
    const { rows: current } = await client.query(
      'SELECT * FROM transactions WHERE id = $1 FOR UPDATE',
      [req.params.id]
    );
    if (!current[0]) return null;
    const tx = current[0];

    // Admin rejects a review transaction → refund sender
    if (tx.status === 'review' && req.body.status === 'blocked') {
      await client.query(
        'UPDATE users SET balance = balance + $1 WHERE id = $2',
        [tx.amount, tx.sender_id]
      );
      if (tx.recipient_id) {
        await client.query(
          'UPDATE users SET balance = balance - $1 WHERE id = $2',
          [tx.amount, tx.recipient_id]
        );
      }
    }

    const { rows } = await client.query(
      `UPDATE transactions
       SET status = $1, completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END
       WHERE id = $2
       RETURNING *`,
      [req.body.status, req.params.id]
    );
    return rows[0];
  });

  if (!updated) return res.status(404).json({ error: 'Transaction not found' });
  publish('transaction.status_changed', { id: updated.id, status: updated.status });
  res.json(updated);
});

// ─── POST /api/transactions/preview ─────────────────────────────────────────
// Scores a transaction without persisting it. Used by the mobile app to show
// the AI risk verdict before the user taps confirm.

router.post('/preview', authenticate, async (req, res) => {
  if (req.principal.type !== 'user') {
    return res.status(403).json({ error: 'Customers only' });
  }
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }
  const { recipientPhone, amount } = parsed.data;

  const { rows: senderRows } = await pool.query(
    'SELECT * FROM users WHERE id = $1', [req.principal.sub]
  );
  const sender = senderRows[0];
  if (!sender) return res.status(404).json({ error: 'Sender not found' });

  const { score, status, reasons } = await scoreTransaction({
    senderId: sender.id,
    recipientPhone,
    amount,
    createdAt: new Date().toISOString(),
  });

  res.json({ score, status, reasons });
});

export default router;
