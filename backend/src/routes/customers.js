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

export default router;
