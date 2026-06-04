// backend/src/services/risk/scorer.js
// Transparent, rule-based risk scorer.  Every rule is independently explainable —
// critical for the research thesis and for regulatory defensibility.
// Each rule returns { points, reason } when it fires, or null when it doesn't.

import { pool } from '../../db/pool.js';

const THRESHOLDS = { safe: 30, review: 70 }; // 0-29 safe | 30-69 review | 70+ blocked

const RULES = [
  // Rule 1 — Late night (22:00–05:00 UTC, which equals Accra/Ghana time, UTC+0)
  ({ createdAt }) => {
    const hour = new Date(createdAt).getUTCHours();
    if (hour >= 22 || hour < 5) return { points: 25, reason: 'late_night' };
    return null;
  },

  // Rule 2 — Large single amount (above ₵2,000)
  ({ amount }) => {
    if (Number(amount) > 2000) return { points: 20, reason: 'amount_above_2000_ghs' };
    return null;
  },

  // Rule 3 — Recipient the sender has never paid before
  async ({ senderId, recipientPhone }) => {
    const { rows } = await pool.query(
      `SELECT 1 FROM transactions
       WHERE sender_id = $1 AND recipient_phone = $2 AND status != 'blocked'
       LIMIT 1`,
      [senderId, recipientPhone]
    );
    if (rows.length === 0) return { points: 20, reason: 'new_recipient' };
    return null;
  },

  // Rule 4 — Amount is more than 3× the sender's 30-day rolling average
  async ({ senderId, amount }) => {
    const { rows } = await pool.query(
      `SELECT COALESCE(AVG(amount), 0)::numeric AS avg_amt
       FROM transactions
       WHERE sender_id = $1
         AND created_at > NOW() - INTERVAL '30 days'
         AND status != 'blocked'`,
      [senderId]
    );
    const avg = Number(rows[0].avg_amt);
    if (avg > 0 && Number(amount) > avg * 3) {
      return { points: 15, reason: 'amount_3x_rolling_avg' };
    }
    return null;
  },

  // Rule 5 — Rapid succession: more than 3 transactions in the last 10 minutes
  async ({ senderId }) => {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS c
       FROM transactions
       WHERE sender_id = $1
         AND created_at > NOW() - INTERVAL '10 minutes'`,
      [senderId]
    );
    if (rows[0].c > 3) return { points: 15, reason: 'rapid_succession' };
    return null;
  },

  // Rule 6 — Recipient phone has been flagged in a fraud alert in the last 30 days
  async ({ recipientPhone }) => {
    const { rows } = await pool.query(
      `SELECT 1 FROM alerts a
       JOIN transactions t ON t.id = a.transaction_id
       WHERE t.recipient_phone = $1
         AND a.created_at > NOW() - INTERVAL '30 days'
       LIMIT 1`,
      [recipientPhone]
    );
    if (rows.length > 0) return { points: 50, reason: 'recipient_flagged_in_alerts' };
    return null;
  },
];

// Scores a prospective transaction.
// Returns { score: 0-100, status: 'safe'|'review'|'blocked', reasons: string[] }
export async function scoreTransaction(tx) {
  let total = 0;
  const reasons = [];

  for (const rule of RULES) {
    const result = await rule(tx);
    if (result) {
      total += result.points;
      reasons.push(result.reason);
    }
  }

  total = Math.min(100, total); // clamp to 0-100

  const status =
    total < THRESHOLDS.safe   ? 'safe'    :
    total < THRESHOLDS.review ? 'review'  : 'blocked';

  return { score: total, status, reasons };
}
