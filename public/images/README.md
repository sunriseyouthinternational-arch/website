# Images Folder

This folder contains static images for the website.

## Folder Structure

- **`/line-broadcast`** - Default image for LINE broadcast messages (class announcements)
- **`/rich-menu`** - Rich menu images for LINE Official Account

## LINE Broadcast Image

Place a default image in `/public/images/line-broadcast/` to be used in all LINE broadcast messages when announcing new classes.

**Requirements:**
- Aspect ratio: 20:13 (e.g., 1040 x 676 pixels)
- Format: JPG or PNG
- Must be accessible via HTTPS
- Recommended filename: `default.jpg` or `default.png`

**Usage:**
The image will be accessible at:
```
https://your-domain.com/images/line-broadcast/default.jpg
```

Update the LINE broadcast code to use this URL instead of class banner images.

## Rich Menu Image

Place your `rich-menu.png` file (2500 x 1686 pixels) in `/public/images/rich-menu/`.

Then update `lib/lineRichMenu.js` to use:
```javascript
const imagePath = '/images/rich-menu/rich-menu.png';
```

## How to Add Images

1. Add your image files to the appropriate subfolder
2. Commit and push your changes:
   ```bash
   git add public/images/
   git commit -m "Add images"
   git push
   ```

## Image Guidelines

- **LINE broadcast**: 1040 x 676px (20:13 aspect ratio)
- **Rich menu**: 2500 x 1686px (required by LINE)
- **Formats**: JPG, PNG
- **Optimization**: Compress images before uploading for better performance

## Note

Class and activity banner images are uploaded via the admin panel and stored in MongoDB as base64, not in this folder.
