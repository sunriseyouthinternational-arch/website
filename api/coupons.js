const connectDB = require('../lib/mongodb');
const { CouponProfile, CouponForSale, ClassInfo } = require('../db/models');

module.exports = async (req, res) => {
  const { resource } = req.query;

  try {
    await connectDB();

    if (resource === 'profiles') {
      if (req.method === 'GET') {
        const profiles = await CouponProfile.find().populate('classInfoId').sort({ createdAt: -1 });
        return res.status(200).json({ profiles });
      }

      if (req.method === 'POST') {
        const { type, classInfoId, discountPercent, name, description, image } = req.body;

        if (!type || !name) {
          return res.status(400).json({ message: '缺少必要欄位 / Missing required fields' });
        }

        if (type === 'trial' && !classInfoId) {
          return res.status(400).json({ message: '體驗券必須指定課程 / Trial coupon must specify a class' });
        }

        if (type === 'discount' && (!discountPercent || discountPercent <= 0 || discountPercent > 100)) {
          return res.status(400).json({ message: '折扣券必須指定有效的折扣百分比 / Discount coupon must specify valid discount percentage' });
        }

        const profile = new CouponProfile({
          type,
          classInfoId: type === 'trial' ? classInfoId : undefined,
          discountPercent: type === 'discount' ? discountPercent : undefined,
          name,
          description: description || '',
          image: image || ''
        });

        await profile.save();
        return res.status(201).json({ message: '優惠券模板創建成功 / Coupon profile created successfully', profile });
      }

      if (req.method === 'PUT') {
        const { profileId } = req.query;
        const { type, classInfoId, discountPercent, name, description, image } = req.body;

        const profile = await CouponProfile.findById(profileId);
        if (!profile) {
          return res.status(404).json({ message: '找不到優惠券模板 / Coupon profile not found' });
        }

        profile.type = type || profile.type;
        profile.classInfoId = type === 'trial' ? classInfoId : undefined;
        profile.discountPercent = type === 'discount' ? discountPercent : undefined;
        profile.name = name || profile.name;
        profile.description = description !== undefined ? description : profile.description;
        profile.image = image !== undefined ? image : profile.image;

        await profile.save();
        return res.status(200).json({ message: '優惠券模板更新成功 / Coupon profile updated successfully', profile });
      }

      if (req.method === 'DELETE') {
        const { profileId } = req.query;
        const profile = await CouponProfile.findByIdAndDelete(profileId);
        if (!profile) {
          return res.status(404).json({ message: '找不到優惠券模板 / Coupon profile not found' });
        }
        return res.status(200).json({ message: '優惠券模板刪除成功 / Coupon profile deleted successfully' });
      }
    }

    if (resource === 'for-sale') {
      if (req.method === 'GET') {
        const coupons = await CouponForSale.find()
          .populate({ path: 'couponProfileId', populate: { path: 'classInfoId' } })
          .sort({ createdAt: -1 });
        return res.status(200).json({ coupons });
      }

      if (req.method === 'POST') {
        const { couponProfileId, price, stock } = req.body;

        if (!couponProfileId || price === undefined) {
          return res.status(400).json({ message: '缺少必要欄位 / Missing required fields' });
        }

        const profile = await CouponProfile.findById(couponProfileId);
        if (!profile) {
          return res.status(404).json({ message: '找不到優惠券模板 / Coupon profile not found' });
        }

        const couponForSale = new CouponForSale({
          couponProfileId,
          price: parseFloat(price),
          stock: stock !== undefined ? parseInt(stock) : -1
        });

        await couponForSale.save();
        return res.status(201).json({ message: '優惠券上架成功 / Coupon listed for sale successfully', coupon: couponForSale });
      }

      if (req.method === 'PUT') {
        const { couponId } = req.query;
        const { price, stock, active } = req.body;

        const coupon = await CouponForSale.findById(couponId);
        if (!coupon) {
          return res.status(404).json({ message: '找不到販售優惠券 / Coupon for sale not found' });
        }

        if (price !== undefined) coupon.price = parseFloat(price);
        if (stock !== undefined) coupon.stock = parseInt(stock);
        if (active !== undefined) coupon.active = active;

        await coupon.save();
        return res.status(200).json({ message: '販售優惠券更新成功 / Coupon for sale updated successfully', coupon });
      }

      if (req.method === 'DELETE') {
        const { couponId } = req.query;
        const coupon = await CouponForSale.findByIdAndDelete(couponId);
        if (!coupon) {
          return res.status(404).json({ message: '找不到販售優惠券 / Coupon for sale not found' });
        }
        return res.status(200).json({ message: '販售優惠券刪除成功 / Coupon for sale deleted successfully' });
      }
    }

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Coupon operation error:', error);
    res.status(500).json({ message: '服務器錯誤 / Server error', error: error.message });
  }
};
