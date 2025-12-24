# LINE Official Account Integration

## Overview

This system integrates with LINE Messaging API to provide each member with a **personalized rich menu** containing their unique profile QR code.

## How It Works

### User Flow

1. **User adds your LINE Official Account**
   - Opens LINE app and scans your Official Account QR code
   - Taps "Add Friend"

2. **Automatic member registration**
   - System receives "follow" event via webhook
   - Creates new member profile with:
     - Unique member ID (e.g., M123456789)
     - LINE display name
     - LINE profile picture
     - Unique profile URL

3. **Rich menu generation**
   - Generates QR code for profile URL
   - Creates personalized rich menu image with:
     - Member's QR code
     - Member ID display
     - Navigation buttons
   - Uploads and links to user's LINE account

4. **User sees their personal QR code**
   - Opens chat with your Official Account
   - Taps menu icon (≡) at bottom
   - Sees their personalized QR code
   - Can tap to view full profile or get member ID

### Technical Architecture

```
LINE User → LINE Platform → Webhook → Your Vercel API
                                          ↓
                                    MongoDB (create member)
                                          ↓
                                    Generate QR code
                                          ↓
                                    Create rich menu image
                                          ↓
                                    Upload to LINE
                                          ↓
                                    Link to user
```

## Setup Instructions

See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for detailed setup steps.

### Quick Start

1. **Get LINE credentials** from [LINE Developers Console](https://developers.line.biz/console/)
2. **Add environment variables** in Vercel:
   - `LINE_CHANNEL_ACCESS_TOKEN`
   - `LINE_CHANNEL_SECRET`
3. **Deploy to Vercel**
4. **Set webhook URL** in LINE Console:
   - `https://your-domain.vercel.app/api/line-webhook`
5. **Test**: Add your Official Account on LINE app

## Rich Menu Design

### Current Layout (2500 x 1686 pixels)

```
┌─────────────────────────────────────┐
│         Top Section (843px)         │
│                                     │
│      我的專屬 QR Code                 │
│      My Personal QR Code            │
│                                     │
│         [QR CODE IMAGE]             │
│                                     │
│   團員編號 Member ID: M123456789     │
│                                     │
├──────────────────┬──────────────────┤
│  Left Button     │  Right Button    │
│    (843px)       │    (843px)       │
│                  │                  │
│  查看個人檔案      │  我的團員編號      │
│  View Profile    │  My Member ID    │
│                  │                  │
└──────────────────┴──────────────────┘
```

### Button Actions

- **Top area (QR code)**: Tapping opens profile URL
- **Bottom left (Green)**: Opens profile URL in browser
- **Bottom right (Orange)**: Sends message "我的團員編號 My Member ID" (bot replies with member ID)

### Customizing Rich Menu

To customize the design, edit `/lib/lineRichMenu.js`:

1. **Change colors**: Modify `fill` attributes in SVG
2. **Change text**: Edit text elements
3. **Change layout**: Adjust `bounds` in `areas` array
4. **Change dimensions**: Update `size` (2500x1686 tall or 2500x843 short)

## Features

### Implemented ✅

- [x] Automatic member creation on LINE follow
- [x] Personalized QR code generation
- [x] Rich menu with embedded QR code
- [x] Bilingual support (Chinese/English)
- [x] Member ID lookup via message
- [x] Profile URL linking
- [x] Unfollow handling

### Future Enhancements 🚀

- [ ] Profile update via LINE chat
- [ ] Class/activity enrollment via LINE
- [ ] Payment notifications via LINE
- [ ] Broadcast messages to all members
- [ ] Event reminders
- [ ] Flex messages for better formatting

## API Endpoints

### `/api/line-webhook`

**Method**: POST
**Purpose**: Receives events from LINE Platform

**Events Handled**:
- `follow` - User adds Official Account → Create member + rich menu
- `unfollow` - User blocks/removes account → Log event
- `message` - User sends message → Reply with member info (if request member ID)

**Authentication**: LINE signature verification

## Database Schema

### Member Schema Updates

```javascript
{
  memberId: "M123456789",
  name: "LINE Display Name",
  line: {
    userId: "U1234567890abcdef",     // LINE user ID
    displayName: "Display Name",      // LINE profile name
    pictureUrl: "https://...",        // LINE profile picture
    richMenuId: "richmenu-abc123",    // Assigned rich menu ID
    linkedAt: Date                    // When linked
  },
  // ... rest of member fields
}
```

## Monitoring & Debugging

### Check Logs in Vercel

```bash
vercel logs --follow
```

### Common Issues

**Rich menu not appearing:**
- Wait 1-2 minutes after follow
- Check if user has other rich menus from other bots
- Verify webhook is receiving events

**QR code not working:**
- Verify `FRONTEND_URL` environment variable
- Check profile URL format
- Ensure member profile page is accessible

**Webhook errors:**
- Verify `LINE_CHANNEL_SECRET` is correct
- Check signature validation
- Ensure MongoDB connection is working

### Test Webhook Locally

You can't test LINE webhooks locally without a public URL. Use:
- **ngrok** to expose localhost
- **Vercel preview deployments**

## Security Considerations

1. **Channel Secret**: Keep secret, never commit to git
2. **Signature Verification**: Always verify LINE signatures (already implemented)
3. **Rate Limiting**: LINE has API rate limits (free plan: 500 push messages/month)
4. **Data Privacy**: Store only necessary LINE data, comply with LINE Terms of Service

## Support

For LINE API issues:
- [LINE Developers Documentation](https://developers.line.biz/en/docs/messaging-api/)
- [LINE Developers Community](https://www.line-community.me/)

For this integration issues:
- Check Vercel logs
- Verify environment variables
- Test webhook URL with LINE Console's verify function
