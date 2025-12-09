const connectDB = require('../../lib/mongodb');
const { Member } = require('../../db/models');

module.exports = async (req, res) => {
  const { memberId } = req.query;

  try {
    await connectDB();

    if (req.method === 'GET') {
      const member = await Member.findOne({ memberId });

      if (!member) {
        return res.status(404).json({
          message: '找不到團員 / Member not found'
        });
      }

      return res.status(200).json({ member });
    }

    if (req.method === 'PUT') {
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

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Member operation error:', error);
    res.status(500).json({ message: '服務器錯誤 / Server error' });
  }
};
