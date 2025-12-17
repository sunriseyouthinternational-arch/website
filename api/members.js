const connectDB = require('../lib/mongodb');
const { Member } = require('../db/models');
const { createPersonalizedRichMenu } = require('../lib/lineRichMenu');
const line = require('@line/bot-sdk');

module.exports = async (req, res) => {
  const { memberId, token, sessionToken, action, couponId } = req.query;

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

      // Create personalized rich menu if user has LINE account
      if (member.line && member.line.userId) {
        try {
          console.log(`[Registration] Creating rich menu for ${member.memberId}`);

          // Determine base URL
          const protocol = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split('://')[0] : 'https';
          const host = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split('://')[1] : 'www.sunriseyouth.org';
          const baseUrl = `${protocol}://${host}`;
          const profileUrl = `${baseUrl}/profile/${member.memberId}`;

          // Create LINE client
          const client = new line.messagingApi.MessagingApiClient({
            channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
          });

          // Delete old rich menu if exists
          if (member.line.richMenuId) {
            try {
              await client.unlinkRichMenuFromUser(member.line.userId);
              await client.deleteRichMenu(member.line.richMenuId);
            } catch (deleteError) {
              console.log(`[Registration] Could not delete old rich menu: ${deleteError.message}`);
            }
          }

          // Create new personalized rich menu
          const richMenuId = await createPersonalizedRichMenu(
            client,
            member.line.userId,
            member.memberId,
            profileUrl,
            member.line.displayName || member.name
          );

          // Save rich menu ID
          member.line.richMenuId = richMenuId;
          await member.save();

          console.log(`[Registration] Rich menu created successfully: ${richMenuId}`);
        } catch (richMenuError) {
          console.error(`[Registration] Error creating rich menu:`, richMenuError);
          // Don't fail registration if rich menu creation fails
        }
      }

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
      const query = { memberId };

      // If session token provided, validate it
      if (sessionToken) {
        query.sessionToken = sessionToken;

        const member = await Member.findOne(query);

        if (!member) {
          return res.status(401).json({
            message: '無效的登入憑證 / Invalid session credentials'
          });
        }

        // Check if session token expired
        if (member.sessionTokenExpires && member.sessionTokenExpires < new Date()) {
          return res.status(401).json({
            message: '登入已過期 / Session expired'
          });
        }

        return res.status(200).json({ member });
      }

      // No session token, normal member lookup
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

    // Add coupon to member
    if (req.method === 'POST' && action === 'add-coupon' && memberId) {
      const { type, classInfoId, discountPercent, name, description, image, quantity } = req.body;

      const member = await Member.findOne({ memberId });

      if (!member) {
        return res.status(404).json({
          message: '找不到團員 / Member not found'
        });
      }

      // Validate coupon data
      if (!type || !name || !quantity) {
        return res.status(400).json({
          message: '缺少必要欄位 / Missing required fields'
        });
      }

      if (type === 'trial' && !classInfoId) {
        return res.status(400).json({
          message: '體驗券必須指定課程 / Trial coupon must specify a class'
        });
      }

      if (type === 'discount' && (!discountPercent || discountPercent <= 0 || discountPercent > 100)) {
        return res.status(400).json({
          message: '折扣券必須指定有效的折扣百分比 / Discount coupon must specify valid discount percentage'
        });
      }

      // Create coupon object
      const coupon = {
        type,
        name,
        description: description || '',
        image: image || '',
        quantity: parseInt(quantity),
        usedCount: 0
      };

      if (type === 'trial') {
        coupon.classInfoId = classInfoId;
      } else {
        coupon.discountPercent = parseInt(discountPercent);
      }

      // Add coupon to member's coupons array
      member.coupons.push(coupon);
      await member.save();

      return res.status(200).json({
        message: '優惠券添加成功 / Coupon added successfully',
        member
      });
    }

    // Delete coupon from member
    if (req.method === 'DELETE' && action === 'delete-coupon' && memberId && couponId) {
      const member = await Member.findOne({ memberId });

      if (!member) {
        return res.status(404).json({
          message: '找不到團員 / Member not found'
        });
      }

      // Find and remove coupon
      const couponIndex = member.coupons.findIndex(c => c._id.toString() === couponId);

      if (couponIndex === -1) {
        return res.status(404).json({
          message: '找不到優惠券 / Coupon not found'
        });
      }

      member.coupons.splice(couponIndex, 1);
      await member.save();

      return res.status(200).json({
        message: '優惠券刪除成功 / Coupon deleted successfully',
        member
      });
    }

    // Transfer coupon to another member
    if (req.method === 'POST' && action === 'transfer-coupon') {
      const { senderMemberId, recipientMemberId, couponId } = req.body;

      if (!senderMemberId || !recipientMemberId || !couponId) {
        return res.status(400).json({
          message: '缺少必要欄位 / Missing required fields'
        });
      }

      const sender = await Member.findOne({ memberId: senderMemberId });
      const recipient = await Member.findOne({ memberId: recipientMemberId });

      if (!sender) {
        return res.status(404).json({
          message: '找不到發送者 / Sender not found'
        });
      }

      if (!recipient) {
        return res.status(404).json({
          message: '找不到收件人 / Recipient not found'
        });
      }

      // Find the coupon in sender's coupons
      const coupon = sender.coupons.id(couponId);

      if (!coupon) {
        return res.status(404).json({
          message: '找不到優惠券 / Coupon not found'
        });
      }

      // Check if coupon has remaining uses
      const remainingUses = coupon.quantity - coupon.usedCount;
      if (remainingUses <= 0) {
        return res.status(400).json({
          message: '優惠券已用完，無法轉讓 / Coupon has no remaining uses'
        });
      }

      // Create a copy of the coupon for the recipient
      const transferredCoupon = {
        type: coupon.type,
        name: coupon.name,
        description: coupon.description,
        image: coupon.image,
        quantity: 1, // Transfer only 1 use
        usedCount: 0
      };

      if (coupon.type === 'trial') {
        transferredCoupon.classInfoId = coupon.classInfoId;
      } else {
        transferredCoupon.discountPercent = coupon.discountPercent;
      }

      // Add coupon to recipient
      recipient.coupons.push(transferredCoupon);
      await recipient.save();

      // Decrement sender's coupon quantity or remove it if no uses left
      if (coupon.quantity - coupon.usedCount === 1) {
        // Last remaining use - remove the coupon entirely
        sender.coupons.pull(couponId);
      } else {
        // Decrement quantity
        coupon.quantity -= 1;
      }
      await sender.save();

      // Send LINE notification to recipient if they have LINE account
      if (recipient.line && recipient.line.userId) {
        try {
          const client = new line.messagingApi.MessagingApiClient({
            channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
          });

          const protocol = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split('://')[0] : 'https';
          const host = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split('://')[1] : 'www.sunriseyouth.org';
          const baseUrl = `${protocol}://${host}`;
          const couponsUrl = `${baseUrl}/profile/${recipient.memberId}?tab=coupons`;

          await client.pushMessage({
            to: recipient.line.userId,
            messages: [
              {
                type: 'text',
                text: `🎁 您收到了一張新優惠券！\n\n優惠券名稱：${coupon.name}\n類型：${coupon.type === 'trial' ? '體驗券' : '折扣券'}\n\n點擊查看您的優惠券：\n${couponsUrl}`
              }
            ]
          });

          console.log(`[Coupon Transfer] LINE notification sent to ${recipient.line.userId}`);
        } catch (lineError) {
          console.error('[Coupon Transfer] Error sending LINE notification:', lineError);
          // Don't fail the transfer if LINE notification fails
        }
      }

      return res.status(200).json({
        message: `優惠券轉讓成功！${recipient.line && recipient.line.userId ? '收件人已收到 LINE 通知。' : ''} / Coupon transferred successfully!${recipient.line && recipient.line.userId ? ' Recipient notified via LINE.' : ''}`,
        sender,
        recipient
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
