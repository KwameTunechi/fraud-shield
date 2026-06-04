// backend/src/routes/admins.js
import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { hashPassword } from '../services/auth/password.js';
import { authenticate, requireAdmin, requireRole } from '../middleware/authenticate.js';

const router = Router();

const SAFE_COLS = 'id, email, full_name, role, mfa_enabled, status, last_login_at, created_at';

// GET /api/admins
router.get('/', authenticate, requireAdmin, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ${SAFE_COLS} FROM admins WHERE status != 'deleted' ORDER BY created_at ASC`
  );
  res.json({ admins: rows });
});

// POST /api/admins  (super_admin only)
const createSchema = z.object({
  email:    z.string().email(),
  fullName: z.string().min(2),
  role:     z.enum(['analyst', 'supervisor', 'super_admin']),
  password: z.string().min(8),
});

router.post('/', authenticate, requireAdmin, requireRole('super_admin'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  const { email, fullName, role, password } = parsed.data;

  const passwordHash = await hashPassword(password);
  const { rows } = await pool.query(
    `INSERT INTO admins (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING ${SAFE_COLS}`,
    [email, passwordHash, fullName, role]
  );
  res.status(201).json(rows[0]);
});

// PUT /api/admins/:id  (super_admin only)
const updateSchema = z.object({
  role:   z.enum(['analyst', 'supervisor', 'super_admin']).optional(),
  status: z.enum(['active', 'suspended']).optional(),
});

router.put('/:id', authenticate, requireAdmin, requireRole('super_admin'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const fields = [];
  const params = [];
  if (parsed.data.role)   { params.push(parsed.data.role);   fields.push(`role = $${params.length}`); }
  if (parsed.data.status) { params.push(parsed.data.status); fields.push(`status = $${params.length}`); }
  if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });

  params.push(req.params.id);
  const { rows } = await pool.query(
    `UPDATE admins SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING ${SAFE_COLS}`,
    params
  );
  if (!rows[0]) return res.status(404).json({ error: 'Admin not found' });
  res.json(rows[0]);
});

// DELETE /api/admins/:id — soft-delete (super_admin only)
router.delete('/:id', authenticate, requireAdmin, requireRole('super_admin'), async (req, res) => {
  if (req.params.id === req.principal.sub) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  await pool.query(
    `UPDATE admins SET status = 'deleted', updated_at = NOW() WHERE id = $1`,
    [req.params.id]
  );
  res.json({ status: 'ok' });
});

export default router;
