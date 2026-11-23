# CV Builder — Free Hosting Startup Guide

This guide covers free hosting options for deploying the CV Builder full-stack application (React frontend + Node.js/Express backend + SQLite database).

---

## Architecture Overview

```
┌──────────────────┐     ┌──────────────────┐     ┌────────────┐
│   React (Vite)   │────▶│   Node/Express   │────▶│   SQLite   │
│   Static Files   │     │   API Server     │     │   (File)   │
└──────────────────┘     └──────────────────┘     └────────────┘
         │                        │
         │                        ▼
         │                ┌────────────┐
         │                │  Puppeteer  │
         │                │ (Chromium)  │
         │                └────────────┘
         ▼
   CDN / Static Host
```

**Key Requirements:**
- Node.js 18+ runtime for backend
- Persistent filesystem for SQLite database + avatar uploads
- Chromium available for Puppeteer PDF generation
- ~512MB+ RAM (Puppeteer needs memory)

---

## 🏆 Option 1: Render (Recommended)

**Best for:** Full-stack apps with persistent storage  
**Free tier:** 750 hours/month, 100GB bandwidth  
**SQLite support:** ✅ (with persistent disk)

### Steps

1. **Push to GitHub** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USER/cv-builder.git
   git push -u origin main
   ```

2. **Deploy Backend (Web Service)**
   - Go to [render.com](https://render.com) → New → Web Service
   - Connect your GitHub repo
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment:** Node
   - Add environment variables:
     ```
     NODE_ENV=production
     JWT_SECRET=<random-64-char-string>
     REFRESH_TOKEN_SECRET=<different-random-64-char-string>
     JWT_EXPIRES_IN=15m
     REFRESH_EXPIRES_IN=7d
     BASE_URL=https://your-backend.onrender.com
     FRONTEND_ORIGIN=https://your-frontend.onrender.com
     ```
   - **Disk:** Add a persistent disk mounted at `/opt/render/project/src/uploads` (for avatars)
   - Update `server.js` DB path to use the persistent disk for the SQLite file

3. **Deploy Frontend (Static Site)**
   - New → Static Site
   - **Root Directory:** `client`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `client/dist`
   - Add rewrite rule: `/* → /index.html` (for SPA routing)

4. **Configure CORS**
   - Update `FRONTEND_ORIGIN` in backend env to match your static site URL

### Puppeteer on Render
Render's Docker-based environment includes Chromium. Add to your `package.json`:
```json
{
  "scripts": {
    "postinstall": "npx puppeteer browsers install chrome"
  }
}
```

---

## 🚂 Option 2: Railway

**Best for:** Quick deploy with generous free tier  
**Free tier:** $5 credit/month (≈500 hours)  
**SQLite support:** ✅ (with volume)

### Steps

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. Deploy:
   ```bash
   cd server
   railway init
   railway up
   ```

3. Add a volume for SQLite persistence:
   - Dashboard → your service → Volumes → Add Volume
   - Mount path: `/data`
   - Update DB path in server.js: `path.join('/data', 'cv_builder.db')`

4. Deploy frontend separately or use Railway's static hosting.

---

## ▲ Option 3: Vercel (Frontend) + Render (Backend)

**Best for:** Blazing-fast frontend with global CDN  
**Free tier:** Unlimited static deploys

### Frontend on Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy:
   ```bash
   cd client
   vercel
   ```
3. Set the API proxy in `vite.config.js` for production, or use Vercel's `vercel.json`:
   ```json
   {
     "rewrites": [
       { "source": "/api/:path*", "destination": "https://your-backend.onrender.com/api/:path*" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

### Backend on Render
Follow Option 1's backend deployment steps.

---

## 🪰 Option 4: Fly.io

**Best for:** Container-based deployment with global edge  
**Free tier:** 3 shared VMs, 160GB bandwidth  
**SQLite support:** ✅ (with volumes)

### Steps

1. Install flyctl: [fly.io/docs/getting-started/installing-flyctl](https://fly.io/docs/getting-started/installing-flyctl/)

2. Create `fly.toml` in project root:
   ```toml
   app = "cv-builder"
   primary_region = "lhr"

   [build]
     dockerfile = "Dockerfile.backend"

   [env]
     NODE_ENV = "production"
     PORT = "8080"

   [mounts]
     source = "cv_data"
     destination = "/data"

   [[services]]
     internal_port = 8080
     protocol = "tcp"
     [services.concurrency]
       hard_limit = 25
       soft_limit = 20
     [[services.ports]]
       handlers = ["http"]
       port = 80
     [[services.ports]]
       handlers = ["tls", "http"]
       port = 443
   ```

3. Create volume and deploy:
   ```bash
   fly volumes create cv_data --size 1
   fly deploy
   fly secrets set JWT_SECRET=xxx REFRESH_TOKEN_SECRET=yyy
   ```

---

## ☁️ Option 5: Oracle Cloud Free Tier

**Best for:** Always-free VM with full control  
**Free tier:** 2 AMD VMs (1GB RAM each) — permanently free  
**SQLite support:** ✅ (full filesystem access)

### Steps

1. Create an Oracle Cloud account at [cloud.oracle.com](https://cloud.oracle.com)
2. Create an Always Free Compute instance (Ubuntu 22.04)
3. SSH in and install Node.js:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```
4. Clone and run:
   ```bash
   git clone https://github.com/YOUR_USER/cv-builder.git
   cd cv-builder/server && npm install && npm start
   cd ../client && npm install && npm run build
   ```
5. Use nginx as reverse proxy + serve static files
6. Install Chromium for Puppeteer:
   ```bash
   sudo apt install -y chromium-browser
   ```

---

## 📋 Pre-Deployment Checklist

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Generate strong random secrets for `JWT_SECRET` and `REFRESH_TOKEN_SECRET`
- [ ] Configure real SMTP credentials for email verification
- [ ] Set correct `FRONTEND_ORIGIN` and `BASE_URL`
- [ ] Build frontend: `cd client && npm run build`
- [ ] Ensure SQLite file has persistent storage
- [ ] Ensure Chromium/Puppeteer is available for PDF generation
- [ ] Run `npm audit fix` on both packages
- [ ] Set up HTTPS (required for secure cookies in production)
- [ ] Test PDF generation on the deployed environment

---

## 🔧 SQLite Considerations

SQLite stores the entire database in a single file (`cv_builder.db`). For cloud deployments:

1. **The DB file must be on persistent storage** — ephemeral filesystems will lose data on restart
2. **Write-Ahead Logging (WAL)** mode is enabled for better concurrent read performance
3. **For high-traffic production**, consider migrating to PostgreSQL (schema already provided in `db/schema.sql`)
4. **Backups**: Schedule periodic copies of the DB file to external storage

---

## 💡 Cost Comparison

| Provider | Free Tier | Best For | SQLite | Puppeteer |
|----------|-----------|----------|--------|-----------|
| **Render** | 750 hrs/mo | Full-stack | ✅ (disk) | ✅ |
| **Railway** | $5/mo credit | Quick deploy | ✅ (volume) | ✅ |
| **Vercel** | Unlimited static | Frontend only | ❌ | ❌ |
| **Fly.io** | 3 VMs | Container apps | ✅ (volume) | ✅ |
| **Oracle Cloud** | 2 VMs forever | Full control | ✅ | ✅ |
