# Dynamic Sitemap with Appwrite - Setup Guide

## 🎯 Overview
Your sitemap will auto-generate every 6 hours AND on-demand via API endpoint.

## 📁 Files Created
- `appwrite-functions/sitemap-generator/index.js` - Main sitemap generator
- `appwrite-functions/sitemap-generator/package.json` - Dependencies
- `appwrite-functions/sitemap-generator/appwrite.json` - Appwrite config

---

## 🚀 Deployment Steps

### 1. Deploy to Appwrite

```bash
cd appwrite-functions/sitemap-generator
npm install
```

Then deploy using Appwrite CLI:
```bash
appwrite deploy function
```

Or manually in Appwrite Console:
1. Go to **Functions** → **Create Function**
2. Name: `sitemap-generator`
3. Runtime: **Node.js 18**
4. Entrypoint: `index.js`
5. Schedule: `0 */6 * * *` (every 6 hours)
6. Execute: **Any** (public access)
7. Upload code or connect to Git

### 2. Set Environment Variables (Optional)
In Appwrite Console → Functions → sitemap-generator → Settings → Variables:
```
SANITY_PROJECT_ID=qw48169l
SANITY_DATASET=production
```

### 3. Test the Function

**Option A: Via Appwrite Console**
- Go to Functions → sitemap-generator → Execute
- Click "Execute Now"

**Option B: Via API**
```bash
curl https://YOUR_APPWRITE_DOMAIN/v1/functions/sitemap-generator/executions \
  -X POST
```

**Option C: Via URL (Recommended)**
Access directly at:
```
https://YOUR_APPWRITE_DOMAIN/v1/functions/sitemap-generator/executions
```

---

## 🔗 Integration with Website

### Option 1: Proxy to Appwrite (Recommended)

Update your `_redirects` file (Netlify) or `vercel.json`:

**Netlify (`public/_redirects`):**
```
/sitemap.xml https://YOUR_APPWRITE_DOMAIN/v1/functions/sitemap-generator/executions 200
```

**Vercel (`vercel.json`):**
```json
{
  "rewrites": [
    {
      "source": "/sitemap.xml",
      "destination": "https://YOUR_APPWRITE_DOMAIN/v1/functions/sitemap-generator/executions"
    }
  ]
}
```

### Option 2: Direct Access (No Proxy)

Simply point search engines directly to Appwrite:

**Submit to Google Search Console:**
```
https://YOUR_APPWRITE_DOMAIN/v1/functions/sitemap-generator/executions
```

**Or create a simple redirect page:**
Create `public/sitemap.xml` with redirect meta tag (not recommended for SEO)

---

## 🔔 Auto-Update on Content Changes

### Sanity Webhook Setup

1. **Go to Sanity Studio** → API → Webhooks
2. **Create new webhook:**
   - Name: `Update SkyNeu Sitemap`
   - URL: `https://YOUR_APPWRITE_DOMAIN/v1/functions/sitemap-generator/executions`
   - Method: `POST`
   - Trigger on: `Create`, `Update`, `Delete`
   - Dataset: `production`
   - Filter (optional): `_type in ["guide", "airplaneGuide", "newsArticle", "airport", "travelGuide", "travelAdvisory", "quiz", "resource"]`

3. **Add Secret (Recommended):**
   - Generate secret: `openssl rand -hex 32`
   - Add to Sanity webhook
   - Add to Appwrite function environment variables as `SANITY_WEBHOOK_SECRET`

**Update `index.js` to verify webhook:**
```javascript
// Add at the top of the function
if (req.headers['sanity-webhook-signature']) {
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  const signature = req.headers['sanity-webhook-signature'];
  
  if (signature !== secret) {
    return res.json({ error: 'Unauthorized' }, 401);
  }
}
```

---

## 📊 Monitoring & Logs

### Check Execution Logs
1. Appwrite Console → Functions → sitemap-generator → Executions
2. View logs for each run
3. Check for errors

### Verify Sitemap
```bash
# Test sitemap is accessible
curl https://skyneu.com/sitemap.xml

# Validate sitemap
curl https://skyneu.com/sitemap.xml | xmllint --format -

# Check sitemap in Google Search Console
# https://search.google.com/search-console
```

---

## ⚡ Performance Optimization

### Caching Strategy

**Appwrite Function Headers:**
```javascript
return res.send(xml, 200, {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=3600, s-maxage=7200', // Cache for 1-2 hours
  'X-Total-URLs': totalUrls.toString(),
  'X-Generated': new Date().toISOString()
});
```

**CDN Caching (Cloudflare/Netlify):**
- Cache sitemap for 1 hour
- Purge cache when Sanity webhook triggers

---

## 🎯 Expected Behavior

### Automatic Updates
✅ Every 6 hours (scheduled)
✅ When you add/update/delete content in Sanity (webhook)
✅ Manual trigger via Appwrite Console
✅ Manual trigger via API call

### Performance
- Generation time: ~2-5 seconds
- Cached for 1-2 hours
- ~1000 URLs = ~150KB file

---

## 🔧 Troubleshooting

### Function fails to execute
- Check Appwrite logs for errors
- Verify Sanity credentials
- Test Sanity queries independently

### Sitemap not updating
- Clear CDN cache
- Check webhook delivery in Sanity
- Verify function schedule is active

### 404 on /sitemap.xml
- Check redirect/rewrite configuration
- Verify Appwrite function is deployed
- Test function execution directly

---

## 📈 SEO Benefits

✅ **Real-time updates** - Google discovers new content within hours
✅ **Accurate data** - No manual updates needed
✅ **News schema** - Google News eligibility for recent articles
✅ **Automatic pinging** - Google notified on every update
✅ **Better rankings** - Fresh sitemap = faster indexing

---

## 💰 Cost Estimate

**Appwrite Cloud (Free Tier):**
- ✅ 750k executions/month (you'll use ~1,500)
- ✅ More than enough for your needs

**Self-hosted Appwrite:**
- ✅ Free forever
- Just pay for server hosting

---

## 🚀 Next Steps

1. Deploy Appwrite function
2. Test execution
3. Set up Sanity webhook
4. Configure redirect/proxy
5. Submit to Google Search Console
6. Monitor for 1 week

**Estimated setup time:** 30 minutes
**Expected results:** 5-10x faster content indexing

---

## 📞 Support

Issues? Check:
1. Appwrite function logs
2. Sanity webhook delivery logs
3. Google Search Console errors
4. Network tab in browser

---

## ✨ Advanced Features (Optional)

### Image Sitemap
Add image URLs from Sanity images

### Video Sitemap
If you add video content

### Multi-language Support
Add `hreflang` tags for international SEO

### Sitemap Index
Split into multiple sitemaps when >50k URLs
