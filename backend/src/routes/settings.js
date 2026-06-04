// backend/src/routes/settings.js
// Handles both /api/ai-config and /api/settings.
// Both read from / write to the settings table keyed by 'ai_config' and 'system'.

import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { authenticate, requireAdmin } from '../middleware/authenticate.js';

const router = Router();

async function getSetting(key) {
  const { rows } = await pool.query('SELECT value FROM settings WHERE key = $1', [key]);
  return rows[0]?.value ?? null;
}

async function setSetting(key, value) {
  await pool.query(
    `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
    [key, JSON.stringify(value)]
  );
}

// ─── AI Config ────────────────────────────────────────────────────────────────

// GET /api/ai-config
router.get('/ai-config', authenticate, requireAdmin, async (req, res) => {
  const config = await getSetting('ai_config');
  res.json(config ?? { anomaly: true, blocking: true, behavior: true, predictive: false });
});

// PUT /api/ai-config/toggles
const togglesSchema = z.object({
  anomaly:    z.boolean().optional(),
  blocking:   z.boolean().optional(),
  behavior:   z.boolean().optional(),
  predictive: z.boolean().optional(),
});

router.put('/ai-config/toggles', authenticate, requireAdmin, async (req, res) => {
  const parsed = togglesSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const current = await getSetting('ai_config') ?? {};
  const updated = { ...current, ...parsed.data };
  await setSetting('ai_config', updated);
  res.json(updated);
});

// ─── System Settings ─────────────────────────────────────────────────────────

// GET /api/settings
router.get('/settings', authenticate, requireAdmin, async (req, res) => {
  const config = await getSetting('system');
  res.json(config ?? {});
});

// PUT /api/settings
const systemSchema = z.object({
  mfaPolicy:         z.string().optional(),
  sessionTimeout:    z.number().int().positive().optional(),
  emailAlerts:       z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  smsAlerts:         z.boolean().optional(),
  dataRetention:     z.number().int().positive().optional(),
  backupSchedule:    z.string().optional(),
  auditLogs:         z.boolean().optional(),
  apiAccess:         z.string().optional(),
});

router.put('/settings', authenticate, requireAdmin, async (req, res) => {
  const parsed = systemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' });

  const current = await getSetting('system') ?? {};
  const updated = { ...current, ...parsed.data };
  await setSetting('system', updated);
  res.json(updated);
});

export default router;
