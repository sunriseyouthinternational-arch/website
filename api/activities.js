const connectDB = require('../lib/mongodb');
const { Activity, Member } = require('../db/models');
const mongoose = require('mongoose');

module.exports = async (req, res) => {
  const { id, action } = req.query;

  try {
    await connectDB();

    // Enroll in activity
    if (action === 'enroll' && req.method === 'POST') {
      const { memberId, paymentMethod, couponId, familyMembers = [], familyMemberCoupons = {} } = req.body;

      const activity = await Activity.findById(id).populate('teacherId');
      const member = await Member.findOne({ memberId });

      if (!activity) {
        return res.status(404).json({ message: '找不到活動 / Activity not found' });
      }

      if (!member) {
        return res.status(404).json({ message: '找不到團員 / Member not found' });
      }

      // Only enroll family members, not the member themselves
      const totalEnrolling = familyMembers.length;
      if (totalEnrolling === 0) {
        return res.status(400).json({ message: '請至少選擇一位家庭成員 / Please select at least one family member' });
      }

      if (activity.currentParticipants + totalEnrolling > activity.maxParticipants) {
        return res.status(400).json({ message: '活動名額不足 / Not enough spots available' });
      }

      // Add family members
      const familyCouponsUsed = [];
      familyMembers.forEach(fmIndex => {
        const familyMember = member.familyMembers[fmIndex];
        if (familyMember) {
          let fmCouponDiscount = 0;

          // Handle family member coupon
          const fmCouponId = familyMemberCoupons[fmIndex];
          if (fmCouponId) {
            const fmCoupon = member.coupons.id(fmCouponId);
            if (fmCoupon && fmCoupon.usedCount < fmCoupon.quantity) {
              if (fmCoupon.type === 'trial') {
                fmCouponDiscount = activity.cost;
              } else {
                fmCouponDiscount = Math.round(activity.cost * fmCoupon.discountPercent / 100);
              }
              fmCoupon.usedCount += 1;
              familyCouponsUsed.push({
                name: fmCoupon.name,
                type: fmCoupon.type,
                discountPercent: fmCoupon.discountPercent
              });
            }
          }

          activity.participants.push({
            memberId: member._id,
            memberName: `${familyMember.name} (${member.name}的家人)`,
            paid: false,
            paymentMethod: paymentMethod || 'in-person',
            isFamilyMember: true,
            couponDiscount: fmCouponDiscount
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
      if (familyCouponsUsed.length > 0) {
        message += '已使用優惠券。';
      } else {
        message += '請記得於活動現場繳費。';
      }
      message += ' / Enrollment successful!';

      if (familyCouponsUsed.length > 0) {
        message += ' Coupons applied.';
      } else {
        message += ' Please remember to pay at the venue.';
      }

      return res.status(200).json({
        message,
        activity,
        familyCouponsUsed
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
