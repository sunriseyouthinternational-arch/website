const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const Class = require('../models/Class');
const Activity = require('../models/Activity');
const authMiddleware = require('../middleware/auth');

// Get all members (admin only)
router.get('/members', authMiddleware, async (req, res) => {
  try {
    const members = await Member.find().sort({ createdAt: -1 });
    res.json({ members });
  } catch (error) {
    console.error('Get all members error:', error);
    res.status(500).json({ message: '服務器錯誤 / Server error' });
  }
});

// Get member details with enrollment history (admin only)
router.get('/members/:memberId', authMiddleware, async (req, res) => {
  try {
    const member = await Member.findOne({ memberId: req.params.memberId });

    if (!member) {
      return res.status(404).json({ message: '找不到團員 / Member not found' });
    }

    res.json({ member });
  } catch (error) {
    console.error('Get member details error:', error);
    res.status(500).json({ message: '服務器錯誤 / Server error' });
  }
});

// Get all classes including completed (admin only)
router.get('/classes', authMiddleware, async (req, res) => {
  try {
    const classes = await Class.find().sort({ createdAt: -1 });
    res.json({ classes });
  } catch (error) {
    console.error('Get all classes error:', error);
    res.status(500).json({ message: '服務器錯誤 / Server error' });
  }
});

// Get all activities including completed (admin only)
router.get('/activities', authMiddleware, async (req, res) => {
  try {
    const activities = await Activity.find().sort({ createdAt: -1 });
    res.json({ activities });
  } catch (error) {
    console.error('Get all activities error:', error);
    res.status(500).json({ message: '服務器錯誤 / Server error' });
  }
});

// Update payment status for class participant (admin only)
router.put('/classes/:classId/participants/:participantId/payment', authMiddleware, async (req, res) => {
  try {
    const { paid } = req.body;
    const classItem = await Class.findById(req.params.classId);

    if (!classItem) {
      return res.status(404).json({ message: '找不到課程 / Class not found' });
    }

    const participant = classItem.participants.id(req.params.participantId);

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

    res.json({
      message: '付款狀態更新成功 / Payment status updated successfully',
      class: classItem
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ message: '更新付款狀態失敗 / Failed to update payment status' });
  }
});

// Update payment status for activity participant (admin only)
router.put('/activities/:activityId/participants/:participantId/payment', authMiddleware, async (req, res) => {
  try {
    const { paid } = req.body;
    const activity = await Activity.findById(req.params.activityId);

    if (!activity) {
      return res.status(404).json({ message: '找不到活動 / Activity not found' });
    }

    const participant = activity.participants.id(req.params.participantId);

    if (!participant) {
      return res.status(404).json({ message: '找不到參與者 / Participant not found' });
    }

    participant.paid = paid;
    await activity.save();

    // Update member enrollment
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

    res.json({
      message: '付款狀態更新成功 / Payment status updated successfully',
      activity
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ message: '更新付款狀態失敗 / Failed to update payment status' });
  }
});

// Get dashboard statistics (admin only)
router.get('/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const totalMembers = await Member.countDocuments();
    const activeClasses = await Class.countDocuments({ status: 'active' });
    const activeActivities = await Activity.countDocuments({ status: 'active' });

    res.json({
      totalMembers,
      activeClasses,
      activeActivities
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: '服務器錯誤 / Server error' });
  }
});

module.exports = router;
