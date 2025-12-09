const connectDB = require('../../lib/mongodb');
const { Activity } = require('../../db/models');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      await connectDB();

      const activities = await Activity.find({ status: 'active' }).sort({ createdAt: -1 });

      res.status(200).json({ activities });
    } catch (error) {
      console.error('Get activities error:', error);
      res.status(500).json({ message: '服務器錯誤 / Server error' });
    }
  } else if (req.method === 'POST') {
    try {
      await connectDB();

      const { name, description, banner, time, cost, teacher, maxParticipants } = req.body;

      const activity = new Activity({
        name,
        description,
        banner: banner || '',
        time,
        cost: parseFloat(cost),
        teacher,
        maxParticipants: parseInt(maxParticipants)
      });

      await activity.save();

      res.status(201).json({
        message: '活動創建成功 / Activity created successfully',
        activity
      });
    } catch (error) {
      console.error('Create activity error:', error);
      res.status(500).json({ message: '創建活動失敗 / Failed to create activity' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
};
