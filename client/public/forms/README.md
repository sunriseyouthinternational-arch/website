# Association Meeting Absence Forms

## ⚠️ REMINDER: Upload Your Form Template!

**ACTION REQUIRED**: Please upload your absence form template to this directory.

### Steps:
1. Create/prepare your absence form template (PDF recommended)
2. Place the file in this directory: `client/public/forms/`
3. Name it: `absence-form-template.pdf` (or `.png`, `.jpg`)
4. Commit and push the file to the repository

## Directory Structure

```
client/public/forms/
├── README.md (this file)
└── absence-form-template.pdf ⚠️ UPLOAD THIS FILE!
```

## Form Access

Once uploaded, members can download the form at:
- Development: `http://localhost:3000/forms/absence-form-template.pdf`
- Production: `https://your-domain.com/forms/absence-form-template.pdf`

## Supported File Formats

- PDF (.pdf) - **Recommended** for printable forms
- PNG (.png) - For image-based forms
- JPG (.jpg) - For image-based forms

## User Upload Storage: MongoDB

User-submitted completed forms are stored in MongoDB:
- Forms are stored as base64 encoded images
- Secure and integrated with existing database
- See implementation in `/api/association-meetings.js` (action=submit-absence)
