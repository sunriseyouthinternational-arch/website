# MongoDB Free Tier Limitations & Form Storage Guide

## MongoDB Atlas Free Tier (M0) Limitations

### Storage Limits
- **Maximum Storage**: 512 MB total database size
- **Shared RAM**: 512 MB (shared across cluster)
- **Shared vCPU**: Limited processing power
- **No backups**: Automatic backups not available on free tier

### Connection & Performance Limits
- **Maximum Connections**: 500 concurrent connections (shared across all users)
- **No sharding**: Cannot distribute data across multiple servers
- **No replica sets**: Limited to 3-node replica set (basic redundancy only)
- **Network transfer**: Subject to fair use limits

### Feature Restrictions
- **No Performance Advisor**: Advanced query optimization tools unavailable
- **No Data Lake**: Cannot query archived data
- **Limited alerting**: Basic alerts only
- **No dedicated support**: Community support only

### When You'll Hit Limitations

With your current website features, you'll likely hit the **512 MB storage limit** when:

1. **Member Data** (approx 5-10 KB per member)
   - 10,000 members ≈ 50-100 MB

2. **Class & Activity Data** (approx 10-50 KB per class/activity)
   - 1,000 classes/activities ≈ 10-50 MB

3. **Meeting Data** (approx 5-20 KB per meeting)
   - 1,000 meetings ≈ 5-20 MB

4. **Images Stored as Base64** (THIS IS THE PROBLEM!)
   - Profile pictures (500 KB each): 100 users = 50 MB
   - Banners (200 KB each): 50 banners = 10 MB
   - **Absence form images (1-2 MB each): 100 forms = 100-200 MB** ⚠️
   - Form images will quickly consume your entire database!

**Estimate**: Without proper file storage, you'll hit the limit with approximately:
- 500-1000 active members with profile pictures
- 200-300 absence form submissions
- 100-200 class/activity banners

---

## Best Practices for Form Storage

### ❌ What You're Currently Doing (NOT RECOMMENDED)

```javascript
// Storing images as Base64 in MongoDB
absences: [{
  formImage: { type: String } // Base64 encoded image (1-2 MB each!)
}]
```

**Problems:**
- 1 MB image becomes ~1.3 MB as Base64 (33% overhead)
- MongoDB document size limit: 16 MB
- Wastes database storage on binary data
- Slow queries when loading images
- No CDN caching benefits

### ✅ Recommended Solution: External File Storage

You have several options, ranked by recommendation:

---

## Option 1: Cloudinary (RECOMMENDED for your use case)

**Why Cloudinary:**
- ✅ **Free tier**: 25 GB storage, 25 GB bandwidth/month
- ✅ **Image optimization**: Automatic compression and format conversion
- ✅ **CDN**: Fast delivery worldwide
- ✅ **Easy integration**: Simple API
- ✅ **Image transformations**: Resize, crop, watermark on-the-fly
- ✅ **No server storage needed**: Direct upload from browser

**Free Tier Limits:**
- Storage: 25 GB
- Bandwidth: 25 GB/month
- Transformations: 25,000/month
- **Enough for**: ~12,500 form images (2 MB each)

**Implementation:**

```javascript
// Install: npm install cloudinary

// In your backend (api/upload.js):
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.body.image, {
        folder: 'absence-forms',
        resource_type: 'image',
        transformation: [
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      });

      // Store only the URL in MongoDB (tiny!)
      return res.json({ url: result.secure_url });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
};

// In your schema:
absences: [{
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  formImageUrl: { type: String }, // Just the URL! (100 bytes vs 1-2 MB)
  requestedAt: { type: Date, default: Date.now }
}]
```

**Frontend Upload:**
```javascript
const handleFormUpload = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'your_preset'); // Create in Cloudinary dashboard

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  const data = await response.json();
  return data.secure_url; // Store this URL in MongoDB
};
```

---

## Option 2: AWS S3 (Good for scaling)

**Why AWS S3:**
- ✅ **Free tier**: 5 GB storage, 20,000 GET requests, 2,000 PUT requests/month (12 months)
- ✅ **After free tier**: Very cheap ($0.023 per GB/month)
- ✅ **Unlimited scalability**: Grows with your needs
- ✅ **Integration with AWS ecosystem**

**Free Tier Limits (first 12 months):**
- Storage: 5 GB
- **Enough for**: ~2,500 form images (2 MB each)

**After Free Tier Pricing:**
- Storage: $0.023 per GB/month (very affordable)
- 100 GB = ~$2.30/month
- **Much cheaper than upgrading MongoDB to paid tier!**

**Implementation:**

```javascript
// Install: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Upload file to S3
const uploadToS3 = async (file, filename) => {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `absence-forms/${filename}`,
    Body: file,
    ContentType: 'image/jpeg'
  });

  await s3Client.send(command);
  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/absence-forms/${filename}`;
};
```

---

## Option 3: Vercel Blob Storage (Easiest if using Vercel)

**Why Vercel Blob:**
- ✅ **If deploying on Vercel**: Seamless integration
- ✅ **Generous free tier**: 1 GB storage, 100 GB bandwidth/month
- ✅ **Simple API**: Dead simple to use
- ✅ **Fast CDN**: Vercel's global edge network

**Free Tier Limits:**
- Storage: 1 GB
- Bandwidth: 100 GB/month
- **Enough for**: ~500 form images (2 MB each)

**Implementation:**

```javascript
// Install: npm install @vercel/blob

import { put } from '@vercel/blob';

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  const blob = await put(filename, request.body, {
    access: 'public',
  });

  return Response.json(blob);
}

// Returns: { url: 'https://xyz.public.blob.vercel-storage.com/...' }
```

---

## Option 4: Firebase Storage (Good for real-time features)

**Why Firebase:**
- ✅ **Free tier**: 5 GB storage, 1 GB/day downloads
- ✅ **Real-time sync**: Good if you add real-time features later
- ✅ **Easy authentication**: Integrates with Firebase Auth
- ✅ **Direct client uploads**: No backend needed

**Free Tier Limits:**
- Storage: 5 GB
- Downloads: 1 GB/day, 50,000 reads/day
- **Enough for**: ~2,500 form images

---

## Option 5: Keep Files on Your Server (NOT RECOMMENDED)

**Why NOT recommended:**
- ❌ Storage costs on hosting platform
- ❌ No CDN (slow for users far from server)
- ❌ Server restart = potential data loss
- ❌ Scaling issues
- ❌ Backup complexity

**Only use if:**
- Very small user base (<100 users)
- Temporary/prototype deployment
- You have existing file server infrastructure

---

## Recommended Architecture for Your Project

### Current State (Problematic)
```
[User uploads form] → [Convert to Base64] → [Store in MongoDB] → [Database full!]
                                              ↓
                                         512 MB limit
                                         Fills with ~200 forms
```

### Recommended State (Scalable)
```
[User uploads form] → [Upload to Cloudinary] → [Get URL] → [Store URL in MongoDB]
                           ↓                                      ↓
                      25 GB free storage                    Uses ~100 bytes
                      ~12,500 forms                         Almost unlimited
```

### Migration Path

1. **Immediate** (Now):
   - Create Cloudinary account (free)
   - Add upload endpoint
   - Store URLs instead of Base64

2. **When you grow** (500+ active users):
   - Upgrade MongoDB to M10 ($57/month for 10 GB)
   - OR stay on free tier with external storage (recommended)

3. **When scaling** (5,000+ users):
   - Consider AWS S3 for cost optimization
   - Implement CDN caching
   - Use image optimization pipeline

---

## Cost Comparison: MongoDB Paid vs External Storage

### Scenario: 1,000 absence form images (2 GB total)

**Option A: Upgrade MongoDB**
- M10 Cluster: $57/month (10 GB storage)
- **Total: $684/year**
- ❌ Still limited to 10 GB
- ❌ Slow image delivery (no CDN)
- ❌ No image optimization

**Option B: Free MongoDB + Cloudinary**
- MongoDB M0: $0/month (free)
- Cloudinary: $0/month (free up to 25 GB)
- **Total: $0/year**
- ✅ 25 GB storage
- ✅ Fast CDN delivery
- ✅ Automatic image optimization
- ✅ 25,000 transformations/month

**Winner: Option B by far!**

---

## Implementation Checklist for Your Project

### Immediate Actions (This Week):

- [x] Create `client/public/forms/` directory for form templates
- [ ] Sign up for Cloudinary (free): https://cloudinary.com/users/register_free
- [ ] Get Cloudinary credentials (Cloud name, API key, API secret)
- [ ] Add to `.env`:
  ```
  CLOUDINARY_CLOUD_NAME=your_cloud_name
  CLOUDINARY_API_KEY=your_api_key
  CLOUDINARY_API_SECRET=your_api_secret
  ```
- [ ] Install Cloudinary: `npm install cloudinary`
- [ ] Create upload API endpoint (see implementation above)
- [ ] Update member UI to upload form images to Cloudinary
- [ ] Store Cloudinary URLs (not Base64) in MongoDB

### Short Term (Next 2 Weeks):

- [ ] Test absence form upload flow
- [ ] Add form template PDF to `client/public/forms/`
- [ ] Implement download button for form template
- [ ] Add admin panel to view uploaded absence forms
- [ ] Test with real form image uploads

### Long Term (Next 3 Months):

- [ ] Monitor MongoDB storage usage
- [ ] Monitor Cloudinary usage
- [ ] Set up alerts for approaching limits
- [ ] Plan for scaling if needed

---

## Database Size Monitoring

Add this to your admin panel to track MongoDB usage:

```javascript
// In your admin dashboard API
const mongoose = require('mongoose');

module.exports = async (req, res) => {
  const db = mongoose.connection.db;
  const stats = await db.stats();

  return res.json({
    storageSize: (stats.storageSize / 1024 / 1024).toFixed(2) + ' MB',
    dataSize: (stats.dataSize / 1024 / 1024).toFixed(2) + ' MB',
    indexSize: (stats.indexSize / 1024 / 1024).toFixed(2) + ' MB',
    percentUsed: ((stats.dataSize / (512 * 1024 * 1024)) * 100).toFixed(2) + '%',
    limit: '512 MB (Free Tier)'
  });
};
```

---

## Summary & Recommendations

### For Form Storage: Use Cloudinary ✅
- **Best free tier**: 25 GB storage
- **Best features**: CDN, optimization, transformations
- **Best for your use case**: Image-heavy uploads
- **Migration effort**: Low (simple API)

### For MongoDB: Stay on Free Tier ✅
- **With external file storage**: Free tier is more than enough
- **Your data (without images)**:
  - 10,000 members: ~100 MB
  - 1,000 classes: ~50 MB
  - 1,000 meetings: ~20 MB
  - **Total: ~170 MB (33% of free tier)**

### When to Upgrade MongoDB:
- Only if you exceed 512 MB of **text data** (member info, classes, etc.)
- NOT for storing files (use external storage instead)
- Realistically: Won't need to upgrade for years with external file storage

---

## Questions or Issues?

If you encounter any problems during implementation:
1. Check MongoDB Atlas dashboard for storage usage
2. Check Cloudinary dashboard for bandwidth usage
3. Review error logs for upload failures
4. Test with small images first (< 500 KB)

Good luck with your implementation! 🚀
