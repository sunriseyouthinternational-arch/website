const line = require('@line/bot-sdk');
const connectDB = require('../lib/mongodb');
const { Member, CouponShareToken } = require('../db/models');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const signature = req.headers['x-line-signature'];
    if (!signature) {
      return res.status(401).json({ message: 'No signature' });
    }

    const body = JSON.stringify(req.body);
    const expectedSignature = line.validateSignature(
      body,
      config.channelSecret,
      signature
    );

    if (!expectedSignature) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const events = req.body.events || [];

    if (events.length > 0) {
      console.log('Processing', events.length, 'events...');
      await processEventsAsync(events);
    }

    return res.status(200).json({ message: 'OK' });

  } catch (error) {
    console.error('LINE webhook error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

async function processEventsAsync(events) {
  try {
    console.log('[processEventsAsync] Starting...');
    console.log('[processEventsAsync] Connecting to database...');
    await connectDB();
    console.log('[processEventsAsync] Database connected!');

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

  if (event.type === 'follow') {
    await handleFollowEvent(event);
  }

  if (event.type === 'unfollow') {
    await handleUnfollowEvent(event);
  }

  if (event.type === 'message') {
    await handleMessageEvent(event);
  }

  if (event.type === 'postback') {
    await handlePostbackEvent(event);
  }
}

async function handleFollowEvent(event) {
  const lineUserId = event.source.userId;
  const replyToken = event.replyToken;
  console.log('[handleFollowEvent] START - User ID:', lineUserId);

  try {
    const member = await Member.findOne({ 'line.userId': lineUserId });
    const baseUrl = process.env.BASE_URL || process.env.FRONTEND_URL;

    if (member) {
      console.log('[handleFollowEvent] Existing member re-followed:', member.memberId);
      return;
    }

    console.log('[handleFollowEvent] New user, checking for pending coupon');
    const profile = await client.getProfile(lineUserId);

    const placeholderMember = await Member.findOne({
      'line.userId': lineUserId,
      registrationCompleted: false,
      pendingCouponToken: { $exists: true, $ne: null }
    });

    let welcomeText;
    if (placeholderMember) {
      console.log('[handleFollowEvent] Found pending coupon for user:', placeholderMember.memberId);
      welcomeText = `🎁 歡迎！您掃描的優惠券已準備好！\nWelcome! Your coupon is ready!\n\n${profile.displayName} 您好！\nHello ${profile.displayName}!\n\n您有一張等待中的優惠券！\nYou have a pending coupon!\n\n請點擊以下連結完成註冊，優惠券將自動添加到您的帳戶：\nPlease click the link below to complete registration, and the coupon will be automatically added:\n\n${baseUrl}/profile\n\n🎉 完成後立即可使用優惠券！\n✨ Use it immediately after registration!`;
    } else {
      console.log('[handleFollowEvent] No pending coupon, sending standard welcome message');
      welcomeText = `🎉 歡迎加入晨光國際少年團！\nWelcome to Sunrise Youth International!\n\n${profile.displayName} 您好！\nHello ${profile.displayName}!\n\n請點擊以下連結開始註冊：\nPlease click the link below to register:\n\n${baseUrl}/profile\n\n完成註冊後即可使用所有功能！\nComplete registration to access all features!`;
    }

    await client.replyMessage({
      replyToken,
      messages: [
        { type: 'text', text: welcomeText },
        { type: 'text', text: '👋 傳送一個貼圖跟我們打聲招呼吧！\n👋 Send us a sticker to say hello!' }
      ]
    });
    console.log('[handleFollowEvent] Welcome messages sent via Reply API (FREE)');
  } catch (error) {
    console.error('[handleFollowEvent] Error:', error);
  }
}

async function handleUnfollowEvent(event) {
  const lineUserId = event.source.userId;

  try {
    const member = await Member.findOne({ 'line.userId': lineUserId });

    if (member) {
      console.log('Member unfollowed:', member.memberId);
    }
  } catch (error) {
    console.error('Error handling unfollow event:', error);
  }
}

async function handleMessageEvent(event) {
  const lineUserId = event.source.userId;
  const replyToken = event.replyToken;
  const messageText = event.message.type === 'text' ? event.message.text : null;

  try {
    const member = await Member.findOne({ 'line.userId': lineUserId });

    if (!member || !member.registrationCompleted) {
      const baseUrl = process.env.BASE_URL || process.env.FRONTEND_URL;
      await client.replyMessage({
        replyToken,
        messages: [{
          type: 'text',
          text: `請先完成註冊才能使用此功能！\nPlease complete registration first!\n\n${baseUrl}/profile`
        }]
      });
      return;
    }

    const baseUrl = process.env.BASE_URL || process.env.FRONTEND_URL;

    if (messageText && (messageText.includes('編號') || messageText.toLowerCase().includes('id'))) {
      await client.replyMessage({
        replyToken,
        messages: [{
          type: 'text',
          text: `您的團員編號：${member.memberId}\nYour member ID: ${member.memberId}\n\n個人檔案連結：\nProfile link:\n${baseUrl}/profile`
        }]
      });
      return;
    }

    if (messageText && (messageText.includes('邀請') || messageText.toLowerCase().includes('referral'))) {
      await client.replyMessage({
        replyToken,
        messages: [{
          type: 'text',
          text: `🎯 您的推薦碼 Your Referral Code:\n\n${member.referralCode}\n\n分享此推薦碼邀請朋友加入！\nShare this code to invite friends!`
        }]
      });
      return;
    }

  } catch (error) {
    console.error('Error handling message event:', error);
  }
}

async function handlePostbackEvent(event) {
  const lineUserId = event.source.userId;
  const replyToken = event.replyToken;
  const postbackData = event.postback.data;

  console.log('[handlePostbackEvent] Postback data:', postbackData);

  try {
    const member = await Member.findOne({ 'line.userId': lineUserId });

    if (postbackData === 'action=share_referral_code') {
      if (!member || !member.registrationCompleted) {
        const baseUrl = process.env.BASE_URL || process.env.FRONTEND_URL;
        await client.replyMessage({
          replyToken,
          messages: [{
            type: 'text',
            text: `請先完成註冊才能使用此功能！\nPlease complete registration first!\n\n${baseUrl}/profile`
          }]
        });
        return;
      }

      await client.replyMessage({
        replyToken,
        messages: [{
          type: 'text',
          text: `🎯 您的推薦碼 Your Referral Code:\n\n${member.referralCode}\n\n分享此推薦碼邀請朋友加入！\nShare this code to invite friends!`
        }]
      });
    }
  } catch (error) {
    console.error('[handlePostbackEvent] Error:', error);
  }
}
