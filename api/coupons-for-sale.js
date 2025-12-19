const connectDB = require('../lib/mongodb');
const { CouponForSale, CouponProfile } = require('../db/models');

module.exports = async (req, res) => {
  try {
    await connectDB();

    // GET all coupons for sale
    if (req.method === 'GET') {
      const coupons = await CouponForSale.find()
        .populate({
          path: 'couponProfileId',
          populate: { path: 'classInfoId' }
        })
        .sort({ createdAt: -1 });
      return res.status(200).json({ coupons });
    }

    // POST create new coupon for sale
    if (req.method === 'POST') {
      const { couponProfileId, price, stock } = req.body;

      // Validation
      if (!couponProfileId || price === undefined) {
        return res.status(400).json({
          message: '缺少必要欄位 / Missing required fields'
        });
      }

      // Verify profile exists
      const profile = await CouponProfile.findById(couponProfileId);
      if (!profile) {
        return res.status(404).json({
          message: '找不到優惠券模板 / Coupon profile not found'
        });
      }

      const couponForSale = new CouponForSale({
        couponProfileId,
        price: parseFloat(price),
        stock: stock !== undefined ? parseInt(stock) : -1
      });

      await couponForSale.save();

      return res.status(201).json({
        message: '優惠券上架成功 / Coupon listed for sale successfully',
        coupon: couponForSale
      });
    }

    // PUT update coupon for sale
    if (req.method === 'PUT') {
      const { couponId } = req.query;
      const { price, stock, active } = req.body;

      const coupon = await CouponForSale.findById(couponId);
      if (!coupon) {
        return res.status(404).json({
          message: '找不到販售優惠券 / Coupon for sale not found'
        });
      }

      if (price !== undefined) coupon.price = parseFloat(price);
      if (stock !== undefined) coupon.stock = parseInt(stock);
      if (active !== undefined) coupon.active = active;

      await coupon.save();

      return res.status(200).json({
        message: '販售優惠券更新成功 / Coupon for sale updated successfully',
        coupon
      });
    }

    // DELETE coupon for sale
    if (req.method === 'DELETE') {
      const { couponId } = req.query;

      const coupon = await CouponForSale.findByIdAndDelete(couponId);
      if (!coupon) {
        return res.status(404).json({
          message: '找不到販售優惠券 / Coupon for sale not found'
        });
      }

      return res.status(200).json({
        message: '販售優惠券刪除成功 / Coupon for sale deleted successfully'
      });
    }

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Coupon for sale operation error:', error);
    res.status(500).json({
      message: '服務器錯誤 / Server error',
      error: error.message
    });
  }
};
