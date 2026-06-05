# FraudShield Operational Runbook

**Last Updated:** June 5, 2026  
**For:** Production deployment on Railway + Vercel + EAS  
**On-Call Contact:** Evans Adusu (eadusu001@st.ug.edu.gh)

---

## Quick Reference

| Task | Page |
|------|------|
| View production logs | [Section 1](#1-viewing-logs) |
| Rollback a deployment | [Section 2](#2-rolling-back-deployments) |
| Rotate JWT secrets | [Section 3](#3-rotating-jwt-secrets) |
| Database backup | [Section 4](#4-database-backups) |
| Restart crashed service | [Section 5](#5-restarting-services) |
| Add new admin user | [Section 6](#6-adding-admin-users) |
| Check system health | [Section 7](#7-health-checks) |
| Emergency shutdown | [Section 8](#8-emergency-procedures) |

---

## 1. Viewing Logs

### 1.1 Backend API Logs (Railway)

**Method 1: Web Dashboard**
1. Go to [railway.app](https://railway.app)
2. Select **FraudShield** project
3. Click **Backend** service
4. Click **Deployments** tab
5. Select the running deployment
6. Click **View Logs**

**Filtering:**
- Type `error` in search box → see only errors
- Type `warn` → see warnings
- Type `transaction` → see transaction logs

**Method 2: Railway CLI**
```bash
# Install Railway CLI (one-time)
npm install -g @railway/cli

# Login
railway login

# View live logs
railway logs --service backend

# Follow logs (tail -f)
railway logs --service backend --follow
```

### 1.2 Web Dashboard Logs (Vercel)

1. Go to [vercel.com](https://vercel.com)
2. Select **fraud-shield** project
3. Click **Deployments**
4. Click on the active deployment
5. Click **Runtime Logs**

**Note:** Frontend logs are limited. Most useful logs are on backend.

### 1.3 Mobile App Logs

**Development:**
- Run `npx expo start` and view Metro bundler output
- Errors appear in terminal

**Production APK:**
- Use [Sentry](#13-error-tracking-sentry) to capture crashes
- Android: `adb logcat | grep ReactNativeJS` (requires USB debugging)

---

## 2. Rolling Back Deployments

### 2.1 Backend (Railway)

**Quick Rollback (5 minutes):**
1. Railway Dashboard → **Backend** service → **Deployments**
2. Find the last known-good deployment (marked with ✅)
3. Click the **•••** menu on that deployment
4. Click **Redeploy**
5. Confirm

Railway will rebuild and deploy that specific commit. Old deployment stays live until new one passes health checks.

**Alternative: Git Revert**
```bash
# Find the bad commit
git log --oneline -5

# Revert it
git revert <commit-hash>

# Push
git push origin main

# Railway auto-deploys the revert commit
```

### 2.2 Web Dashboard (Vercel)

**Instant Rollback (no rebuild):**
1. Vercel Dashboard → **fraud-shield** → **Deployments**
2. Find the last working deployment
3. Click **•••** menu → **Promote to Production**

This is instant because Vercel keeps all old deployments.

### 2.3 Mobile App (EAS)

**Cannot roll back a distributed APK.**  
If an APK has a critical bug:

1. Fix the bug
2. Increment `versionCode` in `app.json`
3. Rebuild: `eas build --profile preview --platform android`
4. Share new download URL to users

For OTA updates (if configured), use `eas update`.

---

## 3. Rotating JWT Secrets

**When to rotate:**
- Security breach suspected
- Secret accidentally committed to Git
- Scheduled rotation (every 90 days recommended)

**Impact:** All users will be logged out and must sign in again.

### Steps

1. **Generate new secrets:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
   # Run twice for JWT_SECRET and JWT_REFRESH_SECRET
   ```

2. **Update Railway environment variables:**
   - Go to Railway → Backend → **Variables**
   - Update `JWT_SECRET` and `JWT_REFRESH_SECRET`
   - Click **Save**

3. **Backend redeploys automatically** (2-3 minutes)

4. **Clear sessions in database** (optional but recommended):
   ```sql
   -- Connect to database
   railway run --service postgres psql
   
   -- Delete all refresh tokens
   DELETE FROM sessions;
   ```

5. **Notify users** via email/Slack: "Please sign in again"

---

## 4. Database Backups

### 4.1 Automatic Backups (Railway)

Railway automatically backs up PostgreSQL:
- **Frequency:** Every 24 hours
- **Retention:** 7 days (Hobby plan)
- **Location:** Railway manages this

**To restore from automatic backup:**
1. Railway Dashboard → **Postgres** service → **Data**
2. Click **Backups** tab
3. Select backup date
4. Click **Restore**

### 4.2 Manual Backup (pg_dump)

**Export entire database:**
```bash
# Via Railway CLI
railway run --service postgres pg_dump -Fc > backup_$(date +%Y%m%d).dump

# Or direct connection
pg_dump -Fc -h <railway-host> -U postgres fraudshield_prod > backup.dump
```

**Export specific tables:**
```bash
pg_dump -Fc -t transactions -t users -t blockchain_entries \
  -h <railway-host> -U postgres fraudshield_prod > critical_data.dump
```

**Restore from dump:**
```bash
pg_restore -h <railway-host> -U postgres -d fraudshield_prod backup.dump
```

### 4.3 Backup Schedule (Production)

- **Daily:** Automatic (Railway)
- **Weekly:** Manual export before major releases
- **Before migrations:** Always backup first

Store manual backups in:
- Google Drive (team shared folder)
- GitHub (encrypted with `git-crypt` or similar)

---

## 5. Restarting Services

### 5.1 Backend Restart

**If backend is unresponsive:**

```bash
# Via Railway CLI
railway restart --service backend

# Or via dashboard
```

Dashboard method:
1. Railway → Backend → **Settings**
2. Click **Restart Service**

**If PostgreSQL is unresponsive:**
```bash
railway restart --service postgres
```

**Warning:** Restarting PostgreSQL drops all active connections. Do this only if truly necessary.

### 5.2 Redis Restart

```bash
railway restart --service redis
```

**Impact:** All rate limit counters and OTP codes are lost. Low risk for short outage.

---

## 6. Adding Admin Users

### 6.1 Via Database (Production)

**Create a new admin:**

```sql
-- Connect to production database
railway run --service postgres psql

-- Generate password hash (replace 'SecurePassword123!')
-- (Do this in Node REPL first, don't hash in SQL)
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('SecurePassword123!', 12).then(console.log)"
-- Copy the output hash

-- Insert admin
INSERT INTO admins (email, password_hash, full_name, role)
VALUES (
  'newadmin@org.com',
  '$2b$12$...hash from above...',
  'New Admin Name',
  'analyst'  -- or 'supervisor', 'super_admin'
);
```

**First login will prompt for MFA setup** (scan QR code with Google Authenticator).

### 6.2 Via API (If /api/admins POST is enabled)

```bash
curl -X POST https://fraudshield-api-production.up.railway.app/api/admins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <super_admin_token>" \
  -d '{
    "email": "newadmin@org.com",
    "password": "SecurePassword123!",
    "fullName": "New Admin",
    "role": "analyst"
  }'
```

**Requires:** Logged-in super_admin with valid access token.

### 6.3 Deleting/Suspending Admin

**Suspend (soft delete):**
```sql
UPDATE admins SET status = 'suspended' WHERE email = 'admin@org.com';
```

**Reactivate:**
```sql
UPDATE admins SET status = 'active' WHERE email = 'admin@org.com';
```

**Permanent delete:**
```sql
DELETE FROM admins WHERE email = 'admin@org.com';
```

---

## 7. Health Checks

### 7.1 Manual Health Check

**Backend API:**
```bash
curl https://fraudshield-api-production.up.railway.app/api/health
```

**Expected response:**
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

**If any check is "down":**
- Check Railway dashboard for service status
- View logs for errors
- Restart affected service

### 7.2 Automated Monitoring (UptimeRobot)

**View status:**
1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Dashboard shows green (up) or red (down)
3. Click monitor for detailed stats

**If alert received:**
1. Check health endpoint manually
2. Check Railway service status
3. View logs
4. Restart if needed
5. Update team in Slack/WhatsApp

### 7.3 Database Connection Test

```bash
# Via Railway
railway run --service postgres psql -c "SELECT 1;"

# Should return:
# ?column? 
#----------
#        1
```

### 7.4 Redis Connection Test

```bash
# Via Railway
railway run --service redis redis-cli ping

# Should return:
# PONG
```

---

## 8. Emergency Procedures

### 8.1 Security Breach Suspected

**Immediate actions (within 5 minutes):**

1. **Rotate all secrets:**
   ```bash
   # Generate new JWT secrets
   node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
   
   # Update in Railway immediately
   ```

2. **Clear all sessions:**
   ```sql
   railway run --service postgres psql
   DELETE FROM sessions;
   ```

3. **Review recent logins:**
   ```sql
   SELECT email, last_login_at, role 
   FROM admins 
   WHERE last_login_at > NOW() - INTERVAL '1 hour'
   ORDER BY last_login_at DESC;
   ```

4. **Check blockchain integrity:**
   ```bash
   curl https://fraudshield-api-production.up.railway.app/api/blockchain/verify
   ```

5. **Review alerts:**
   ```sql
   SELECT * FROM alerts WHERE created_at > NOW() - INTERVAL '1 hour' ORDER BY created_at DESC;
   ```

### 8.2 Database Corruption Detected

1. **Stop all writes immediately:**
   ```bash
   railway pause --service backend
   ```

2. **Export current data:**
   ```bash
   pg_dump -Fc -h <host> -U postgres fraudshield_prod > emergency_backup.dump
   ```

3. **Restore from last known-good backup**

4. **Verify data integrity:**
   ```sql
   SELECT COUNT(*) FROM transactions;
   SELECT COUNT(*) FROM blockchain_entries;
   SELECT * FROM blockchain_entries ORDER BY id DESC LIMIT 1;
   ```

5. **Resume services:**
   ```bash
   railway resume --service backend
   ```

### 8.3 Complete System Shutdown

**When to use:** Critical security issue, preparing for maintenance window, or major migration.

**Steps:**

1. **Notify users** (post banner on web dashboard)

2. **Pause Railway services:**
   ```bash
   railway pause --service backend
   railway pause --service postgres
   railway pause --service redis
   ```

3. **Take final backup**

4. **Post status update** (README, social media, email)

**To resume:**
```bash
railway resume --service postgres
railway resume --service redis
railway resume --service backend
```

Services start in order (DB first, then app).

---

## 9. Monitoring Dashboards

### 9.1 Railway Dashboard

**URL:** https://railway.app/project/[your-project-id]

**What to monitor:**
- CPU usage (should be <50% average)
- Memory usage (should be <80% of limit)
- Request count
- Error rate

**Alerts:**
- Railway sends email if service crashes
- Set up Slack integration for real-time alerts

### 9.2 Sentry (Error Tracking)

**URL:** https://sentry.io/organizations/[your-org]/

**What to monitor:**
- Unhandled exceptions
- Error frequency trends
- Affected users count

**Triage priority:**
1. Errors affecting >10 users
2. Errors in authentication flow
3. Errors in transaction processing
4. All others

### 9.3 Logtail (Log Aggregation)

**URL:** https://logtail.com

**Useful queries:**
- `level:error` → all errors
- `level:error AND endpoint:"/api/transactions"` → transaction errors
- `userId:"<uuid>"` → logs for specific user

---

## 10. Common Issues & Solutions

### Issue: Backend returns 503 "Database connection error"

**Cause:** PostgreSQL connection pool exhausted or database is down

**Solution:**
```bash
# Check database status
railway run --service postgres psql -c "SELECT 1;"

# If fails, restart PostgreSQL
railway restart --service postgres

# If succeeds, restart backend (clears connection pool)
railway restart --service backend
```

---

### Issue: "CORS error" in browser console

**Cause:** CORS_ORIGINS environment variable doesn't match web app URL

**Solution:**
```bash
# Check current value
railway variables --service backend | grep CORS_ORIGINS

# Update (replace with your Vercel URL)
railway variables --service backend set CORS_ORIGINS=https://fraud-shield.vercel.app

# Backend auto-redeploys
```

---

### Issue: Mobile app can't connect to API

**Cause:** `EXPO_PUBLIC_API_URL` points to wrong URL or backend is down

**Solution:**
1. Check backend health endpoint
2. Verify URL in `mobile/eas.json` matches Railway URL
3. Rebuild APK with correct URL

---

### Issue: Blockchain verification job failing

**Cause:** Tampering detected or job crashed

**Solution:**
```bash
# Check alerts
railway run --service postgres psql
SELECT * FROM alerts WHERE type = 'integrity_violation' ORDER BY created_at DESC LIMIT 5;

# If alert exists, check blockchain entries
SELECT id, event_type, substring(hash, 1, 12) as hash_short
FROM blockchain_entries ORDER BY id DESC LIMIT 10;

# If data looks corrupted, restore from backup
```

---

## 11. Regular Maintenance Tasks

### Weekly
- [ ] Check Railway usage/cost (Settings → Usage)
- [ ] Review error logs in Sentry
- [ ] Verify automatic backups ran successfully

### Monthly
- [ ] Review and close stale alerts
- [ ] Check npm audit on all three apps
- [ ] Update dependencies (minor versions only)
- [ ] Test rollback procedure (staging environment)

### Quarterly
- [ ] Rotate JWT secrets
- [ ] Full security audit (re-run checklist)
- [ ] Load test with k6 or Artillery
- [ ] Review and update this runbook

---

## 12. Contact Information

**On-Call Rotation:**
- **Primary:** Evans Adusu (eadusu001@st.ug.edu.gh)
- **Backup:** [Team Member 2]
- **Escalation:** [Supervisor/Professor]

**External Services:**
- **Railway Support:** support@railway.app
- **Vercel Support:** support@vercel.com
- **Expo Support:** https://expo.dev/support

**Internal Channels:**
- **Slack:** #fraudshield-ops
- **Email List:** fraudshield-team@ug.edu.gh

---

## 13. Useful Commands Cheat Sheet

```bash
# Railway CLI
railway login
railway status
railway logs --service backend --follow
railway restart --service backend
railway run --service postgres psql
railway variables --service backend

# Git
git log --oneline -10
git revert <commit-hash>
git push origin main

# Database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM transactions;"
pg_dump -Fc $DATABASE_URL > backup.dump
pg_restore -d $DATABASE_URL backup.dump

# Node
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
npm audit --production
npm outdated

# Curl (health checks)
curl https://fraudshield-api-production.up.railway.app/api/health
curl -I https://fraud-shield.vercel.app/  # Check headers
```

---

**Document Version:** 1.0.0  
**Last Updated:** June 5, 2026  
**Next Review:** September 5, 2026  
**Owner:** Evans Adusu
