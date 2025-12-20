const connectDB = require('../lib/mongodb');
const { Member, CouponShareToken, CouponForSale } = require('../db/models');
const { createPersonalizedRichMenu } = require('../lib/lineRichMenu');
const line = require('@line/bot-sdk');
const crypto = require('crypto');

module.exports = async (req, res) => {
  const { memberId, lineUserId, token, sessionToken, action, couponId } = req.query;

  try {
    await connectDB();

    // POST /api/members/auth - Authenticate/create member via LIFF
    if (req.method === 'POST' && req.url.includes('/auth')) {
      const { lineUserId: userId, displayName, pictureUrl } = req.body;

      if (!userId) {
        return res.status(400).json({
          message: '缺少 LINE 用戶 ID / Missing LINE user ID'
        });
      }

      console.log('[API /auth] Looking up member with LINE userId:', userId);

      // Find existing member
      const member = await Member.findOne({ 'line.userId': userId });

      if (!member) {
        console.log('[API /auth] Member not found - needs to register');
        return res.status(200).json({
          member: null,
          needsRegistration: true,
          lineProfile: { userId, displayName, pictureUrl }
        });
      }

      console.log('[API /auth] Found existing member:', member.memberId);

      // Update LINE profile info in case it changed
      member.line.displayName = displayName;
      member.line.pictureUrl = pictureUrl;
      await member.save();

      return res.status(200).json({ member, needsRegistration: !member.registrationCompleted });
    }

    // POST /api/members/register - Complete registration
    if (req.method === 'POST' && req.url.includes('/register')) {
      const {
        lineUserId: userId,
        name,
        englishAlias,
        gender,
        birthDate,
        familyMembers,
        contact,
        referralCode,
        pendingCouponToken
      } = req.body;

      if (!userId) {
        return res.status(400).json({
          message: '缺少 LINE 用戶 ID / Missing LINE user ID'
        });
      }

      console.log('[API /register] Completing registration for userId:', userId);

      // Server-side validation for phone number
      if (contact && contact.mobile) {
        const phoneNumber = contact.mobile.replace(/\D/g, ''); // Remove non-digits
        if (phoneNumber.length < 9 || phoneNumber.length > 10) {
          return res.status(400).json({
            message: '請輸入有效的台灣手機號碼（9-10位數字） / Please enter a valid Taiwan phone number (9-10 digits)'
          });
        }
      }

      let member = await Member.findOne({ 'line.userId': userId });

      // If member doesn't exist, create new one
      if (!member) {
        console.log('[API /register] Creating new member');

        // Generate sequential member ID (M0001, M0002, etc.)
        const lastMember = await Member.findOne().sort({ createdAt: -1 }).select('memberId');
        let nextNumber = 1;

        if (lastMember && lastMember.memberId) {
          const lastNumber = parseInt(lastMember.memberId.substring(1));
          if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
          }
        }

        const newMemberId = `M${nextNumber.toString().padStart(4, '0')}`;
        console.log('[API /register] Generated member ID:', newMemberId);

        member = new Member({
          memberId: newMemberId,
          line: {
            userId,
            linkedAt: new Date()
          }
        });
      }

      // Handle referral code
      if (referralCode) {
        const referrer = await Member.findOne({
          referralCode: referralCode.trim().toUpperCase(),
          registrationCompleted: true
        });

        if (referrer) {
          member.referredBy = referrer._id;
        }
      }

      // Generate unique referral code for this member
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

        const existing = await Member.findOne({ referralCode: generatedCode });
        if (!existing) uniqueCode = true;
      }

      // Update/set member information
      member.name = name;
      member.englishAlias = englishAlias || '';
      member.gender = gender;
      member.birthDate = birthDate;
      member.familyMembers = familyMembers || [];
      member.contact = contact;
      member.referralCode = generatedCode;
      member.registrationCompleted = true;
      await member.save();

      console.log('[API /register] Registration completed for member:', member.memberId);

      if (member.line && member.line.userId) {
        try {
          const client = new line.messagingApi.MessagingApiClient({
            channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
          });

          let welcomeText = `🎉 恭喜！註冊完成\n\n您的會員編號：${member.memberId}\n\n現在您可以：\n✨ 報名課程和活動\n📝 編輯個人資料\n🎫 購買和使用優惠券\n🎁 查看積分和獎勵`;

          if (pendingCouponToken) {
            const baseUrl = process.env.REACT_APP_API_URL || 'https://www.sunriseyouth.org';
            const claimUrl = `${baseUrl}/claim/${pendingCouponToken}`;
            welcomeText += `\n\n🎁 您有一張優惠券待領取！\n請點擊以下連結領取：\n${claimUrl}`;
            console.log('[API /register] Including coupon claim URL in welcome message:', claimUrl);
          }

          welcomeText += `\n\n請點擊下方選單開始使用！`;

          const welcomeMessage = {
            type: 'text',
            text: welcomeText
          };

          await client.pushMessage({
            to: member.line.userId,
            messages: [welcomeMessage]
          });

          console.log('[API /register] Welcome message sent to:', member.memberId);
        } catch (messageError) {
          console.error('[API /register] Error sending welcome message:', messageError);
        }
      }

      return res.status(200).json({
        message: '註冊成功 / Registration successful',
        member
      });
    }

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
      member.registrationToken = undefined;
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

          // Send welcome message
          try {
            const welcomeMessage = {
              type: 'text',
              text: `🎉 恭喜！註冊完成\n\n您的會員編號：${member.memberId}\n\n現在您可以：\n✨ 報名課程和活動\n📝 編輯個人資料\n🎫 購買和使用優惠券\n🎁 查看積分和獎勵\n\n請點擊下方選單開始使用！`
            };

            await client.pushMessage({
              to: member.line.userId,
              messages: [welcomeMessage]
            });

            console.log('[Registration] Welcome message sent to:', member.memberId);
          } catch (messageError) {
            console.error('[Registration] Error sending welcome message:', messageError);
            // Don't fail registration if message sending fails
          }
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
      let member;

      // If LINE user ID provided, search by that first (for LIFF login)
      if (lineUserId) {
        console.log('[API] Looking up member by LINE user ID:', lineUserId);
        member = await Member.findOne({ 'line.userId': lineUserId });

        if (!member) {
          console.log('[API] No member found with line.userId:', lineUserId);
          // Check if there's a member with this userId but not yet linked
          const allMembers = await Member.find({ 'line.userId': { $exists: true } }).limit(5);
          console.log('[API] Sample of existing members with line.userId:', allMembers.map(m => ({
            memberId: m.memberId,
            lineUserId: m.line?.userId,
            registrationCompleted: m.registrationCompleted
          })));
        } else {
          console.log('[API] Member found:', {
            memberId: member.memberId,
            name: member.name,
            registrationCompleted: member.registrationCompleted,
            hasLineUserId: !!member.line?.userId
          });
        }
      } else if (memberId) {
        // Try to find by memberId first, then by LINE ID
        member = await Member.findOne({ memberId });

        if (!member) {
          // Try searching by LINE ID if not found by member ID
          member = await Member.findOne({ 'contact.lineId': memberId });
        }
      }

      if (!member) {
        return res.status(404).json({
          message: '找不到會員 / Member not found'
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

      // Get LINE Official Account ID for add friend URL
      const lineChannelId = process.env.LINE_CHANNEL_ID || '@907xmpck';
      // Ensure @ symbol is present for LINE Official Account URL
      const channelIdWithAt = lineChannelId.startsWith('@') ? lineChannelId : `@${lineChannelId}`;
      const lineAddFriendUrl = `https://line.me/ti/p/${channelIdWithAt}`;

      return res.status(200).json({
        message: '分享連結已生成 / Share link generated successfully',
        token,
        claimUrl,
        lineAddFriendUrl,
        expiresAt
      });
    }

    // Purchase coupon from marketplace
    if (req.method === 'POST' && action === 'purchase-coupon') {
      const { memberId, couponForSaleId } = req.body;

      if (!memberId || !couponForSaleId) {
        return res.status(400).json({
          message: '缺少必要欄位 / Missing required fields'
        });
      }

      const member = await Member.findOne({ memberId });

      if (!member) {
        return res.status(404).json({
          message: '找不到團員 / Member not found'
        });
      }

      // Fetch the coupon for sale
      const couponForSale = await CouponForSale.findById(couponForSaleId).populate('couponProfileId');

      if (!couponForSale) {
        return res.status(404).json({
          message: '找不到販售優惠券 / Coupon for sale not found'
        });
      }

      if (!couponForSale.active) {
        return res.status(400).json({
          message: '此優惠券已下架 / This coupon is no longer available'
        });
      }

      // Check stock availability
      if (couponForSale.stock !== -1 && couponForSale.stock <= 0) {
        return res.status(400).json({
          message: '此優惠券已售完 / This coupon is sold out'
        });
      }

      const profile = couponForSale.couponProfileId;

      // Create new coupon based on profile
      const newCoupon = {
        type: profile.type,
        classInfoId: profile.classInfoId,
        discountPercent: profile.discountPercent,
        name: profile.name,
        description: profile.description,
        image: profile.image,
        quantity: 1,
        usedCount: 0
      };

      // Add coupon to member's coupons
      member.coupons.push(newCoupon);
      await member.save();

      // Decrement stock if not unlimited
      if (couponForSale.stock !== -1) {
        couponForSale.stock -= 1;
        await couponForSale.save();
      }

      return res.status(200).json({
        message: '購買成功 / Purchase successful',
        member
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
