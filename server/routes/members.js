const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const Member = require('../models/Member');
const { uploadProfile } = require('../middleware/upload');

// Register new member
router.post('/register', async (req, res) => {
  try {
    const { name, gender, birthDate, familyMembers, contact } = req.body;

    const member = new Member({
      name,
      gender,
      birthDate,
      familyMembers: familyMembers || [],
      contact
    });

    await member.save();

    // Generate QR code
    const qrCodeData = `SYI-${member.memberId}`;
    const qrCodeUrl = await QRCode.toDataURL(qrCodeData);
    member.qrCode = qrCodeUrl;
    await member.save();

    res.status(201).json({
      message: '註冊成功 / Registration successful',
      member: {
        memberId: member.memberId,
        name: member.name,
        qrCode: member.qrCode
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: '註冊失敗 / Registration failed', error: error.message });
  }
});

// Get member by ID
router.get('/:memberId', async (req, res) => {
  try {
    const member = await Member.findOne({ memberId: req.params.memberId });

    if (!member) {
      return res.status(404).json({ message: '找不到團員 / Member not found' });
    }

    res.json({ member });
  } catch (error) {
    console.error('Get member error:', error);
    res.status(500).json({ message: '服務器錯誤 / Server error' });
  }
});

// Update member information
router.put('/:memberId', async (req, res) => {
  try {
    const { name, gender, birthDate, familyMembers, contact } = req.body;

    const member = await Member.findOne({ memberId: req.params.memberId });

    if (!member) {
      return res.status(404).json({ message: '找不到團員 / Member not found' });
    }

    // Update fields
    if (name) member.name = name;
    if (gender) member.gender = gender;
    if (birthDate) member.birthDate = birthDate;
    if (familyMembers) member.familyMembers = familyMembers;
    if (contact) member.contact = { ...member.contact, ...contact };

    await member.save();

    res.json({ message: '更新成功 / Update successful', member });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ message: '更新失敗 / Update failed' });
  }
});

// Upload profile picture
router.post('/:memberId/profile-picture', uploadProfile.single('profilePicture'), async (req, res) => {
  try {
    const member = await Member.findOne({ memberId: req.params.memberId });

    if (!member) {
      return res.status(404).json({ message: '找不到團員 / Member not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: '請上傳圖片 / Please upload an image' });
    }

    member.profilePicture = `/uploads/profiles/${req.file.filename}`;
    await member.save();

    res.json({
      message: '照片上傳成功 / Photo uploaded successfully',
      profilePicture: member.profilePicture
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: '上傳失敗 / Upload failed' });
  }
});

// Get member enrollments
router.get('/:memberId/enrollments', async (req, res) => {
  try {
    const member = await Member.findOne({ memberId: req.params.memberId });

    if (!member) {
      return res.status(404).json({ message: '找不到團員 / Member not found' });
    }

    res.json({ enrollments: member.enrollments });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ message: '服務器錯誤 / Server error' });
  }
});

module.exports = router;
