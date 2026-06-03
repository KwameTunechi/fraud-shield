// backend/src/routes/health.js
import { Router } from 'express';
import { pool } from '../db/pool.js';
import { redis } from '../db/redis.js';

const router = Router();

router.get('/', async (req, res) => {
  const checks = { api: 'ok' };

  try { await pool.query('SELECT 1'); checks.db = 'ok'; }
  catch { checks.db = 'down'; }

  try { await redis.ping(); checks.redis = 'ok'; }
  catch { checks.redis = 'down'; }

  const healthy = Object.values(checks).every(v => v === 'ok');
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  });
});

export default router;
