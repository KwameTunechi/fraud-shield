// backend/src/routes/alerts.js
import { Router } from 'express';
import { pool } from '../db/pool.js';
import { authenticate, requireAdmin } from '../middleware/authenticate.js';

const router = Router();

// ─── GET /api/alerts ──────────────────────────────────────────────────────────

router.get('/', authenticate, async (req, res) => {
  const limit  = Math.min(Number(req.query.limit) || 25, 100);
  const offset = Number(req.query.offset) || 0;
  const status = req.query.status; // 'unread' | 'resolved' | omit for all

  const where  = [];
  const params = [];

  // Customers see only their own alerts; admins see everything
  if (req.principal.type === 'user') {
    params.push(req.principal.sub);
    where.push(`user_id = $${params.length}`);
  }
  if (status === 'unread')   where.push('read = FALSE');
  if (status === 'resolved') where.push('resolved = TRUE');
  if (status === 'open')     where.push('resolved = FALSE');

  params.push(limit, offset);
  const sql = `
    SELECT * FROM alerts
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const { rows } = await pool.query(sql, params);
  res.json({ alerts: rows, limit, offset });
});

// ─── PUT /api/alerts/:id/read ─────────────────────────────────────────────────

router.put('/:id/read', authenticate, async (req, res) => {
  // Customers may only mark their own alerts as read; admins may mark any.
  const params = [req.params.id];
  let ownerClause = '';
  if (req.principal.type === 'user') {
    params.push(req.principal.sub);
    ownerClause = ' AND user_id = $2';
  }
  const { rows } = await pool.query(
    `UPDATE alerts SET read = TRUE WHERE id = $1${ownerClause} RETURNING *`,
    params
  );
  if (!rows[0]) return res.status(404).json({ error: 'Alert not found' });
  res.json(rows[0]);
});

// ─── PUT /api/alerts/:id/resolve — admin only ─────────────────────────────────

router.put('/:id/resolve', authenticate, requireAdmin, async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE alerts
     SET resolved = TRUE, resolved_at = NOW(), resolved_by = $1
     WHERE id = $2
     RETURNING *`,
    [req.principal.sub, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Alert not found' });
  res.json(rows[0]);
});

export default router;
