# Flask Backend Deployment Guide

This guide explains how to deploy your Flask backend for video processing and chat functionality.

## ⚠️ Why Not Vercel?

**Vercel Limitations:**
- **10-second timeout** on Hobby plan (60s on Pro)
- Video processing with Twelve Labs can take **5-10+ minutes**
- File size limits (4.5MB Hobby, 50MB Pro)

**Recommended Platforms:**
- **Railway** (Recommended) - Easy setup, good for Python, handles long tasks
- **Render** - Similar to Railway, free tier available
- **Vultr** - Traditional VPS, full control

---

## Option 1: Deploy to Railway (Recommended)

Railway is excellent for Python/Flask apps and handles long-running processes well.

### Step 1: Prepare Files

Your backend already has:
- ✅ `backend/requirements.txt` (with dependencies)
- ✅ `backend/wsgi.py` (WSGI entry point)
- ✅ `backend/Procfile` (for Gunicorn)

**Make sure `gunicorn` is in `requirements.txt`** (already added).

### Step 2: Deploy on Railway

1. **Go to [Railway.app](https://railway.app)** and sign up/login
2. **Create New Project** → **Deploy from GitHub repo**
3. **Select your repository** (NoMoreTears/HiReady)
4. **Add Service** → **Select "backend" folder** as root directory

### Step 3: Configure Railway

**Railway Settings:**

1. **Go to Service Settings** → **Root Directory**
   - Set to: `backend` (without trailing slash)

2. **Go to Variables Tab** → Add environment variables (see Step 4 below)

3. **Go to Settings** → **Deploy** → **Build Command**
   - **Set Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   - This ensures dependencies (including `gunicorn`) are installed during build

4. **Go to Settings** → **Deploy** → **Start Command**
   - **Set Start Command**: `python -m gunicorn --bind 0.0.0.0:$PORT --timeout 600 --workers 2 wsgi:app`
   - Or Railway will auto-detect from `Procfile` if present

**Note:** Railway auto-detects Python from `requirements.txt`, but explicitly setting the build command ensures dependencies are installed.

**Alternative Fix - Create `railway.toml`:**

If Railway still doesn't install dependencies after setting the Build Command, create `backend/railway.toml`:
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "python -m gunicorn --bind 0.0.0.0:$PORT --timeout 600 --workers 2 wsgi:app"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

This file explicitly tells Railway how to build and start your app.

**Set Environment Variables in Railway:**
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname
TWELVELABS_API_KEY=your-twelve-labs-api-key
TWELVELABS_INDEX_ID=your-twelve-labs-index-id
BACKBOARD_API_KEY=your-backboard-api-key
FLASK_PORT=5001  # Optional, Railway sets PORT automatically
```

### Step 4: Get Flask URL

After deployment, Railway provides a URL like:
```
https://your-app-name.up.railway.app
```

**Update your Express backend environment variable:**
```
FLASK_BASE_URL=https://your-app-name.up.railway.app
```

---

## Option 2: Deploy to Render

Similar to Railway, Render also handles Flask well.

### Step 1: Prepare Files

Same as Railway - you already have `requirements.txt`, `wsgi.py`, and `Procfile`.

### Step 2: Deploy on Render

**⚠️ IMPORTANT: Render Auto-Detection Issue**

Render auto-detects the environment from the **root directory**, not the Root Directory setting. If your repo has `package.json` or `bun.lockb` at the root, Render will default to **Bun/Node**.

**Fix in Render Dashboard:**

1. **Go to [Render.com](https://render.com)** and sign up/login
2. **New** → **Web Service**
3. **Connect GitHub** → Select your repository
4. **Configure (IMPORTANT ORDER):**
   
   **FIRST - Set Environment BEFORE Root Directory:**
   - **Environment**: Click the dropdown and **manually select `Python 3`** (do NOT let it auto-detect)
   - **Name**: `no-more-tears-flask` (or your choice)
   
   **THEN - Set Root Directory:**
   - **Root Directory**: `backend` (without trailing slash)
   
   **Build & Start:**
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command**: `python -m gunicorn --bind 0.0.0.0:$PORT --timeout 600 --workers 2 wsgi:app`

5. **If Render still detects Bun:**
   - Go to **Settings** → **Environment**
   - Manually change **Runtime** from `Bun` to `Python 3`
   - Click **Save Changes**
   - Trigger a **Manual Deploy**

### Step 3: Set Environment Variables

In Render dashboard → **Environment**:
```
MONGODB_URI=mongodb+srv://...
TWELVELABS_API_KEY=...
TWELVELABS_INDEX_ID=...
BACKBOARD_API_KEY=...
```

### Step 4: Get Flask URL

Render provides a URL like:
```
https://no-more-tears-flask.onrender.com
```

**Update Express:**
```
FLASK_BASE_URL=https://no-more-tears-flask.onrender.com
```

---

## Option 3: Deploy to Vultr (Traditional VPS)

For full control and custom configurations.

### Step 1: Create Vultr Server

1. Create Ubuntu 22.04 server (2GB RAM minimum)
2. SSH into server: `ssh root@your-server-ip`

### Step 2: Install Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Python 3.10+
apt install python3.10 python3.10-venv python3-pip nginx -y

# Install MongoDB (if not using Atlas)
# Or skip if using MongoDB Atlas
```

### Step 3: Deploy Application

```bash
# Clone repository
cd /opt
git clone https://github.com/JacobChan182/HiReady.git
cd HiReady/backend

# Create virtual environment
python3.10 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
nano .env
# Add: MONGODB_URI, TWELVELABS_API_KEY, etc.
```

### Step 4: Configure Gunicorn Service

```bash
# Create systemd service
sudo nano /etc/systemd/system/flask-app.service
```

```ini
[Unit]
Description=Flask Application
After=network.target

[Service]
User=root
WorkingDirectory=/opt/HiReady/backend
Environment="PATH=/opt/HiReady/backend/.venv/bin"
ExecStart=/opt/HiReady/backend/.venv/bin/gunicorn --bind 0.0.0.0:5001 --timeout 600 --workers 2 wsgi:app

[Install]
WantedBy=multi-user.target
```

```bash
# Start service
sudo systemctl daemon-reload
sudo systemctl enable flask-app
sudo systemctl start flask-app
sudo systemctl status flask-app
```

### Step 5: Configure Nginx (Optional - for HTTPS)

```bash
sudo nano /etc/nginx/sites-available/flask-app
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/flask-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## After Deployment

### Update Express Backend

Once Flask is deployed, update your Express backend environment variable:

**In Vercel (for Express API):**
```
FLASK_BASE_URL=https://your-flask-url.com
```

### Update Frontend (Optional)

If Flask has a public API endpoint, you can set:
```
VITE_BACKEND_URL=https://your-flask-url.com/api
```

### Test Flask Deployment

```bash
# Health check
curl https://your-flask-url.com/health

# Should return:
# {"status": "ok", "server": "Flask"}
```

---

## Troubleshooting

### Flask Not Starting

1. **Check logs**:
   - Railway: Service → Deployments → View logs
   - Render: Logs tab
   - Vultr: `sudo journalctl -u flask-app -f`

2. **Check environment variables** are set correctly

3. **Check Gunicorn command** in Procfile matches your setup

### Timeout Issues

- Increase `--timeout 600` in Procfile/Gunicorn command (10 minutes)
- For very long tasks, consider background job queues (Celery + Redis)

### CORS Issues

- Flask already has `CORS(app)` configured
- Make sure your frontend URL is allowed

---

## Recommended Setup

**For your use case (video processing):**
1. **Express API** → Deployed on Vercel (fast, simple routes)
2. **Flask Backend** → Deployed on Railway or Render (long-running video tasks)

This gives you:
- ✅ Fast Express API responses (Vercel edge network)
- ✅ Long-running video processing (Railway/Render)
- ✅ Cost-effective (Vercel free + Railway free tier)

---

## Quick Start: Railway

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select repo → Add Service → Select `backend/` folder
4. Add environment variables (see above)
5. Deploy!

Railway will automatically:
- Detect Python
- Install from `requirements.txt`
- Use `Procfile` to start
- Provide HTTPS URL

Then set `FLASK_BASE_URL` in Vercel environment variables.

---

## Connecting Railway Flask to Vercel Deployment

After deploying Flask to Railway, you need to connect it to your Vercel deployment (frontend + Express).

### Step 1: Get Your Railway Flask URL

After deploying on Railway, you'll get a URL like:
```
https://your-app-name.up.railway.app
```

Test it works:
```bash
curl https://your-app-name.up.railway.app/health
# Should return: {"status":"ok","server":"Flask"}
```

### Step 2: Set Environment Variables in Vercel

Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

Add these variables:

#### For Express Backend (serverless functions):
```
FLASK_BASE_URL=https://your-app-name.up.railway.app
```

This tells Express where to send video upload/indexing requests.

#### For Frontend (built at build time):
```
VITE_BACKEND_URL=https://your-app-name.up.railway.app/api
```

This tells the frontend where to send chat API requests directly to Flask.

**Important:** 
- `FLASK_BASE_URL` is used by Express serverless functions (runtime)
- `VITE_BACKEND_URL` is embedded in the frontend build (build time)
- Both should point to your Railway Flask URL

### Step 3: Configure CORS on Flask

Make sure Flask allows requests from your Vercel domain. In `backend/app.py`, Flask already has `CORS(app)` which allows all origins. For production, you might want to restrict this:

```python
from flask_cors import CORS

# Allow specific origins in production
allowed_origins = [
    'https://your-vercel-app.vercel.app',
    'https://your-custom-domain.com'
]

if os.getenv('FLASK_ENV') == 'production':
    CORS(app, origins=allowed_origins)
else:
    CORS(app)  # Allow all in development
```

Or set it via environment variable:
```python
allowed_origins = os.getenv('CORS_ORIGINS', '*').split(',')
CORS(app, origins=allowed_origins if '*' not in allowed_origins else None)
```

### Step 4: Redeploy Vercel

After setting environment variables:

1. **Redeploy** your Vercel project to pick up the new `VITE_BACKEND_URL`
   - Go to **Deployments** → Click **...** → **Redeploy**
   - Or push a new commit to trigger a redeploy

2. **Verify** the connection:
   - Open your Vercel app
   - Check browser console for any CORS errors
   - Test chat functionality (uses `VITE_BACKEND_URL`)
   - Test video upload (Express uses `FLASK_BASE_URL`)

### Step 5: Test the Connection

#### Test Frontend → Flask (Chat API):
```javascript
// In browser console on your Vercel app
fetch(`${import.meta.env.VITE_BACKEND_URL}/backboard/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'test-123',
    user_role: 'student',
    message: 'Hello'
  })
})
.then(r => r.json())
.then(console.log)
```

#### Test Express → Flask (Video Upload):
Express should automatically use `FLASK_BASE_URL` when handling video uploads.

### Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐
│   Vercel (CDN)  │         │  Vercel Serverless│
│                 │         │   (Express API)   │
│  React Frontend │────────▶│   /api/upload     │────────▶┌──────────────┐
│                 │         │                   │         │              │
│  Chat API ──────┼─────────┼───────────────────┼────────▶│ Railway Flask│
│  (direct)       │         │                   │         │              │
└─────────────────┘         └───────────────────┘         └──────────────┘
```

- **Frontend → Flask**: Direct calls using `VITE_BACKEND_URL` (for chat)
- **Frontend → Express**: Calls to `/api/*` routes (handled by Vercel serverless functions)
- **Express → Flask**: Calls using `FLASK_BASE_URL` (for video indexing)

### Troubleshooting

**Error: CORS policy blocked**
- Check Flask CORS configuration allows your Vercel domain
- Verify `CORS_ORIGINS` environment variable in Railway

**Error: Cannot reach Flask**
- Verify `FLASK_BASE_URL` is set correctly in Vercel
- Test Railway URL directly: `curl https://your-app.up.railway.app/health`
- Check Railway logs for errors

**Error: Chat not working**
- Verify `VITE_BACKEND_URL` is set in Vercel
- Redeploy Vercel after setting `VITE_BACKEND_URL` (build-time variable)
- Check browser console for API errors
