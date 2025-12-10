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

    // IMPORTANT: Return 200 OK immediately to avoid timeout
    // LINE expects response within 1-3 seconds
    res.status(200).json({ message: 'OK' });

    // Process events asynchronously (don't await)
    if (events.length > 0) {
      processEventsAsync(events).catch(error => {
        console.error('Error processing events asynchronously:', error);
      });
    }

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
    // Connect to database
    await connectDB();

    // Process each event
    for (const event of events) {
      await handleEvent(event);
    }
  } catch (error) {
    console.error('Async event processing error:', error);
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

  try {
    // Check if user already exists
    let member = await Member.findOne({ 'line.userId': lineUserId });

    if (member) {
      console.log('Existing member re-followed:', member.memberId);
      // Send welcome back message using push message (not reply)
      await client.pushMessage({
        to: lineUserId,
        messages: [{
          type: 'text',
          text: `歡迎回來！Welcome back!\n您的團員編號：${member.memberId}\nYour member ID: ${member.memberId}`
        }]
      });
      return;
    }

    // Get LINE profile information
    const profile = await client.getProfile(lineUserId);

    // Generate unique member ID
    const memberId = `M${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // Determine domain from request
    const protocol = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split('://')[0] : 'https';
    const host = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split('://')[1] : 'website-five-chi-99.vercel.app';
    const baseUrl = `${protocol}://${host}`;
    const profileUrl = `${baseUrl}/profile/${memberId}`;

    // Create new member
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
    await member.save();
    console.log('New member created:', memberId, 'LINE ID:', lineUserId);

    // Send welcome message FIRST using push message
    await client.pushMessage({
      to: lineUserId,
      messages: [
        {
          type: 'text',
          text: `🎉 歡迎加入晨光國際少年團！\nWelcome to Sunrise Youth International!\n\n您的團員編號 Your Member ID:\n${memberId}\n\n請稍等，正在為您建立專屬 QR Code...\nPlease wait, creating your personalized QR code...\n\n個人檔案連結 Profile link:\n${profileUrl}`
        }
      ]
    });

    // Create personalized rich menu with QR code (this takes time)
    const richMenuId = await createPersonalizedRichMenu(
      client,
      lineUserId,
      memberId,
      profileUrl,
      profile.displayName
    );

    // Save rich menu ID to member
    member.line.richMenuId = richMenuId;
    await member.save();

    console.log('Rich menu created for member:', memberId);

    // Send confirmation that rich menu is ready
    await client.pushMessage({
      to: lineUserId,
      messages: [{
        type: 'text',
        text: '✅ 您的專屬 QR Code 已建立完成！\n點選下方選單查看 📱\n\nYour personalized QR code is ready!\nTap the menu below to view 📱'
      }]
    });

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
