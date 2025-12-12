const connectDB = require('../lib/mongodb');
const { Teacher } = require('../db/models');

module.exports = async (req, res) => {
  const { id } = req.query;

  try {
    await connectDB();

    // List all teachers or create new
    if (!id) {
      if (req.method === 'GET') {
        const teachers = await Teacher.find({ status: 'active' }).sort({ name: 1 });
        return res.status(200).json({ teachers });
      }

      if (req.method === 'POST') {
        const { name, englishName, bio, specialties, email, phone, photo } = req.body;

        const teacher = new Teacher({
          name,
          englishName: englishName || '',
          bio: bio || '',
          specialties: specialties || '',
          email: email || '',
          phone: phone || '',
          photo: photo || ''
        });

        await teacher.save();

        return res.status(201).json({
          message: '教師創建成功 / Teacher created successfully',
          teacher
        });
      }
    }

    // Get/Update/Delete specific teacher
    if (id) {
      if (req.method === 'GET') {
        const teacher = await Teacher.findById(id);

        if (!teacher) {
          return res.status(404).json({ message: '找不到教師 / Teacher not found' });
        }

        return res.status(200).json({ teacher });
      }

      if (req.method === 'PUT') {
        const teacher = await Teacher.findByIdAndUpdate(id, req.body, { new: true });

        if (!teacher) {
          return res.status(404).json({ message: '找不到教師 / Teacher not found' });
        }

        return res.status(200).json({
          message: '教師更新成功 / Teacher updated successfully',
          teacher
        });
      }

      if (req.method === 'DELETE') {
        const teacher = await Teacher.findByIdAndDelete(id);

        if (!teacher) {
          return res.status(404).json({ message: '找不到教師 / Teacher not found' });
        }

        return res.status(200).json({ message: '教師刪除成功 / Teacher deleted successfully' });
      }
    }

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Teacher operation error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: '服務器錯誤 / Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
