const line = require('@line/bot-sdk');
const connectDB = require('../lib/mongodb');
const { Member } = require('../db/models');
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

    // IMPORTANT: Send 200 OK immediately to LINE to avoid timeout
    // But DON'T return - keep processing
    res.status(200).json({ message: 'OK' });

    // Process events (must await even after sending response, or function will terminate)
    if (events.length > 0) {
      console.log('Processing', events.length, 'events...');
      await processEventsAsync(events);
    }

    // Function ends here, but response was already sent

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
    let member = await Member.findOne({ 'line.userId': lineUserId });

    if (member) {
      console.log('[handleFollowEvent] Existing member re-followed:', member.memberId);
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

    // Generate unique member ID
    const memberId = `M${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    console.log('[handleFollowEvent] Generated member ID:', memberId);

    // Determine domain from request
    const protocol = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split('://')[0] : 'https';
    const host = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split('://')[1] : 'website-five-chi-99.vercel.app';
    const baseUrl = `${protocol}://${host}`;
    const profileUrl = `${baseUrl}/profile/${memberId}`;
    console.log('[handleFollowEvent] Profile URL:', profileUrl);

    // Create new member
    console.log('[handleFollowEvent] Creating member object...');
    member = new Member({
      memberId,
      name: profile.displayName,
      englishAlias: '',
      gender: '男', // Default, can be updated later
      birthDate: new Date('2000-01-01'), // Default, should be updated
      familyMembers: [],
      contact: {
        mobile: '', // Will be filled later
      },
      line: {
        userId: lineUserId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        linkedAt: new Date()
      }
    });

    // Save member first
    console.log('[handleFollowEvent] Saving member to database...');
    await member.save();
    console.log('[handleFollowEvent] ✅ New member created:', memberId, 'LINE ID:', lineUserId);

    // Send welcome message with instructions
    console.log('[handleFollowEvent] Sending welcome message...');
    await client.pushMessage({
      to: lineUserId,
      messages: [
        {
          type: 'text',
          text: `🎉 歡迎加入晨光國際少年團！\nWelcome to Sunrise Youth International!\n\n您的團員編號 Your Member ID:\n${memberId}\n\n📱 個人檔案連結 Profile link:\n${profileUrl}\n\n⚠️ 請訪問個人檔案頁面查看您的專屬 QR Code\nPlease visit your profile page to view your QR code`
        }
      ]
    });
    console.log('[handleFollowEvent] ✅ Welcome message sent!');

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

    // Echo member ID if user asks
    if (messageText && (messageText.includes('編號') || messageText.toLowerCase().includes('id'))) {
      await client.pushMessage({
        to: lineUserId,
        messages: [{
          type: 'text',
          text: `您的團員編號：${member.memberId}\nYour member ID: ${member.memberId}\n\n個人檔案連結：\nProfile link:\n${process.env.FRONTEND_URL || 'https://website-five-chi-99.vercel.app'}/profile/${member.memberId}`
        }]
      });
    }

  } catch (error) {
    console.error('Error handling message event:', error);
  }
}
