# Custom Domain Setup Guide: hiready.tech

This guide walks you through configuring your custom domain `hiready.tech` to work with your Vercel deployment.

## Step 1: Configure DNS in controlpanel.tech

1. **Log in to [controlpanel.tech](https://controlpanel.tech)**
2. **Navigate to DNS Management** for `hiready.tech`
3. **Add/Update DNS Records:**

### Option A: Root Domain (hiready.tech)

Add these records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 3600 (or Auto) |
| A | @ | 76.76.21.22 | 3600 (or Auto) |
| CNAME | www | cname.vercel-dns.com | 3600 (or Auto) |

**OR (Recommended)**: Use Vercel's DNS settings:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 3600 |
| A | @ | 76.76.21.22 | 3600 |

### Option B: Using CNAME (if A records don't work)

Some DNS providers support CNAME for root domains. If your provider supports it:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | @ | cname.vercel-dns.com | 3600 |
| CNAME | www | cname.vercel-dns.com | 3600 |

**Note:** You'll get the exact DNS values from Vercel in Step 2.

## Step 2: Add Domain in Vercel

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Select your project** (HiReady/NoMoreTears)
3. **Go to Settings → Domains**
4. **Click "Add Domain"**
5. **Enter:** `hiready.tech`
6. **Click "Add"**
7. **Vercel will show you DNS configuration:**
   - Copy the DNS records Vercel provides
   - They will look something like:
     ```
     Type: A
     Name: @
     Value: 76.76.21.21
     
     Type: A  
     Name: @
     Value: 76.76.21.22
     ```
8. **Optional - Add www subdomain:**
   - Click "Add Domain" again
   - Enter: `www.hiready.tech`
   - This will automatically redirect to `hiready.tech`

## Step 3: Update DNS in controlpanel.tech

1. **Go back to controlpanel.tech DNS settings**
2. **Update/Add the A records** that Vercel provided:
   - Type: `A`
   - Name: `@` (or leave blank for root domain)
   - Value: `76.76.21.21` (or whatever Vercel shows)
   - TTL: `3600` (or Auto)
   
   Repeat for the second A record if Vercel provides two.

3. **For www subdomain (optional):**
   - Type: `CNAME`
   - Name: `www`
   - Value: `cname.vercel-dns.com` (or whatever Vercel shows)
   - TTL: `3600`

4. **Save the DNS changes**

## Step 4: Wait for DNS Propagation

DNS changes can take **5 minutes to 48 hours** to propagate, but usually:
- **Most changes:** 5-30 minutes
- **Global propagation:** Up to 48 hours

**Check DNS propagation:**
```bash
# Check if DNS is resolving
nslookup hiready.tech

# Or use online tools:
# - https://dnschecker.org
# - https://www.whatsmydns.net
```

## Step 5: Verify Domain in Vercel

1. **Go back to Vercel → Settings → Domains**
2. **Wait for domain status to show "Valid Configuration"**
   - ✅ Green checkmark = DNS is configured correctly
   - ⏳ "Pending" = DNS is still propagating
   - ❌ "Invalid" = Check DNS settings

3. **Once valid, SSL certificate will be automatically provisioned** (usually takes 5-10 minutes)

## Step 6: Update Cloudflare R2 CORS (Video Storage)

Your Cloudflare R2 bucket needs to allow requests from the new domain:

1. **Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)**
2. **R2 → Your Bucket → Settings → CORS**
3. **Update CORS configuration:**

```json
[
  {
    "AllowedOrigins": [
      "https://hiready.tech",
      "https://www.hiready.tech",
      "https://hi-ready.vercel.app",
      "https://*.vercel.app",
      "http://localhost:5173"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["Content-Range", "Content-Length", "ETag", "Accept-Ranges"],
    "MaxAgeSeconds": 3600
  }
]
```

4. **Save** the CORS configuration

## Step 7: Update Environment Variables (Optional)

If you have any hardcoded references to the Vercel domain, you may want to update them, but Vercel will automatically route both domains.

The CORS configuration in `api/index.ts` has already been updated to include `https://hiready.tech`.

## Step 8: Test Your Domain

Once DNS has propagated:

1. **Visit:** `https://hiready.tech`
2. **You should see your Vercel deployment**
3. **Check browser console** for any CORS errors
4. **Test functionality:**
   - Login/Signup
   - Video upload
   - Quiz generation
   - Chat features

## Troubleshooting

### "Domain not resolving"

**Check:**
- DNS records are saved in controlpanel.tech
- Wait at least 30 minutes for propagation
- Use `nslookup hiready.tech` to check DNS

### "Invalid Configuration" in Vercel

**Check:**
- A records point to the correct IPs (76.76.21.21, 76.76.21.22)
- No typos in DNS records
- TTL is set correctly (3600 or Auto)

### "SSL Certificate Pending"

**Wait:** SSL certificates are automatically provisioned and can take 5-10 minutes after DNS is valid.

### "CORS Error" on hiready.tech

**Check:**
- `api/index.ts` has been updated (already done)
- Cloudflare R2 CORS includes `https://hiready.tech`
- Redeploy Vercel after code changes

### Domain works but redirects to vercel.app

**This is normal!** Vercel will serve your app on both domains. To make `hiready.tech` the primary:
- Vercel automatically serves both
- Users can access either domain
- Consider setting up a redirect from `www.hiready.tech` → `hiready.tech` (optional)

## Summary Checklist

- [ ] DNS records added in controlpanel.tech
- [ ] Domain added in Vercel Dashboard
- [ ] DNS records updated to match Vercel's requirements
- [ ] Wait for DNS propagation (check with nslookup)
- [ ] Verify domain shows "Valid" in Vercel
- [ ] Wait for SSL certificate (5-10 minutes after valid)
- [ ] Update Cloudflare R2 CORS to include `https://hiready.tech`
- [ ] Test `https://hiready.tech` in browser
- [ ] Verify all features work (login, upload, quiz, chat)

## After Setup

Your app will be accessible at:
- ✅ `https://hiready.tech` (custom domain)
- ✅ `https://www.hiready.tech` (if configured)
- ✅ `https://hi-ready.vercel.app` (still works)

Both domains point to the same deployment and share the same SSL certificate automatically managed by Vercel.
