const connectDB = require('../lib/mongodb');
const { Admin } = require('../db/models');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  const { action } = req.query;

  try {
    await connectDB();

    // Create default admin
    if (action === 'create-default') {
      console.log('Creating default admin...');

      const existingAdmin = await Admin.findOne({ username: 'admin' });

      if (existingAdmin) {
        return res.status(400).json({
          message: '管理員已存在 / Admin already exists'
        });
      }

      const admin = new Admin({
        username: 'admin',
        password: 'admin123'
      });

      await admin.save();

      return res.status(200).json({
        message: '默認管理員已創建 / Default admin created successfully'
      });
    }

    // Check admins (debug)
    if (action === 'check') {
      const admins = await Admin.find({}).select('username createdAt');

      return res.status(200).json({
        count: admins.length,
        admins: admins.map(a => ({
          username: a.username,
          createdAt: a.createdAt
        }))
      });
    }

    // Admin login
    if (req.method === 'POST') {
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

      return res.status(200).json({
        message: '登錄成功 / Login successful',
        token,
        admin: { username: admin.username }
      });
    }

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({
      message: '服務器錯誤 / Server error',
      error: error.message
    });
  }
};
