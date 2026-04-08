# Google Sheets Member Sync - Implementation Summary

## What Was Implemented

A complete Google Sheets integration that automatically syncs all member data to a Google Spreadsheet in real-time.

## Files Created

1. **lib/googleSheets.js** - Core sync service
   - Authenticates with Google Sheets API using service account
   - Formats member data into spreadsheet rows
   - Handles individual member sync and bulk sync operations
   - Creates sheet and headers automatically

2. **GOOGLE_SHEETS_SETUP.md** - Complete setup guide
   - Step-by-step Google Cloud setup
   - Service account creation
   - Environment configuration
   - Troubleshooting guide

## Files Modified

1. **api/members.js** - Added sync hooks to:
   - Member registration (line 251)
   - Profile updates (line 575)
   - Membership upgrades (line 1055)
   - Upgrade approvals (line 1095)

2. **api/admin.js** - Added sheets sync endpoints:
   - `GET /api/admin?resource=sheets-sync` - Check sync status
   - `POST /api/admin?resource=sheets-sync` - Manually sync all members

3. **.env.example** - Added Google Sheets configuration variables

4. **.gitignore** - Added service account JSON file patterns

5. **package.json** - Added googleapis dependency

## How It Works

### Automatic Sync
Every time a member is created or updated, the system:
1. Saves the member to MongoDB
2. Populates the referredBy field
3. Calls `googleSheets.syncMember(member)`
4. Finds or creates the member's row in the sheet
5. Updates all 25 columns with current data

### Manual Sync
Admins can trigger a full sync via `POST /api/sheets-sync` to:
- Clear existing data
- Sync all members at once
- Useful for initial setup or recovery

### Data Synced (25 columns)
- Basic info: ID, name, gender, birth date
- Contact: phone, mobile, LINE info
- Membership: status, dates, payment info
- Referrals: referral code, referred by
- Counts: family members, coupons, enrollments
- Timestamps: created at, updated at

## Setup Required

Follow GOOGLE_SHEETS_SETUP.md to:
1. Create Google Cloud project
2. Enable Google Sheets API
3. Create service account and download JSON key
4. Create spreadsheet and share with service account
5. Add environment variables to .env

## Environment Variables

```env
GOOGLE_SHEET_ID=your_spreadsheet_id
GOOGLE_SHEET_NAME=Members
GOOGLE_SERVICE_ACCOUNT_PATH=./service-account-key.json
# OR for production:
# GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

## Error Handling

- Sync failures are logged but don't block member operations
- If spreadsheet ID is not configured, sync is skipped silently
- All errors include descriptive messages for troubleshooting

## Testing

1. Check configuration: `GET /api/admin?resource=sheets-sync`
2. Sync all members: `POST /api/admin?resource=sheets-sync`
3. Register new member and verify it appears in sheet
4. Update member profile and verify changes sync

## Next Steps

1. Follow GOOGLE_SHEETS_SETUP.md to configure Google Cloud
2. Add environment variables to .env
3. Test with `POST /api/admin?resource=sheets-sync`
4. Verify automatic sync on new registrations
