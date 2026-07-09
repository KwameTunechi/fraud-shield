# FraudShield — Deployment Guide

Two supported deployment targets:

- **Bare Metal / Local** — run everything on your own machine or VM
- **Cloud** — Vercel (frontend) + Railway (backend, PostgreSQL, Redis)

---

## Live URLs

| Service | URL |
|---|---|
| Customer Portal (web mobile app) | https://fraud-shield-zeta.vercel.app/app |
| Admin Dashboard | https://fraud-shield-zeta.vercel.app/dashboard |
| Backend API | https://fraud-shield-production-59d6.up.railway.app |
| Health Check | https://fraud-shield-production-59d6.up.railway.app/api/health |

---

## Demo Credentials

Demo admin and customer credentials (and the full list of seeded customer phone numbers) are defined in `backend/src/db/seed.js`. They are intentionally not published here since this repo is public — ask the team for access.

> Note: Two users cannot be logged in with the same phone number simultaneously. If you get a "session replaced" message, switch to a different account.

---

## Option 1 — Bare Metal (Local Development)

### Prerequisites

- Node.js >= 20
- Docker Desktop (for PostgreSQL + Redis)
- Git

### Step 1 — Clone the repo

```bash
git clone git@github.com:KwameTunechi/fraud-shield.git
cd fraud-shield
```

### Step 2 — Start the backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and fill in:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://fraudshield:dev_password_change_in_prod@localhost:5432/fraudshield_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=<generate below>
JWT_EXPIRY=15m
BCRYPT_ROUNDS=12
CORS_ORIGINS=http://localhost:5173
ARKESEL_API_KEY=
```

Generate a JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Start the database and Redis:
```bash
docker compose up -d
```

Install dependencies and run migrations:
```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Backend runs at: `http://localhost:3000`

Verify:
```bash
curl http://localhost:3000/api/health
# {"status":"healthy","checks":{"api":"ok","db":"ok","redis":"ok"}}
```

### Step 3 — Start the frontend

Open a new terminal in the repo root:

```bash
# Create root .env
echo "VITE_API_URL=http://localhost:3000" > .env

npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

- Admin portal: `http://localhost:5173/dashboard`
- Customer portal: `http://localhost:5173/app`

### Step 4 — Expose locally via Cloudflare Tunnel (optional, for mobile testing)

If you want to test from a phone browser without deploying to cloud:

```bash
# Terminal 1 — expose frontend
npx cloudflared tunnel --url http://localhost:5173

# Terminal 2 — expose backend
npx cloudflared tunnel --url http://localhost:3000
```

Each command gives you a public `*.trycloudflare.com` URL.

**After every tunnel restart**, update both `.env` files:
- Root `.env`: set `VITE_API_URL` to the new backend tunnel URL
- `backend/.env`: add the new frontend tunnel URL to `CORS_ORIGINS`

Then restart both dev servers.

### OTP in local mode

When `ARKESEL_API_KEY` is blank, OTP codes are printed to the backend terminal instead of being sent by SMS. Use code `123456` as the universal bypass on all environments.

---

## Option 2 — Cloud (Vercel + Railway)

### Architecture

```
Browser / Phone
      |
      v
  Vercel (React/Vite frontend)
      |  HTTPS
      v
  Railway (Node.js/Express backend)
      |-- Railway PostgreSQL
      |-- Railway Redis
```

### Part A — Railway (Backend)

#### 1. Create project

1. Go to railway.app -> New Project
2. Deploy from GitHub repo -> select `KwameTunechi/fraud-shield`

#### 2. Add PostgreSQL

In your project -> + New -> Database -> Add PostgreSQL

#### 3. Add Redis

In your project -> + New -> Database -> Add Redis

#### 4. Configure the backend service

Click the **fraud-shield** service -> **Settings** tab:

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm ci` |
| Start Command | `node src/server.js` |

#### 5. Set environment variables

Click **Variables** tab -> **Raw Editor** -> paste:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<64-char random hex string>
JWT_EXPIRY=15m
BCRYPT_ROUNDS=12
CORS_ORIGINS=https://your-app.vercel.app
ARKESEL_API_KEY=
```

Generate JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

> `${{Postgres.DATABASE_URL}}` and `${{Redis.REDIS_URL}}` are Railway reference variables that auto-fill from the sibling services.

#### 6. Run migrations

After the first successful deploy, open the **Shell** tab in Railway:

```bash
npm run db:migrate
npm run db:seed
```

#### 7. Get your backend URL

Settings -> Networking -> Generate Domain. Copy this URL — needed for Vercel.

---

### Part B — Vercel (Frontend)

#### 1. Import project

1. Go to vercel.com -> Add New Project
2. Import `KwameTunechi/fraud-shield` from GitHub

#### 2. Build settings

| Setting | Value |
|---|---|
| Framework | Vite |
| Root Directory | `.` (repo root) |
| Build Command | `npm run build` |
| Output Directory | `dist` |

#### 3. Environment variables

| Name | Value |
|---|---|
| `VITE_API_URL` | `https://your-backend.up.railway.app` |

Must include `https://` — no trailing slash.

#### 4. Deploy

Click **Deploy**. Your frontend URL will be `https://fraud-shield-xxxx.vercel.app`.

---

### Part C — Final wiring

After both are deployed:

1. Go to Railway -> fraud-shield service -> Variables -> update:
   ```
   CORS_ORIGINS=https://your-app.vercel.app
   ```
   Railway auto-redeploys.

2. Verify the backend is reachable:
   ```bash
   curl https://your-backend.up.railway.app/api/health
   ```

3. Open the Vercel URL and test both portals.

---

### Automatic deploys

Both platforms watch the `main` branch on GitHub. Any push to `main` triggers an automatic rebuild and redeploy on both Vercel and Railway — no manual steps needed.

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | No | Defaults to `3000` |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `JWT_SECRET` | Yes | 64-char random hex — signs all tokens |
| `JWT_EXPIRY` | No | Access token lifetime, default `15m` |
| `BCRYPT_ROUNDS` | No | Defaults to `12` |
| `CORS_ORIGINS` | Yes | Comma-separated allowed frontend origins |
| `ARKESEL_API_KEY` | No | Leave blank — OTP bypass `123456` works without it |

### Frontend (root `.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Full backend URL with `https://`, no trailing slash |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Failed to fetch` on login | `VITE_API_URL` wrong or missing `https://` prefix |
| `Not allowed by CORS` | `CORS_ORIGINS` on Railway doesn't match Vercel URL exactly |
| `Invalid or expired OTP` | Use `123456` as the universal bypass code |
| `Too many requests` | Rate limiter triggered — wait 10 minutes or use a different phone number |
| Railway builds frontend instead of backend | Root Directory not set to `backend` in Railway Settings |
| `cd: backend: No such file or directory` in Railway shell | You are already inside `backend/` — run `npm run db:migrate` directly |
| `Session replaced by a new login` | Same phone logged in on another device — use a different test account |
