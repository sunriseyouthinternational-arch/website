const connectDB = require('../lib/mongodb');
const { Member } = require('../db/models');

module.exports = async (req, res) => {
  const { memberId, token } = req.query;

  try {
    await connectDB();

    // Get member by registration token (for completing registration)
    if (req.method === 'GET' && token && !memberId) {
      const member = await Member.findOne({ registrationToken: token });

      if (!member) {
        return res.status(404).json({
          message: '無效的註冊連結 / Invalid registration link'
        });
      }

      // Check if token is expired
      if (member.registrationTokenExpires && member.registrationTokenExpires < new Date()) {
        return res.status(400).json({
          message: '註冊連結已過期 / Registration link has expired'
        });
      }

      // Check if already completed
      if (member.registrationCompleted) {
        return res.status(400).json({
          message: '此團員已完成註冊 / This member has already completed registration',
          redirectTo: `/profile/${member.memberId}`
        });
      }

      return res.status(200).json({
        member: {
          memberId: member.memberId,
          name: member.name,
          englishAlias: member.englishAlias,
          gender: member.gender,
          birthDate: member.birthDate,
          familyMembers: member.familyMembers,
          contact: member.contact
        }
      });
    }

    // Complete registration with token
    if (req.method === 'POST' && token) {
      const { name, englishAlias, gender, birthDate, familyMembers, contact, referralCode } = req.body;

      const member = await Member.findOne({ registrationToken: token });

      if (!member) {
        return res.status(404).json({
          message: '無效的註冊連結 / Invalid registration link'
        });
      }

      // Check if token is expired
      if (member.registrationTokenExpires && member.registrationTokenExpires < new Date()) {
        return res.status(400).json({
          message: '註冊連結已過期 / Registration link has expired'
        });
      }

      // Check if already completed
      if (member.registrationCompleted) {
        return res.status(400).json({
          message: '此團員已完成註冊 / This member has already completed registration'
        });
      }

      // If referral code provided, validate and link to referrer
      if (referralCode) {
        const referrer = await Member.findOne({
          referralCode: referralCode.trim().toUpperCase(),
          registrationCompleted: true
        });

        if (referrer) {
          member.referredBy = referrer._id;
        }
        // If invalid code, just ignore it (don't block registration)
      }

      // Generate unique referral code for this member (6 chars: 3 letters + 3 numbers)
      let uniqueCode = false;
      let generatedCode = '';
      while (!uniqueCode) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        generatedCode = '';
        for (let i = 0; i < 3; i++) {
          generatedCode += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        for (let i = 0; i < 3; i++) {
          generatedCode += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }

        // Check if code already exists
        const existing = await Member.findOne({ referralCode: generatedCode });
        if (!existing) {
          uniqueCode = true;
        }
      }

      // Update member with complete information
      member.name = name;
      member.englishAlias = englishAlias || '';
      member.gender = gender;
      member.birthDate = birthDate;
      member.familyMembers = familyMembers || [];
      member.contact = contact;
      member.referralCode = generatedCode;
      member.registrationCompleted = true;
      member.registrationToken = undefined; // Remove token after use
      member.registrationTokenExpires = undefined;

      await member.save();

      return res.status(200).json({
        message: '註冊完成 / Registration completed successfully',
        member: {
          memberId: member.memberId,
          name: member.name,
          referralCode: member.referralCode
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

    // Update member profile
    if (req.method === 'PUT' && memberId) {
      const { name, englishAlias, gender, birthDate, familyMembers, contact } = req.body;

      const member = await Member.findOne({ memberId });

      if (!member) {
        return res.status(404).json({
          message: '找不到團員 / Member not found'
        });
      }

      // Only allow updates if registration is completed
      if (!member.registrationCompleted) {
        return res.status(400).json({
          message: '請先完成註冊 / Please complete registration first'
        });
      }

      if (name) member.name = name;
      if (englishAlias !== undefined) member.englishAlias = englishAlias;
      if (gender) member.gender = gender;
      if (birthDate) member.birthDate = birthDate;
      if (familyMembers !== undefined) member.familyMembers = familyMembers;
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
