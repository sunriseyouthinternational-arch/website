const connectDB = require('../../../lib/mongodb');
const { Class, Member } = require('../../../db/models');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    await connectDB();

    const { memberId } = req.body;

    const classItem = await Class.findById(id);
    const member = await Member.findOne({ memberId });

    if (!classItem) {
      return res.status(404).json({ message: '找不到課程 / Class not found' });
    }

    if (!member) {
      return res.status(404).json({ message: '找不到團員 / Member not found' });
    }

    // Check if class is full
    if (classItem.currentParticipants >= classItem.maxParticipants) {
      return res.status(400).json({ message: '課程已滿 / Class is full' });
    }

    // Check if already enrolled
    const alreadyEnrolled = classItem.participants.some(
      p => p.memberId.toString() === member._id.toString()
    );

    if (alreadyEnrolled) {
      return res.status(400).json({ message: '已經報名此課程 / Already enrolled in this class' });
    }

    // Add to class participants
    classItem.participants.push({
      memberId: member._id,
      memberName: member.name,
      paid: false
    });

    await classItem.save();

    // Add to member enrollments
    member.enrollments.push({
      type: 'class',
      itemId: classItem._id,
      itemName: classItem.name,
      paid: false
    });

    await member.save();

    res.status(200).json({
      message: '報名成功！請記得於課程現場繳費。 / Enrollment successful! Please remember to pay at the venue.',
      class: classItem
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ message: '報名失敗 / Enrollment failed' });
  }
};
