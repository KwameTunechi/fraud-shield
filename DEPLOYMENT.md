# FraudShield — Complete Deployment Guide

This guide is written for Claude (or any developer) to set up and run the entire FraudShield platform from scratch, with zero prior context. Follow it top-to-bottom and the backend API, web admin dashboard, and mobile app will all be running with full functionality.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      FraudShield Platform                    │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Mobile App  │    │  Web Admin   │    │   Backend    │  │
│  │ React Native │    │ React + Vite │    │ Node/Express │  │
│  │  Expo SDK 54 │    │  (root dir)  │    │ (backend/)   │  │
│  │  (mobile/)   │    │              │    │              │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
│         │                  │                    │           │
│         └──────────────────┴────────────────────┘          │
│                          REST API + SSE                      │
│                    (JWT auth, dual-channel)                  │
│                                                             │
│                    ┌────────────────┐                        │
│                    │  PostgreSQL 16 │                        │
│                    │    Redis 7     │                        │
│                    └────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

**Repo:** `git@github.com:KwameTunechi/fraud-shield.git`  
**Branch:** `feature/evans-sprint11-deployment`  
**Local path (this machine):** `/home/ubuntu/fraud-shield`

---

## Part 0 — Understand the Project Structure

```
fraud-shield/
├── backend/                   # Node.js/Express API server
│   ├── src/
│   │   ├── server.js          # Entry point — starts Express + PG + Redis
│   │   ├── app.js             # Routes, middleware, CORS, Helmet
│   │   ├── routes/            # auth, transactions, customers, alerts, risk, blockchain, settings, events, admins
│   │   ├── middleware/        # authenticate.js (JWT), requireAdmin
│   │   ├── services/
│   │   │   ├── risk/scorer.js # Rule-based AI fraud scorer (6 rules, 0–100 score)
│   │   │   ├── blockchain/    # Immutable SHA-256 chained ledger
│   │   │   └── events/bus.js  # SSE pub/sub (live dashboard updates)
│   │   ├── db/
│   │   │   ├── pool.js        # PostgreSQL connection pool (DATABASE_URL)
│   │   │   ├── redis.js       # Redis connection (REDIS_URL)
│   │   │   ├── migrate.js     # Runs SQL migration files
│   │   │   ├── seed.js        # Inserts demo admin + 12 customers + 56 transactions
│   │   │   └── migrations/
│   │   │       ├── 001_initial_schema.sql
│   │   │       └── 002_settings.sql
│   │   └── jobs/
│   │       └── verifyLedger.js # Runs blockchain integrity check every 10 min
│   ├── docker-compose.yml     # Local Postgres 16 + Redis 7
│   ├── .env.example           # Template — copy to .env and fill secrets
│   └── package.json
│
├── src/                       # Web admin dashboard (React/Vite SPA)
│   ├── main.jsx               # Entry point
│   ├── App.jsx                # Router + auth guards
│   ├── context/AuthContext.jsx # Admin JWT session management
│   ├── api/client.js          # HTTP client, token refresh (localStorage + cookie)
│   ├── hooks/useApi.js        # Data-fetching hook with reload
│   └── pages/
│       ├── LandingPage.jsx    # Public marketing page
│       ├── SignIn.jsx         # Email + password
│       ├── TwoFactor.jsx      # TOTP MFA (dev bypass: 123456)
│       ├── Dashboard.jsx      # Main overview
│       ├── LiveTransactions.jsx  # SSE real-time feed
│       ├── RiskAnalytics.jsx  # Charts (7d/30d/90d range)
│       ├── AlertsIncidents.jsx
│       ├── BlockchainLedger.jsx
│       ├── CustomerDirectory.jsx
│       ├── CustomerProfile.jsx
│       ├── Administrators.jsx
│       ├── AIConfiguration.jsx
│       └── SystemSettings.jsx
│
├── mobile/                    # React Native / Expo SDK 54 app
│   ├── src/
│   │   ├── config.js          # API_URL — DEV uses tunnel, PROD uses EXPO_PUBLIC_API_URL
│   │   ├── context/AuthContext.js  # Customer JWT + SecureStore + biometric
│   │   ├── api/client.js      # Mobile HTTP client with SecureStore refresh
│   │   ├── navigation/        # AppNavigator → AuthNavigator | MainNavigator
│   │   └── screens/
│   │       ├── auth/          # SplashScreen, SignInScreen, OTPScreen, SetPinScreen, BiometricScreen
│   │       └── main/          # HomeScreen, SendMoneyScreen, TransactionsScreen,
│   │                          # TransactionDetailScreen, SecurityScreen, FraudScenarioScreen, ProfileScreen
│   ├── assets/                # App icons, splash
│   ├── app.json               # Expo config (package: com.fraudshield.mobile)
│   ├── eas.json               # EAS build profiles (preview=APK, production=AAB)
│   └── package.json
│
├── index.html                 # Vite HTML entry
├── vite.config.js
└── package.json               # Web dashboard dependencies
```

---

## Part 1 — Local Development Setup

This is the recommended path for working on the project.

### 1.1 — Clone the Repository

```bash
git clone git@github.com:KwameTunechi/fraud-shield.git
cd fraud-shield
git checkout feature/evans-sprint11-deployment
```

### 1.2 — Start Databases (Docker)

The backend needs PostgreSQL 16 and Redis 7.

```bash
cd backend
docker compose up -d
```

This starts:
- `fraudshield-postgres` on port **5432**
- `fraudshield-redis` on port **6379**

Verify both containers are running:

```bash
docker compose ps
```

Both should show `Up`. If Docker isn't installed:
```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER  # then log out and back in
```

### 1.3 — Configure Backend Environment

```bash
# still in /fraud-shield/backend
cp .env.example .env
```

Edit `.env` and fill in the two JWT secrets. Leave everything else as-is for local dev:

```bash
# Generate both secrets (run each separately, copy output into .env)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Final `.env` should look like:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://fraudshield:dev_password_change_in_prod@localhost:5432/fraudshield_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=<64-char hex from above>
JWT_REFRESH_SECRET=<different 64-char hex from above>
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
BCRYPT_ROUNDS=12
CORS_ORIGINS=http://localhost:5173
ARKESEL_API_KEY=
```

> **ARKESEL_API_KEY**: Leave blank in dev. OTP codes are printed to the backend console instead of sending real SMS. Look for `[DEV] OTP for +233XXXXXXXXX: 123456` in the backend logs.

### 1.4 — Install Backend Dependencies & Run Migrations

```bash
# in backend/
npm install
npm run db:migrate   # creates all tables
npm run db:seed      # inserts demo data (admin + 12 customers + 56 transactions)
```

Seed output confirms:
```
✓ Admin: admin@fraudshield.test / Password123!
✓ 12 customers seeded (all PIN: 1234)
✓ 56 transactions seeded
✓ Blockchain ledger: 56 entries
✓ 6 alerts generated
```

### 1.5 — Start the Backend Server

```bash
# in backend/
npm run dev
```

Expected output:
```
PostgreSQL connected
Redis connected
FraudShield API running on http://localhost:3000
Ledger integrity verifier started (interval: 10 min)
```

Verify it's healthy:
```bash
curl http://localhost:3000/api/health
# → {"status":"healthy","checks":{"api":"ok","db":"ok","redis":"ok"},"timestamp":"..."}
```

### 1.6 — Start the Web Admin Dashboard

Open a new terminal:

```bash
# in fraud-shield/ (root)
npm install
npm run dev
```

The dashboard runs on **http://localhost:5173**.

Sign in with:
- **Email:** `admin@fraudshield.test`
- **Password:** `Password123!`
- **MFA code:** `123456` (dev bypass — any 6-digit code works in development)

### 1.7 — Start the Mobile App

Open another terminal:

```bash
cd mobile
npm install --legacy-peer-deps   # some packages have peer dep conflicts
npm start                        # runs: expo start
```

> **Important:** The mobile app uses a tunnel URL in dev, set in `mobile/src/config.js`:
> ```js
> const DEV_API_URL = 'https://roots-normally-forward-executed.trycloudflare.com'
> ```
> This is a Cloudflare tunnel pointing to the local backend. If the tunnel is stale/expired, either:
> - Update `DEV_API_URL` to your machine's LAN IP: `http://192.168.x.x:3000`
> - Or start a fresh tunnel: `npx cloudflared tunnel --url http://localhost:3000`

Expo will show a QR code. Scan with:
- **Android:** Expo Go app → Scan QR
- **iOS:** Camera app → tap the banner

Mobile test credentials:
- **Phone:** Any number in `+233244100001` to `+233244100012`
- **PIN:** `1234`
- **OTP:** Check backend console for the printed OTP code

---

## Part 2 — Auth Flows (Critical to Understand)

### Admin Auth (Web Dashboard)

```
POST /api/auth/admin/signin       → { pendingToken }  (password verified)
POST /api/auth/admin/verify-mfa   → { accessToken, refreshToken, admin }
```

- Access token: JWT, 15-minute lifespan, stored in memory only
- Refresh token: returned in JSON body AND httpOnly cookie
- Web frontend stores refresh in `localStorage['fs_admin_refresh']` for cross-origin survival
- Mid-session refresh: `POST /api/auth/refresh` with `{ refreshToken }` in body

### Customer Auth (Mobile App)

```
POST /api/auth/customer/request-otp  → { status: 'ok' }  (OTP printed to console in dev)
POST /api/auth/customer/verify-otp   → { accessToken, refreshToken, user, pinSetup }
  pinSetup=true  → new user, navigate to SetPin screen
  pinSetup=false → existing user, navigate to Biometric screen

POST /api/auth/customer/set-pin      → { status: 'ok' }  (sets pin_hash + mfa_enabled=true)
POST /api/auth/customer/verify-pin   → { accessToken, refreshToken, user }
GET  /api/auth/me                    → { id, phone_number, full_name, balance, trust_score, mfa_enabled }
```

Mobile refresh tokens are stored in Expo SecureStore (iOS Keychain / Android Keystore).

### Common Auth Endpoint

```
POST /api/auth/refresh    → { accessToken, refreshToken }
POST /api/auth/signout    → { status: 'ok' }
```

---

## Part 3 — Risk Scoring Logic

Every transaction runs through `backend/src/services/risk/scorer.js`.

| Rule | Points | Trigger |
|------|--------|---------|
| `late_night` | 20 | Transaction between 22:00–05:00 |
| `amount_above_2000_ghs` | 30 | Amount > GHS 2,000 |
| `new_recipient` | 25 | No prior transaction to this phone number |
| `amount_3x_rolling_avg` | 25 | Amount > 3× sender's 30-day average |
| `rapid_succession` | 30 | 3+ transactions by same sender in past 5 minutes |
| `recipient_flagged_in_alerts` | 50 | Recipient phone has a fraud alert in the last 30 days |

**Score thresholds:**
- `0–29` → `completed` (safe)
- `30–69` → `review` (flagged for admin)
- `70+` → `blocked` (auto-rejected)

**Biometric MFA is triggered on mobile when:** score ≥ 70, amount ≥ GHS 1,000, recipient is flagged, or 3+ rapid transactions.

---

## Part 4 — Key API Endpoints Reference

All endpoints require `Authorization: Bearer <accessToken>` unless noted.

### Transactions
```
GET    /api/transactions              → { transactions, total }  (?limit=25&offset=0&status=completed|review|blocked)
GET    /api/transactions/:id          → transaction object
POST   /api/transactions/preview      → { riskScore, riskLevel, willBlock, reasons[] }
POST   /api/transactions              → { transaction }  (creates + scores + logs to blockchain)
PUT    /api/transactions/:id/status   → { ...transaction }  (admin only; fires SSE event)
```

### Customers (admin only)
```
GET    /api/customers                 → { customers[], total, stats }  (?search=&limit=25)
GET    /api/customers/:id             → { customer, transactions[], alerts[], stats }
```

### Risk & Analytics (admin only)
```
GET    /api/risk/summary              → { totalTransactions, blockedCount, reviewCount, avgRiskScore, alertCount }
GET    /api/risk/analytics?range=30d  → { byDay[], byCategory[], topReasons[] }  (range: 7d|30d|90d)
```

### Alerts
```
GET    /api/alerts?limit=50           → { alerts[] }
PUT    /api/alerts/:id/read           → alert object
PUT    /api/alerts/:id/resolve        → alert object  (admin only)
```

### Blockchain (admin only)
```
GET    /api/blockchain?limit=50       → { entries[], total }
GET    /api/blockchain/verify         → { ok: true|false, checkedCount, tamperedAt? }
```

### AI Config (admin only)
```
GET    /api/ai-config                 → { anomaly, blocking, behavior, predictive }
PUT    /api/ai-config/toggles         → same shape (updates settings table)
```

### System Settings (admin only)
```
GET    /api/settings                  → { mfaPolicy, sessionTimeout, emailAlerts, ... }
PUT    /api/settings                  → same shape (partial update)
```

### SSE (Server-Sent Events)
```
GET    /api/events/stream?token=<accessToken>
Events: transaction.new, transaction.status_changed
```

### Admins (admin only)
```
GET    /api/admins                    → { admins[] }
POST   /api/admins                    → { admin }  (super_admin only)
PUT    /api/admins/:id                → { admin }
DELETE /api/admins/:id                → 204  (super_admin only)
```

---

## Part 5 — Mobile App Screen Flow

```
SplashScreen (2.2s animated)
  └── SignInScreen
        ├── [Remembered phone] → PIN numpad + biometric option
        │     ├── Fingerprint/Face → loginWithBiometric() → HomeScreen
        │     ├── Enter PIN → loginWithPin() → BiometricScreen → HomeScreen
        │     └── "Use OTP" → OTPScreen → BiometricScreen → HomeScreen
        │
        └── [No remembered phone] → Enter phone number → requestOtp()
              └── OTPScreen (6-digit code)
                    ├── pinSetup=true  → SetPinScreen → BiometricScreen → HomeScreen
                    └── pinSetup=false → BiometricScreen → HomeScreen

HomeScreen (tab navigator)
  ├── Send Money → preview → confirm → success (updates balance via refreshUser())
  ├── Transactions tab → list → TransactionDetailScreen (risk analysis + blockchain hash)
  ├── Security tab → SecurityScreen → FraudScenarioScreen (animated fraud demos)
  └── Profile tab → stats + MFA status + sign out
```

---

## Part 6 — Cloudflare Tunnel Setup (for Mobile Dev)

The mobile app in dev mode needs to reach the backend over HTTPS (Expo's Metro bundler blocks plain HTTP on device). A Cloudflare tunnel creates a public HTTPS URL that forwards to localhost.

```bash
# Install cloudflared (one-time)
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Start tunnel pointing to local backend (backend must be running on :3000)
cloudflared tunnel --url http://localhost:3000
```

Cloudflare will print a URL like:
```
https://roots-normally-forward-executed.trycloudflare.com
```

Update `mobile/src/config.js`:
```js
const DEV_API_URL = 'https://<YOUR-TUNNEL-URL>.trycloudflare.com'
```

Also update the web admin if running cross-origin:
```js
// src/.env.local  (create this file)
VITE_API_URL=https://<YOUR-TUNNEL-URL>.trycloudflare.com
```

> Tunnel URLs change every time you restart `cloudflared`. Update `config.js` and restart Metro (`npm start`) after each tunnel restart.

**Current tunnel URLs (as of last session):**
- Backend: `https://roots-normally-forward-executed.trycloudflare.com`
- Frontend: `https://goes-myth-documentation-phillips.trycloudflare.com`

---

## Part 7 — Production Deployment

### 7.1 — Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → select `fraud-shield`
2. In service settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm ci`
   - **Start Command:** `npm start`
3. Add services: **+ New → Database → PostgreSQL** and **+ New → Database → Redis**
4. Set environment variables in **Variables** tab:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` |
| `JWT_SECRET` | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | (different secret, same method) |
| `JWT_EXPIRY` | `15m` |
| `JWT_REFRESH_EXPIRY` | `7d` |
| `BCRYPT_ROUNDS` | `12` |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `ARKESEL_API_KEY` | Your key from arkesel.com |
| `CORS_ORIGINS` | `https://YOUR-VERCEL-URL.vercel.app` |

5. After first deploy, open **Shell** in Railway and run:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
6. **Settings → Networking → Generate Domain** to get your Railway URL.
7. Test: `curl https://YOUR-RAILWAY-URL/api/health` → should return `{"status":"healthy",...}`

### 7.2 — Deploy Web Dashboard to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import `fraud-shield` repo
2. Build settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (leave as root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Environment variables:
   ```
   VITE_API_URL=https://YOUR-RAILWAY-URL.up.railway.app
   ```
4. Click **Deploy**. You'll get `https://fraud-shield-xyz.vercel.app`
5. Go back to Railway → update `CORS_ORIGINS` to your Vercel URL → Railway redeploys automatically

### 7.3 — Build Mobile APK (EAS)

1. Install EAS CLI and log in:
   ```bash
   npm install -g eas-cli
   eas login          # use your Expo account
   ```
2. Update `mobile/eas.json` with your Railway URL:
   ```json
   {
     "build": {
       "preview": {
         "env": {
           "EXPO_PUBLIC_API_URL": "https://YOUR-RAILWAY-URL.up.railway.app"
         }
       }
     }
   }
   ```
3. Build the APK:
   ```bash
   cd mobile
   eas build --profile preview --platform android
   ```
   This takes ~10–15 minutes. EAS provides a download URL when done.
4. Share the APK URL with testers. They download and install it directly.

---

## Part 8 — Demo Credentials Summary

### Admin Portal

| Field | Value |
|-------|-------|
| URL (local) | http://localhost:5173 |
| Email | `admin@fraudshield.test` |
| Password | `Password123!` |
| MFA Code | `123456` (dev bypass) |
| Role | `super_admin` |

### Mobile App (Test Customers)

All test customers use **PIN: `1234`**

| Phone | Name | Balance | Trust Score |
|-------|------|---------|-------------|
| `+233244100001` | Kwame Asante | ₵3,200 | 85% |
| `+233244100002` | Abena Osei | ₵1,800 | 72% |
| `+233244100003` | Kofi Mensah | ₵5,400 | 91% |
| `+233244100004` | Adwoa Boateng | ₵760 | 60% |
| `+233244100007` | Kojo Frimpong | ₵930 | 45% (flagged) |
| `+233244100010` | Kwesi Antwi | ₵1,120 | 55% (blocked txns) |

OTPs are printed to the backend console:
```
[DEV] OTP for +233244100001: 123456
```

---

## Part 9 — Common Issues & Fixes

### Backend won't start

**Symptom:** `Error: connect ECONNREFUSED 127.0.0.1:5432`  
**Fix:** Docker containers aren't running.
```bash
cd backend && docker compose up -d
```

**Symptom:** `JWT_SECRET is not defined` or similar  
**Fix:** `.env` file is missing or incomplete.
```bash
cp .env.example .env   # then add JWT secrets
```

**Symptom:** `relation "users" does not exist`  
**Fix:** Migrations haven't been run yet.
```bash
npm run db:migrate && npm run db:seed
```

### CORS errors in browser console

**Symptom:** `Access-Control-Allow-Origin` error when web dashboard calls API  
**Fix:** `CORS_ORIGINS` doesn't include the frontend URL.
```bash
# In backend/.env
CORS_ORIGINS=http://localhost:5173
# After changing .env, restart the backend
```

### Mobile app gets "Network request failed"

**Symptom:** All API calls fail on device/emulator  
**Cause:** `DEV_API_URL` in `mobile/src/config.js` is stale or points to localhost (device can't reach your laptop's localhost)  
**Fix:**
```bash
# Option A: start a fresh cloudflared tunnel and update config.js
cloudflared tunnel --url http://localhost:3000
# copy the new URL into mobile/src/config.js > DEV_API_URL

# Option B: use LAN IP
ipconfig getifaddr en0    # macOS
hostname -I               # Linux
# set DEV_API_URL = 'http://192.168.x.x:3000'
```

### OTP never arrives

**In dev:** No SMS is sent. Look for the OTP in the backend console output:
```
[DEV] OTP for +233244100001: 123456
```

**In production:** Make sure `ARKESEL_API_KEY` is set and has credit.

### Admin sign-in fails with "Invalid email or password"

The seed creates exactly one admin. If you re-ran the seed (it wipes and re-inserts), the credentials are reset to:
- Email: `admin@fraudshield.test`
- Password: `Password123!`

If you manually created an admin with a different password, use that instead.

### "relation does not exist" after re-seeding

The seed wipes all tables but not the schema. If you deleted tables manually:
```bash
npm run db:migrate   # re-creates tables
npm run db:seed      # re-inserts data
```

### React Native / Expo issues

**Symptom:** `Unable to resolve module 'expo-clipboard'`  
**Fix:** Install with legacy-peer-deps:
```bash
cd mobile
npm install --legacy-peer-deps
```

**Symptom:** Metro bundler stuck or showing wrong QR  
**Fix:**
```bash
npx expo start --clear   # clears Metro cache
```

**Symptom:** `Invariant Violation: "main" has not been registered`  
**Fix:** Check `mobile/index.js` — it must `import App` and call `registerRootComponent`.

---

## Part 10 — Making Changes and Pushing

The project follows a single long-lived feature branch for this sprint:

```bash
git checkout feature/evans-sprint11-deployment

# After making changes:
git add <files>
git commit -m "fix: description of what changed"
git push origin feature/evans-sprint11-deployment
```

**Rules:**
- Never commit `.env` files (gitignored, contain secrets)
- Always push after every commit
- Never commit `node_modules/`

---

## Part 11 — Complete Restart Checklist

Use this when starting a fresh session to get everything running:

```bash
# 1. Start databases
cd /home/ubuntu/fraud-shield/backend
docker compose up -d

# 2. Start backend (in one terminal)
npm run dev
# Wait for: "FraudShield API running on http://localhost:3000"

# 3. Start web dashboard (in another terminal)
cd /home/ubuntu/fraud-shield
npm run dev
# Opens on http://localhost:5173

# 4. Start mobile (in a third terminal)
cd /home/ubuntu/fraud-shield/mobile
npm start

# 5. (Optional) Start cloudflare tunnel if mobile needs HTTPS
cloudflared tunnel --url http://localhost:3000
# Copy the URL into mobile/src/config.js > DEV_API_URL
# Then restart Metro: Ctrl+C and npm start again

# 6. Verify everything is working
curl http://localhost:3000/api/health
# Expected: {"status":"healthy","checks":{"api":"ok","db":"ok","redis":"ok"}}
```

---

## Part 12 — Environment Variable Reference

### Backend (`backend/.env`)

| Variable | Required | Default (dev) | Description |
|----------|----------|---------------|-------------|
| `NODE_ENV` | No | `development` | Controls MFA bypass (dev allows 123456) |
| `PORT` | No | `3000` | HTTP port |
| `DATABASE_URL` | **Yes** | see .env.example | PostgreSQL connection string |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection string |
| `JWT_SECRET` | **Yes** | — | Signs access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | **Yes** | — | Signs refresh tokens (different from JWT_SECRET) |
| `JWT_EXPIRY` | No | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRY` | No | `7d` | Refresh token lifetime |
| `BCRYPT_ROUNDS` | No | `12` | Argon cost factor for password hashing |
| `CORS_ORIGINS` | No | `http://localhost:5173` | Comma-separated allowed origins |
| `ARKESEL_API_KEY` | No | blank | SMS provider (blank = OTP to console) |

### Web Dashboard (`.env.local` in root, or Vercel env)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | **Yes** | — | Full URL to backend API (no trailing slash) |

### Mobile (`mobile/src/config.js` in dev; `mobile/eas.json` for builds)

| Variable | Context | Description |
|----------|---------|-------------|
| `DEV_API_URL` | Dev only | Hardcoded in `config.js` — must be HTTPS tunnel or LAN IP |
| `EXPO_PUBLIC_API_URL` | EAS build | Set in `eas.json` per build profile |

---

## Part 13 — Cost & Infrastructure (Production)

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Railway (backend + Postgres + Redis) | Hobby ($5 credit) | ~$3–7 net |
| Vercel (web dashboard) | Hobby | Free |
| Expo EAS (APK builds) | Free tier (30 builds/month) | Free |
| Arkesel (SMS OTPs) | Pay-as-you-go | ~GH₵0.05/SMS |

**Set Railway spending limit:** Project Settings → Billing → Hard Limit: $5 USD
