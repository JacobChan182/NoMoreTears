# Testing Express Deployment on Vercel

This guide shows you how to test your Express backend deployment on Vercel.

## 📍 API Endpoints

Your Express backend is available at: `https://your-domain.vercel.app/api/*`

### Available Routes:
- **Health Check**: `/health`
- **Authentication**: `/api/auth/*`
  - `POST /api/auth/signup` - Register new user
  - `POST /api/auth/signin` - User login
  - `GET /api/auth/me` - Get current user
  - `POST /api/auth/logout` - Logout
- **Courses**: `/api/courses/*`
- **Students**: `/api/students/*`
- **Analytics**: `/api/analytics/*`
- **Upload**: `/api/upload/*`

---

## 🧪 Testing Methods

### Method 1: Health Check (Simplest)

**Test the health endpoint:**
```bash
# Replace YOUR_DOMAIN with your Vercel domain
curl https://YOUR_DOMAIN.vercel.app/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "server": "Express"
}
```

**In Browser:**
Visit: `https://YOUR_DOMAIN.vercel.app/health`

---

### Method 2: Using cURL

**Test Signup:**
```bash
curl -X POST https://YOUR_DOMAIN.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "role": "student"
  }'
```

**Test Signin:**
```bash
curl -X POST https://YOUR_DOMAIN.vercel.app/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "role": "student"
  }' \
  -c cookies.txt
```

**Test Get Current User (with cookies):**
```bash
curl https://YOUR_DOMAIN.vercel.app/api/auth/me \
  -b cookies.txt
```

---

### Method 3: Using Browser Console

**Open Browser DevTools (F12) → Console tab:**

```javascript
// Health check
fetch('https://YOUR_DOMAIN.vercel.app/health')
  .then(r => r.json())
  .then(console.log);

// Signup
fetch('https://YOUR_DOMAIN.vercel.app/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'test123',
    role: 'student'
  })
})
  .then(r => r.json())
  .then(console.log);

// Signin
fetch('https://YOUR_DOMAIN.vercel.app/api/auth/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'test123',
    role: 'student'
  })
})
  .then(r => r.json())
  .then(console.log);

// Get current user
fetch('https://YOUR_DOMAIN.vercel.app/api/auth/me', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(console.log);
```

---

### Method 4: Using Postman/Insomnia

1. **Health Check:**
   - Method: `GET`
   - URL: `https://YOUR_DOMAIN.vercel.app/health`

2. **Signup:**
   - Method: `POST`
   - URL: `https://YOUR_DOMAIN.vercel.app/api/auth/signup`
   - Headers: `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
       "email": "test@example.com",
       "password": "testpassword123",
       "role": "student"
     }
     ```

3. **Signin:**
   - Method: `POST`
   - URL: `https://YOUR_DOMAIN.vercel.app/api/auth/signin`
   - Headers: `Content-Type: application/json`
   - Enable: "Send cookies" / "Include cookies in requests"
   - Body (JSON):
     ```json
     {
       "email": "test@example.com",
       "password": "testpassword123",
       "role": "student"
     }
     ```

---

### Method 5: Test from Frontend

If your frontend is deployed, test through the UI:

1. **Navigate to your Vercel frontend URL**
2. **Try to signup/signin** - check browser DevTools Network tab
3. **Verify API calls** are going to `/api/auth/*` endpoints

**Check Browser Network Tab:**
- Open DevTools (F12) → Network tab
- Look for requests to `/api/*`
- Check response status codes (200 = success)

---

## 🔍 Debugging Tips

### 1. Check Vercel Function Logs

**In Vercel Dashboard:**
1. Go to your project → **Deployments**
2. Click on a deployment
3. Click **Functions** tab
4. Click on `/api` function
5. View logs for errors

### 2. Test Local Serverless Function (Optional)

**Install Vercel CLI:**
```bash
npm i -g vercel
```

**Run locally:**
```bash
vercel dev
```

This starts a local serverless environment similar to Vercel.

### 3. Common Issues

**CORS Errors:**
- Ensure `FRONTEND_URL` environment variable is set in Vercel
- Check allowed origins in `server/index.ts`

**Database Connection:**
- Ensure `MONGODB_URI` is set in Vercel environment variables
- Check Vercel function logs for connection errors

**Cookie Issues:**
- Ensure `credentials: 'include'` in fetch requests
- Check CORS `credentials: true` is set

---

## ✅ Quick Test Checklist

- [ ] Health check (`/health`) returns `{"status": "ok"}`
- [ ] Signup endpoint works (`POST /api/auth/signup`)
- [ ] Signin endpoint works (`POST /api/auth/signin`)
- [ ] Cookies are set correctly (check DevTools → Application → Cookies)
- [ ] `/api/auth/me` returns user data when authenticated
- [ ] CORS allows requests from frontend domain
- [ ] Database connections work (MongoDB)
- [ ] Error handling returns proper status codes

---

## 🚀 Quick Test Script

Save this as `test-api.sh`:

```bash
#!/bin/bash
DOMAIN="https://YOUR_DOMAIN.vercel.app"

echo "Testing Health Check..."
curl -s "$DOMAIN/health" | jq

echo -e "\n\nTesting Signup..."
curl -s -X POST "$DOMAIN/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","role":"student"}' \
  -c cookies.txt | jq

echo -e "\n\nTesting Signin..."
curl -s -X POST "$DOMAIN/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","role":"student"}' \
  -c cookies.txt | jq

echo -e "\n\nTesting Get Current User..."
curl -s "$DOMAIN/api/auth/me" \
  -b cookies.txt | jq

rm cookies.txt
```

**Run it:**
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 📞 Next Steps

Once Express is working:
1. Update frontend `VITE_API_URL` environment variable to your Vercel domain
2. Test full frontend + backend integration
3. Deploy Flask backend (if needed) separately
