const connectDB = require('../lib/mongodb');
const { CouponShareToken, Member, ClassInfo } = require('../db/models');

module.exports = async (req, res) => {
  const { token } = req.query;

  try {
    await connectDB();

    // GET - View coupon details before claiming (public endpoint)
    if (req.method === 'GET' && token) {
      const shareToken = await CouponShareToken.findOne({ token }).populate('couponData.classInfoId');

      if (!shareToken) {
        return res.status(404).json({
          message: '找不到優惠券 / Coupon not found'
        });
      }

      // Check if already claimed
      if (shareToken.status === 'claimed') {
        return res.status(400).json({
          message: '此優惠券已被領取 / This coupon has already been claimed',
          status: 'claimed'
        });
      }

      // Check if expired (link expiry)
      if (new Date() > shareToken.expiresAt) {
        shareToken.status = 'expired';
        await shareToken.save();
        return res.status(400).json({
          message: '此連結已過期 / This link has expired',
          status: 'expired'
        });
      }

      // Check if coupon itself is expired
      if (shareToken.couponData.expiryDate && new Date() > new Date(shareToken.couponData.expiryDate)) {
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
      const { token: claimToken, lineUserId } = req.body;

      if (!claimToken || !lineUserId) {
        return res.status(400).json({
          message: '缺少必要欄位 / Missing required fields'
        });
      }

      // Find the share token
      const shareToken = await CouponShareToken.findOne({ token: claimToken });

      if (!shareToken) {
        return res.status(404).json({
          message: '找不到優惠券 / Coupon not found'
        });
      }

      // Check if already claimed
      if (shareToken.status === 'claimed') {
        return res.status(400).json({
          message: '此優惠券已被領取 / This coupon has already been claimed',
          status: 'claimed'
        });
      }

      // Check if expired (link expiry)
      if (new Date() > shareToken.expiresAt) {
        shareToken.status = 'expired';
        await shareToken.save();
        return res.status(400).json({
          message: '此連結已過期 / This link has expired',
          status: 'expired'
        });
      }

      // Check if coupon itself is expired
      if (shareToken.couponData.expiryDate && new Date() > new Date(shareToken.couponData.expiryDate)) {
        return res.status(400).json({
          message: '此優惠券已過期 / This coupon has expired',
          status: 'expired'
        });
      }

      // Find member by LINE user ID
      const member = await Member.findOne({ 'line.userId': lineUserId });

      if (!member) {
        return res.status(404).json({
          message: '找不到會員，請先完成註冊 / Member not found, please complete registration first',
          needsRegistration: true
        });
      }

      if (!member.registrationCompleted) {
        member.pendingCouponToken = claimToken;
        await member.save();
        return res.status(400).json({
          message: '請先完成註冊 / Please complete registration first',
          needsRegistration: true
        });
      }

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
      await member.save();

      return res.status(200).json({
        success: true,
        message: '優惠券領取成功！ / Coupon claimed successfully!',
        coupon: shareToken.couponData,
        senderName: shareToken.senderName,
        memberName: member.name
      });
    }

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Coupon claim error:', error);
    res.status(500).json({
      message: '服務器錯誤 / Server error',
      error: error.message
    });
  }
};
