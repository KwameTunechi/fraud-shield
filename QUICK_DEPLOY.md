# Quick Deployment Guide

Follow these steps to deploy FraudShield to production servers **right now**.

---

## Part 1: Deploy Backend to Railway (15 minutes)

### Step 1: Create Railway Account

1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Sign in with your GitHub account
4. Click **"Authorize Railway"**

### Step 2: Deploy from GitHub

1. On Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose **"KwameTunechi/fraud-shield"** repository
4. Railway detects Node.js project

### Step 3: Configure Backend Service

1. Railway creates a service automatically
2. Click on the service (should be named something like "fraud-shield")
3. Go to **Settings** tab
4. Set **Root Directory**: `backend`
5. Set **Build Command**: `npm ci`
6. Set **Start Command**: `npm start`

### Step 4: Add PostgreSQL Database

1. From your Railway project dashboard
2. Click **"+ New"** button
3. Select **"Database"** → **"Add PostgreSQL"**
4. Railway creates a PostgreSQL 16 instance
5. Connection string is automatically available as `${{Postgres.DATABASE_URL}}`

### Step 5: Add Redis

1. Click **"+ New"** button again
2. Select **"Database"** → **"Add Redis"**
3. Railway creates a Redis 7 instance
4. Connection string is automatically available as `${{Redis.REDIS_URL}}`

### Step 6: Set Environment Variables

1. Click on your **backend service**
2. Go to **"Variables"** tab
3. Click **"+ New Variable"** and add each one below:

```
DATABASE_URL = ${{Postgres.DATABASE_URL}}
REDIS_URL = ${{Redis.REDIS_URL}}
NODE_ENV = production
PORT = 3000
BCRYPT_ROUNDS = 12
JWT_EXPIRY = 15m
JWT_REFRESH_EXPIRY = 7d
```

4. **Generate JWT secrets** (run these commands in your terminal):

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# Copy the output, add as JWT_SECRET in Railway

# Generate JWT_REFRESH_SECRET (different!)
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# Copy the output, add as JWT_REFRESH_SECRET in Railway
```

5. Add these optional variables:

```
CORS_ORIGINS = http://localhost:5173
ARKESEL_API_KEY = (leave blank for now, OTP will print to logs)
```

### Step 7: Deploy

1. Railway automatically starts deploying
2. Watch the **"Deployments"** tab
3. Build takes ~2-3 minutes
4. When you see **"SUCCESS"**, click on the deployment

### Step 8: Get Your Backend URL

1. Go to **Settings** tab
2. Scroll to **"Networking"**
3. Click **"Generate Domain"**
4. You'll get something like: `fraudshield-backend-production.up.railway.app`
5. **Copy this URL** — you'll need it for web and mobile

### Step 9: Run Database Migrations

1. In Railway, click on your **backend service**
2. Go to **"Deployments"** tab
3. Click on the active deployment
4. Click **"View Logs"**
5. You'll see the server starting

**Option A: Run migrations via Railway CLI (recommended)**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run npm run db:migrate
railway run npm run db:seed
```

**Option B: Run migrations manually via Postgres**

1. Click on the **Postgres** service
2. Go to **"Connect"** tab
3. Copy the connection command
4. Run in your terminal:

```bash
# Connect to database
psql <connection-string>

# Paste the contents of backend/src/db/migrations/001_initial_schema.sql
# Then paste backend/src/db/migrations/002_settings.sql
```

### Step 10: Test Your Backend

```bash
curl https://YOUR-RAILWAY-URL.up.railway.app/api/health

# Expected response:
# {"status":"healthy","checks":{"api":"ok","db":"ok","redis":"ok"},"timestamp":"..."}
```

✅ **Backend is live!**

---

## Part 2: Deploy Web Dashboard to Vercel (10 minutes)

### Step 1: Create Vercel Account

1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Sign in with GitHub
4. Click **"Authorize Vercel"**

### Step 2: Import Project

1. From Vercel dashboard, click **"Add New..."** → **"Project"**
2. Find **"KwameTunechi/fraud-shield"** in the list
3. Click **"Import"**

### Step 3: Configure Build Settings

Vercel auto-detects Vite, but verify these settings:

- **Framework Preset**: Vite
- **Root Directory**: `./` (leave as root)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 4: Add Environment Variable

1. Click **"Environment Variables"** section
2. Add variable:

```
Name: VITE_API_URL
Value: https://YOUR-RAILWAY-URL.up.railway.app
```

(Use the Railway backend URL from Part 1 Step 8)

### Step 5: Deploy

1. Click **"Deploy"**
2. Vercel builds the project (~2 minutes)
3. When done, you'll get a URL like: `fraud-shield-xyz.vercel.app`

### Step 6: Update Backend CORS

1. Go back to **Railway**
2. Click your **backend service**
3. Go to **"Variables"** tab
4. Find `CORS_ORIGINS`
5. Update it to: `https://fraud-shield-xyz.vercel.app`
   (Use your actual Vercel URL)
6. Backend will automatically redeploy (~1 minute)

### Step 7: Test Your Dashboard

1. Visit your Vercel URL: `https://fraud-shield-xyz.vercel.app`
2. Click **"Sign In"**
3. Enter: `admin@fraudshield.test` / `Password123!`
4. You'll get an `otpauth://` URL for MFA setup
5. Scan with Google Authenticator (or use a QR code generator website)
6. Enter the 6-digit code
7. You should land on the dashboard!

✅ **Web dashboard is live!**

---

## Part 3: Build Mobile APK (Optional, 15 minutes)

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

If you don't have an Expo account:
- Go to https://expo.dev
- Sign up (free)
- Then run `eas login` again

### Step 3: Update API URL in Config

Edit `mobile/eas.json` and update the Railway URL:

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

### Step 4: Build APK

```bash
cd mobile
eas build --profile preview --platform android
```

This will:
1. Upload your code to Expo servers
2. Compile the Android APK (~12 minutes)
3. Give you a download URL when done

### Step 5: Download and Test

1. Open the build URL on your Android phone
2. Download the APK
3. Install it (you may need to allow "Install from unknown sources")
4. Open the app
5. Try signing in with a phone number
6. OTP will print to Railway backend logs (unless you set up Arkesel)

✅ **Mobile app is live!**

---

## Quick Reference

### Your Production URLs

- **Backend API**: `https://YOUR-RAILWAY-URL.up.railway.app`
- **Web Dashboard**: `https://YOUR-VERCEL-URL.vercel.app`
- **Mobile APK**: `https://expo.dev/artifacts/...` (from EAS build)

### Demo Admin Account

- Email: `admin@fraudshield.test`
- Password: `Password123!`
- MFA: Scan QR code on first login

### Demo Customer Account

- Phone: `+233200000001`
- OTP: Check Railway backend logs (prints in dev mode)
- PIN: Set on first login (e.g., `1234`)

---

## Cost Tracking

### Railway
- Free trial: $5 credit (lasts ~1 month with our resource limits)
- After trial: ~$5-7/month
- Monitor at: Railway dashboard → Project → Usage

### Vercel
- Free (Hobby plan)
- 100 GB bandwidth/month
- Unlimited deployments

### Expo EAS
- Free tier: 30 builds/month
- Preview APK builds: Free

---

## Troubleshooting

### Backend health check fails

```bash
# Check Railway logs
railway logs --service backend

# Common issues:
# - Migrations didn't run → run db:migrate
# - DATABASE_URL missing → check Variables tab
# - Port mismatch → should be 3000
```

### Web dashboard CORS error

```bash
# Update CORS_ORIGINS in Railway to match your Vercel URL exactly
# No trailing slash!
# Format: https://fraud-shield-xyz.vercel.app
```

### Mobile can't connect

```bash
# Check EXPO_PUBLIC_API_URL in mobile/eas.json
# Rebuild if you changed it: eas build --profile preview --platform android
```

---

## Next Steps After Deployment

1. **Update README.md** with your live URLs
2. **Test all features** (sign in, transactions, alerts)
3. **Take screenshots** for documentation
4. **Record demo video** (4-5 minutes)
5. **Share with team** and supervisors

---

**Questions?** Check:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- [RUNBOOK.md](./docs/RUNBOOK.md) - Operations manual
- [SECURITY_AUDIT.md](./docs/SECURITY_AUDIT.md) - Security verification

**Created:** June 5, 2026  
**By:** Evans Adusu
