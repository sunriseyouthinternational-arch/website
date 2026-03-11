const connectDB = require('../lib/mongodb');
const { CouponShareToken, Member, ClassInfo } = require('../db/models');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { token } = req.query;

  try {
    await connectDB();

    // GET - View coupon details before claiming (public endpoint)
    if (req.method === 'GET' && token) {
      const shareToken = await CouponShareToken.findOne({ token }).populate('couponData.classInfoId');

      if (!shareToken) {
        console.log('[Coupon Claim] Token not found:', token);
        return res.status(404).json({
          message: '找不到優惠券 / Coupon not found'
        });
      }

      console.log('[Coupon Claim] Token found:', {
        token,
        status: shareToken.status,
        expiresAt: shareToken.expiresAt,
        couponExpiryDate: shareToken.couponData.expiryDate,
        currentDate: new Date()
      });

      // Check if already claimed
      if (shareToken.status === 'claimed') {
        return res.status(400).json({
          message: '此優惠券已被領取 / This coupon has already been claimed',
          status: 'claimed'
        });
      }

      // Check if expired (link expiry)
      if (new Date() > shareToken.expiresAt) {
        console.log('[Coupon Claim] Link expired - expiresAt:', shareToken.expiresAt, 'current:', new Date());
        shareToken.status = 'expired';
        await shareToken.save();
        return res.status(400).json({
          message: '此連結已過期 / This link has expired',
          status: 'expired'
        });
      }

      // Check if coupon itself is expired
      if (shareToken.couponData.expiryDate && new Date() > new Date(shareToken.couponData.expiryDate)) {
        console.log('[Coupon Claim] Coupon expired - expiryDate:', shareToken.couponData.expiryDate, 'current:', new Date());
        return res.status(400).json({
          message: '此優惠券已過期 / This coupon has expired',
          status: 'expired'
        });
      }

      // Return coupon details for preview
      return res.status(200).json({
        coupon: shareToken.couponData,
        senderName: shareToken.senderName,
        expiresAt: shareToken.expiresAt,
        status: 'available'
      });
    }

    // POST - Automatic coupon claiming via LIFF (with LINE user ID)
    if (req.method === 'POST') {
      console.log('[Coupon Claim POST] Starting claim process');
      const { token: claimToken, lineUserId } = req.body;

      if (!claimToken || !lineUserId) {
        console.log('[Coupon Claim POST] Missing fields:', { claimToken: !!claimToken, lineUserId: !!lineUserId });
        return res.status(400).json({
          message: '缺少必要欄位 / Missing required fields'
        });
      }

      console.log('[Coupon Claim POST] Looking up token:', claimToken);

      // Find the share token
      const shareToken = await CouponShareToken.findOne({ token: claimToken });

      if (!shareToken) {
        console.log('[Coupon Claim POST] Token not found');
        return res.status(404).json({
          message: '找不到優惠券 / Coupon not found'
        });
      }

      console.log('[Coupon Claim POST] Token found:', {
        status: shareToken.status,
        expiresAt: shareToken.expiresAt,
        couponExpiryDate: shareToken.couponData?.expiryDate,
        senderMemberId: shareToken.senderMemberId
      });

      // Check if already claimed
      if (shareToken.status === 'claimed') {
        console.log('[Coupon Claim POST] Already claimed');
        return res.status(400).json({
          message: '此優惠券已被領取 / This coupon has already been claimed',
          status: 'claimed'
        });
      }

      // Check if expired (link expiry)
      if (new Date() > shareToken.expiresAt) {
        console.log('[Coupon Claim POST] Link expired');
        shareToken.status = 'expired';
        await shareToken.save();
        return res.status(400).json({
          message: '此連結已過期 / This link has expired',
          status: 'expired'
        });
      }

      // Check if coupon itself is expired
      if (shareToken.couponData.expiryDate && new Date() > new Date(shareToken.couponData.expiryDate)) {
        console.log('[Coupon Claim POST] Coupon expired');
        return res.status(400).json({
          message: '此優惠券已過期 / This coupon has expired',
          status: 'expired'
        });
      }

      console.log('[Coupon Claim POST] Looking up member with LINE userId:', lineUserId);

      // Find member by LINE user ID
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

      // Member qualifies - has completed 0 classes, proceed with claim
      console.log('[Coupon Claim POST] Member qualifies for coupon (0 completed classes), processing claim');

      try {
        // Add coupon to member
        member.coupons.push({
          type: shareToken.couponData.type,
          classInfoId: shareToken.couponData.classInfoId,
          discountPercent: shareToken.couponData.discountPercent,
          name: shareToken.couponData.name,
          description: shareToken.couponData.description,
          image: shareToken.couponData.image,
          expiryDate: shareToken.couponData.expiryDate,
          quantity: 1,
          usedCount: 0
        });

        // Decrement sender's coupon
        const sender = await Member.findOne({ memberId: shareToken.senderMemberId });
        if (sender) {
          const senderCoupon = sender.coupons.id(shareToken.senderCouponId);
          if (senderCoupon) {
            const remainingUses = senderCoupon.quantity - senderCoupon.usedCount;
            if (remainingUses === 1) {
              sender.coupons.pull(shareToken.senderCouponId);
            } else {
              senderCoupon.quantity -= 1;
            }
            await sender.save();
          }
        }

        // Mark token as claimed
        shareToken.status = 'claimed';
        shareToken.claimedBy = member.memberId;
        shareToken.claimedAt = new Date();
        await shareToken.save();

        // Save member with new coupon
        await member.save();

        console.log('[Coupon Claim POST] Coupon claimed successfully by member:', member.memberId);

        return res.status(200).json({
          message: '優惠券領取成功 / Coupon claimed successfully',
          success: true,
          coupon: shareToken.couponData,
          senderName: shareToken.senderName
        });
      } catch (claimError) {
        console.error('[Coupon Claim POST] Error processing coupon claim:', claimError);
        return res.status(500).json({
          message: '優惠券領取失敗 / Failed to claim coupon',
          error: claimError.message
        });
      }
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
