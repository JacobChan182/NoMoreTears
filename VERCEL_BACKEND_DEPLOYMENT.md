# Deploying Express & Flask Backends to Vercel

This guide explains how to deploy both your Express (Node.js) and Flask (Python) backends to Vercel as serverless functions.

## ⚠️ Important Considerations

**Vercel Serverless Limitations:**
- **Function Timeout**: 10 seconds (Hobby), 60 seconds (Pro), up to 300 seconds (Enterprise)
- **Cold Starts**: First request after inactivity may be slower
- **File Size Limits**: 4.5MB (Hobby), 50MB (Pro) for function code
- **Request Body Size**: 4.5MB limit (Hobby)

**Video Processing Warning**: 
Your Flask backend does video indexing/processing which may exceed timeout limits. Consider:
1. Using background jobs/queues (e.g., Vercel Cron + background processing)
2. Deploying Flask to a traditional server (Vultr, Railway, Render) for long-running tasks
3. Using Vercel Pro for 60s timeouts

## Option 1: Deploy Both to Vercel (Recommended for Simple APIs)

### Express Backend Setup

Vercel automatically detects Express apps. Create an API handler:

**1. Create `api/index.js` in your project root:**

```javascript
// This will handle all /api/* routes
import server from '../server/index.js';

export default server;
```

**2. Update `server/index.ts` to export the Express app:**

```typescript
// At the end of server/index.ts, replace app.listen() with:
export default app;

// For local development, keep the listen block:
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}
```

**3. Update `vercel.json` to include API routes:**

```json
{
  "buildCommand": "npm run build:frontend",
  "outputDirectory": "frontend/dist",
  "devCommand": "npm run dev:frontend",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Flask Backend Setup

**1. Create `api/py/index.py` (Python serverless function handler):**

```python
from flask import Flask
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../backend'))

from app import create_app

app = create_app()

# Export handler for Vercel
def handler(request):
    return app(request.environ, lambda status, headers: None)
```

**2. Create `api/py/requirements.txt`:**

```txt
flask==3.1.2
flask-cors==6.0.2
python-dotenv>=1.0.0
pymongo>=4.0.0
dnspython>=2.0.0
twelvelabs==1.2.0b0
backboard-sdk==1.4.7
```

**3. Update `vercel.json` with Python runtime:**

```json
{
  "buildCommand": "npm run build:frontend",
  "outputDirectory": "frontend/dist",
  "functions": {
    "api/py/**/*.py": {
      "runtime": "python3.9"
    }
  },
  "rewrites": [
    {
      "source": "/api/py/(.*)",
      "destination": "/api/py"
    },
    {
      "source": "/api/(.*)",
      "destination": "/api"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Option 2: Deploy Express to Vercel, Flask Elsewhere (Recommended)

Given the video processing requirements, you might want to:

1. **Deploy Express to Vercel** (for API routes)
2. **Deploy Flask to a traditional server** (Vultr, Railway, Render, Heroku) for long-running video processing

This is recommended because:
- Video indexing can take minutes
- Vercel's 60s timeout (Pro) may not be enough
- Background processing is better suited for traditional servers

### Deploy Flask to Railway/Render (Alternative)

**Railway** (https://railway.app):
- Supports Python/Flask natively
- Automatic deploys from Git
- Free tier available

**Render** (https://render.com):
- Free tier for web services
- Python/Flask support
- Background workers available

**Steps for Render:**
1. Create `render.yaml`:
```yaml
services:
  - type: web
    name: flask-backend
    env: python
    buildCommand: pip install -r backend/requirements.txt
    startCommand: cd backend && gunicorn app:app --bind 0.0.0.0:$PORT
    envVars:
      - key: MONGODB_URI
        sync: false
      - key: TWELVELABS_API_KEY
        sync: false
      - key: BACKBOARD_API_KEY
        sync: false
```

2. Point your frontend's `VITE_API_URL` to the Render URL

## Option 3: Monorepo with Separate Vercel Projects

Deploy frontend, Express, and Flask as **separate Vercel projects**:

1. **Frontend**: Current Vercel project
2. **Express API**: New Vercel project with `vercel.json` pointing to `server/`
3. **Flask API**: New Vercel project with Python runtime

This gives you:
- Independent scaling
- Separate environment variables
- Different timeout limits per service

## Environment Variables

In each Vercel project, set:

**For Express:**
- `MONGODB_URI`
- `PORT` (optional, Vercel manages this)
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
- `FRONTEND_URL` (your frontend Vercel URL)

**For Flask:**
- `MONGODB_URI`
- `TWELVELABS_API_KEY`
- `BACKBOARD_API_KEY`

## Recommended Approach

**Best for your use case:**
1. ✅ **Frontend**: Deploy to Vercel (current setup)
2. ✅ **Express**: Deploy to Vercel as serverless functions
3. ⚠️ **Flask**: Deploy to Railway/Render for video processing (avoids timeout issues)

This gives you:
- Fast API responses from Express (Vercel's edge network)
- Reliable video processing from Flask (no timeout limits)
- Separate scaling and cost control

## Quick Start: Express on Vercel

1. **Update `server/index.ts`** to export the app:
```typescript
// ... existing code ...

export default app;

// Keep listen for local dev
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}
```

2. **Create `api/index.js`**:
```javascript
import app from '../server/index.js';
export default app;
```

3. **Deploy**: Push to GitHub, Vercel will detect and deploy

The Express backend will be available at `https://your-domain.vercel.app/api/*`
