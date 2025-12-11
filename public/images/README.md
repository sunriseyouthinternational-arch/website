# Images Folder

This folder contains static images for the website.

## Folder Structure

- **`/banners`** - Banner images for classes and activities
- **`/rich-menu`** - Rich menu images for LINE Official Account

## How to Add Images

### Option 1: Upload via Admin Panel (Recommended)
When creating a class or activity in the admin panel, use the file upload feature to add banner images. Images are automatically converted to base64 and stored in the database.

### Option 2: Place Images in This Folder
1. Add your image files to the appropriate subfolder:
   - Class/Activity banners → `/public/images/banners/`
   - Rich menu image → `/public/images/rich-menu/`

2. Images will be accessible at:
   - `https://your-domain.com/images/banners/your-image.jpg`
   - `https://your-domain.com/images/rich-menu/your-image.png`

3. Commit and push your changes:
   ```bash
   git add public/images/
   git commit -m "Add images"
   git push
   ```

## Rich Menu Image

For the LINE rich menu, place your `rich-menu.png` file (2500 x 1686 pixels) in `/public/images/rich-menu/`.

Then update `lib/lineRichMenu.js` to use:
```javascript
const imagePath = '/images/rich-menu/rich-menu.png';
```

## Image Guidelines

- **Banner images**: 800 x 400px (recommended)
- **Rich menu**: 2500 x 1686px (required by LINE)
- **Max file size**: 2MB for admin uploads
- **Formats**: JPG, PNG, GIF
- **Optimization**: Compress images before uploading for better performance
