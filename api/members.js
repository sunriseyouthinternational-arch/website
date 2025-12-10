const connectDB = require('../lib/mongodb');
const { Member } = require('../db/models');
const QRCode = require('qrcode');

module.exports = async (req, res) => {
  const { memberId } = req.query;

  try {
    await connectDB();

    // Register new member
    if (req.method === 'POST' && !memberId) {
      const { name, gender, birthDate, familyMembers, contact } = req.body;

      const member = new Member({
        name,
        gender,
        birthDate,
        familyMembers: familyMembers || [],
        contact
      });

      await member.save();

      // Generate QR code with full profile URL
      const profileUrl = `${process.env.FRONTEND_URL || 'https://website-five-chi-99.vercel.app'}/profile/${member.memberId}`;
      const qrCodeUrl = await QRCode.toDataURL(profileUrl);
      member.qrCode = qrCodeUrl;
      await member.save();

      return res.status(201).json({
        message: '註冊成功 / Registration successful',
        member: {
          memberId: member.memberId,
          name: member.name,
          qrCode: member.qrCode
        }
      });
    }

    // Get member by ID
    if (req.method === 'GET' && memberId) {
      const member = await Member.findOne({ memberId });

      if (!member) {
        return res.status(404).json({
          message: '找不到團員 / Member not found'
        });
      }

      return res.status(200).json({ member });
    }

    // Update member
    if (req.method === 'PUT' && memberId) {
      const { name, gender, birthDate, familyMembers, contact } = req.body;

      const member = await Member.findOne({ memberId });

      if (!member) {
        return res.status(404).json({
          message: '找不到團員 / Member not found'
        });
      }

      if (name) member.name = name;
      if (gender) member.gender = gender;
      if (birthDate) member.birthDate = birthDate;
      if (familyMembers) member.familyMembers = familyMembers;
      if (contact) member.contact = { ...member.contact, ...contact };

      await member.save();

      return res.status(200).json({
        message: '更新成功 / Update successful',
        member
      });
    }

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Member operation error:', error);
    res.status(500).json({
      message: '服務器錯誤 / Server error',
      error: error.message
    });
  }
};
