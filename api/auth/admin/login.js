const connectDB = require('../../lib/mongodb');
const { Admin } = require('../../db/models');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(401).json({
        message: '用戶名或密碼錯誤 / Invalid username or password'
      });
    }

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: '用戶名或密碼錯誤 / Invalid username or password'
      });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: '登錄成功 / Login successful',
      token,
      admin: { username: admin.username }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '服務器錯誤 / Server error' });
  }
};
