const connectDB = require('../../../../lib/mongodb');
const { Class, Member } = require('../../../../db/models');

module.exports = async (req, res) => {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { classId, participantId } = req.query;

  try {
    await connectDB();

    const { paid } = req.body;
    const classItem = await Class.findById(classId);

    if (!classItem) {
      return res.status(404).json({ message: '找不到課程 / Class not found' });
    }

    const participant = classItem.participants.id(participantId);

    if (!participant) {
      return res.status(404).json({ message: '找不到參與者 / Participant not found' });
    }

    participant.paid = paid;
    await classItem.save();

    // Update member enrollment
    const member = await Member.findById(participant.memberId);
    if (member) {
      const enrollment = member.enrollments.find(
        e => e.itemId.toString() === classItem._id.toString() && e.type === 'class'
      );
      if (enrollment) {
        enrollment.paid = paid;
        await member.save();
      }
    }

    res.status(200).json({
      message: '付款狀態更新成功 / Payment status updated successfully',
      class: classItem
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ message: '更新付款狀態失敗 / Failed to update payment status' });
  }
};
