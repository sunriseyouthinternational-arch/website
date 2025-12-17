const line = require('@line/bot-sdk');
const connectDB = require('../lib/mongodb');
const { Member, CouponShareToken } = require('../db/models');
const { createPersonalizedRichMenu } = require('../lib/lineRichMenu');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
});

module.exports = async (req, res) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify LINE signature
    const signature = req.headers['x-line-signature'];
    if (!signature) {
      return res.status(401).json({ message: 'No signature' });
    }

    // Validate signature
    const body = JSON.stringify(req.body);
    const expectedSignature = line.validateSignature(
      body,
      config.channelSecret,
      signature
    );

    if (!expectedSignature) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    // Get events
    const events = req.body.events || [];

    // Process events FIRST before sending response
    // This ensures Vercel won't terminate the function early
    if (events.length > 0) {
      console.log('Processing', events.length, 'events...');
      await processEventsAsync(events);
    }

    // Send 200 OK AFTER processing is complete
    // LINE may see this as slow, but at least events get processed
    return res.status(200).json({ message: 'OK' });

  } catch (error) {
    console.error('LINE webhook error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Process events asynchronously after responding to LINE
async function processEventsAsync(events) {
  try {
    console.log('[processEventsAsync] Starting...');

    // Connect to database
    console.log('[processEventsAsync] Connecting to database...');
    await connectDB();
    console.log('[processEventsAsync] Database connected!');

    // Process each event
    for (const event of events) {
      console.log('[processEventsAsync] Processing event:', event.type);
      await handleEvent(event);
      console.log('[processEventsAsync] Event processed:', event.type);
    }

    console.log('[processEventsAsync] All events processed successfully!');
  } catch (error) {
    console.error('[processEventsAsync] ERROR:', error);
    console.error('[processEventsAsync] Error stack:', error.stack);
  }
}

async function handleEvent(event) {
  console.log('LINE event:', event.type);

  // Handle follow event (user adds the Official Account)
  if (event.type === 'follow') {
    await handleFollowEvent(event);
  }

  // Handle unfollow event (user blocks/removes the account)
  if (event.type === 'unfollow') {
    await handleUnfollowEvent(event);
  }

  // Handle message events (optional - for future features)
  if (event.type === 'message') {
    await handleMessageEvent(event);
  }
}

async function handleFollowEvent(event) {
  const lineUserId = event.source.userId;
  console.log('[handleFollowEvent] START - User ID:', lineUserId);

  // Check for state parameter (coupon token)
  const state = event.follow?.params?.state;
  let pendingCouponToken = null;

  if (state && state.startsWith('COUPON_')) {
    pendingCouponToken = state.substring(7); // Remove 'COUPON_' prefix
    console.log('[handleFollowEvent] Coupon token detected:', pendingCouponToken);
  }

  try {
    // Check if user already exists
    console.log('[handleFollowEvent] Checking if user exists...');
    let member = await Member.findOne({ 'line.userId': lineUserId });

    if (member) {
      console.log('[handleFollowEvent] Existing member re-followed:', member.memberId);

      // If there's a pending coupon, claim it immediately for existing member
      if (pendingCouponToken) {
        console.log('[handleFollowEvent] Claiming coupon for existing member...');
        try {
          const shareToken = await CouponShareToken.findOne({ token: pendingCouponToken });

          if (shareToken && shareToken.status === 'pending' && new Date() <= shareToken.expiresAt) {
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
            await member.save();

            const protocol = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split('://')[0] : 'https';
            const host = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split('://')[1] : 'www.sunriseyouth.org';
            const baseUrl = `${protocol}://${host}`;
            const couponsUrl = `${baseUrl}/profile/${member.memberId}?tab=coupons`;

            await client.pushMessage({
              to: lineUserId,
              messages: [{
                type: 'text',
                text: `🎁 您收到了一張新優惠券！\nYou received a new coupon!\n\n優惠券名稱 Name:\n${shareToken.couponData.name}\n\n點擊查看 View your coupons:\n${couponsUrl}`
              }]
            });

            console.log('[handleFollowEvent] Coupon claimed successfully!');
            return;
          }
        } catch (couponError) {
          console.error('[handleFollowEvent] Error claiming coupon:', couponError);
        }
      }

      // Send welcome back message using push message (not reply)
      console.log('[handleFollowEvent] Sending welcome back message...');
      await client.pushMessage({
        to: lineUserId,
        messages: [{
          type: 'text',
          text: `歡迎回來！Welcome back!\n您的團員編號：${member.memberId}\nYour member ID: ${member.memberId}`
        }]
      });
      console.log('[handleFollowEvent] Welcome back message sent!');
      return;
    }

    // Get LINE profile information
    console.log('[handleFollowEvent] Getting LINE profile...');
    const profile = await client.getProfile(lineUserId);
    console.log('[handleFollowEvent] Profile received:', profile.displayName);

    // Generate sequential member ID (M0001, M0002, etc.)
    console.log('[handleFollowEvent] Generating sequential member ID...');
    const lastMember = await Member.findOne().sort({ createdAt: -1 }).select('memberId');
    let nextNumber = 1;

    if (lastMember && lastMember.memberId) {
      // Extract number from last member ID (e.g., "M0001" -> 1)
      const lastNumber = parseInt(lastMember.memberId.substring(1));
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    // Format as M0001, M0002, etc. (4 digits)
    const memberId = `M${nextNumber.toString().padStart(4, '0')}`;
    const registrationToken = require('crypto').randomBytes(32).toString('hex');
    console.log('[handleFollowEvent] Generated member ID:', memberId);

    // Determine domain from request
    const protocol = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split('://')[0] : 'https';
    const host = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split('://')[1] : 'www.sunriseyouth.org';
    const baseUrl = `${protocol}://${host}`;
    const registrationUrl = `${baseUrl}/register?token=${registrationToken}`;
    console.log('[handleFollowEvent] Registration URL:', registrationUrl);

    // Create incomplete member (pending registration)
    console.log('[handleFollowEvent] Creating incomplete member object...');
    member = new Member({
      memberId,
      name: profile.displayName, // Temporary, will be updated
      englishAlias: '',
      gender: '男', // Default, must be updated
      birthDate: new Date('2000-01-01'), // Default, must be updated
      familyMembers: [],
      contact: {
        mobile: '', // Must be filled during registration
        lineId: '' // Cannot auto-fill - LINE API doesn't provide custom LINE ID
      },
      line: {
        userId: lineUserId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        linkedAt: new Date()
      },
      registrationToken,
      registrationTokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      registrationCompleted: false,
      pendingCouponToken: pendingCouponToken || undefined // Store coupon token if provided
    });

    // Save incomplete member
    console.log('[handleFollowEvent] Saving incomplete member to database...');
    await member.save();
    console.log('[handleFollowEvent] ✅ Incomplete member created:', memberId, 'LINE ID:', lineUserId);

    // Send welcome message with registration link
    console.log('[handleFollowEvent] Sending welcome message with registration link...');
    let welcomeMessage = `🎉 歡迎加入晨光國際少年團！\nWelcome to Sunrise Youth International!\n\n您的團員編號 Your Member ID:\n${memberId}\n\n⚠️ 請點擊以下連結完成註冊\nPlease click the link below to complete registration:\n\n${registrationUrl}\n\n此連結將在 7 天後失效\nThis link will expire in 7 days`;

    // Add coupon message if pending
    if (pendingCouponToken) {
      welcomeMessage += `\n\n🎁 您有一張優惠券等待領取！\nYou have a coupon waiting!\n完成註冊後將自動加入您的帳戶。\nIt will be added to your account after registration.`;
    }

    await client.pushMessage({
      to: lineUserId,
      messages: [
        {
          type: 'text',
          text: welcomeMessage
        }
      ]
    });
    console.log('[handleFollowEvent] ✅ Welcome message with registration link sent!');

  } catch (error) {
    console.error('Error handling follow event:', error);

    // Send error message to user using push message
    try {
      await client.pushMessage({
        to: lineUserId,
        messages: [{
          type: 'text',
          text: '抱歉，註冊過程中發生錯誤。請稍後再試。\nSorry, an error occurred during registration. Please try again later.'
        }]
      });
    } catch (pushError) {
      console.error('Error sending error message:', pushError);
    }
  }
}

async function handleUnfollowEvent(event) {
  const lineUserId = event.source.userId;

  try {
    // Find member and mark as inactive (optional)
    const member = await Member.findOne({ 'line.userId': lineUserId });

    if (member) {
      console.log('Member unfollowed:', member.memberId);
      // Optionally: mark as inactive, but keep the data
      // member.line.active = false;
      // await member.save();
    }
  } catch (error) {
    console.error('Error handling unfollow event:', error);
  }
}

async function handleMessageEvent(event) {
  const lineUserId = event.source.userId;
  const messageText = event.message.text;

  try {
    // Find member
    const member = await Member.findOne({ 'line.userId': lineUserId });

    if (!member) {
      // User not registered yet (shouldn't happen if they followed)
      await client.pushMessage({
        to: lineUserId,
        messages: [{
          type: 'text',
          text: '請先完成註冊。\nPlease complete registration first.'
        }]
      });
      return;
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://www.sunriseyouth.org';

    // Handle member ID request
    if (messageText && (messageText.includes('編號') || messageText.toLowerCase().includes('id'))) {
      await client.pushMessage({
        to: lineUserId,
        messages: [{
          type: 'text',
          text: `您的團員編號：${member.memberId}\nYour member ID: ${member.memberId}\n\n個人檔案連結：\nProfile link:\n${baseUrl}/profile/${member.memberId}`
        }]
      });
      return;
    }

    // Handle points request
    if (messageText && (messageText.includes('點數') || messageText.toLowerCase().includes('point'))) {
      const points = member.points || 0;

      // Generate a session token for auto-login
      const sessionToken = require('crypto').randomBytes(32).toString('hex');
      const sessionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Save session token to member
      member.sessionToken = sessionToken;
      member.sessionTokenExpires = sessionExpires;
      await member.save();

      const profileUrl = `${baseUrl}/profile/${member.memberId}?tab=points&session=${sessionToken}`;

      await client.pushMessage({
        to: lineUserId,
        messages: [{
          type: 'text',
          text: `💎 您的會員點數 Your Points:\n\n${points} 點 points\n\n點擊下方連結查看可兌換的禮物：\nClick below to view redeemable gifts:\n\n${profileUrl}`
        }]
      });
      return;
    }

    // Handle referral code request
    if (messageText && (messageText.includes('邀請') || messageText.toLowerCase().includes('referral'))) {
      // Generate referral code if member doesn't have one
      if (!member.referralCode) {
        console.log(`[handleMessageEvent] Generating referral code for ${member.memberId}`);

        // Generate unique 6-character referral code
        let uniqueCode = false;
        let generatedCode = '';

        while (!uniqueCode) {
          generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          const existing = await Member.findOne({ referralCode: generatedCode });
          if (!existing) {
            uniqueCode = true;
          }
        }

        member.referralCode = generatedCode;
        await member.save();
        console.log(`[handleMessageEvent] Generated referral code ${generatedCode} for ${member.memberId}`);
      }

      const referralCode = member.referralCode;
      await client.pushMessage({
        to: lineUserId,
        messages: [{
          type: 'text',
          text: `🎯 您的推薦碼 Your Referral Code:\n\n${referralCode}\n\n分享此推薦碼邀請朋友加入！\nShare this code to invite friends!`
        }]
      });
      return;
    }

  } catch (error) {
    console.error('Error handling message event:', error);
  }
}
