# Production Readiness Checklist

Use this checklist before deploying FraudShield to production or sharing with supervisors/markers.

---

## Security

### Authentication & Authorization
- [ ] JWT secrets are unique 64+ character random strings (not example values)
- [ ] `JWT_SECRET` ≠ `JWT_REFRESH_SECRET`
- [ ] Refresh tokens expire after reasonable time (default: 7 days)
- [ ] Access tokens are short-lived (default: 15 minutes)
- [ ] MFA is enforced for all admin accounts
- [ ] Rate limiting active on auth endpoints (5 attempts per 15 min)

### Data Protection
- [ ] `.env` files are in `.gitignore` (never committed)
- [ ] No real student IDs, names, or photos in seed data
- [ ] No real phone numbers in test data
- [ ] Passwords hashed with bcrypt (min 12 rounds)
- [ ] PINs hashed with bcrypt
- [ ] Sensitive fields (password, pin, otp, token) sanitized in logs

### Network Security
- [ ] CORS locked to specific domains (not `*`)
- [ ] Helmet security headers enabled
- [ ] CSP (Content Security Policy) configured
- [ ] HSTS enabled with 1-year max-age
- [ ] SSL/TLS enforced (Railway & Vercel handle this automatically)
- [ ] `credentials: true` in CORS for cookie-based auth

### Database Security
- [ ] Database credentials not in source code
- [ ] Connection string uses SSL in production
- [ ] Parameterized queries used everywhere (no string concatenation)
- [ ] Input validation with Zod schemas at API boundaries

---

## Performance & Reliability

### Resource Limits
- [ ] Railway hard spending limit set ($5 recommended)
- [ ] Backend service: 0.5 vCPU, 512 MB RAM
- [ ] PostgreSQL: 0.25 vCPU, 256 MB RAM
- [ ] Redis: 0.25 vCPU, 256 MB RAM

### Monitoring
- [ ] Health endpoint responding: `/api/health`
- [ ] Uptime monitor configured (UptimeRobot or similar)
- [ ] Log aggregation enabled (Railway built-in logs)
- [ ] Error tracking active (optional: Sentry)

### Database
- [ ] Migrations have run successfully
- [ ] Seed data loaded (at least one admin account)
- [ ] Indexes exist on frequently queried columns
- [ ] Connection pool configured (max: 20 connections)

---

## Functionality

### Backend API
- [ ] Health check returns `{"status":"healthy"}`
- [ ] Admin signin works end-to-end
- [ ] Customer OTP flow works
- [ ] Transactions POST creates entries
- [ ] Risk scoring returns real scores
- [ ] Blockchain ledger appends entries
- [ ] SSE live feed pushes events
- [ ] All routes require authentication (except `/api/health`, `/api/auth/*`)

### Web Dashboard
- [ ] Landing page loads
- [ ] Sign-in redirects to 2FA
- [ ] 2FA with valid code reaches dashboard
- [ ] Dashboard shows real data (not mock arrays)
- [ ] Live transactions update in real-time
- [ ] Risk analytics charts render
- [ ] Blockchain ledger shows entries
- [ ] Alerts & incidents list works
- [ ] Signing out clears session

### Mobile App
- [ ] Sign-in with phone number sends OTP
- [ ] OTP verification creates user
- [ ] PIN setup works for new users
- [ ] Home screen shows real balance
- [ ] Send money triggers risk scoring
- [ ] Transaction detail shows blockchain hash
- [ ] App handles offline gracefully

---

## Code Quality

### Testing
- [ ] Web app test coverage ≥ 80% (all metrics)
- [ ] Backend tests pass with real PostgreSQL & Redis
- [ ] CI pipeline green on `main` branch
- [ ] No ESLint warnings (`npx eslint src --max-warnings 0`)

### Documentation
- [ ] README has installation instructions
- [ ] `DEPLOYMENT.md` exists and is up-to-date
- [ ] `.env.example` files present in backend
- [ ] API endpoints documented (or self-documenting via code)

### Version Control
- [ ] All sprint work merged to `main`
- [ ] No `WIP` or `TODO` commits on `main`
- [ ] `.gitignore` excludes secrets and node_modules
- [ ] Commit messages follow convention

---

## Deployment

### Railway (Backend)
- [ ] Service deployed and running
- [ ] PostgreSQL connected
- [ ] Redis connected
- [ ] Environment variables set
- [ ] Public domain generated
- [ ] CORS includes Vercel URL

### Vercel (Web)
- [ ] Project deployed
- [ ] `VITE_API_URL` points to Railway
- [ ] Production build succeeded
- [ ] Bundle size < 2MB

### Mobile (EAS)
- [ ] APK built successfully
- [ ] `EXPO_PUBLIC_API_URL` points to Railway
- [ ] APK downloadable and installable
- [ ] App connects to production API

---

## Pre-Demo Checklist

Run through this **24 hours before** a demo or submission:

### Smoke Test
- [ ] Visit web dashboard → sign in → send test transaction
- [ ] Open mobile app → send test transaction
- [ ] Verify transaction appears on web dashboard in real-time
- [ ] Check backend logs for errors

### Data Cleanup
- [ ] Remove test transactions (or clearly mark as test data)
- [ ] Ensure demo admin account exists with known credentials
- [ ] Ensure demo customer account exists for mobile demo

### Rehearsal
- [ ] Demo script written
- [ ] Demo data seeded (if needed)
- [ ] Backup plan if internet is flaky (local dev environment ready)

---

## Post-Deployment

### Within 24 Hours
- [ ] Test all critical paths (auth, transactions, alerts)
- [ ] Check error logs for unexpected issues
- [ ] Verify uptime monitor is alerting correctly

### Weekly
- [ ] Review Railway usage (stay under $5 limit)
- [ ] Check for failed deployments
- [ ] Clear old logs if storage fills

### Before Submission
- [ ] Full smoke test
- [ ] Demo recording captures all features
- [ ] README has deployed URLs
- [ ] No secrets exposed in Git history

---

## Emergency Contacts

If production goes down before a demo:

1. **Check status pages:**
   - Railway: status.railway.app
   - Vercel: vercel-status.com

2. **Quick fixes:**
   - Restart Railway service (Deployments → Restart)
   - Redeploy from last working commit

3. **Fallback:**
   - Run locally with `docker compose up` + `npm run dev`
   - Use ngrok or localtunnel for temporary public URL

---

## Sign-Off

Before marking as production-ready, all checkboxes above must be ticked.

**Deployment lead:** _________________________  
**Date:** _________________________  
**Sprint:** 11 (Deploy Backend, Web, and Mobile)
