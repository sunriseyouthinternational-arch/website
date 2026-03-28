const connectDB = require('../lib/mongodb');
const { ClassInfo } = require('../db/models');

module.exports = async (req, res) => {
  const { id } = req.query;

  try {
    await connectDB();

    // List all class info or create new
    if (!id) {
      if (req.method === 'GET') {
        const classInfos = await ClassInfo.find({ status: 'active' }).sort({ name: 1 });
        return res.status(200).json({ classInfos });
      }

      if (req.method === 'POST') {
        const { name, description, banner, cost, maxParticipants, ageRange } = req.body;

        const classInfo = new ClassInfo({
          name,
          description,
          banner: banner || '',
          cost: parseFloat(cost),
          maxParticipants: parseInt(maxParticipants),
          ageRange: ageRange || []
        });

        await classInfo.save();

        return res.status(201).json({
          message: '課程資訊創建成功 / Class info created successfully',
          classInfo
        });
      }
    }

    // Get/Update/Delete specific class info
    if (id) {
      if (req.method === 'GET') {
        const classInfo = await ClassInfo.findById(id);

        if (!classInfo) {
          return res.status(404).json({ message: '找不到課程資訊 / Class info not found' });
        }

        return res.status(200).json({ classInfo });
      }

      if (req.method === 'PUT') {
        const classInfo = await ClassInfo.findByIdAndUpdate(id, req.body, { new: true });

        if (!classInfo) {
          return res.status(404).json({ message: '找不到課程資訊 / Class info not found' });
        }

        return res.status(200).json({
          message: '課程資訊更新成功 / Class info updated successfully',
          classInfo
        });
      }

      if (req.method === 'DELETE') {
        const classInfo = await ClassInfo.findByIdAndDelete(id);

        if (!classInfo) {
          return res.status(404).json({ message: '找不到課程資訊 / Class info not found' });
        }

        return res.status(200).json({ message: '課程資訊刪除成功 / Class info deleted successfully' });
      }
    }

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('ClassInfo operation error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: '服務器錯誤 / Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
