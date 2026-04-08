# Google Sheets Integration Setup Guide

This guide will help you set up automatic syncing of member data to Google Sheets.

## Overview

The system automatically syncs member data to Google Sheets whenever:
- A new member registers
- A member updates their profile
- A member upgrades their membership
- An admin approves a membership upgrade

## Prerequisites

- A Google account
- Access to Google Cloud Console
- A Google Spreadsheet where you want to sync member data

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "Member Management")
4. Click "Create"

## Step 2: Enable Google Sheets API

1. In your Google Cloud project, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on it and press "Enable"

## Step 3: Create Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Enter service account details:
   - **Name**: `member-sync-service`
   - **Description**: `Service account for syncing member data to Google Sheets`
4. Click "Create and Continue"
5. Skip the optional steps (Grant access, Grant users access)
6. Click "Done"

## Step 4: Generate Service Account Key

1. In the "Credentials" page, find your service account under "Service Accounts"
2. Click on the service account email
3. Go to the "Keys" tab
4. Click "Add Key" → "Create new key"
5. Choose "JSON" format
6. Click "Create"
7. A JSON file will be downloaded to your computer
8. **Keep this file secure** - it contains credentials to access your Google Sheets

## Step 5: Create Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet
3. Name it (e.g., "Member Database")
4. Copy the spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
   ```
5. Share the spreadsheet with your service account:
   - Click "Share" button
   - Paste the service account email (from Step 3)
   - Give it "Editor" permissions
   - Uncheck "Notify people"
   - Click "Share"

## Step 6: Configure Environment Variables

Add the following to your `.env` file:

### Option A: Using JSON file path (Development)

```env
# Google Sheets Configuration
GOOGLE_SHEET_ID=your_spreadsheet_id_here
GOOGLE_SHEET_NAME=Members
GOOGLE_SERVICE_ACCOUNT_PATH=./path/to/service-account-key.json
```

### Option B: Using JSON string (Production)

```env
# Google Sheets Configuration
GOOGLE_SHEET_ID=your_spreadsheet_id_here
GOOGLE_SHEET_NAME=Members
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"..."}
```

**For production**, use Option B and paste the entire contents of the JSON file as a single-line string.

## Step 7: Test the Integration

### Test 1: Check Configuration

```bash
curl http://localhost:3000/api/sheets-sync
```

Expected response:
```json
{
  "message": "Google Sheets sync service is ready",
  "totalMembers": 10,
  "configured": true
}
```

### Test 2: Sync All Existing Members

```bash
curl -X POST http://localhost:3000/api/sheets-sync
```

Expected response:
```json
{
  "message": "成功同步 10 位會員 / Successfully synced 10 members",
  "count": 10
}
```

### Test 3: Register a New Member

Register a new member through your app and check that they appear in the Google Sheet automatically.

## Spreadsheet Structure

The system creates the following columns automatically:

| Column | Description |
|--------|-------------|
| Member ID | Unique member identifier (M0001, M0002, etc.) |
| Name | Member's full name |
| English Alias | English name or alias |
| Gender | 男 or 女 |
| Birth Date | Date of birth (YYYY-MM-DD) |
| Phone | Home phone number |
| Mobile | Mobile phone number |
| LINE ID | LINE contact ID |
| LINE User ID | LINE platform user ID |
| LINE Display Name | Display name from LINE |
| Registration Completed | Yes/No |
| Referral Code | Member's unique referral code |
| Referred By | Member ID of referrer |
| Points | Membership points |
| Membership Status | 會友 or 協會會員 |
| Membership Start Date | When membership started |
| Membership Upgraded Date | When upgraded to 協會會員 |
| Payment Status | pending or paid |
| Payment Method | in-person, linepay, or credit |
| Role | 一般會員 or 董事會 |
| Family Members Count | Number of family members |
| Coupons Count | Number of coupons owned |
| Enrollments Count | Number of class/activity enrollments |
| Created At | Account creation timestamp |
| Updated At | Last update timestamp |

## Troubleshooting

### Error: "Google service account credentials not configured"

- Make sure you've set either `GOOGLE_SERVICE_ACCOUNT_PATH` or `GOOGLE_SERVICE_ACCOUNT_JSON` in your `.env` file
- Verify the JSON file path is correct
- Check that the JSON content is valid

### Error: "The caller does not have permission"

- Make sure you've shared the spreadsheet with the service account email
- Give the service account "Editor" permissions
- Wait a few minutes for permissions to propagate

### Error: "Unable to parse range"

- Check that `GOOGLE_SHEET_NAME` matches the sheet tab name in your spreadsheet
- Default is "Members" - the system will create this tab automatically if it doesn't exist

### Members not syncing automatically

- Check server logs for sync errors
- Verify `GOOGLE_SHEET_ID` is set correctly
- Test manual sync with `POST /api/sheets-sync`
- Sync failures are logged but don't block member operations

## Security Best Practices

1. **Never commit** the service account JSON file to version control
2. Add `*-key.json` to your `.gitignore`
3. Use environment variables for production
4. Restrict service account permissions to only Google Sheets API
5. Regularly rotate service account keys
6. Monitor API usage in Google Cloud Console

## API Endpoints

### GET /api/sheets-sync
Check sync service status and configuration

### POST /api/sheets-sync
Manually sync all members to Google Sheets (admin use)

## Automatic Sync Triggers

The system automatically syncs member data on these events:

1. **New Registration** (`POST /api/members/register`)
2. **Profile Update** (`PUT /api/members?memberId=...`)
3. **Membership Upgrade** (`POST /api/members?action=upgrade-membership`)
4. **Upgrade Approval** (`PUT /api/members?action=approve-upgrade-request`)

All syncs are non-blocking - if sync fails, the main operation still succeeds and the error is logged.

## Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test Google Sheets API access manually
4. Check Google Cloud Console for API quota limits
