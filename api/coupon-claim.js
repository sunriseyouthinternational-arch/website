const connectDB = require('../lib/mongodb');
const { CouponShareToken, Member } = require('../db/models');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { token } = req.query;

  try {
    await connectDB();

    // GET - View coupon details
    if (req.method === 'GET' && token) {
      const shareToken = await CouponShareToken.findOne({ token }).populate('couponData.classInfoId');

      if (!shareToken) {
        return res.status(404).json({
          message: '找不到優惠券 / Coupon not found'
        });
      }

      if (shareToken.status === 'claimed') {
        return res.status(400).json({
          message: '此優惠券已被領取 / This coupon has already been claimed',
          status: 'claimed'
        });
      }

      if (new Date() > shareToken.expiresAt) {
        shareToken.status = 'expired';
        await shareToken.save();
        return res.status(400).json({
          message: '此連結已過期 / This link has expired',
          status: 'expired'
        });
      }

      if (shareToken.couponData.expiryDate && new Date() > new Date(shareToken.couponData.expiryDate)) {
        return res.status(400).json({
          message: '此優惠券已過期 / This coupon has expired',
          status: 'expired'
        });
      }

      return res.status(200).json({
        coupon: shareToken.couponData,
        senderName: shareToken.senderName,
        expiresAt: shareToken.expiresAt,
        status: 'available'
      });
    }

    // POST - Claim coupon with memberId
    if (req.method === 'POST') {
      const { token: claimToken, memberId } = req.body;

      if (!claimToken || !memberId) {
        return res.status(400).json({
          message: '缺少必要欄位 / Missing required fields'
        });
      }

      const shareToken = await CouponShareToken.findOne({ token: claimToken });

      if (!shareToken) {
        return res.status(404).json({
          message: '找不到優惠券 / Coupon not found'
        });
      }

      if (shareToken.status === 'claimed') {
        return res.status(400).json({
          message: '此優惠券已被領取 / This coupon has already been claimed',
          status: 'claimed'
        });
      }

      if (new Date() > shareToken.expiresAt) {
        shareToken.status = 'expired';
        await shareToken.save();
        return res.status(400).json({
          message: '此連結已過期 / This link has expired',
          status: 'expired'
        });
      }

      if (shareToken.couponData.expiryDate && new Date() > new Date(shareToken.couponData.expiryDate)) {
        return res.status(400).json({
          message: '此優惠券已過期 / This coupon has expired',
          status: 'expired'
        });
      }

      const recipient = await Member.findOne({ memberId });

      if (!recipient) {
        return res.status(404).json({
          message: '找不到團員 / Member not found'
        });
      }

      // Check if recipient is the sender
      if (recipient.memberId === shareToken.senderMemberId) {
        return res.status(400).json({
          message: '無法領取自己分享的優惠券 / Cannot claim your own coupon'
        });
      }

      // Check if recipient has completed any classes
      const completedClasses = recipient.enrollments.filter(e => e.status === 'completed');
      if (completedClasses.length > 0) {
        return res.status(400).json({
          message: '優惠券只能分享給未修過課程的會員 / Coupons can only be shared to members who have not completed any classes',
          hasCompletedClasses: true
        });
      }

      // Add coupon to recipient
      recipient.coupons.push({
        type: shareToken.couponData.type,
        classInfoId: shareToken.couponData.classInfoId,
        discountPercent: shareToken.couponData.discountPercent,
        name: shareToken.couponData.name,
        description: shareToken.couponData.description,
        image: shareToken.couponData.image,
        quantity: 1,
        usedCount: 0,
        expiryDate: shareToken.couponData.expiryDate
      });

      await recipient.save();

      // Mark share token as claimed
      shareToken.status = 'claimed';
      shareToken.claimedBy = recipient.memberId;
      shareToken.claimedAt = new Date();
      await shareToken.save();

      // Decrement sender's coupon
      const sender = await Member.findOne({ memberId: shareToken.senderMemberId });
      if (sender) {
        const senderCoupon = sender.coupons.id(shareToken.senderCouponId);
        if (senderCoupon) {
          senderCoupon.usedCount += 1;
          await sender.save();
        }
      }

      return res.status(200).json({
        message: '優惠券領取成功！/ Coupon claimed successfully!',
        success: true,
        coupon: shareToken.couponData
      });
    }

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('[Coupon Claim] ERROR:', error);
    res.status(500).json({
      message: '服務器錯誤 / Server error',
      error: error.message
    });
  }
};nd member by LINE user ID
      const member = await Member.findOne({ 'line.userId': lineUserId });

      console.log('[Coupon Claim POST] Looking up sender:', shareToken.senderMemberId);

      // Get sender's referral code for registration autofill
      const sender = await Member.findOne({ memberId: shareToken.senderMemberId });
      const senderReferralCode = sender?.referralCode || '';

      console.log('[Coupon Claim POST] Member found:', !!member, 'Sender found:', !!sender);

      if (!member) {
        console.log('[Coupon Claim POST] Member not found, creating placeholder with pending token');

        // Generate sequential member ID for placeholder
        const lastMember = await Member.findOne().sort({ createdAt: -1 }).select('memberId');
        let nextNumber = 1;

        if (lastMember && lastMember.memberId) {
          const lastNumber = parseInt(lastMember.memberId.substring(1));
          if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
          }
        }

        const newMemberId = `M${nextNumber.toString().padStart(4, '0')}`;
        console.log('[Coupon Claim POST] Generated placeholder member ID:', newMemberId);

        // Create a placeholder member record to store the pending coupon token
        const newMember = new Member({
          memberId: newMemberId,
          line: {
            userId: lineUserId,
            linkedAt: new Date()
          },
          registrationCompleted: false,
          pendingCouponToken: claimToken
        });
        await newMember.save();

        console.log('[Coupon Claim POST] Placeholder member created with pending token');

        // Send LINE message with registration instructions
        try {
          const client = new line.messagingApi.MessagingApiClient({
            channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
          });

          const registrationText = `🎉 歡迎！您已掃描優惠券\n\n📋 為了領取此優惠券，請完成會員註冊：\n${process.env.REGISTRATION_URL || 'https://website.example.com'}/profile\n\n點擊上方連結進行註冊，填寫基本資訊後，優惠券將自動添加到您的帳戶！\n\n✨ 如有任何問題，歡迎聯絡我們`;

          console.log('[Coupon Claim POST] Sending registration guide message to new user:', lineUserId);
          await client.pushMessage({
            to: lineUserId,
            messages: [{
              type: 'text',
              text: registrationText
            }]
          });
          console.log('[Coupon Claim POST] Registration guide message sent successfully');
        } catch (messageError) {
          console.error('[Coupon Claim POST] Error sending registration guide message:', messageError);
          // Don't fail the API call if message sending fails
        }

        return res.status(404).json({
          message: '找不到會員，請先完成註冊 / Member not found, please complete registration first',
          needsRegistration: true,
          senderReferralCode
        });
      }

      if (!member.registrationCompleted) {
        console.log('[Coupon Claim POST] Member exists but not registered, saving pending token');

        // Save pending token to existing member
        member.pendingCouponToken = claimToken;
        await member.save();

        // Send LINE message with registration instructions
        if (member.line && member.line.userId) {
          try {
            const client = new line.messagingApi.MessagingApiClient({
              channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
            });

            const registrationText = `📋 您需要完成會員註冊以領取優惠券\n\n請點擊下方連結進行註冊：\n${process.env.REGISTRATION_URL || 'https://website.example.com'}/profile\n\n註冊時請填寫您的基本資訊，完成後優惠券將自動添加到您的帳戶！\n\n🎁 尚未加入 LINE 官方帳號嗎？\n點擊下方加入並獲得最新活動資訊`;

            console.log('[Coupon Claim POST] Sending registration guide message to:', member.line.userId);
            await client.pushMessage({
              to: member.line.userId,
              messages: [{
                type: 'text',
                text: registrationText
              }]
            });
            console.log('[Coupon Claim POST] Registration guide message sent successfully');
          } catch (messageError) {
            console.error('[Coupon Claim POST] Error sending registration guide message:', messageError);
            // Don't fail the API call if message sending fails
          }
        }

        return res.status(400).json({
          message: '請先完成註冊 / Please complete registration first',
          needsRegistration: true,
          senderReferralCode
        });
      }

      // Check if member has completed any classes
      const completedClasses = member.enrollments.filter(
        e => e.type === 'class' && e.status === 'completed'
      );

      if (completedClasses.length > 0) {
        console.log('[Coupon Claim POST] Member has completed classes, rejecting claim:', completedClasses.length);
        return res.status(400).json({
          message: '優惠券只能分享給未修過課程的會員 / Coupons can only be shared to members who have not completed any classes',
          hasCompletedClasses: true,
          completedClassCount: completedClasses.length
        });
      }

      // Member qualifies - has completed 0 classes
      // For registered members, save as pending coupon token for consistent handling
      console.log('[Coupon Claim POST] Registered member with 0 completed classes qualifies');

      member.pendingCouponToken = claimToken;
      await member.save();

      return res.status(200).json({
        message: '優惠券可領取 / Coupon can be claimed',
        success: true,
        coupon: shareToken.couponData,
        senderName: shareToken.senderName,
        couponToken: claimToken,
        member: {
          memberId: member.memberId,
          name: member.name
        }
      });
    }

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('[Coupon Claim] ERROR:', error);
    console.error('[Coupon Claim] Stack:', error.stack);
    res.status(500).json({
      message: '服務器錯誤 / Server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
