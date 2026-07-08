# FraudShield — AI-Powered Mobile Money Fraud Detection Platform

A research project at the **University of Ghana** investigating how layered defences — AI risk scoring, blockchain audit trails, and multi-factor authentication — reduce fraud in Ghana's mobile money ecosystem.

Mobile money fraud losses in Ghana reached **GH₵14.94M in early 2025**. FraudShield combines three pillars to detect and prevent attacks in real time:

---

## Live App

| Portal | URL |
|---|---|
| Customer Portal (mobile web) | https://fraud-shield-zeta.vercel.app/app |
| Admin Dashboard | https://fraud-shield-zeta.vercel.app/dashboard |

**Demo credentials:** request access from the project team — not published here since this repo is public.

---

| Pillar | Implementation |
|--------|---------------|
| 🤖 AI Risk Engine | Rule-based scorer with 6 explainable rules; every decision is auditable |
| 🔗 Blockchain Ledger | SHA-256 hash-chained audit trail stored in PostgreSQL; tamper-evident |
| 🔒 Multi-Factor Auth | Admin: password + TOTP · Customer: phone + SMS OTP + PIN + biometric |

---

## Repository Structure

```
fraud-shield/
├── backend/                    # Node.js / Express API
│   ├── src/
│   │   ├── routes/             # auth, transactions, alerts, risk, blockchain,
│   │   │                       # customers, admins, settings, events
│   │   ├── services/           # auth (password, tokens, MFA, OTP, PIN),
│   │   │                       # blockchain ledger, SSE event bus
│   │   ├── middleware/         # authenticate, rateLimit
│   │   ├── db/                 # PostgreSQL pool, Redis client, migrations, seed
│   │   └── jobs/               # verifyLedger (integrity check every 10 min)
│   ├── tests/                  # Vitest integration tests (53 passing)
│   └── docker-compose.yml      # PostgreSQL 16 + Redis 7
├── src/                        # Web admin dashboard (React + Vite)
│   ├── api/                    # API client (auto-refresh, circuit breaker, retry)
│   ├── context/                # AuthContext (session restore, signIn, verifyMfa)
│   ├── hooks/                  # useApi data-fetching hook
│   ├── pages/                  # 10 dashboard pages, all wired to live backend
│   ├── components/             # DashboardLayout, PrivateRoute, ErrorBoundary,
│   │                           # Loading, EmptyState, Sidebar, Navbar
│   ├── errors/                 # AppError, AuthError, NetworkError, ValidationError
│   ├── schemas/                # Zod validation schemas
│   └── utils/                  # Logger, withTimeout, withRetry, createCircuitBreaker
└── mobile/                     # React Native + Expo SDK 54
    └── src/
        ├── api/                # Fetch client with expo-secure-store token
        ├── context/            # AuthContext (OTP, PIN, biometric, session restore)
        ├── hooks/              # useApi hook
        ├── navigation/         # AppNavigator, AuthNavigator, MainNavigator
        └── screens/
            ├── auth/           # Splash, SignIn, OTP, SetPin, Biometric
            └── main/           # Home, SendMoney, Transactions, TransactionDetail,
                                # Profile
```

---

## Running Locally

### Prerequisites

- Node.js ≥ 20
- Docker Desktop (or a running PostgreSQL 16 + Redis 7)

### 1 — Start the backend

```bash
cd backend
cp .env.example .env          # fill in JWT secrets (generate below)
docker compose up -d          # start PostgreSQL + Redis
npm install
npm run db:migrate            # create all tables
npm run db:seed               # insert demo admin + 12 seeded customers
npm run dev                   # API at http://localhost:3000
```

Generate strong JWT secrets (run twice, use different values):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Verify the backend is healthy:

```bash
curl http://localhost:3000/api/health
# {"status":"healthy","checks":{"api":"ok","db":"ok","redis":"ok"}}
```

### 2 — Start the web dashboard

```bash
# from repo root
cp .env.example .env          # set VITE_API_URL=http://localhost:3000
npm install
npm run dev                   # http://localhost:5173
```

**Demo admin sign-in:**
1. `/signin` → sign in with the seeded admin credentials (see `backend/src/db/seed.js` or request from the team)
2. Enter the MFA code from your authenticator app (or the dev bypass code, non-prod only)
3. Session persists across page refreshes via `localStorage`

### 3 — Run the mobile app

```bash
cd mobile
npm install
```

Edit `mobile/src/config.js` — set `API_URL` to your machine's LAN IP (not `localhost`):

```bash
ipconfig          # Windows — IPv4 under your WiFi adapter
ifconfig          # macOS / Linux
```

```bash
npx expo start    # scan QR in Expo Go on your phone
```

**Demo customer sign-in:**
- Use one of the seeded customer phone numbers (see `backend/src/db/seed.js` or request from the team)
- OTP prints to the backend terminal in dev mode
- Set a 4-digit PIN on first sign-in; subsequent logins go straight to PIN screen
- Biometric (fingerprint / Face ID) offered as a second factor on supported devices

---

## Backend API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | — | DB + Redis health check |
| POST | `/api/auth/admin/signin` | — | Email + password → pending token |
| POST | `/api/auth/admin/verify-mfa` | — | TOTP → access + refresh tokens |
| POST | `/api/auth/customer/request-otp` | — | Send OTP via SMS |
| POST | `/api/auth/customer/verify-otp` | — | Verify OTP → tokens + `pinSetup` |
| POST | `/api/auth/customer/set-pin` | user | Set PIN after first OTP |
| POST | `/api/auth/customer/verify-pin` | — | PIN-only sign-in |
| POST | `/api/auth/refresh` | — | Rotate access token (cookie or body) |
| POST | `/api/auth/signout` | — | Revoke session |
| GET | `/api/auth/me` | any | Current user/admin profile |
| GET | `/api/transactions` | any | Paginated list (customers see own only) |
| POST | `/api/transactions` | user | Submit transaction (scored + recorded) |
| POST | `/api/transactions/preview` | user | Score without persisting (mobile AI check) |
| GET/PUT | `/api/transactions/:id` | any | Detail / admin status update |
| GET | `/api/alerts` | any | Paginated alerts |
| PUT | `/api/alerts/:id/read` | any | Mark as read |
| PUT | `/api/alerts/:id/resolve` | admin | Resolve alert |
| GET | `/api/risk/summary` | admin | KPI cards (24 h counts, avg risk) |
| GET | `/api/risk/analytics` | admin | Chart data (byDay, byCategory) |
| GET | `/api/blockchain` | admin | Paginated ledger entries |
| GET | `/api/blockchain/verify` | admin | Chain integrity check |
| GET | `/api/customers` | admin | Paginated customer list + search |
| GET/POST/PUT/DELETE | `/api/admins` | admin | Admin CRUD (super_admin for writes) |
| GET/PUT | `/api/ai-config` | admin | AI toggle settings |
| GET/PUT | `/api/settings` | admin | System settings |
| GET | `/api/events/stream` | admin | SSE live transaction feed |

---

## AI Risk Engine

`backend/src/services/risk/scorer.js` — six rules, each transparent and auditable:

| Rule key | Points | When it fires |
|----------|--------|---------------|
| `late_night` | 25 | Between 22:00–05:00 UTC |
| `amount_above_2000_ghs` | 20 | Amount > GHS 2,000 |
| `new_recipient` | 20 | No prior transaction to this phone |
| `amount_3x_avg` | 15 | Amount > 3× sender's 30-day rolling average |
| `rapid_succession` | 15 | > 3 transactions in the last 10 minutes |
| `recipient_flagged` | 50 | Recipient appears in open alerts |

**Thresholds:** 0–29 = Safe · 30–69 = Review · 70+ = Blocked

Triggered rules are stored in `transactions.metadata.reasons` so every decision is fully auditable.

### Adaptive Biometric MFA

The mobile app gates high-risk transactions behind a fingerprint/Face ID challenge before submission. The `biometricReason()` function triggers when any of:

- Risk score ≥ 70 → "High fraud risk score detected"
- Amount ≥ GHS 1,000 → "Large transfer requires identity verification"
- Any of `recipient_flagged`, `rapid_succession`, `amount_above_2000_ghs` rules fire
- Score ≥ 50 and amount ≥ GHS 300 → "Elevated risk on this transfer"

Clean low-risk transactions proceed without a biometric challenge.

---

## Blockchain Ledger

Each entry:

```
hash[0] = SHA-256("genesis" | eventType | payloadJson)
hash[n] = SHA-256(hash[n-1] | eventType | payloadJson)
```

Events logged: every transaction, every successful admin sign-in.

`GET /api/blockchain/verify` walks the entire chain and returns `{ ok: true }` or `{ ok: false, badAt: id, reason: "hash_mismatch" }`. A background job runs every 10 minutes and raises a critical alert if tampering is detected.

---

## Web Dashboard

All pages are wired to the live backend with no hardcoded mock data:

| Page | Data source |
|------|------------|
| Dashboard | alerts + recent transactions + admin profile |
| Live Transactions | `/api/transactions` + SSE stream (new rows appear live) |
| Risk Analytics | `/api/risk/analytics` → Recharts byDay + byCategory charts |
| Alerts & Incidents | `/api/alerts` with Mark Read + Resolve buttons |
| Blockchain Ledger | `/api/blockchain` + chain integrity banner |
| Customer Directory | `/api/customers` with 300 ms debounced search |
| Customer Profile | per-customer transactions, alerts, trust score |
| AI Configuration | `/api/ai-config` toggles — each flip persists to DB immediately |
| System Settings | `/api/settings` + live admin count + role info |
| Administrators | `/api/admins` with role badges + last-login times |

### Sidebar

- Collapsible via the **×** button next to the logo; re-expands via the hamburger when collapsed
- User avatar at the bottom shows the signed-in admin's name and role; click the logout icon to sign out
- FraudShield logo always navigates back to `/dashboard`

### Session persistence

The admin refresh token is stored in `localStorage` and sent in the request body on page load. This means refreshing the page or navigating directly to any `/dashboard/*` URL restores the session without redirecting to sign-in.

---

## Mobile App

### Auth flow

```
Splash
  │
  ├── Returning user (phone stored) ──► PIN numpad ──► BiometricScreen ──► Home
  │       ├── "Use OTP instead"    ──► OTPScreen ──► BiometricScreen ──► Home
  │       └── "Different account"  ──► clears stored phone → phone entry
  │
  └── New user ──► Phone entry ──► OTPScreen ──► [SetPinScreen, first time]
                                ──► BiometricScreen ──► Home
```

- Phone number and PIN are stored in `expo-secure-store` after first login
- Subsequent logins go straight to PIN screen (or fingerprint for returning users)
- Biometric can be used as quick login (reads stored credentials) or as post-PIN MFA

### Main screens (all real data)

| Screen | What's wired |
|--------|-------------|
| Home | Balance + trust score from auth; recent transactions + alerts; pull-to-refresh; tappable transaction rows |
| Send Money | Preview calls `/api/transactions/preview` → live AI score + reasons; adaptive biometric gate for high-risk; posts real transaction with blockchain hash |
| Transactions | Full list with status filters + pull-to-refresh |
| Transaction Detail | AI reasons, risk score, blockchain hash with Copy button |
| Profile | Real name, balance, transaction count; all menu items wired |

---

## Database Schema

Migrations in `backend/src/db/migrations/`:

| Table | Purpose |
|-------|---------|
| `admins` | Admin accounts (bcrypt password, TOTP secret) |
| `users` | Customers (bcrypt PIN, trust score, balance) |
| `transactions` | All transactions with risk score + blockchain hash |
| `alerts` | Fraud alerts linked to transactions |
| `blockchain_entries` | Immutable hash-chained audit log |
| `sessions` | Refresh tokens (stored hashed, with expiry) |
| `otp_codes` | SMS OTP records (hashed, TTL via Redis) |
| `settings` | AI config + system settings (JSONB key-value) |

---

## Tests

```bash
# Backend — 53 integration tests
cd backend && npm test

# Frontend
npm test                    # run once
npm run test:coverage       # v8 coverage report
```

Frontend test coverage: **96% statements / 89% branches / 93% functions**.

Backend tests cover: admin auth (TOTP flow, rate limiting), customer auth (OTP, PIN, session), transactions (all 6 risk rules, blockchain integration), blockchain integrity (append, verify, tamper detection).

---

## CI/CD

GitHub Actions on every push to `main`/`develop`:

| Job | Steps |
|-----|-------|
| `web` | lint → test + coverage → build |
| `backend` | npm ci → vitest against live Postgres + Redis service containers |
| `mobile` | npm ci → test --if-present |

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full guide.

### Quick Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full step-by-step guide covering both local bare-metal setup and cloud deployment (Vercel + Railway).

---

## Sprint Progress

| Sprint | Description | Status |
|--------|-------------|--------|
| 0 | Team setup, GitHub workflow, local environment | ✅ |
| 1 | Backend skeleton, DB schema, health endpoint | ✅ |
| 2 | Admin auth — email, bcrypt, TOTP, JWT, rate limiting | ✅ |
| 3 | Customer auth — phone, SMS OTP, PIN | ✅ |
| 4 | Transactions, rule-based AI risk engine, alerts, analytics | ✅ |
| 5 | Live blockchain audit trail + SSE real-time feed | ✅ |
| 6 | Web: API client, AuthContext, PrivateRoute | ✅ |
| 7 | Web: Dashboard, LiveTransactions, RiskAnalytics, Alerts | ✅ |
| 8 | Web: all remaining pages + new backend endpoints | ✅ |
| 9 | Mobile: auth — OTP, PIN, biometric, session restore | ✅ |
| 10 | Mobile: Home, SendMoney, Transactions, Profile | ✅ |
| 11 | Mobile: returning-user flow, adaptive biometric MFA, all buttons wired | ✅ |
| 12 | Admin portal audit: all pages verified, blockchain integrity fixed, session persistence | ✅ |
| 13 | Deploy: Railway (backend) + Vercel (web) — live at fraud-shield-zeta.vercel.app | ✅ |

---

## Team

| Name | Role |
|------|------|
| Evans Adusu | Project Lead |
| Group 6 | University of Ghana |

---

## Research Context

University of Ghana. The platform investigates how composite security (AI + blockchain + MFA) compares to single-layer defences against SIM swap, phishing, fake reversal, and account-takeover fraud in Ghana's mobile money sector.
