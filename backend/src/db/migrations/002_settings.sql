-- backend/src/db/migrations/002_settings.sql
-- Generic key-value settings store used for AI config and system settings.

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO settings (key, value) VALUES
  ('ai_config',
   '{"anomaly":true,"blocking":true,"behavior":true,"predictive":false}'::jsonb),
  ('system',
   '{"mfaPolicy":"enforced","sessionTimeout":30,"emailAlerts":true,"pushNotifications":true,"smsAlerts":false,"dataRetention":90,"backupSchedule":"daily","auditLogs":true,"apiAccess":"limited"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
