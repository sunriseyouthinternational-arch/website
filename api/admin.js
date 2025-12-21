const connectDB = require('../lib/mongodb');
const { Member, Class, Activity } = require('../db/models');

module.exports = async (req, res) => {
  const { resource, action, classId, activityId, participantId } = req.query;

  try {
    await connectDB();

    // Dashboard stats
    if (resource === 'stats') {
      const totalMembers = await Member.countDocuments();
      const activeClasses = await Class.countDocuments({ status: 'active' });
      const activeActivities = await Activity.countDocuments({ status: 'active' });

      return res.status(200).json({
        totalMembers,
        activeClasses,
        activeActivities
      });
    }

    // Referral leaderboard
    if (resource === 'referral-leaderboard') {
      // Get all members with their referral counts
      const members = await Member.find({ registrationCompleted: true })
        .select('memberId name referralCode')
        .lean();

      // Count referrals for each member
      const leaderboard = await Promise.all(
        members.map(async (member) => {
          const referralCount = await Member.countDocuments({
            referredBy: member._id,
            registrationCompleted: true
          });

          return {
            memberId: member.memberId,
            name: member.name,
            referralCode: member.referralCode,
            referralCount
          };
        })
      );

      // Filter out members with 0 referrals and sort by count (highest first)
      const rankedLeaderboard = leaderboard
        .filter(m => m.referralCount > 0)
        .sort((a, b) => b.referralCount - a.referralCount);

      return res.status(200).json({ leaderboard: rankedLeaderboard });
    }

    // List all members
    if (resource === 'members' && !action) {
      const members = await Member.find().sort({ createdAt: -1 });
      return res.status(200).json({ members });
    }

    // Update class payment status
    if (resource === 'class-payment' && req.method === 'PUT') {
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

      return res.status(200).json({
        message: '付款狀態更新成功 / Payment status updated successfully',
        class: classItem
      });
    }

    // Update activity payment status
    if (resource === 'activity-payment' && req.method === 'PUT') {
      const { paid } = req.body;
      const activity = await Activity.findById(activityId);

      if (!activity) {
        return res.status(404).json({ message: '找不到活動 / Activity not found' });
      }

      const participant = activity.participants.id(participantId);

      if (!participant) {
        return res.status(404).json({ message: '找不到參與者 / Participant not found' });
      }

      participant.paid = paid;
      await activity.save();

      const member = await Member.findById(participant.memberId);
      if (member) {
        const enrollment = member.enrollments.find(
          e => e.itemId.toString() === activity._id.toString() && e.type === 'activity'
        );
        if (enrollment) {
          enrollment.paid = paid;
          await member.save();
        }
      }

      return res.status(200).json({
        message: '付款狀態更新成功 / Payment status updated successfully',
        activity
      });
    }

    // Update class payment method
    if (resource === 'class-payment-method' && req.method === 'PUT') {
      const { paymentMethod } = req.body;
      const classItem = await Class.findById(classId);

      if (!classItem) {
        return res.status(404).json({ message: '找不到課程 / Class not found' });
      }

      const participant = classItem.participants.id(participantId);

      if (!participant) {
        return res.status(404).json({ message: '找不到參與者 / Participant not found' });
      }

      participant.paymentMethod = paymentMethod;
      await classItem.save();

      return res.status(200).json({
        message: '付款方式更新成功 / Payment method updated successfully',
        class: classItem
      });
    }

    // Update activity payment method
    if (resource === 'activity-payment-method' && req.method === 'PUT') {
      const { paymentMethod } = req.body;
      const activity = await Activity.findById(activityId);

      if (!activity) {
        return res.status(404).json({ message: '找不到活動 / Activity not found' });
      }

      const participant = activity.participants.id(participantId);

      if (!participant) {
        return res.status(404).json({ message: '找不到參與者 / Participant not found' });
      }

      participant.paymentMethod = paymentMethod;
      await activity.save();

      return res.status(200).json({
        message: '付款方式更新成功 / Payment method updated successfully',
        activity
      });
    }

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Admin operation error:', error);
    res.status(500).json({ message: '服務器錯誤 / Server error' });
  }
};
