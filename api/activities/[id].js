const connectDB = require('../../lib/mongodb');
const { Activity } = require('../../db/models');

module.exports = async (req, res) => {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      await connectDB();

      const activity = await Activity.findById(id);

      if (!activity) {
        return res.status(404).json({ message: '找不到活動 / Activity not found' });
      }

      res.status(200).json({ activity });
    } catch (error) {
      console.error('Get activity error:', error);
      res.status(500).json({ message: '服務器錯誤 / Server error' });
    }
  } else if (req.method === 'PUT') {
    try {
      await connectDB();

      const activity = await Activity.findByIdAndUpdate(id, req.body, { new: true });

      if (!activity) {
        return res.status(404).json({ message: '找不到活動 / Activity not found' });
      }

      res.status(200).json({
        message: '活動更新成功 / Activity updated successfully',
        activity
      });
    } catch (error) {
      console.error('Update activity error:', error);
      res.status(500).json({ message: '更新活動失敗 / Failed to update activity' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await connectDB();

      const activity = await Activity.findByIdAndDelete(id);

      if (!activity) {
        return res.status(404).json({ message: '找不到活動 / Activity not found' });
      }

      res.status(200).json({ message: '活動刪除成功 / Activity deleted successfully' });
    } catch (error) {
      console.error('Delete activity error:', error);
      res.status(500).json({ message: '刪除活動失敗 / Failed to delete activity' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
};
