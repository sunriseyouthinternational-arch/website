const connectDB = require('../lib/mongodb');
const { Class, ClassInfo, Member } = require('../db/models');
const mongoose = require('mongoose');

const getAgeRangeLabel = (ageRange) => {
  const labels = {
    'all': '所有年齡',
    'children': '兒童 (6-12歲)',
    'teen': '青少年 (13-17歲)',
    'adult': '成人 (18-64歲)',
    'elderly': '長者 (65歲以上)'
  };
  return labels[ageRange] || '';
};

module.exports = async (req, res) => {
  const { id, action } = req.query;

  try {
    await connectDB();

    // Enroll in class
    if (action === 'enroll' && req.method === 'POST') {
      const { memberId, paymentMethod, couponId, familyMembers = [], familyMemberCoupons = {} } = req.body;

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

          classItem.participants.push({
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

            classItem.participants.push({
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

      await classItem.save();

      console.log('[Enrollment] Saved class participants:', JSON.stringify(classItem.participants, null, 2));

      member.enrollments.push({
        type: 'class',
        itemId: classItem._id,
        itemName: classItem.classInfoId.name
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
        familyCouponsUsed
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
        const { classInfoId, teacherId, teacher, time, date, location, sendLineAnnouncement } = req.body;

        // Verify classInfo exists
        const classInfo = await ClassInfo.findById(classInfoId);
        if (!classInfo) {
          return res.status(404).json({ message: '找不到課程資訊 / Class info not found' });
        }

        const classItem = new Class({
          classInfoId,
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

            console.log('Sending LINE broadcast for class:', classInfo.name);
            console.log('LINE_CHANNEL_ACCESS_TOKEN exists:', !!process.env.LINE_CHANNEL_ACCESS_TOKEN);

            const flexMessage = {
              type: 'flex',
              altText: `📢 新課程通知：${classInfo.name}`,
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
                      text: classInfo.name,
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
                        classInfo.ageRange ? {
                          type: 'box',
                          layout: 'baseline',
                          spacing: 'sm',
                          contents: [
                            { type: 'text', text: '👶', size: 'sm', flex: 0 },
                            { type: 'text', text: `建議年齡：${getAgeRangeLabel(classInfo.ageRange)}`, size: 'sm', color: '#666666', flex: 5, wrap: true }
                          ]
                        } : undefined,
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
        const classItem = await Class.findByIdAndUpdate(id, req.body, { new: true });

        if (!classItem) {
          return res.status(404).json({ message: '找不到課程 / Class not found' });
        }

        // Update enrollment status when class status changes
        if (req.body.status === 'completed') {
          console.log('Updating enrollment status to completed for class:', id);
          const result = await Member.updateMany(
            { 'enrollments.itemId': new mongoose.Types.ObjectId(id) },
            { $set: { 'enrollments.$[elem].status': 'completed' } },
            { arrayFilters: [{ 'elem.itemId': new mongoose.Types.ObjectId(id) }] }
          );
          console.log('Update result:', result);
        } else if (req.body.status === 'cancelled') {
          const result = await Member.updateMany(
            { 'enrollments.itemId': new mongoose.Types.ObjectId(id) },
            { $set: { 'enrollments.$[elem].status': 'cancelled' } },
            { arrayFilters: [{ 'elem.itemId': new mongoose.Types.ObjectId(id) }] }
          );
          console.log('Update result:', result);
        }

        return res.status(200).json({
          message: '課程更新成功 / Class updated successfully',
          class: classItem
        });
      }

      if (req.method === 'DELETE') {
        const classItem = await Class.findByIdAndDelete(id);

        if (!classItem) {
          return res.status(404).json({ message: '找不到課程 / Class not found' });
        }

        // Update enrollment status for all participants
        await Member.updateMany(
          { 'enrollments.itemId': id },
          { $set: { 'enrollments.$[elem].status': 'cancelled' } },
          { arrayFilters: [{ 'elem.itemId': id }] }
        );

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
