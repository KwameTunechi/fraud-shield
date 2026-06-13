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

// ─── AI Models ───────────────────────────────────────────────────────────────

function formatLastTrained(ts, status) {
  if (status === 'training') return 'In progress';
  if (!ts) return 'Never';
  const diffMs = Date.now() - new Date(ts).getTime();
  const mins  = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days >= 1)  return days  === 1 ? '1 day ago'  : `${days} days ago`;
  if (hours >= 1) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  return mins <= 1 ? 'Just now' : `${mins} minutes ago`;
}

// GET /api/ai/models
router.get('/ai/models', authenticate, requireAdmin, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, version, accuracy, status, config, last_trained_at FROM risk_models ORDER BY created_at ASC'
  );
  const statusDot = { active: '#22c55e', training: '#3b82f6', inactive: '#94a3b8' };
  const models = rows.map(r => ({
    id:          r.id,
    name:        r.name,
    version:     r.version,
    accuracy:    parseFloat(r.accuracy ?? 0),
    status:      r.status,
    progress:    r.config?.progress ?? Math.round(parseFloat(r.accuracy ?? 0)),
    lastTrained: formatLastTrained(r.last_trained_at, r.status),
    dot:         statusDot[r.status] ?? '#94a3b8',
  }));
  res.json(models);
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
