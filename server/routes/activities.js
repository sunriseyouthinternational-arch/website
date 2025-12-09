const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const Member = require('../models/Member');
const authMiddleware = require('../middleware/auth');
const { uploadBanner } = require('../middleware/upload');

// Get all active activities
router.get('/', async (req, res) => {
  try {
    const activities = await Activity.find({ status: 'active' }).sort({ createdAt: -1 });
    res.json({ activities });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ message: '服務器錯誤 / Server error' });
  }
});

// Get activity by ID
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({ message: '找不到活動 / Activity not found' });
    }

    res.json({ activity });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ message: '服務器錯誤 / Server error' });
  }
});

// Enroll member in activity
router.post('/:id/enroll', async (req, res) => {
  try {
    const { memberId } = req.body;

    const activity = await Activity.findById(req.params.id);
    const member = await Member.findOne({ memberId });

    if (!activity) {
      return res.status(404).json({ message: '找不到活動 / Activity not found' });
    }

    if (!member) {
      return res.status(404).json({ message: '找不到團員 / Member not found' });
    }

    // Check if activity is full
    if (activity.currentParticipants >= activity.maxParticipants) {
      return res.status(400).json({ message: '活動已滿 / Activity is full' });
    }

    // Check if already enrolled
    const alreadyEnrolled = activity.participants.some(
      p => p.memberId.toString() === member._id.toString()
    );

    if (alreadyEnrolled) {
      return res.status(400).json({ message: '已經報名此活動 / Already enrolled in this activity' });
    }

    // Add to activity participants
    activity.participants.push({
      memberId: member._id,
      memberName: member.name,
      paid: false
    });

    await activity.save();

    // Add to member enrollments
    member.enrollments.push({
      type: 'activity',
      itemId: activity._id,
      itemName: activity.name,
      paid: false
    });

    await member.save();

    res.json({
      message: '報名成功！請記得於活動現場繳費。 / Enrollment successful! Please remember to pay at the venue.',
      activity
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ message: '報名失敗 / Enrollment failed' });
  }
});

// Create new activity (admin only)
router.post('/', authMiddleware, uploadBanner.single('banner'), async (req, res) => {
  try {
    const { name, description, time, cost, teacher, maxParticipants } = req.body;

    const activity = new Activity({
      name,
      description,
      time,
      cost: parseFloat(cost),
      teacher,
      maxParticipants: parseInt(maxParticipants),
      banner: req.file ? `/uploads/banners/${req.file.filename}` : ''
    });

    await activity.save();

    res.status(201).json({
      message: '活動創建成功 / Activity created successfully',
      activity
    });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ message: '創建活動失敗 / Failed to create activity' });
  }
});

// Update activity (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const activity = await Activity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!activity) {
      return res.status(404).json({ message: '找不到活動 / Activity not found' });
    }

    res.json({
      message: '活動更新成功 / Activity updated successfully',
      activity
    });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ message: '更新活動失敗 / Failed to update activity' });
  }
});

// Delete activity (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);

    if (!activity) {
      return res.status(404).json({ message: '找不到活動 / Activity not found' });
    }

    res.json({ message: '活動刪除成功 / Activity deleted successfully' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ message: '刪除活動失敗 / Failed to delete activity' });
  }
});

module.exports = router;
