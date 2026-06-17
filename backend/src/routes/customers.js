// backend/src/routes/customers.js
import { Router } from 'express';
import { pool } from '../db/pool.js';
import { authenticate, requireAdmin } from '../middleware/authenticate.js';

const router = Router();

// GET /api/customers  — paginated list with optional search
router.get('/', authenticate, requireAdmin, async (req, res) => {
  const limit  = Math.min(Number(req.query.limit) || 25, 100);
  const offset = Number(req.query.offset) || 0;
  const search = (req.query.search || '').trim();

  const where  = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    const n = params.length;
    where.push(`(phone_number ILIKE $${n} OR full_name ILIKE $${n})`);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT id, phone_number, full_name, balance, trust_score, mfa_enabled, status, created_at
     FROM users
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*)::int AS total FROM users ${whereClause}`,
    params
  );

  // Summary stats
  const { rows: stats } = await pool.query(`
    SELECT
      COUNT(*)::int                                        AS total,
      SUM(CASE WHEN mfa_enabled THEN 1 ELSE 0 END)::int  AS mfa_count,
      COALESCE(AVG(trust_score), 0)::int                  AS avg_trust
    FROM users
  `);

  res.json({
    customers: rows,
    total: countRows[0].total,
    stats: stats[0],
    limit,
    offset,
  });
});

// GET /api/customers/:id  — full customer profile with transactions & alerts
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;

  const { rows: userRows } = await pool.query(
    `SELECT id, phone_number, full_name, balance, trust_score, mfa_enabled, status, created_at
     FROM users WHERE id = $1`,
    [id]
  );
  if (!userRows[0]) return res.status(404).json({ error: 'Customer not found' });

  const { rows: transactions } = await pool.query(
    `SELECT * FROM transactions WHERE sender_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [id]
  );

  const { rows: alerts } = await pool.query(
    `SELECT * FROM alerts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
    [id]
  );

  const { rows: stats } = await pool.query(
    `SELECT
       COUNT(*)::int                                                    AS total_txns,
       COALESCE(SUM(CASE WHEN status='blocked' THEN 1 ELSE 0 END), 0)::int AS blocked_txns,
       COALESCE(SUM(CASE WHEN status='review'  THEN 1 ELSE 0 END), 0)::int AS review_txns,
       COALESCE(AVG(risk_score), 0)::int                               AS avg_risk,
       COALESCE(SUM(amount), 0)                                        AS total_spent
     FROM transactions WHERE sender_id = $1`,
    [id]
  );

  res.json({
    customer: userRows[0],
    transactions,
    alerts,
    stats: stats[0],
  });
});

export default router;
