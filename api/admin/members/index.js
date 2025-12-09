const connectDB = require('../../../lib/mongodb');
const { Member } = require('../../../db/models');

module.exports = async (req, res) => {
  try {
    await connectDB();

    const members = await Member.find().sort({ createdAt: -1 });

    res.status(200).json({ members });
  } catch (error) {
    console.error('Get all members error:', error);
    res.status(500).json({ message: '服務器錯誤 / Server error' });
  }
};
