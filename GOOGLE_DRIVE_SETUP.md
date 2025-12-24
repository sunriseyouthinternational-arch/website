# Google Drive Integration Setup Guide

This guide will help you set up Google Drive storage for user-submitted absence forms.

## Why Google Drive?

- ✅ **15 GB free storage** (enough for ~7,500 form images at 2 MB each)
- ✅ **Reliable and secure** (Google infrastructure)
- ✅ **Easy sharing** with your admin team
- ✅ **Familiar interface** for viewing/managing forms
- ✅ **Free forever** (no credit card required)

## Setup Steps

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Create Project"**
3. Name it: `sunrise-youth-forms` (or any name you prefer)
4. Click **"Create"**

### Step 2: Enable Google Drive API

1. In your project, go to **"APIs & Services"** > **"Library"**
2. Search for **"Google Drive API"**
3. Click on it and click **"Enable"**

### Step 3: Create a Service Account

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"Create Credentials"** > **"Service Account"**
3. Fill in:
   - **Service account name**: `form-uploader`
   - **Service account ID**: `form-uploader` (auto-filled)
   - **Description**: `Uploads absence forms to Google Drive`
4. Click **"Create and Continue"**
5. **Role**: Select **"Basic"** > **"Editor"** (or **"Drive File Creator"** for more restricted access)
6. Click **"Continue"** > **"Done"**

### Step 4: Create Service Account Key

1. On the **Credentials** page, find your service account in the list
2. Click on the service account email
3. Go to the **"Keys"** tab
4. Click **"Add Key"** > **"Create new key"**
5. Choose **JSON** format
6. Click **"Create"**
7. A JSON file will be downloaded - **keep this file safe!**

### Step 5: Create Google Drive Folder

1. Go to [Google Drive](https://drive.google.com/)
2. Click **"New"** > **"Folder"**
3. Name it: `Absence Forms`
4. Right-click the folder > **"Share"**
5. Paste your service account email (from the JSON file: `client_email` field)
   - Example: `form-uploader@sunrise-youth-forms.iam.gserviceaccount.com`
6. Set permission to **"Editor"**
7. Click **"Share"**
8. Get the folder ID:
   - Open the folder in Google Drive
   - Look at the URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
   - Copy the `FOLDER_ID_HERE` part

### Step 6: Add Credentials to .env File

Open your `.env` file and add these variables:

```bash
# Google Drive Configuration
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here
```

**Important Notes:**
- Get `GOOGLE_SERVICE_ACCOUNT_EMAIL` from the JSON file: `client_email` field
- Get `GOOGLE_PRIVATE_KEY` from the JSON file: `private_key` field
  - **Keep the quotes and newlines** (`\n`) in the private key!
  - Example: `"-----BEGIN PRIVATE KEY-----\nMIIEvQIB...\n-----END PRIVATE KEY-----\n"`
- Get `GOOGLE_DRIVE_FOLDER_ID` from the folder URL (Step 5)

### Step 7: Install Google APIs Package

```bash
npm install googleapis
```

### Step 8: Test the Integration

1. Start your server
2. Try submitting an absence form from the member portal
3. Check your Google Drive folder - you should see the uploaded image!

## File Organization in Google Drive

Uploaded files will be named:
```
absence-form-{memberID}-{timestamp}.jpg
```

Example:
```
absence-form-M001-1703425678901.jpg
absence-form-M002-1703425789012.jpg
```

## Viewing Uploaded Forms

### In Google Drive:
1. Go to your **"Absence Forms"** folder
2. Click on any image to view it
3. You can download, share, or organize forms as needed

### In Admin Panel:
- Forms will be displayed with a link to view them in Google Drive
- Admin can click the link to open the form in a new tab

## Security Considerations

1. **Service Account Permissions**: The service account only has access to the specific folder you shared
2. **File Privacy**: By default, uploaded files are private
   - Only people with access to the Drive folder can view them
   - The API sets files to `anyone with link can view` for easier admin access
   - To make more private: Modify `api/google-drive-upload.js` permissions

3. **Keep Credentials Safe**:
   - Never commit the service account JSON file to Git
   - Keep `.env` file in `.gitignore`
   - Don't share your private key publicly

## Troubleshooting

### Error: "Invalid grant"
- Check that your `GOOGLE_PRIVATE_KEY` includes proper newlines (`\n`)
- Make sure the key is wrapped in quotes in the `.env` file

### Error: "Insufficient permissions"
- Make sure you shared the Drive folder with the service account email
- Check that the service account has "Editor" permission

### Error: "File not found" (folder ID issue)
- Verify the `GOOGLE_DRIVE_FOLDER_ID` is correct
- Make sure the folder is shared with the service account

### Forms not appearing in Drive
- Check server logs for upload errors
- Verify your service account JSON credentials are correct
- Test API key validity in Google Cloud Console

## Cost

**100% FREE!**
- Google Drive: 15 GB free storage
- Google Cloud: Free tier includes Google Drive API usage
- No credit card required

## Alternative: MongoDB Fallback

If you don't set up Google Drive, the system will:
- Store images as Base64 in MongoDB (not recommended)
- Show a warning message
- Work, but fill up your MongoDB storage quickly

**Recommendation**: Set up Google Drive - it takes 10 minutes and gives you much better storage!

## Questions?

If you run into issues:
1. Check the [Google Drive API documentation](https://developers.google.com/drive/api/guides/about-sdk)
2. Review server logs for specific error messages
3. Verify all environment variables are set correctly
