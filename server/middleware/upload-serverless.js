const multer = require('multer');

// For Vercel serverless: Store files in memory instead of disk
// Files will be converted to base64 and stored in MongoDB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype) {
    cb(null, true);
  } else {
    cb(new Error('只允許圖片文件 / Only image files are allowed'));
  }
};

const uploadProfile = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

const uploadBanner = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter
});

module.exports = { uploadProfile, uploadBanner };
