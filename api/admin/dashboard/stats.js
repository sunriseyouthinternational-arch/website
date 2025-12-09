const connectDB = require('../../../lib/mongodb');
const { Member, Class, Activity } = require('../../../db/models');

module.exports = async (req, res) => {
  try {
    await connectDB();

    const totalMembers = await Member.countDocuments();
    const activeClasses = await Class.countDocuments({ status: 'active' });
    const activeActivities = await Activity.countDocuments({ status: 'active' });

    res.status(200).json({
      totalMembers,
      activeClasses,
      activeActivities
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: '服務器錯誤 / Server error' });
  }
};
