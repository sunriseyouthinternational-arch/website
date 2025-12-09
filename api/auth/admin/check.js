const connectDB = require('../../../lib/mongodb');
const { Admin } = require('../../../db/models');

module.exports = async (req, res) => {
  try {
    await connectDB();

    const admins = await Admin.find({}).select('username createdAt');

    res.status(200).json({
      count: admins.length,
      admins: admins.map(a => ({
        username: a.username,
        createdAt: a.createdAt
      }))
    });
  } catch (error) {
    console.error('Check admin error:', error);
    res.status(500).json({
      message: 'Error checking admins',
      error: error.message
    });
  }
};
