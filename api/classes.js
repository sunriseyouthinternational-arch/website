const connectDB = require('../lib/mongodb');
const { Class, ClassInfo, Member } = require('../db/models');

module.exports = async (req, res) => {
  const { id, action } = req.query;

  try {
    await connectDB();

    // Enroll in class
    if (action === 'enroll' && req.method === 'POST') {
      const { memberId, paymentMethod, couponId } = req.body;

      const classItem = await Class.findById(id).populate('classInfoId').populate('teacherId');
      const member = await Member.findOne({ memberId });

      if (!classItem) {
        return res.status(404).json({ message: '找不到課程 / Class not found' });
      }

      if (!member) {
        return res.status(404).json({ message: '找不到團員 / Member not found' });
      }

      if (classItem.currentParticipants >= classItem.classInfoId.maxParticipants) {
        return res.status(400).json({ message: '課程已滿 / Class is full' });
      }

      const alreadyEnrolled = classItem.participants.some(
        p => p.memberId.toString() === member._id.toString()
      );

      if (alreadyEnrolled) {
        return res.status(400).json({ message: '已經報名此課程 / Already enrolled in this class' });
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

        // Validate coupon type
        if (coupon.type === 'trial') {
          // Trial coupon must match the class
          if (coupon.classInfoId.toString() !== classItem.classInfoId._id.toString()) {
            return res.status(400).json({ message: '此優惠券不適用於本課程 / This coupon is not valid for this class' });
          }
        }
        // Discount coupons are valid for all classes

        // Increment usedCount
        coupon.usedCount += 1;
        couponUsed = {
          name: coupon.name,
          type: coupon.type,
          discountPercent: coupon.discountPercent
        };
      }

      classItem.participants.push({
        memberId: member._id,
        memberName: member.name,
        paid: false,
        paymentMethod: paymentMethod || 'in-person'
      });

      await classItem.save();

      member.enrollments.push({
        type: 'class',
        itemId: classItem._id,
        itemName: classItem.classInfoId.name
      });

      await member.save();

      let message = '報名成功！';
      if (couponUsed) {
        if (couponUsed.type === 'trial') {
          message += '已使用體驗券，本次課程免費。';
        } else {
          message += `已使用 ${couponUsed.discountPercent}% 折扣券。`;
        }
      } else {
        message += '請記得於課程現場繳費。';
      }
      message += ' / Enrollment successful!';

      if (couponUsed) {
        if (couponUsed.type === 'trial') {
          message += ' Trial coupon applied - this class is free.';
        } else {
          message += ` ${couponUsed.discountPercent}% discount coupon applied.`;
        }
      } else {
        message += ' Please remember to pay at the venue.';
      }

      return res.status(200).json({
        message,
        class: classItem,
        couponUsed
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
                hero: classInfo.banner && classInfo.banner.startsWith('http') ? {
                  type: 'image',
                  url: classInfo.banner,
                  size: 'full',
                  aspectRatio: '20:13',
                  aspectMode: 'cover'
                } : undefined,
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
