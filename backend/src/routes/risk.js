// backend/src/routes/risk.js
import { Router } from 'express';
import { pool } from '../db/pool.js';
import { authenticate, requireAdmin } from '../middleware/authenticate.js';

const router = Router();

// ─── GET /api/risk/summary — KPI cards for the admin dashboard ────────────────

router.get('/summary', authenticate, requireAdmin, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int
         FROM transactions
        WHERE created_at > NOW() - INTERVAL '24 hours')           AS tx_24h,
      (SELECT COUNT(*)::int
         FROM transactions
        WHERE status = 'blocked'
          AND created_at > NOW() - INTERVAL '24 hours')           AS blocked_24h,
      (SELECT COUNT(*)::int
         FROM alerts
        WHERE resolved = FALSE)                                    AS open_alerts,
      (SELECT COALESCE(AVG(risk_score), 0)::int
         FROM transactions
        WHERE created_at > NOW() - INTERVAL '7 days')             AS avg_risk_7d,
      (SELECT COUNT(*)::int FROM users WHERE status = 'active')   AS active_users
  `);
  res.json(rows[0]);
});

// ─── GET /api/risk/analytics — time-series data for charts ───────────────────

router.get('/analytics', authenticate, requireAdmin, async (req, res) => {
  const RANGE_MAP = { '7d': '7 days', '30d': '30 days', '90d': '90 days' };
  const interval  = RANGE_MAP[req.query.range] ?? '30 days';

  const { rows: byDay } = await pool.query(`
    SELECT
      date_trunc('day', created_at)                                   AS day,
      COUNT(*)::int                                                    AS total,
      SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END)::int        AS blocked,
      SUM(CASE WHEN status = 'review'  THEN 1 ELSE 0 END)::int        AS under_review,
      COALESCE(AVG(risk_score), 0)::int                               AS avg_risk
    FROM transactions
    WHERE created_at > NOW() - $1::interval
    GROUP BY day
    ORDER BY day
  `, [interval]);

  // Per-category breakdown
  const { rows: byCategory } = await pool.query(`
    SELECT
      category,
      COUNT(*)::int                         AS total,
      COALESCE(AVG(risk_score), 0)::int     AS avg_risk,
      SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END)::int AS blocked
    FROM transactions
    GROUP BY category
  `);

  // Most common risk reasons across all flagged transactions in the selected range
  const { rows: topReasons } = await pool.query(`
    SELECT reason, COUNT(*)::int AS occurrences
    FROM (
      SELECT jsonb_array_elements_text(metadata->'reasons') AS reason
      FROM transactions
      WHERE ai_flagged = TRUE
        AND created_at > NOW() - $1::interval
    ) sub
    GROUP BY reason
    ORDER BY occurrences DESC
    LIMIT 10
  `, [interval]);

  res.json({ byDay, byCategory, topReasons });
});

export default router;
