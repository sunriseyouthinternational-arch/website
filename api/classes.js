const connectDB = require('../lib/mongodb');
const { Class, ClassInfo, Member } = require('../db/models');
const {
  POINTS_PER_NTD,
  REFERRAL_CLASS_COMPLETION_POINTS,
  awardPoints,
  maybeAwardAttendanceCoupon,
  redeemPoints,
  updateEnrollmentStatus,
  upsertEnrollment
} = require('../lib/memberRewards');

module.exports = async (req, res) => {
  const { id, action } = req.query;

  try {
    await connectDB();

    if (action === 'cancel-enrollment' && req.method === 'POST') {
      const { memberId } = req.body;

      const classItem = await Class.findById(id).populate('classInfoId').populate('teacherId');
      const member = await Member.findOne({ memberId });

      if (!classItem) {
        return res.status(404).json({ message: '找不到課程 / Class not found' });
      }

      if (!member) {
        return res.status(404).json({ message: '找不到團員 / Member not found' });
      }

      const enrollment = member.enrollments.find(
        (entry) => entry.type === 'class' && entry.itemId.toString() === classItem._id.toString() && entry.status === 'active'
      );

      if (!enrollment) {
        return res.status(400).json({ message: '尚未報名此課程 / You are not enrolled in this class' });
      }

      const originalCount = classItem.participants.length;
      classItem.participants = classItem.participants.filter(
        (participant) => participant.memberId.toString() !== member._id.toString()
      );

      if (classItem.participants.length === originalCount) {
        return res.status(400).json({ message: '找不到可取消的報名資料 / No enrollment found to cancel' });
      }

      updateEnrollmentStatus(member, 'class', classItem._id, 'cancelled');

      await Promise.all([
        classItem.save(),
        member.save()
      ]);

      return res.status(200).json({
        message: '已取消課程報名 / Class enrollment cancelled',
        class: classItem
      });
    }

    // Enroll in class
    if (action === 'enroll' && req.method === 'POST') {
      const { memberId, paymentMethod, familyMembers = [], familyMemberCoupons = {}, pointsToUse = 0 } = req.body;

      const classItem = await Class.findById(id).populate('classInfoId').populate('teacherId');
      const member = await Member.findOne({ memberId });

      if (!classItem) {
        return res.status(404).json({ message: '找不到課程 / Class not found' });
      }

      if (!member) {
        return res.status(404).json({ message: '找不到團員 / Member not found' });
      }

      const totalEnrolling = familyMembers.length;
      if (totalEnrolling === 0) {
        return res.status(400).json({ message: '請至少選擇一位人員 / Please select at least one person' });
      }

      if (classItem.currentParticipants + totalEnrolling > classItem.classInfoId.maxParticipants) {
        return res.status(400).json({ message: '課程名額不足 / Not enough spots available' });
      }

      const familyCouponsUsed = [];
      const participantEntries = [];

      familyMembers.forEach(fmIndex => {
        // Handle main member enrollment
        if (fmIndex === 'self') {
          let fmCouponDiscount = 0;

          const fmCouponId = familyMemberCoupons['self'];
          if (fmCouponId) {
            const fmCoupon = member.coupons.id(fmCouponId);
            if (fmCoupon && fmCoupon.usedCount < fmCoupon.quantity) {
              if (fmCoupon.type === 'trial') {
                fmCouponDiscount = classItem.classInfoId.cost;
              } else {
                fmCouponDiscount = Math.round(classItem.classInfoId.cost * fmCoupon.discountPercent / 100);
              }
              fmCoupon.usedCount += 1;
              familyCouponsUsed.push({
                name: fmCoupon.name,
                type: fmCoupon.type,
                discountPercent: fmCoupon.discountPercent
              });
            }
          }

          participantEntries.push({
            memberId: member._id,
            memberName: member.name,
            paid: false,
            paymentMethod: paymentMethod || 'in-person',
            isFamilyMember: false,
            couponDiscount: fmCouponDiscount
          });
        } else {
          // Handle family member enrollment
          const familyMember = member.familyMembers[fmIndex];
          if (familyMember) {
            let fmCouponDiscount = 0;

            const fmCouponId = familyMemberCoupons[fmIndex];
            if (fmCouponId) {
              const fmCoupon = member.coupons.id(fmCouponId);
              if (fmCoupon && fmCoupon.usedCount < fmCoupon.quantity) {
                if (fmCoupon.type === 'trial') {
                  fmCouponDiscount = classItem.classInfoId.cost;
                } else {
                  fmCouponDiscount = Math.round(classItem.classInfoId.cost * fmCoupon.discountPercent / 100);
                }
                fmCoupon.usedCount += 1;
                familyCouponsUsed.push({
                  name: fmCoupon.name,
                  type: fmCoupon.type,
                  discountPercent: fmCoupon.discountPercent
                });
              }
            }

            participantEntries.push({
              memberId: member._id,
              memberName: `${familyMember.name} (${member.name}的家人)`,
              paid: false,
              paymentMethod: paymentMethod || 'in-person',
              isFamilyMember: true,
              couponDiscount: fmCouponDiscount
            });
          }
        }
      });

      const subtotal = classItem.classInfoId.cost * participantEntries.length;
      const couponDiscountTotal = participantEntries.reduce((sum, participant) => sum + (participant.couponDiscount || 0), 0);
      const totalAfterCoupons = Math.max(0, subtotal - couponDiscountTotal);
      const requestedPoints = Math.max(0, Math.floor(Number(pointsToUse) || 0));
      const pointsRequestedNtd = requestedPoints * POINTS_PER_NTD;
      const pointsDiscountTotal = redeemPoints(member, {
        key: `points-redemption:class:${classItem._id.toString()}:${member._id.toString()}`,
        type: 'points_redemption',
        points: Math.min(pointsRequestedNtd, totalAfterCoupons),
        itemId: classItem._id,
        description: `課程報名折抵 / Points redemption for class ${classItem._id.toString()}`
      });

      let remainingPointsDiscount = pointsDiscountTotal;
      participantEntries.forEach((participant) => {
        const participantSubtotal = Math.max(0, classItem.classInfoId.cost - (participant.couponDiscount || 0));
        const participantPointsDiscount = Math.min(participantSubtotal, remainingPointsDiscount);
        remainingPointsDiscount -= participantPointsDiscount;
        participant.pointsDiscount = participantPointsDiscount;
        classItem.participants.push(participant);
      });

      await classItem.save();

      console.log('[Enrollment] Saved class participants:', JSON.stringify(classItem.participants, null, 2));

      upsertEnrollment(member, {
        type: 'class',
        itemId: classItem._id,
        itemName: classItem.name || classItem.classInfoId.name,
        paid: false,
        paymentMethod: paymentMethod || 'in-person',
        couponDiscount: couponDiscountTotal,
        pointsDiscount: pointsDiscountTotal
      });

      await member.save();

      let message = '報名成功！';
      if (familyCouponsUsed.length > 0) {
        message += '已使用優惠券。';
      } else {
        message += '請記得於課程現場繳費。';
      }
      message += ' / Enrollment successful!';

      if (familyCouponsUsed.length > 0) {
        message += ' Coupons applied.';
      } else {
        message += ' Please remember to pay at the venue.';
      }

      return res.status(200).json({
        message,
        class: classItem,
        familyCouponsUsed,
        pricing: {
          subtotal,
          couponDiscount: couponDiscountTotal,
          pointsDiscount: pointsDiscountTotal,
          finalCost: Math.max(0, totalAfterCoupons - pointsDiscountTotal)
        },
        remainingPoints: member.points || 0
      });
    }

    // List all classes or create new
    if (!id) {
      if (req.method === 'GET') {
        const classes = await Class.find()
          .populate('classInfoId')
          .populate('teacherId')
          .sort({ createdAt: -1 });
        return res.status(200).json({ classes });
      }

      if (req.method === 'POST') {
        const { classInfoId, name, description, teacherId, teacher, time, date, location, sendLineAnnouncement } = req.body;

        // Verify classInfo exists
        const classInfo = await ClassInfo.findById(classInfoId);
        if (!classInfo) {
          return res.status(404).json({ message: '找不到課程資訊 / Class info not found' });
        }

        const className = name || classInfo.name;
        const classDescription = description || classInfo.description;

        const classItem = new Class({
          classInfoId,
          name: className,
          description: classDescription,
          teacherId: teacherId || null,
          teacher,
          time,
          date: new Date(date),
          location: location || ''
        });

        await classItem.save();

        // Send LINE broadcast if requested
        if (sendLineAnnouncement) {
          try {
            const axios = require('axios');

            console.log('Sending LINE broadcast for class:', className);
            console.log('LINE_CHANNEL_ACCESS_TOKEN exists:', !!process.env.LINE_CHANNEL_ACCESS_TOKEN);

            const flexMessage = {
              type: 'flex',
              altText: `📢 新課程通知：${className}`,
              contents: {
                type: 'bubble',
                hero: {
                  type: 'image',
                  url: `${process.env.BASE_URL}/images/line-broadcast/class_announcement.jpg`,
                  size: 'full',
                  aspectRatio: '20:13',
                  aspectMode: 'cover'
                },
                body: {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'text',
                      text: '📢 新課程通知',
                      weight: 'bold',
                      size: 'md',
                      color: '#1DB446'
                    },
                    {
                      type: 'text',
                      text: className,
                      weight: 'bold',
                      size: 'xl',
                      wrap: true,
                      margin: 'md'
                    },
                    {
                      type: 'box',
                      layout: 'vertical',
                      margin: 'lg',
                      spacing: 'sm',
                      contents: [
                        {
                          type: 'box',
                          layout: 'baseline',
                          spacing: 'sm',
                          contents: [
                            { type: 'text', text: '📅', size: 'sm', flex: 0 },
                            { type: 'text', text: new Date(date).toLocaleDateString('zh-TW'), size: 'sm', color: '#666666', flex: 5, wrap: true }
                          ]
                        },
                        {
                          type: 'box',
                          layout: 'baseline',
                          spacing: 'sm',
                          contents: [
                            { type: 'text', text: '⏰', size: 'sm', flex: 0 },
                            { type: 'text', text: time, size: 'sm', color: '#666666', flex: 5, wrap: true }
                          ]
                        },
                        {
                          type: 'box',
                          layout: 'baseline',
                          spacing: 'sm',
                          contents: [
                            { type: 'text', text: '📍 地點', size: 'sm', flex: 0 },
                            { type: 'text', text: location || '待定', size: 'sm', color: '#666666', flex: 5, wrap: true }
                          ]
                        },
                        {
                          type: 'box',
                          layout: 'baseline',
                          spacing: 'sm',
                          contents: [
                            { type: 'text', text: '👥', size: 'sm', flex: 0 },
                            { type: 'text', text: `名額：${classInfo.maxParticipants}人`, size: 'sm', color: '#666666', flex: 5 }
                          ]
                        },
                        classInfo.description ? {
                          type: 'text',
                          text: classInfo.description,
                          size: 'sm',
                          color: '#999999',
                          margin: 'md',
                          wrap: true
                        } : undefined,
                        {
                          type: 'text',
                          text: '請至官方帳號查看詳情並報名！',
                          size: 'sm',
                          color: '#1DB446',
                          margin: 'md',
                          wrap: true
                        }
                      ].filter(Boolean)
                    }
                  ]
                },
                footer: {
                  type: 'box',
                  layout: 'vertical',
                  spacing: 'sm',
                  contents: [
                    {
                      type: 'button',
                      style: 'primary',
                      action: {
                        type: 'uri',
                        label: '查看詳情並報名',
                        uri: `${process.env.BASE_URL}/profile?tab=classes&classId=${classItem._id}`
                      }
                    }
                  ]
                }
              }
            };

            const response = await axios.post('https://api.line.me/v2/bot/message/broadcast', {
              messages: [flexMessage]
            }, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
              }
            });

            console.log('LINE broadcast sent successfully:', response.status);
          } catch (error) {
            console.error('LINE broadcast error:', error.response?.data || error.message);
          }
        }

        return res.status(201).json({
          message: '課程創建成功 / Class created successfully',
          class: classItem
        });
      }
    }

    // Get/Update/Delete specific class
    if (id) {
      if (req.method === 'GET') {
        const classItem = await Class.findById(id).populate('classInfoId').populate('teacherId');

        if (!classItem) {
          return res.status(404).json({ message: '找不到課程 / Class not found' });
        }

        return res.status(200).json({ class: classItem });
      }

      if (req.method === 'PUT') {
        const classItem = await Class.findById(id).populate('classInfoId');

        if (!classItem) {
          return res.status(404).json({ message: '找不到課程 / Class not found' });
        }

        // Update hosted class fields only. Shared template fields belong in ClassInfo management.
        const classUpdates = {};
        if (req.body.name !== undefined) classUpdates.name = req.body.name;
        if (req.body.description !== undefined) classUpdates.description = req.body.description;
        if (req.body.date !== undefined) classUpdates.date = req.body.date;
        if (req.body.time !== undefined) classUpdates.time = req.body.time;
        if (req.body.location !== undefined) classUpdates.location = req.body.location;
        if (req.body.teacher !== undefined) classUpdates.teacher = req.body.teacher;
        if (req.body.teacherId !== undefined) classUpdates.teacherId = req.body.teacherId;
        if (req.body.status !== undefined) classUpdates.status = req.body.status;

        // Update Class
        const updatedClass = await Class.findByIdAndUpdate(id, classUpdates, { new: true });

        // Update enrollment status when class status changes
        if (req.body.status === 'completed' || req.body.status === 'cancelled') {
          const participantMemberIds = [...new Set(classItem.participants.map((participant) => participant.memberId.toString()))];
          const participantMembers = await Member.find({ _id: { $in: participantMemberIds } });

          for (const member of participantMembers) {
            const enrollment = updateEnrollmentStatus(member, 'class', classItem._id, req.body.status);
            if (!enrollment) {
              continue;
            }

            if (req.body.status === 'completed' && member.referredBy) {
              const referrer = await Member.findById(member.referredBy);
              if (referrer) {
                const referralAwarded = awardPoints(referrer, {
                  key: `referral-class-completion:${member._id.toString()}:${classItem._id.toString()}`,
                  type: 'referral_class_completion_bonus',
                  points: REFERRAL_CLASS_COMPLETION_POINTS,
                  itemId: classItem._id,
                  relatedMemberId: member._id,
                  description: `推薦會員 ${member.memberId} 完成課程 / Referral class completion bonus for ${member.memberId}`
                });

                if (referralAwarded) {
                  await referrer.save();
                }
              }

              maybeAwardAttendanceCoupon(member);
            }

            await member.save();
          }
        }

        return res.status(200).json({
          message: '課程更新成功 / Class updated successfully',
          class: updatedClass
        });
      }

      if (req.method === 'DELETE') {
        const classItem = await Class.findByIdAndDelete(id);

        if (!classItem) {
          return res.status(404).json({ message: '找不到課程 / Class not found' });
        }

        // Update enrollment status for all participants
        const enrolledMembers = await Member.find({ 'enrollments.itemId': id });
        for (const member of enrolledMembers) {
          updateEnrollmentStatus(member, 'class', id, 'cancelled');
          await member.save();
        }

        return res.status(200).json({ message: '課程刪除成功 / Class deleted successfully' });
      }
    }

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Class operation error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: '服務器錯誤 / Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
