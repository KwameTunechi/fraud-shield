-- 003_improvements.sql
-- PIN lockout tracking and trust score improvements

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS failed_pin_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until        TIMESTAMPTZ;
