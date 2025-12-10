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

### LINE_CHANNEL_ACCESS_TOKEN (required for LINE integration)
Your LINE Official Account Channel Access Token from LINE Developers Console.

Example: `eyJhbGciOiJIUzI1NiJ9...`

**⚠️ Security Warning**: This is a sensitive credential. Keep it secret!

### LINE_CHANNEL_SECRET (required for LINE integration)
Your LINE Official Account Channel Secret from LINE Developers Console.

Example: `df97801f0eff84318834996f09fc9375`

**⚠️ Security Warning**: This is a sensitive credential. Keep it secret!
**⚠️ Important**: If you accidentally exposed this secret, regenerate it immediately in LINE Developers Console!

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

## LINE Official Account Setup

### Step 1: Get Your LINE Credentials

1. Go to [LINE Developers Console](https://developers.line.biz/console/)
2. Select your provider and channel
3. Go to "Messaging API" tab
4. Find your **Channel Access Token** (long-term)
   - If not generated, click "Issue" button
5. Find your **Channel Secret** at the top of the page

### Step 2: Configure Webhook in LINE Console

1. In LINE Developers Console, go to "Messaging API" tab
2. Scroll to "Webhook settings"
3. Set Webhook URL to: `https://your-domain.vercel.app/api/line-webhook`
   - Replace `your-domain` with your actual Vercel domain
4. Enable "Use webhook"
5. Click "Verify" to test the webhook (make sure it's deployed first!)

### Step 3: Add Environment Variables in Vercel

1. Go to Vercel project → Settings → Environment Variables
2. Add `LINE_CHANNEL_ACCESS_TOKEN` with your token
3. Add `LINE_CHANNEL_SECRET` with your secret
4. Select "Production" and "Preview" environments
5. Click "Save"
6. Redeploy your application

### Step 4: Configure LINE Official Account Settings

In LINE Official Account Manager (not Developers Console):
1. Go to Settings → Response settings
2. **Disable** "Greeting message" (or customize it)
3. **Disable** "Auto-response" (webhook will handle messages)
4. **Enable** "Webhooks"

### Step 5: Test the Integration

1. Open LINE app on your phone
2. Add your LINE Official Account (scan QR code or search)
3. You should receive a welcome message with your member ID
4. Open the chat menu (tap the ≡ icon) to see your personalized QR code!

### Troubleshooting

**Webhook verification fails:**
- Make sure the environment variables are set in Vercel
- Redeploy after adding environment variables
- Check that the webhook URL is correct (no trailing slash)

**Rich menu not showing:**
- Check if you're on the free plan (limited to 1000 rich menus)
- Check Vercel logs for errors: `vercel logs`
- Rich menus may take 1-2 minutes to appear

**Security Note:**
If you shared your Channel Secret publicly (like in chat), regenerate it:
1. LINE Developers Console → Messaging API tab
2. Click "Reissue" next to Channel Secret
3. Update the environment variable in Vercel
4. Redeploy
