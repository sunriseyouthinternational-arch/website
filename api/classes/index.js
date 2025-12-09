const connectDB = require('../../lib/mongodb');
const { Class } = require('../../db/models');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      await connectDB();

      const classes = await Class.find({ status: 'active' }).sort({ createdAt: -1 });

      res.status(200).json({ classes });
    } catch (error) {
      console.error('Get classes error:', error);
      res.status(500).json({ message: '服務器錯誤 / Server error' });
    }
  } else if (req.method === 'POST') {
    try {
      await connectDB();

      const { name, description, banner, time, cost, teacher, maxParticipants } = req.body;

      const classItem = new Class({
        name,
        description,
        banner: banner || '',
        time,
        cost: parseFloat(cost),
        teacher,
        maxParticipants: parseInt(maxParticipants)
      });

      await classItem.save();

      res.status(201).json({
        message: '課程創建成功 / Class created successfully',
        class: classItem
      });
    } catch (error) {
      console.error('Create class error:', error);
      res.status(500).json({ message: '創建課程失敗 / Failed to create class' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
};
