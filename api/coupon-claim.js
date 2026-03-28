const connectDB = require('../lib/mongodb');
const { CouponShareToken, Member } = require('../db/models');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();

    // GET - View coupon details
    if (req.method === 'GET') {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({
          message: '缺少必要欄位 / Missing required fields'
        });
      }

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
};
