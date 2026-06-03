-- backend/src/db/migrations/001_initial_schema.sql
-- Initial FraudShield schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ======================================
-- Admins (web dashboard users)
-- ======================================
CREATE TABLE IF NOT EXISTS admins (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'analyst',  -- analyst | supervisor | super_admin
  mfa_secret    TEXT,
  mfa_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  status        TEXT NOT NULL DEFAULT 'active',   -- active | suspended | deleted
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ======================================
-- Users (mobile money customers)
-- ======================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number  TEXT UNIQUE NOT NULL,
  pin_hash      TEXT,
  full_name     TEXT NOT NULL,
  balance       NUMERIC(14,2) NOT NULL DEFAULT 0,
  trust_score   INTEGER NOT NULL DEFAULT 50,
  mfa_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);

-- ======================================
-- Transactions
-- ======================================
CREATE TABLE IF NOT EXISTS transactions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference         TEXT UNIQUE NOT NULL,
  sender_id         UUID NOT NULL REFERENCES users(id),
  recipient_phone   TEXT NOT NULL,
  recipient_id      UUID REFERENCES users(id),
  amount            NUMERIC(14,2) NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'GHS',
  category          TEXT NOT NULL DEFAULT 'P2P',  -- P2P | AGENT | MERCHANT
  risk_score        INTEGER NOT NULL DEFAULT 0,
  ai_flagged        BOOLEAN NOT NULL DEFAULT FALSE,
  status            TEXT NOT NULL DEFAULT 'pending', -- pending | safe | review | blocked | completed | failed
  blockchain_hash   TEXT,
  metadata          JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_transactions_sender  ON transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status  ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);

-- ======================================
-- Alerts
-- ======================================
CREATE TABLE IF NOT EXISTS alerts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type            TEXT NOT NULL,  -- sim_swap | phishing | reversal | takeover | unusual_amount | high_risk | review_required
  title           TEXT NOT NULL,
  description     TEXT,
  severity        TEXT NOT NULL,  -- low | medium | high | critical
  user_id         UUID REFERENCES users(id),
  transaction_id  UUID REFERENCES transactions(id),
  read            BOOLEAN NOT NULL DEFAULT FALSE,
  resolved        BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by     UUID REFERENCES admins(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ
);

-- ======================================
-- Blockchain audit trail (append-only)
-- ======================================
CREATE TABLE IF NOT EXISTS blockchain_entries (
  id              BIGSERIAL PRIMARY KEY,
  hash            TEXT NOT NULL UNIQUE,
  previous_hash   TEXT,
  event_type      TEXT NOT NULL,  -- transaction | auth | admin_action
  transaction_id  UUID REFERENCES transactions(id),
  payload         JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blockchain_created ON blockchain_entries(created_at);

-- ======================================
-- OTP codes
-- ======================================
CREATE TABLE IF NOT EXISTS otp_codes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id),
  phone       TEXT,
  code_hash   TEXT NOT NULL,
  purpose     TEXT NOT NULL,  -- signin | signup | password_reset
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_phone_purpose ON otp_codes(phone, purpose) WHERE used = FALSE;

-- ======================================
-- Sessions (active refresh tokens)
-- ======================================
CREATE TABLE IF NOT EXISTS sessions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES users(id),
  admin_id            UUID REFERENCES admins(id),
  token_hash          TEXT NOT NULL,
  device_fingerprint  TEXT,
  ip_address          TEXT,
  expires_at          TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((user_id IS NOT NULL) OR (admin_id IS NOT NULL))
);

-- ======================================
-- Risk model configurations
-- ======================================
CREATE TABLE IF NOT EXISTS risk_models (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  version           TEXT NOT NULL,
  accuracy          NUMERIC(5,2),
  status            TEXT NOT NULL DEFAULT 'active',  -- active | inactive | training
  config            JSONB NOT NULL,
  last_trained_at   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ======================================
-- Fraud scenarios (mobile simulator)
-- ======================================
CREATE TABLE IF NOT EXISTS fraud_scenarios (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type         TEXT NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  severity     TEXT NOT NULL,
  steps        JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
