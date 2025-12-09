const connectDB = require('../../lib/mongodb');
const { Admin } = require('../../db/models');

module.exports = async (req, res) => {
  try {
    // Connect to database FIRST
    await connectDB();

    console.log('Creating default admin...');
    console.log('ADMIN_USERNAME:', process.env.ADMIN_USERNAME);

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });

    if (existingAdmin) {
      console.log('Admin already exists');
      return res.status(400).json({
        message: '管理員已存在 / Admin already exists'
      });
    }

    console.log('Creating new admin...');
    const admin = new Admin({
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123'
    });

    await admin.save();
    console.log('Admin created successfully');

    res.status(200).json({
      message: '默認管理員已創建 / Default admin created successfully'
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      message: '服務器錯誤 / Server error',
      error: error.message,
      details: error.toString()
    });
  }
};
