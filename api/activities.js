const connectDB = require('../lib/mongodb');
const { Activity, Member } = require('../db/models');
const mongoose = require('mongoose');

module.exports = async (req, res) => {
  const { id, action } = req.query;

  try {
    await connectDB();

    // Enroll in activity
    if (action === 'enroll' && req.method === 'POST') {
      const { memberId, paymentMethod, couponId, familyMembers = [] } = req.body;

      const activity = await Activity.findById(id).populate('teacherId');
      const member = await Member.findOne({ memberId });

      if (!activity) {
        return res.status(404).json({ message: '找不到活動 / Activity not found' });
      }

      if (!member) {
        return res.status(404).json({ message: '找不到團員 / Member not found' });
      }

      const totalEnrolling = 1 + familyMembers.length;
      if (activity.currentParticipants + totalEnrolling > activity.maxParticipants) {
        return res.status(400).json({ message: '活動名額不足 / Not enough spots available' });
      }

      const alreadyEnrolled = activity.participants.some(
        p => p.memberId.toString() === member._id.toString()
      );

      if (alreadyEnrolled) {
        return res.status(400).json({ message: '已經報名此活動 / Already enrolled in this activity' });
      }

      // Handle coupon redemption
      let couponUsed = null;
      if (couponId) {
        const coupon = member.coupons.id(couponId);

        if (!coupon) {
          return res.status(404).json({ message: '找不到優惠券 / Coupon not found' });
        }

        // Check if coupon has remaining uses
        if (coupon.usedCount >= coupon.quantity) {
          return res.status(400).json({ message: '優惠券已用完 / Coupon has been fully used' });
        }

        // Validate coupon type - only discount coupons work for activities
        if (coupon.type === 'trial') {
          return res.status(400).json({ message: '體驗券僅適用於課程 / Trial coupons are only valid for classes' });
        }

        // Increment usedCount
        coupon.usedCount += 1;
        couponUsed = {
          name: coupon.name,
          type: coupon.type,
          discountPercent: coupon.discountPercent
        };
      }

      activity.participants.push({
        memberId: member._id,
        memberName: member.name,
        paid: false,
        paymentMethod: paymentMethod || 'in-person'
      });

      // Add family members
      familyMembers.forEach(fmIndex => {
        const familyMember = member.familyMembers[fmIndex];
        if (familyMember) {
          activity.participants.push({
            memberId: member._id,
            memberName: `${familyMember.name} (${member.name}的家人)`,
            paid: false,
            paymentMethod: paymentMethod || 'in-person',
            isFamilyMember: true
          });
        }
      });

      await activity.save();

      member.enrollments.push({
        type: 'activity',
        itemId: activity._id,
        itemName: activity.name
      });

      await member.save();

      let message = '報名成功！';
      if (couponUsed) {
        message += `已使用 ${couponUsed.discountPercent}% 折扣券。`;
      } else {
        message += '請記得於活動現場繳費。';
      }
      message += ' / Enrollment successful!';

      if (couponUsed) {
        message += ` ${couponUsed.discountPercent}% discount coupon applied.`;
      } else {
        message += ' Please remember to pay at the venue.';
      }

      return res.status(200).json({
        message,
        activity,
        couponUsed
      });
    }

    // List all activities or create new
    if (!id) {
      if (req.method === 'GET') {
        const activities = await Activity.find()
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

        // Update enrollment status when activity status changes
        if (req.body.status === 'completed') {
          await Member.updateMany(
            { 'enrollments.itemId': new mongoose.Types.ObjectId(id) },
            { $set: { 'enrollments.$[elem].status': 'completed' } },
            { arrayFilters: [{ 'elem.itemId': new mongoose.Types.ObjectId(id) }] }
          );
        } else if (req.body.status === 'cancelled') {
          await Member.updateMany(
            { 'enrollments.itemId': new mongoose.Types.ObjectId(id) },
            { $set: { 'enrollments.$[elem].status': 'cancelled' } },
            { arrayFilters: [{ 'elem.itemId': new mongoose.Types.ObjectId(id) }] }
          );
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
