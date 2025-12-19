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

  try {
    // Check if user already exists
    console.log('[handleFollowEvent] Checking if user exists...');
    const member = await Member.findOne({ 'line.userId': lineUserId });

    const baseUrl = process.env.FRONTEND_URL || 'https://sunriseyouth.org';

    if (member) {
      console.log('[handleFollowEvent] Existing member re-followed:', member.memberId);

      // Send welcome back message
      await client.pushMessage({
        to: lineUserId,
        messages: [{
          type: 'text',
          text: `🎉 歡迎回來！Welcome back!\n\n您的團員編號 Your Member ID:\n${member.memberId}\n\n請造訪我們的網站 Visit our website:\n${baseUrl}/profile`
        }]
      });
      console.log('[handleFollowEvent] Welcome back message sent');
      return;
    }

    // New user - create member and send welcome message
    console.log('[handleFollowEvent] New user, creating member...');
    const profile = await client.getProfile(lineUserId);

    // Generate unique member ID
    let newMemberId = 'M' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100);
    console.log('[handleFollowEvent] Generated member ID:', newMemberId);

    // Create incomplete member
    const newMember = new Member({
      memberId: newMemberId,
      name: profile.displayName || 'New Member',
      gender: '男',
      birthDate: new Date('2000-01-01'),
      contact: { phone: '', mobile: '', lineId: '' },
      line: {
        userId: lineUserId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        linkedAt: new Date()
      },
      registrationCompleted: false
    });

    await newMember.save();
    console.log('[handleFollowEvent] Member created:', newMemberId);

    // Send welcome message with registration link
    await client.pushMessage({
      to: lineUserId,
      messages: [{
        type: 'text',
        text: `🎉 歡迎加入晨光國際少年團！\nWelcome to Sunrise Youth International!\n\n${profile.displayName} 您好！\nHello ${profile.displayName}!\n\n您的團員編號 Your Member ID:\n${newMemberId}\n\n請點擊以下連結完成註冊：\nPlease click the link below to complete registration:\n\n${baseUrl}/profile\n\n完成註冊後即可使用所有功能！\nComplete registration to access all features!`
      }]
    });
    console.log('[handleFollowEvent] Welcome message sent')
  } catch (error) {
    console.error('[handleFollowEvent] Error:', error);

    // Send error message to user
    try {
      await client.pushMessage({
        to: lineUserId,
        messages: [{
          type: 'text',
          text: '抱歉，發生錯誤。請稍後再試。\nSorry, an error occurred. Please try again later.'
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
          text: `您的團員編號：${member.memberId}\nYour member ID: ${member.memberId}\n\n個人檔案連結：\nProfile link:\n${baseUrl}/profile`
        }]
      });
      return;
    }

    // Handle points request
    if (messageText && (messageText.includes('點數') || messageText.toLowerCase().includes('point'))) {
      const points = member.points || 0;

      await client.pushMessage({
        to: lineUserId,
        messages: [{
          type: 'text',
          text: `💎 您的會員點數 Your Points:\n\n${points} 點 points\n\n點擊下方連結查看可兌換的禮物：\nClick below to view redeemable gifts:\n\n${baseUrl}/profile?tab=points`
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
