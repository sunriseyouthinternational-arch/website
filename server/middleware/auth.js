const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: '未授權訪問 / Unauthorized access' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: '無效的令牌 / Invalid token' });
  }
};

module.exports = authMiddleware;
