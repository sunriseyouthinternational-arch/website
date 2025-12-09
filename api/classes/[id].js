const connectDB = require('../../lib/mongodb');
const { Class, Member } = require('../../db/models');

module.exports = async (req, res) => {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      await connectDB();

      const classItem = await Class.findById(id);

      if (!classItem) {
        return res.status(404).json({ message: '找不到課程 / Class not found' });
      }

      res.status(200).json({ class: classItem });
    } catch (error) {
      console.error('Get class error:', error);
      res.status(500).json({ message: '服務器錯誤 / Server error' });
    }
  } else if (req.method === 'PUT') {
    try {
      await connectDB();

      const classItem = await Class.findByIdAndUpdate(id, req.body, { new: true });

      if (!classItem) {
        return res.status(404).json({ message: '找不到課程 / Class not found' });
      }

      res.status(200).json({
        message: '課程更新成功 / Class updated successfully',
        class: classItem
      });
    } catch (error) {
      console.error('Update class error:', error);
      res.status(500).json({ message: '更新課程失敗 / Failed to update class' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await connectDB();

      const classItem = await Class.findByIdAndDelete(id);

      if (!classItem) {
        return res.status(404).json({ message: '找不到課程 / Class not found' });
      }

      res.status(200).json({ message: '課程刪除成功 / Class deleted successfully' });
    } catch (error) {
      console.error('Delete class error:', error);
      res.status(500).json({ message: '刪除課程失敗 / Failed to delete class' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
};
