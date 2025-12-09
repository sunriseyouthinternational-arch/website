const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Admin login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find admin
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(401).json({ message: '用戶名或密碼錯誤 / Invalid username or password' });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: '用戶名或密碼錯誤 / Invalid username or password' });
    }

    // Generate token
    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: '登錄成功 / Login successful',
      token,
      admin: { username: admin.username }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '服務器錯誤 / Server error' });
  }
});

// Create default admin - handler function
const createDefaultAdmin = async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });

    if (existingAdmin) {
      return res.status(400).json({ message: '管理員已存在 / Admin already exists' });
    }

    const admin = new Admin({
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123'
    });

    await admin.save();

    res.json({ message: '默認管理員已創建 / Default admin created successfully' });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: '服務器錯誤 / Server error' });
  }
};

// Accept both GET and POST for easier browser testing
router.get('/admin/create-default', createDefaultAdmin);
router.post('/admin/create-default', createDefaultAdmin);

module.exports = router;
