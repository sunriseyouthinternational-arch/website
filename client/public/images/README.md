# Images Folder

This folder contains static images for the website.

## Folder Structure

- **`/line-broadcast`** - Default image for LINE broadcast messages (class announcements)
- **`/profile_pics`** - Default profile pictures (male.jpg, female.jpg)
- **`/richmenu`** - Rich menu images for LINE Official Account

## LINE Broadcast Image

Place a default image in `/client/public/images/line-broadcast/` to be used in all LINE broadcast messages when announcing new classes.

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

## Profile Pictures

Default profile pictures are stored in `/client/public/images/profile_pics/`:
- `male.jpg` - Default picture for male members
- `female.jpg` - Default picture for female members

These are served directly by the React app and accessible at `/images/profile_pics/male.jpg` and `/images/profile_pics/female.jpg`.

## Rich Menu Image

Place your `rich-menu.png` file (2500 x 1686 pixels) in `/client/public/images/richmenu/`.

Then update `lib/lineRichMenu.js` to use:
```javascript
const imagePath = path.join(process.cwd(), 'client/public/images/richmenu/rich-menu.png');
```

## How to Add Images

1. Add your image files to the appropriate subfolder in `/client/public/images/`
2. Commit and push your changes:
   ```bash
   git add client/public/images/
   git commit -m "Add images"
   git push
   ```

## Image Guidelines

- **LINE broadcast**: 1040 x 676px (20:13 aspect ratio)
- **Rich menu**: 2500 x 1686px (required by LINE)
- **Profile pictures**: Any reasonable size (will be displayed as thumbnails)
- **Formats**: JPG, PNG
- **Optimization**: Compress images before uploading for better performance

## Note

Class and activity banner images are uploaded via the admin panel and stored in MongoDB as base64, not in this folder.
