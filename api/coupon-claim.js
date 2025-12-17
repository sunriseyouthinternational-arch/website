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

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Coupon claim error:', error);
    res.status(500).json({
      message: '服務器錯誤 / Server error',
      error: error.message
    });
  }
};
