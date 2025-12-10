# Environment Variables for Sunrise Youth International

## Required Variables

### MONGODB_URI
Your MongoDB Atlas connection string.
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

### ADMIN_USERNAME (optional)
Default admin username. Defaults to `admin` if not set.

### ADMIN_PASSWORD (optional)
Default admin password. Defaults to `admin123` if not set.

### JWT_SECRET (optional)
Secret key for JWT token generation. Defaults to `default_secret` if not set.
**Important**: Set a secure random string in production!

### FRONTEND_URL (optional)
Override for the frontend URL used in QR codes.
If not set, automatically detects from request headers.

Example: `https://your-custom-domain.com`

**Note**: You only need to set this if:
- Using a custom domain that differs from the API domain
- QR codes need to point to a different URL than the current domain

## Setting Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Click on "Environment Variables" in sidebar
4. Add each variable:
   - Name: `MONGODB_URI`
   - Value: `mongodb+srv://...`
   - Environment: Production (and Preview if needed)
5. Click "Save"
6. Redeploy your application for changes to take effect

## Updating Domain Name

When you change your domain name:
1. Update your custom domain in Vercel project settings
2. QR codes will automatically use the new domain for NEW members
3. Existing members' QR codes will still point to the old domain
4. To update existing QR codes, you can:
   - Set `FRONTEND_URL` environment variable to your new domain
   - Or re-register members to get new QR codes

## Custom Domain Setup

To use a custom domain (e.g., `sunrise-youth.org`):
1. In Vercel: Settings → Domains → Add your domain
2. Configure DNS records as instructed by Vercel
3. QR codes will automatically use your custom domain for all new registrations
4. No code changes needed!
