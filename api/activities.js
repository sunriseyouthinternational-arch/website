const connectDB = require('../lib/mongodb');
const { Activity, Member } = require('../db/models');

module.exports = async (req, res) => {
  const { id, action } = req.query;

  try {
    await connectDB();

    // Enroll in activity
    if (action === 'enroll' && req.method === 'POST') {
      const { memberId } = req.body;

      const activity = await Activity.findById(id).populate('teacherId');
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

      return res.status(200).json({
        message: '報名成功！請記得於活動現場繳費。 / Enrollment successful! Please remember to pay at the venue.',
        activity
      });
    }

    // List all activities or create new
    if (!id) {
      if (req.method === 'GET') {
        const activities = await Activity.find({ status: 'active' })
          .populate('teacherId')
          .sort({ createdAt: -1 });
        return res.status(200).json({ activities });
      }

      if (req.method === 'POST') {
        const { name, description, banner, date, time, location, cost, teacherId, teacher, maxParticipants } = req.body;

        const activity = new Activity({
          name,
          description,
          banner: banner || '',
          date: date || null,
          time,
          location: location || '',
          cost: parseFloat(cost),
          teacherId: teacherId || null,
          teacher,
          maxParticipants: parseInt(maxParticipants)
        });

        await activity.save();

        return res.status(201).json({
          message: '活動創建成功 / Activity created successfully',
          activity
        });
      }
    }

    // Get/Update/Delete specific activity
    if (id) {
      if (req.method === 'GET') {
        const activity = await Activity.findById(id).populate('teacherId');

        if (!activity) {
          return res.status(404).json({ message: '找不到活動 / Activity not found' });
        }

        return res.status(200).json({ activity });
      }

      if (req.method === 'PUT') {
        const activity = await Activity.findByIdAndUpdate(id, req.body, { new: true });

        if (!activity) {
          return res.status(404).json({ message: '找不到活動 / Activity not found' });
        }

        return res.status(200).json({
          message: '活動更新成功 / Activity updated successfully',
          activity
        });
      }

      if (req.method === 'DELETE') {
        const activity = await Activity.findByIdAndDelete(id);

        if (!activity) {
          return res.status(404).json({ message: '找不到活動 / Activity not found' });
        }

        // Update enrollment status for all participants
        await Member.updateMany(
          { 'enrollments.itemId': id },
          { $set: { 'enrollments.$[elem].status': 'cancelled' } },
          { arrayFilters: [{ 'elem.itemId': id }] }
        );

        return res.status(200).json({ message: '活動刪除成功 / Activity deleted successfully' });
      }
    }

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Activity operation error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: '服務器錯誤 / Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
