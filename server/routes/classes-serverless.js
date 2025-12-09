const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const Member = require('../models/Member');
const authMiddleware = require('../middleware/auth');
const { uploadBanner } = require('../middleware/upload-serverless');

// Get all active classes
router.get('/', async (req, res) => {
  try {
    const classes = await Class.find({ status: 'active' }).sort({ createdAt: -1 });
    res.json({ classes });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ message: '服務器錯誤 / Server error' });
  }
});

// Get class by ID
router.get('/:id', async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);

    if (!classItem) {
      return res.status(404).json({ message: '找不到課程 / Class not found' });
    }

    res.json({ class: classItem });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ message: '服務器錯誤 / Server error' });
  }
});

// Enroll member in class
router.post('/:id/enroll', async (req, res) => {
  try {
    const { memberId } = req.body;

    const classItem = await Class.findById(req.params.id);
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

    res.json({
      message: '報名成功！請記得於課程現場繳費。 / Enrollment successful! Please remember to pay at the venue.',
      class: classItem
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ message: '報名失敗 / Enrollment failed' });
  }
});

// Create new class (admin only) - serverless version with base64 banner
router.post('/', authMiddleware, uploadBanner.single('banner'), async (req, res) => {
  try {
    const { name, description, time, cost, teacher, maxParticipants } = req.body;

    let bannerData = '';
    if (req.file) {
      // Convert to base64
      bannerData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    const classItem = new Class({
      name,
      description,
      time,
      cost: parseFloat(cost),
      teacher,
      maxParticipants: parseInt(maxParticipants),
      banner: bannerData
    });

    await classItem.save();

    res.status(201).json({
      message: '課程創建成功 / Class created successfully',
      class: classItem
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ message: '創建課程失敗 / Failed to create class' });
  }
});

// Update class (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const classItem = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!classItem) {
      return res.status(404).json({ message: '找不到課程 / Class not found' });
    }

    res.json({
      message: '課程更新成功 / Class updated successfully',
      class: classItem
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ message: '更新課程失敗 / Failed to update class' });
  }
});

// Delete class (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const classItem = await Class.findByIdAndDelete(req.params.id);

    if (!classItem) {
      return res.status(404).json({ message: '找不到課程 / Class not found' });
    }

    res.json({ message: '課程刪除成功 / Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ message: '刪除課程失敗 / Failed to delete class' });
  }
});

module.exports = router;
