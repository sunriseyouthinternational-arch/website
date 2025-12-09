const connectDB = require('../../lib/mongodb');
const { Member } = require('../../db/models');
const QRCode = require('qrcode');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

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
    res.status(500).json({
      message: '註冊失敗 / Registration failed',
      error: error.message
    });
  }
};
