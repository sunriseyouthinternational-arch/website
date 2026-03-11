# LINE Rich Menu Troubleshooting

## Issue: Rich Menu Not Showing After Updates

If you've made changes to the rich menu configuration but users don't see the updated menu, this is because:

1. **Old Rich Menus Need to be Deleted**: Each user's LINE account is linked to a specific rich menu ID. When you update the rich menu code, existing users still see their old menu.
2. **New Users Get Updated Menu**: Only new users (those who follow the account after the update) will automatically get the new rich menu.

## Solution: Regenerate Rich Menus

Use the `/api/admin` endpoint with `resource=line-rich-menu&action=regenerate` to regenerate rich menus for existing members.

### Usage Options

#### 1. Regenerate for ALL Members
```bash
GET https://www.sunriseyouth.org/api/admin?resource=line-rich-menu&action=regenerate
```

This will:
- Find all members with completed registration and linked LINE accounts
- Delete their old rich menus
- Create new rich menus with updated configuration
- Link new menus to their LINE accounts

#### 2. Regenerate for Specific Member
```bash
GET https://www.sunriseyouth.org/api/admin?resource=line-rich-menu&action=regenerate&memberId=M0001
```

#### 3. Regenerate by LINE User ID
```bash
GET https://www.sunriseyouth.org/api/admin?resource=line-rich-menu&action=regenerate&lineUserId=U1234567890abcdef
```

## Current Rich Menu Configuration

### Button Layout (Updated)

```
┌─────────────────────────────────────────────────────┐
│                  TOP ROW (Y: 0-843)                 │
│  [個人資料 會員管理 Membership]                       │
│  → Opens: /profile/:memberId                        │
├──────────────────┬─────────────────┬────────────────┤
│   課程/活動       │   點數/禮物      │   邀請碼        │
│ Classes &        │  Points &       │  Referral      │
│ Activities       │  Gifts          │  Code          │
│ (Y: 843-1686)    │ (Y: 843-1686)   │ (Y: 843-1686)  │
│ X: 0-833        │ X: 834-1667     │ X: 1667-2500   │
│                  │                 │                │
│ → LINK           │ → LINK          │ → MESSAGE      │
│ ?tab=courses     │ ?tab=points     │ "邀請碼"       │
└──────────────────┴─────────────────┴────────────────┘
```

### Button Actions

1. **Top Button**: Opens profile tab
   - URL: `/profile/:memberId`

2. **Bottom-Left Button**: Opens classes & activities tab
   - URL: `/profile/:memberId?tab=courses`
   - Shows personalized view of enrolled vs available classes

3. **Bottom-Middle Button**: Opens points & gifts tab ⭐ **UPDATED**
   - URL: `/profile/:memberId?tab=points`
   - Shows member points and gift redemption (under construction)
   - **CHANGED FROM**: Message "點數/禮物 Points & Gifts"
   - **CHANGED TO**: Direct link to points tab

4. **Bottom-Right Button**: Sends referral code message
   - Action: Sends message "邀請碼 Referral Code"
   - Webhook handles and returns referral code

## How to Test

### 1. Using Browser (Development)

Test the endpoints directly:
```bash
# For specific member
curl "https://www.sunriseyouth.org/api/admin?resource=line-rich-menu&action=regenerate&memberId=M0001"

# For all members
curl "https://www.sunriseyouth.org/api/admin?resource=line-rich-menu&action=regenerate"
```

### 2. Response Format

Success response:
```json
{
  "success": true,
  "message": "Processed 1 member(s)",
  "summary": {
    "total": 1,
    "success": 1,
    "failed": 0
  },
  "results": [
    {
      "memberId": "M0001",
      "name": "John Doe",
      "lineUserId": "U1234567890abcdef",
      "richMenuId": "richmenu-abc123",
      "success": true
    }
  ]
}
```

### 3. Verify in LINE App

After regenerating:
1. Open LINE app
2. Go to the official account chat
3. Look at bottom menu bar
4. You should see the updated rich menu image
5. Test each button to verify correct behavior

## Important Notes

### When to Regenerate Rich Menus

You need to regenerate rich menus whenever you:
- ✅ Update button actions (URLs, messages)
- ✅ Change rich menu image
- ✅ Modify button areas/bounds
- ✅ Update domain names
- ✅ Add/remove buttons

### Automatic Rich Menu Creation

New users automatically get the latest rich menu:
- When they follow the official account (webhook `handleFollowEvent`)
- After completing registration (webhook creates personalized menu)

### Domain Configuration

The rich menu uses the domain from:
1. `process.env.FRONTEND_URL` (if set)
2. Request headers `x-forwarded-host` or `host`
3. Fallback: `https://www.sunriseyouth.org`

Current domain: **www.sunriseyouth.org**

## Troubleshooting Checklist

If rich menu still not showing:

- [ ] Run regenerate API endpoint for the affected user
- [ ] Check LINE Developer Console for any rich menu errors
- [ ] Verify `richmenu.png` exists at `/public/images/rich-menu/richmenu.png`
- [ ] Confirm image is exactly 2500 x 1686 pixels
- [ ] Check member's `line.richMenuId` is saved in database
- [ ] Verify LINE channel access token is valid
- [ ] Test with fresh LINE account to rule out caching issues

## Manual Cleanup (LINE Developer Console)

If automated regeneration fails, you can manually delete old rich menus:

1. Go to [LINE Developers Console](https://developers.line.biz/)
2. Select your Official Account channel
3. Go to "Rich menus" section
4. Delete all old rich menus
5. Run the regenerate API endpoint

## Files Involved

- `/lib/lineRichMenu.js` - Rich menu creation logic
- `/api/line-webhook.js` - Handles follow events and messages
- `/api/admin.js` - Admin endpoints including rich menu setup and regeneration
- `/public/images/rich-menu/richmenu.png` - Rich menu image
- `/client/src/pages/Profile.js` - Profile page with tabs

## Recent Changes (2024)

### December 11, 2024
- ✅ Changed bottom-middle button from message to URI action
- ✅ Button now opens `/profile/:memberId?tab=points` directly
- ✅ Updated all domain references from `website-five-chi-99.vercel.app` to `www.sunriseyouth.org`
- ✅ Integrated classes/activities into profile courses tab
- ✅ Created points & gifts tab in profile page
- ✅ Removed standalone `/classes-activities` and `/redeem-gifts` pages
- ⚠️ **ACTION REQUIRED**: Run regenerate API for all existing members to see updates
