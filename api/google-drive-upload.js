const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const connectDB = require('../db/connect');
const AssociationMeeting = require('../db/models').AssociationMeeting;

/**
 * Google Drive Upload API for Absence Forms
 *
 * This endpoint uploads user-submitted absence forms to Google Drive
 * and stores the Google Drive file URL in MongoDB.
 *
 * Setup Required:
 * 1. Create a Google Cloud Project
 * 2. Enable Google Drive API
 * 3. Create a Service Account
 * 4. Download service account credentials JSON
 * 5. Share your Google Drive folder with the service account email
 * 6. Add credentials to .env file
 *
 * Environment Variables:
 * - GOOGLE_DRIVE_FOLDER_ID: The folder ID where forms will be uploaded
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL: Service account email
 * - GOOGLE_PRIVATE_KEY: Service account private key
 */

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Verify user authentication
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const { meetingId, formImage } = req.body;

    if (!meetingId || !formImage) {
      return res.status(400).json({ message: 'Meeting ID and form image are required' });
    }

    // Verify the meeting exists and is mandatory
    const meeting = await AssociationMeeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (!meeting.mandatory) {
      return res.status(400).json({ message: 'This meeting is not mandatory' });
    }

    // Check if user already submitted an absence request
    const existingAbsence = meeting.absences.find(
      absence => absence.memberId.toString() === decoded.userId
    );

    if (existingAbsence) {
      return res.status(400).json({
        message: 'You have already submitted an absence request for this meeting'
      });
    }

    // Check if Google Drive is configured
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.warn('Google Drive not configured, storing image as Base64 in database');

      // Fallback: Store in MongoDB (not recommended for production)
      meeting.absences.push({
        memberId: decoded.userId,
        memberName: decoded.name,
        memberIdString: decoded.memberId,
        requestedAt: new Date(),
        formImage: formImage // Base64 string
      });

      await meeting.save();

      return res.status(200).json({
        message: 'Absence request submitted successfully (stored locally)',
        warning: 'Google Drive storage not configured'
      });
    }

    // Initialize Google Drive API
    const auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/drive.file']
    );

    const drive = google.drive({ version: 'v3', auth });

    // Convert base64 to buffer
    const base64Data = formImage.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Create unique filename
    const timestamp = Date.now();
    const filename = `absence-form-${decoded.memberId}-${timestamp}.jpg`;

    // Upload to Google Drive
    const fileMetadata = {
      name: filename,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID || 'root']
    };

    const media = {
      mimeType: 'image/jpeg',
      body: require('stream').Readable.from(buffer)
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink'
    });

    // Make file accessible (optional - depends on your requirements)
    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone' // Change to 'user' or 'domain' for restricted access
      }
    });

    const fileUrl = file.data.webViewLink;

    // Store absence request with Google Drive URL
    meeting.absences.push({
      memberId: decoded.userId,
      memberName: decoded.name,
      memberIdString: decoded.memberId,
      requestedAt: new Date(),
      formImageUrl: fileUrl // Google Drive link instead of Base64
    });

    await meeting.save();

    return res.status(200).json({
      message: 'Absence request submitted successfully',
      fileUrl: fileUrl,
      fileId: file.data.id
    });

  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    return res.status(500).json({
      message: 'Failed to upload form',
      error: error.message
    });
  }
};
