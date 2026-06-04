// backend/src/routes/blockchain.js
import { Router } from 'express';
import { pool } from '../db/pool.js';
import { verifyChain } from '../services/blockchain/ledger.js';
import { authenticate, requireAdmin } from '../middleware/authenticate.js';

const router = Router();

// GET /api/blockchain  — paginated ledger entries (admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  const limit  = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;

  const { rows } = await pool.query(
    `SELECT id, hash, previous_hash, event_type, transaction_id, created_at
     FROM blockchain_entries
     ORDER BY id DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const { rows: countRows } = await pool.query(
    'SELECT COUNT(*)::int AS total FROM blockchain_entries'
  );

  res.json({ entries: rows, total: countRows[0].total, limit, offset });
});

// GET /api/blockchain/verify  — integrity check (admin only)
router.get('/verify', authenticate, requireAdmin, async (req, res) => {
  const result = await verifyChain();
  res.status(result.ok ? 200 : 409).json(result);
});

// GET /api/blockchain/:id  — single entry with full payload
router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM blockchain_entries WHERE id = $1',
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Entry not found' });
  res.json(rows[0]);
});

export default router;
