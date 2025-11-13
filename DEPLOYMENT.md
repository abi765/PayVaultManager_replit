# PayVaultManager - Render.com Deployment Guide

## 🚀 Quick Deploy to Render.com

### Prerequisites
- GitHub account
- Render.com account (sign up at https://render.com)
- Code pushed to GitHub repository

---

## 📋 Step-by-Step Deployment

### Step 1: Push Code to GitHub

Ensure all changes are committed and pushed:

```bash
git add .
git commit -m "Prepare for Render deployment with security fixes"
git push origin claude_app_development
```

### Step 2: Create Render Account

1. Go to https://render.com
2. Sign up with your GitHub account
3. Authorize Render to access your repositories

### Step 3: Deploy Using render.yaml (Recommended)

#### Option A: Blueprint Deployment (Easiest)

1. In Render Dashboard, click **"New +"** → **"Blueprint"**
2. Connect your GitHub repository
3. Select branch: `claude_app_development`
4. Render will automatically detect `render.yaml`
5. Click **"Apply"**
6. Wait for deployment (5-10 minutes)

#### Option B: Manual Deployment

If Blueprint doesn't work, deploy manually:

**Create PostgreSQL Database:**
1. Click **"New +"** → **"PostgreSQL"**
2. Name: `payvault-db`
3. Database: `payvault`
4. Plan: Free (upgrade later)
5. Click **"Create Database"**
6. Copy the **Internal Database URL** (starts with `postgresql://`)

**Create Web Service:**
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select branch: `claude_app_development`
4. Configure:
   - **Name:** `payvault-app`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free (upgrade later)

5. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<paste-internal-database-url>
   ALLOWED_ORIGINS=https://payvault-app.onrender.com
   SESSION_SECRET=<generate-random-32-char-string>
   ```

6. Click **"Create Web Service"**

### Step 4: Initialize Database

After deployment succeeds:

1. Go to your web service in Render dashboard
2. Click **"Shell"** tab
3. Run database migration:
   ```bash
   npm run db:push
   ```
4. The seed script will automatically create an admin user

### Step 5: Access Your App

1. Your app URL: `https://payvault-app.onrender.com` (or your custom domain)
2. Login with default credentials:
   - **Username:** `admin`
   - **Password:** `admin123`

⚠️ **IMPORTANT:** Change the default password immediately after first login!

---

## 🔧 Post-Deployment Configuration

### 1. Update ALLOWED_ORIGINS

After deployment, update the environment variable:

1. Go to web service → **Environment** tab
2. Edit `ALLOWED_ORIGINS`
3. Set to your actual domain: `https://your-actual-domain.onrender.com`
4. Save changes (app will redeploy)

### 2. Custom Domain (Optional)

1. Go to web service → **Settings** tab
2. Scroll to **Custom Domain**
3. Add your domain (e.g., `payvault.yourdomain.com`)
4. Update DNS records as instructed
5. SSL certificate is automatic

### 3. Upgrade Plans (When Ready)

**Free Tier Limitations:**
- Web service spins down after 15 min of inactivity
- Database is free for 90 days, then $7/month
- 750 hours/month free compute

**Recommended for Production:**
- Web Service: **Starter** ($7/month) - always on
- Database: **Starter** ($7/month) - 1GB storage

---

## 🔐 Security Checklist

Before going live, ensure:

- [ ] Changed default admin password
- [ ] Set strong `SESSION_SECRET` (32+ random characters)
- [ ] Configured `ALLOWED_ORIGINS` correctly
- [ ] Database has backups enabled (paid plans)
- [ ] Reviewed all user roles and permissions
- [ ] Tested all critical flows

---

## 🛠️ Troubleshooting

### Build Fails

**Error:** `npm install` fails
- **Solution:** Check Node.js version compatibility
- Render uses Node 20 by default (matches our setup)

**Error:** TypeScript compilation fails
- **Solution:** Run `npm run check` locally first
- Fix any type errors before deploying

### Database Connection Issues

**Error:** "Cannot connect to database"
- **Solution:** Verify `DATABASE_URL` environment variable
- Ensure database is in the same region as web service
- Check if database is still provisioning

### App Crashes on Start

**Error:** "Environment variable validation failed"
- **Solution:** Ensure all required env vars are set
- Check `server/env.ts` for required variables

### Rate Limiting Issues

If users report "Too many requests":
- Increase rate limits in `server/index.ts`
- Or upgrade to paid plan for better resources

---

## 📊 Monitoring & Maintenance

### View Logs

1. Go to web service → **Logs** tab
2. View real-time application logs
3. Search for errors or issues

### Database Backups

**Free Plan:** No automatic backups
**Paid Plan:** Daily automatic backups

To backup manually:
1. Go to database → **Backups** tab
2. Click **"Create Backup"**

### Health Checks

Render automatically monitors: `GET /api/auth/me`
- If it fails 3 times, service restarts automatically

---

## 🔄 Continuous Deployment

Every push to `claude_app_development` branch triggers auto-deploy:

1. Push code: `git push origin claude_app_development`
2. Render automatically:
   - Pulls latest code
   - Runs build
   - Deploys new version
   - Zero-downtime deployment

To disable auto-deploy:
- Go to web service → **Settings**
- Disable **"Auto-Deploy"**

---

## 📝 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | - | Set to `production` |
| `PORT` | No | 10000 | Port for web service |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `ALLOWED_ORIGINS` | Recommended | - | CORS allowed origins (comma-separated) |
| `SESSION_SECRET` | Recommended | - | Secret for session encryption |

---

## 🆘 Need Help?

- **Render Docs:** https://render.com/docs
- **Render Community:** https://community.render.com
- **GitHub Issues:** [Your Repo URL]/issues

---

## 📈 Scaling Tips

When your app grows:

1. **Database:**
   - Upgrade to 4GB plan ($25/month)
   - Enable connection pooling
   - Add read replicas

2. **Web Service:**
   - Upgrade to Standard ($25/month) - 2GB RAM
   - Enable horizontal scaling (multiple instances)

3. **CDN:**
   - Use Cloudflare for static assets
   - Enable caching

4. **Monitoring:**
   - Add Sentry for error tracking
   - Use Datadog or New Relic for APM

---

## ✅ Deployment Complete!

Your PayVaultManager app is now live and ready to use! 🎉

Next steps:
1. Change admin password
2. Create user accounts for your team
3. Start adding employees
4. Process your first payroll

Happy managing! 💰
