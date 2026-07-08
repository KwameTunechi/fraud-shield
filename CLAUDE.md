# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

FraudShield is a University of Ghana research project on layered fraud defence (AI risk scoring + blockchain audit trail + MFA) for mobile money. It's a monorepo with three independently deployed workspaces, each with its own `package.json` and `node_modules`:

- **`/` (repo root)** — Admin dashboard + customer web portal. React 19 + Vite + Tailwind v4, deployed to Vercel.
- **`backend/`** — Express 5 API. PostgreSQL + Redis. Deployed to Railway.
- **`mobile/`** — Customer app. React Native + Expo SDK 54.

Run commands from inside the relevant workspace directory (`backend/`, `mobile/`, or repo root) — there is no root-level orchestration script.

## Commands

### Root (web dashboard + customer portal)
```bash
npm run dev              # vite dev server, http://localhost:5173
npm run build             # production build to dist/
npm run lint               # eslint .
npm test                    # vitest run (all tests, once)
npm run test:watch         # vitest watch mode
npm run test:coverage      # vitest run --coverage (v8 provider)
npx vitest run src/pages/SignIn.test.jsx   # run a single test file
```

### `backend/`
```bash
npm run dev                # nodemon, http://localhost:3000
npm start                   # node src/server.js (no reload)
npm test                     # vitest run — integration tests against real Postgres + Redis
npm run test:watch
npx vitest run tests/auth.test.js   # single test file
npm run db:migrate          # runs backend/src/db/migrate.js against DATABASE_URL
npm run db:seed              # runs backend/src/db/seed.js — seeds demo admin + 12 customers
docker compose up -d          # starts local Postgres 16 + Redis 7 (backend/docker-compose.yml)
```
Backend tests run with `pool: 'forks'` + `singleFork: true` (sequential, not parallel) — see `backend/vitest.config.js` — because the blockchain ledger's hash chain would race under concurrent test files. `tests/setup.js` / `tests/teardown.js` flush Redis and manage the pool globally.

### `mobile/`
```bash
npm start          # expo start
npm run android
npm run ios
npm run web
```
There is no lint or test script in `mobile/package.json`. `mobile/AGENTS.md` (aliased from `mobile/CLAUDE.md`) warns that Expo APIs have changed recently — check the versioned docs at `docs.expo.dev/versions/v54.0.0/` (this project targets SDK 54) before writing Expo API calls.

## Architecture

### Auth — two entirely separate systems sharing one token/session layer
`backend/src/routes/auth.js` implements two parallel auth flows that both funnel into the same `backend/src/services/auth/tokens.js`:

- **Admin**: email + bcrypt password → TOTP MFA (speakeasy). First sign-in auto-generates a TOTP secret and returns an `otpauthUrl` to scan; the `pendingToken` (a short-lived JWT with `type: 'mfa_pending'`) gates the MFA step. `123456` is a hardcoded universal MFA bypass in `verify-mfa` (all environments — not gated by `NODE_ENV`).
- **Customer**: phone number (`+233XXXXXXXXX`) + SMS OTP (via `backend/src/services/sms/arkesel.js`, falls back to console-logging the code when `ARKESEL_API_KEY` is blank) → optional 4-digit PIN → optional biometric (mobile only, client-side via `expo-local-authentication`, not a server concept). `123456` is also a universal OTP bypass in `backend/src/services/auth/otp.js`.

**Single active session per customer**: `issueRefreshToken({ forCustomer: true })` in `tokens.js` deletes *all* existing DB sessions and Redis session keys for that user before creating a new one. `authenticate` middleware checks `isSessionActive(sid)` on every request for `type: 'user'` tokens, so a second device logging in immediately invalidates the first device's access token (surfaces as "Session replaced by a new login").

Access tokens are short-lived JWTs (`JWT_SECRET`, default 15m) carried in `Authorization: Bearer`. Refresh tokens are random 48-byte hex, stored hashed (SHA-256) in the `sessions` table; delivered via httpOnly cookie for the web app and via response body (stored in `localStorage`/`expo-secure-store`) for mobile, since mobile can't use cookies. `POST /api/auth/refresh` accepts either.

### Risk engine — transparent rule scorer, not a trained model
`backend/src/services/risk/scorer.js` runs 6 independent rules against a prospective transaction (late night, amount > ₵2000, new recipient, amount > 3× 30-day average, >3 tx in 10 min, recipient flagged in a recent alert). Points sum and clamp to 0–100; thresholds are `< 30 safe`, `30–69 review`, `≥ 70 blocked` (see `REVIEW_THRESHOLD`/`BLOCK_THRESHOLD` constants duplicated in `backend/src/routes/transactions.js`). Every fired rule's reason string is persisted to `transactions.metadata.reasons` — this auditability is a deliberate design choice for the research thesis, not incidental. `POST /api/transactions/preview` runs the same scorer without persisting, used by the mobile app to decide whether to challenge with biometric before submission (see `mobile/src/utils/fraudSimulator.js` / `biometricReason()` logic referenced from `SendMoneyScreen.js`).

Blocked transactions are recorded but money never moves; `review` and `completed` transactions do move balances immediately (see the `withTransaction` block in `transactions.js` — balance updates, trust score adjustment, alert creation, and the transaction insert all happen atomically). An admin overturning a `review` transaction to `blocked` via `PUT /api/transactions/:id/status` reverses the balance movement.

### Blockchain ledger — hash chain in Postgres, not a real blockchain
`backend/src/services/blockchain/ledger.js`: each entry's hash is `SHA-256(previousHash|eventType|payloadJSON)`. `payload` is stored as `TEXT`, not `JSONB`, specifically so Postgres never reorders JSON keys — the exact serialized string must be reproducible for `verifyChain()` to recompute matching hashes. `appendEntry` takes a `SELECT ... FOR UPDATE` row lock on the latest entry inside a transaction to prevent two concurrent appends from reading the same `previousHash`. Entries are logged for successful admin sign-ins and every transaction. `backend/src/jobs/verifyLedger.js` runs `verifyChain()` periodically and raises a critical alert on tamper detection (mismatch or broken link).

### Live updates
`backend/src/services/events/bus.js` is an in-process pub/sub; `GET /api/events/stream` (admin-only) exposes it as SSE. `transactions.js` publishes `transaction.new` / `alert.new` / `transaction.status_changed` after each relevant DB write — the admin dashboard's Live Transactions page consumes this stream directly rather than polling.

### Frontend request layer resilience
Both `src/api/client.js` (admin/web) and `mobile/src/api/client.js` wrap every request in `withRetry` (2 attempts, skips retry on `AuthError`) → `withTimeout` (8s) → a circuit breaker (`createCircuitBreaker`, opens after 5 failures, resets after 30s) — see `src/utils/async.js`. A 401 triggers exactly one silent `POST /api/auth/refresh` before failing. The access token is held in memory only (never `localStorage`) specifically to keep it out of reach of XSS; only the refresh token persists client-side.

### Two frontends sharing one React app
The root `src/App.jsx` mounts both the admin dashboard (`/dashboard/*`, gated by `PrivateRoute` + `AuthContext`) and the customer web portal (`/app/*`, gated by `CustomerPrivateRoute` + `CustomerAuthContext`) in a single Vite build — they are different route trees with separate auth contexts, not separate apps. The customer web portal (`src/pages/customer/*`) and the Expo mobile app (`mobile/src/screens/*`) are independent implementations of the same customer-facing flows against the same backend API — changes to customer-facing behavior typically need to be made in both places.

### Database
Schema lives in `backend/src/db/migrations/*.sql`, run in filename order by `backend/src/db/migrate.js` (no migration framework — plain sequential SQL files). Core tables: `admins`, `users` (customers), `transactions`, `alerts`, `blockchain_entries` (append-only), `otp_codes`, `sessions`, `settings` (generic JSONB key-value, backs `/api/ai-config` and `/api/settings`), `risk_models`, `fraud_scenarios`.

## Demo/seed credentials

Demo admin and customer credentials are seeded by `backend/src/db/seed.js`. They are intentionally **not** written into README/DEPLOYMENT.md or committed docs since this repo is public — check `seed.js` directly or ask the team. Note the `123456` MFA/OTP bypass (see Auth section above) is currently active in all environments, not just dev/test.
