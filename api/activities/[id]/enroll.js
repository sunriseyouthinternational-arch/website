const connectDB = require('../../../lib/mongodb');
const { Activity, Member } = require('../../../db/models');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    await connectDB();

    const { memberId } = req.body;

    const activity = await Activity.findById(id);
    const member = await Member.findOne({ memberId });

    if (!activity) {
      return res.status(404).json({ message: '找不到活動 / Activity not found' });
    }

    if (!member) {
      return res.status(404).json({ message: '找不到團員 / Member not found' });
    }

    if (activity.currentParticipants >= activity.maxParticipants) {
      return res.status(400).json({ message: '活動已滿 / Activity is full' });
    }

    const alreadyEnrolled = activity.participants.some(
      p => p.memberId.toString() === member._id.toString()
    );

    if (alreadyEnrolled) {
      return res.status(400).json({ message: '已經報名此活動 / Already enrolled in this activity' });
    }

    activity.participants.push({
      memberId: member._id,
      memberName: member.name,
      paid: false
    });

    await activity.save();

    member.enrollments.push({
      type: 'activity',
      itemId: activity._id,
      itemName: activity.name,
      paid: false
    });

    await member.save();

    res.status(200).json({
      message: '報名成功！請記得於活動現場繳費。 / Enrollment successful! Please remember to pay at the venue.',
      activity
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ message: '報名失敗 / Enrollment failed' });
  }
};
