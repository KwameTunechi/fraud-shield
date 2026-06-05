# FraudShield Deployment Guide

This guide covers deploying the FraudShield platform to production.

## Overview

FraudShield consists of three deployable components:

1. **Backend API** — Node.js/Express server with PostgreSQL and Redis (Railway)
2. **Web Admin Dashboard** — React/Vite SPA (Vercel)
3. **Mobile App** — React Native/Expo APK (EAS Build)

---

## Prerequisites

- [ ] GitHub account with access to the FraudShield repository
- [ ] Railway account (free Hobby plan)
- [ ] Vercel account (free Hobby plan)
- [ ] Expo account (free)
- [ ] Arkesel SMS API key (for production SMS)

---

## Part 1: Deploy Backend to Railway

### 1.1 Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select the `fraud-shield` repository
4. Railway will auto-detect the Node.js backend

### 1.2 Configure Build Settings

In the backend service settings:

- **Root Directory**: `backend`
- **Build Command**: `npm ci`
- **Start Command**: `npm start`

### 1.3 Add Database Services

From the Railway project dashboard:

1. Click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Click **"+ New"** → **"Database"** → **"Redis"**

Railway will automatically inject connection strings as environment variables.

### 1.4 Set Environment Variables

Go to the backend service **"Variables"** tab and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Auto-injected by Railway |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` | Auto-injected by Railway |
| `JWT_SECRET` | Generate with: `openssl rand -base64 48` | **Keep secret** |
| `JWT_REFRESH_SECRET` | Generate with: `openssl rand -base64 48` | **Different from JWT_SECRET** |
| `JWT_EXPIRY` | `15m` | Access token lifespan |
| `JWT_REFRESH_EXPIRY` | `7d` | Refresh token lifespan |
| `BCRYPT_ROUNDS` | `12` | Password hashing cost |
| `NODE_ENV` | `production` | |
| `PORT` | `3000` | |
| `ARKESEL_API_KEY` | Your Arkesel API key | From arkesel.com dashboard |
| `CORS_ORIGINS` | `https://fraud-shield.vercel.app` | Update after Vercel deployment |

> **Security Note**: Never commit secrets to Git. Generate unique secrets for production.

### 1.5 Run Database Migrations

After the first deployment:

1. Open Railway → Backend Service → **"Shell"**
2. Run:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

This creates tables and seeds initial admin accounts.

### 1.6 Configure Domain & Resources

**Generate Public URL:**
- Go to **Settings** → **Networking**
- Click **"Generate Domain"**
- You'll get something like: `fraudshield-api-production.up.railway.app`

**Set Resource Limits (Important for cost control):**
- Go to **Settings** → **Resources**
- Set limits:
  - **Backend**: 0.5 vCPU, 512 MB RAM
  - **PostgreSQL**: 0.25 vCPU, 256 MB RAM
  - **Redis**: 0.25 vCPU, 256 MB RAM

**Set Spending Limit:**
- Go to Project **Settings** → **Billing**
- Set **Hard Limit**: $5 USD
- Railway will pause services if this limit is reached

### 1.7 Verify Deployment

Test the health endpoint:

```bash
curl https://YOUR-RAILWAY-URL.up.railway.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "checks": {
    "api": "ok",
    "db": "ok",
    "redis": "ok"
  },
  "timestamp": "2026-06-05T..."
}
```

---

## Part 2: Deploy Web Dashboard to Vercel

### 2.1 Create Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New"** → **"Project"**
3. Import the `fraud-shield` repository

### 2.2 Configure Build Settings

- **Framework Preset**: Vite
- **Root Directory**: `./` (project root)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 2.3 Set Environment Variables

Add the following in **Settings** → **Environment Variables**:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://YOUR-RAILWAY-URL.up.railway.app` |

### 2.4 Deploy

Click **"Deploy"**. Vercel will:
- Install dependencies
- Build the production bundle
- Deploy to a `.vercel.app` domain

You'll get a URL like: `fraud-shield-xyz.vercel.app`

### 2.5 Update Backend CORS

Go back to Railway → Backend Service → **Variables** and update:

```
CORS_ORIGINS=https://fraud-shield-xyz.vercel.app
```

Railway will auto-redeploy with the new CORS setting.

### 2.6 Verify Deployment

Visit your Vercel URL and:
- [ ] Landing page loads
- [ ] Click "Sign In" → enters email/password
- [ ] 2FA flow works
- [ ] Dashboard shows real data from Railway API

---

## Part 3: Build Mobile App (Android APK)

### 3.1 Install EAS CLI

```bash
npm install -g eas-cli
```

### 3.2 Login to Expo

```bash
eas login
```

Use your Expo account credentials.

### 3.3 Configure EAS Build

The `mobile/eas.json` file is already configured for preview builds.

Verify the API URL in `eas.json`:

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

### 3.4 Build Android APK

```bash
cd mobile
eas build --profile preview --platform android
```

This will:
- Upload your code to Expo's build servers
- Compile the APK
- Provide a download URL (~12 minutes)

### 3.5 Download & Test

1. Open the build URL on your Android phone
2. Download the APK
3. Install it
4. Sign in with a test phone number
5. Send a test transaction
6. Verify risk scoring works

### 3.6 Distribute

Share the download URL with:
- Team members for testing
- Markers/supervisors for evaluation

> **Note**: iOS builds require an Apple Developer account ($99/year). For research purposes, Android APK is sufficient. iOS users can run the app via Expo Go instead.

---

## Part 4: Configure GitHub Actions for CI/CD

The updated `.github/workflows/ci.yml` now tests:
- ✅ Web app (lint, test, build)
- ✅ Backend (with PostgreSQL and Redis in CI)
- ✅ Mobile app (if tests exist)

Every push to `main` or `develop` triggers the full pipeline.

**Auto-deploy is already enabled:**
- Railway watches the `main` branch → auto-deploys backend
- Vercel watches the `main` branch → auto-deploys web dashboard

---

## Cost Breakdown

### Railway (Backend + Databases)

- **Hobby Plan**: $5/month (includes $5 usage credit)
- **With resource limits**: ~$8-12/month actual usage
- **Net cost**: $3-7/month after credit

**Cost control:**
- Set hard spending limit: $5
- Railway pauses services at limit

### Vercel (Web Dashboard)

- **Hobby Plan**: Free
- Includes:
  - 100 GB bandwidth/month
  - Unlimited deployments
  - Free SSL

### Expo EAS (Mobile Builds)

- **Free tier**: 30 builds/month
- Preview builds (APK): ✅ Free
- Production builds: ✅ Free

### Arkesel (SMS)

- Pay-as-you-go
- ~5 pesewas per SMS
- GH₵10 credit = ~200 SMS (plenty for demos)

**Total monthly cost (split 4 ways):**
- **Total**: $3-7/month
- **Per person**: < $2/month

---

## Security Checklist

Before going live:

- [ ] Unique JWT secrets generated (not example values)
- [ ] `.env` files are gitignored
- [ ] CORS locked to Vercel domain only
- [ ] Helmet security headers enabled
- [ ] Rate limiting active on auth endpoints
- [ ] Hard spending limit set on Railway
- [ ] No real student data in seed files
- [ ] SSL/TLS enforced (Railway & Vercel do this automatically)

---

## Monitoring & Logs

### Railway Logs
- Go to Backend Service → **"Deployments"** → **"View Logs"**
- Filter by: `error`, `warn`, `failed`

### Vercel Logs
- Go to Project → **"Deployments"** → Select deployment → **"Logs"**

### Health Checks

Set up a simple uptime monitor:
- Use [UptimeRobot](https://uptimerobot.com) (free)
- Monitor: `https://YOUR-RAILWAY-URL/api/health`
- Alert: Email if down for > 5 minutes

---

## Rollback Procedure

### Backend (Railway)
1. Go to **"Deployments"**
2. Find the last working deployment
3. Click **"Redeploy"**

### Web (Vercel)
1. Go to **"Deployments"**
2. Find the last working deployment
3. Click **"Promote to Production"**

---

## Troubleshooting

### Backend won't start
- Check Railway logs for errors
- Verify `DATABASE_URL` and `REDIS_URL` are set
- Confirm migrations ran: `npm run db:migrate`

### CORS errors in browser
- Check `CORS_ORIGINS` includes your Vercel URL
- No trailing slash in URLs
- Backend service redeployed after CORS change

### Mobile app can't reach API
- Verify `EXPO_PUBLIC_API_URL` in `eas.json`
- Check Railway backend is running
- Test health endpoint: `curl https://YOUR-URL/api/health`

### Database connection errors
- Railway Postgres should auto-connect via `DATABASE_URL`
- If issues persist, check service is running in Railway dashboard

---

## Support

If deployment issues persist:
1. Check Railway/Vercel status pages
2. Review logs (see Monitoring section)
3. Open an issue in the GitHub repository with:
   - Error messages
   - Which service (backend/web/mobile)
   - Steps to reproduce
