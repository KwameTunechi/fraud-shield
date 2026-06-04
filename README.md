# FraudShield — AI-Powered Mobile Money Fraud Detection Platform

A research project at the **University of Ghana** (CSIT 621 — Emerging Technologies for Business I) investigating how layered defences — AI risk scoring, blockchain audit trails, and multi-factor authentication — reduce fraud in Ghana's mobile money ecosystem.

Mobile money fraud losses in Ghana reached **GH₵14.94M in early 2025**. FraudShield combines three pillars to detect and prevent attacks in real time:

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
│   ├── pages/                  # 11 dashboard pages, all wired to live backend
│   ├── components/             # DashboardLayout, PrivateRoute, ErrorBoundary,
│   │                           # Loading, EmptyState, Sidebar, Navbar
│   ├── errors/                 # AppError, AuthError, NetworkError, ValidationError …
│   ├── schemas/                # Zod validation schemas
│   └── utils/                  # Logger, withTimeout, withRetry, createCircuitBreaker
└── mobile/                     # React Native + Expo SDK 56
    └── src/
        ├── api/                # Fetch client with expo-secure-store token
        ├── context/            # AuthContext (OTP, PIN, biometric, session restore)
        ├── hooks/              # useApi hook
        ├── navigation/         # AppNavigator, AuthNavigator, MainNavigator
        └── screens/
            ├── auth/           # Splash, SignIn, OTP, SetPin, Biometric
            └── main/           # Home, SendMoney, Transactions, TransactionDetail,
                                # Profile, Security, FraudScenario
```

---

## Running Locally

### Prerequisites

- Node.js ≥ 20
- Docker Desktop

### 1 — Start the backend

```bash
cd backend
cp .env.example .env          # fill in JWT secrets (generate below)
docker compose up -d          # start PostgreSQL + Redis
npm install
npm run db:migrate            # create all tables
npm run db:seed               # insert demo admin + customer
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
npm install
npm run dev                   # http://localhost:5173
```

**Demo admin sign-in:**
1. `/signin` → `admin@fraudshield.test` / `Password123!`
2. First login shows an `otpauth://` URL — paste it into any QR generator and scan with Google Authenticator, or add manually via "Enter setup key"
3. Enter the 6-digit TOTP code → dashboard

### 3 — Run the mobile app

```bash
cd mobile
npm install
```

Edit `mobile/src/config.js` and replace the placeholder IP with your laptop's LAN IP (not `localhost` — the phone is a different device):

```bash
ipconfig          # Windows — look for IPv4 under your WiFi adapter
ifconfig          # macOS / Linux
```

```bash
npx expo start    # scan QR in Expo Go on your phone
```

**Demo customer sign-in:**
- Enter any Ghana mobile number, e.g. `0244000001`
- The OTP prints to the backend terminal in dev mode
- Set a 4-digit PIN on first sign-in
- Biometric is offered on phones that support it

---

## Backend API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | — | DB + Redis health check |
| POST | `/api/auth/admin/signin` | — | Email + password → pending token |
| POST | `/api/auth/admin/verify-mfa` | — | TOTP → access token + cookie |
| POST | `/api/auth/customer/request-otp` | — | Send OTP via SMS |
| POST | `/api/auth/customer/verify-otp` | — | Verify OTP → tokens + `pinSetup` |
| POST | `/api/auth/customer/set-pin` | user | Set PIN after first OTP |
| POST | `/api/auth/customer/verify-pin` | — | PIN-only sign-in |
| POST | `/api/auth/refresh` | — | Rotate access token |
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

All 11 pages are wired to the live backend with no hardcoded mock data:

| Page | Data source |
|------|------------|
| Dashboard | alerts + recent transactions + auth context (admin name/role) |
| Live Transactions | `/api/transactions` + SSE stream (new rows appear without refresh) |
| Risk Analytics | `/api/risk/analytics` byDay + byCategory → real Recharts data |
| Alerts & Incidents | `/api/alerts` with Mark Read + Resolve buttons |
| Blockchain Ledger | `/api/blockchain` + chain integrity banner |
| Customer Directory | `/api/customers` with 300 ms debounced search |
| AI Configuration | `/api/ai-config` toggles — each flip persists to DB immediately |
| System Settings | `/api/settings` + real admin info from auth context |
| Administrators | `/api/admins` with role badges + last-login times |

---

## Mobile App

### Auth flow

```
Splash ──► SignIn (phone number)
               │
               ├── "Get OTP"  ──► OTPScreen ──► [SetPinScreen, first time] ──► BiometricScreen ──► Home
               │
               └── "Use PIN"  ──► PIN numpad ──► BiometricScreen ──► Home
```

Refresh token stored in `expo-secure-store`. On next app open the session is restored automatically — no re-authentication.

### Main screens (all real data)

| Screen | What's wired |
|--------|-------------|
| Home | Balance + trust score from auth; recent transactions + alerts; pull-to-refresh |
| Send Money | Step 2 calls `/api/transactions/preview` → real AI score + plain-English reasons; step 3 posts the real transaction; result shows reference + blockchain hash |
| Transactions | Full list with status filters + pull-to-refresh |
| Transaction Detail | Fetches by ID; shows AI reasons, blockchain hash with Copy button |
| Profile | Real name, balance, transaction count; sign out clears secure storage |

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
| `risk_models` | Risk model config |
| `fraud_scenarios` | Simulator scenario definitions |
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
| 11 | Deploy: Railway (backend) + Vercel (web) + EAS (Android APK) | ⬜ |
| 12 | Hardening: Sentry, Logtail, UptimeRobot, security audit | ⬜ |

---

## Team

| Name | Role |
|------|------|
| Evans Adusu | Project Lead |
| Group 6 | CSIT 621 — University of Ghana |

---

## Research Context

CSIT 621 — Emerging Technologies for Business I, University of Ghana. The platform investigates how composite security (AI + blockchain + MFA) compares to single-layer defences against SIM swap, phishing, fake reversal, and account-takeover fraud in Ghana's mobile money sector.

Live URLs and APK download will be added here after Sprint 11.
