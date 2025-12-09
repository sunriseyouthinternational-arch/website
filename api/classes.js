const connectDB = require('../lib/mongodb');
const { Class, Member } = require('../db/models');

module.exports = async (req, res) => {
  const { id, action } = req.query;

  try {
    await connectDB();

    // Enroll in class
    if (action === 'enroll' && req.method === 'POST') {
      const { memberId } = req.body;

      const classItem = await Class.findById(id);
      const member = await Member.findOne({ memberId });

      if (!classItem) {
        return res.status(404).json({ message: '找不到課程 / Class not found' });
      }

      if (!member) {
        return res.status(404).json({ message: '找不到團員 / Member not found' });
      }

      if (classItem.currentParticipants >= classItem.maxParticipants) {
        return res.status(400).json({ message: '課程已滿 / Class is full' });
      }

      const alreadyEnrolled = classItem.participants.some(
        p => p.memberId.toString() === member._id.toString()
      );

      if (alreadyEnrolled) {
        return res.status(400).json({ message: '已經報名此課程 / Already enrolled in this class' });
      }

      classItem.participants.push({
        memberId: member._id,
        memberName: member.name,
        paid: false
      });

      await classItem.save();

      member.enrollments.push({
        type: 'class',
        itemId: classItem._id,
        itemName: classItem.name,
        paid: false
      });

      await member.save();

      return res.status(200).json({
        message: '報名成功！請記得於課程現場繳費。 / Enrollment successful! Please remember to pay at the venue.',
        class: classItem
      });
    }

    // List all classes or create new
    if (!id) {
      if (req.method === 'GET') {
        const classes = await Class.find({ status: 'active' }).sort({ createdAt: -1 });
        return res.status(200).json({ classes });
      }

      if (req.method === 'POST') {
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

        return res.status(201).json({
          message: '課程創建成功 / Class created successfully',
          class: classItem
        });
      }
    }

    // Get/Update/Delete specific class
    if (id) {
      if (req.method === 'GET') {
        const classItem = await Class.findById(id);

        if (!classItem) {
          return res.status(404).json({ message: '找不到課程 / Class not found' });
        }

        return res.status(200).json({ class: classItem });
      }

      if (req.method === 'PUT') {
        const classItem = await Class.findByIdAndUpdate(id, req.body, { new: true });

        if (!classItem) {
          return res.status(404).json({ message: '找不到課程 / Class not found' });
        }

        return res.status(200).json({
          message: '課程更新成功 / Class updated successfully',
          class: classItem
        });
      }

      if (req.method === 'DELETE') {
        const classItem = await Class.findByIdAndDelete(id);

        if (!classItem) {
          return res.status(404).json({ message: '找不到課程 / Class not found' });
        }

        return res.status(200).json({ message: '課程刪除成功 / Class deleted successfully' });
      }
    }

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Class operation error:', error);
    res.status(500).json({ message: '服務器錯誤 / Server error' });
  }
};
