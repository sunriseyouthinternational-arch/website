const connectDB = require('../lib/mongodb');
const { Member, CouponShareToken } = require('../db/models');
const { createPersonalizedRichMenu } = require('../lib/lineRichMenu');
const line = require('@line/bot-sdk');
const crypto = require('crypto');

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

      // Check for pending coupon and claim it
      if (member.pendingCouponToken) {
        try {
          const shareToken = await CouponShareToken.findOne({ token: member.pendingCouponToken });

          if (shareToken && shareToken.status === 'pending' && new Date() <= shareToken.expiresAt) {
            // Check if coupon itself is not expired
            if (!shareToken.couponData.expiryDate || new Date() <= new Date(shareToken.couponData.expiryDate)) {
              // Add coupon to recipient
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

              // Decrement sender's coupon now that it's been successfully claimed
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

              console.log(`[Registration] Coupon auto-claimed for ${member.memberId}`);
            }
          }
        } catch (couponError) {
          console.error('[Registration] Error claiming pending coupon:', couponError);
          // Don't block registration if coupon claim fails
        }

        // Clear pending coupon token regardless of success
        member.pendingCouponToken = undefined;
      }

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
      // Try to find by memberId first, then by LINE ID
      let member = await Member.findOne({ memberId });

      if (!member) {
        // Try searching by LINE ID if not found by member ID
        member = await Member.findOne({ 'contact.lineId': memberId });
      }

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
      const { type, classInfoId, discountPercent, name, description, image, quantity, expiryDate } = req.body;

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

      // Add expiry date if provided
      if (expiryDate) {
        coupon.expiryDate = new Date(expiryDate);
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

    // Generate shareable link for coupon
    if (req.method === 'POST' && action === 'generate-share-link') {
      const { memberId: senderMemberId, couponId } = req.body;

      if (!senderMemberId || !couponId) {
        return res.status(400).json({
          message: '缺少必要欄位 / Missing required fields'
        });
      }

      const sender = await Member.findOne({ memberId: senderMemberId });

      if (!sender) {
        return res.status(404).json({
          message: '找不到團員 / Member not found'
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
          message: '優惠券已用完，無法分享 / Coupon has no remaining uses'
        });
      }

      // Check if coupon is expired
      if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
        return res.status(400).json({
          message: '優惠券已過期 / Coupon has expired'
        });
      }

      // Generate unique token
      const token = crypto.randomBytes(16).toString('hex');

      // Create share token (expires in 7 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const shareToken = new CouponShareToken({
        token,
        couponData: {
          type: coupon.type,
          classInfoId: coupon.classInfoId,
          discountPercent: coupon.discountPercent,
          name: coupon.name,
          description: coupon.description,
          image: coupon.image,
          expiryDate: coupon.expiryDate
        },
        senderMemberId: sender.memberId,
        senderName: sender.name,
        senderCouponId: coupon._id, // Store reference to sender's coupon
        expiresAt
      });

      await shareToken.save();

      // Note: Coupon is NOT decremented here. It will be decremented when successfully claimed.

      const protocol = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split('://')[0] : 'https';
      const host = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split('://')[1] : 'www.sunriseyouth.org';
      const baseUrl = `${protocol}://${host}`;
      const claimUrl = `${baseUrl}/claim/${token}`;

      // Get LINE Official Account ID for add friend URL (without state - LINE doesn't support query params here)
      const lineChannelId = process.env.LINE_CHANNEL_ID || '@sunriseyouth';
      // Remove @ symbol if present for the URL
      const channelIdClean = lineChannelId.startsWith('@') ? lineChannelId.substring(1) : lineChannelId;
      const lineAddFriendUrl = `https://line.me/ti/p/${channelIdClean}`;

      return res.status(200).json({
        message: '分享連結已生成 / Share link generated successfully',
        token,
        claimUrl,
        lineAddFriendUrl,
        expiresAt
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
