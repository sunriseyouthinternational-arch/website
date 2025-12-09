const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
const profilesDir = path.join(uploadsDir, 'profiles');
const bannersDir = path.join(uploadsDir, 'banners');

[uploadsDir, profilesDir, bannersDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage for profile pictures
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure storage for banners
const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, bannersDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('只允許圖片文件 / Only image files are allowed'));
  }
};

const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

const uploadBanner = multer({
  storage: bannerStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter
});

module.exports = { uploadProfile, uploadBanner };
