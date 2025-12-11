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

/**
 * Test endpoint to manually create rich menu for a member
 * Usage: GET /api/line-test?memberId=M123456789
 * or: GET /api/line-test?lineUserId=U1234567890abcdef
 */
module.exports = async (req, res) => {
  try {
    const { memberId, lineUserId } = req.query;

    if (!memberId && !lineUserId) {
      return res.status(400).json({
        message: 'Please provide memberId or lineUserId',
        usage: '/api/line-test?memberId=M123456789'
      });
    }

    // Connect to database
    await connectDB();

    // Find member
    let member;
    if (memberId) {
      member = await Member.findOne({ memberId });
    } else {
      member = await Member.findOne({ 'line.userId': lineUserId });
    }

    if (!member) {
      return res.status(404).json({
        message: 'Member not found',
        memberId,
        lineUserId
      });
    }

    if (!member.line || !member.line.userId) {
      return res.status(400).json({
        message: 'Member does not have LINE account linked',
        memberId: member.memberId
      });
    }

    // Get profile URL
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'www.sunriseyouth.org';
    const baseUrl = process.env.FRONTEND_URL || `${protocol}://${host}`;
    const profileUrl = `${baseUrl}/profile/${member.memberId}`;

    // Delete/unlink ANY existing rich menu (handles both new and old rich menus)
    try {
      const existingRichMenuId = await client.getRichMenuIdOfUser(member.line.userId);

      if (existingRichMenuId) {
        console.log(`Found existing rich menu: ${existingRichMenuId}`);
        await client.unlinkRichMenuFromUser(member.line.userId);
        console.log(`Unlinked rich menu from user`);

        try {
          await client.deleteRichMenu(existingRichMenuId);
          console.log(`Deleted rich menu: ${existingRichMenuId}`);
        } catch (deleteError) {
          console.log(`Could not delete rich menu (might be default): ${deleteError.message}`);
        }
      } else {
        console.log(`No existing rich menu found`);
      }
    } catch (error) {
      if (error.message && error.message.includes('404')) {
        console.log(`No rich menu currently linked`);
      } else {
        console.log(`Error checking for existing rich menu:`, error.message);
      }
    }

    // Create new rich menu
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

    return res.status(200).json({
      success: true,
      message: 'Rich menu created successfully!',
      member: {
        memberId: member.memberId,
        name: member.name,
        lineUserId: member.line.userId,
        richMenuId: richMenuId,
        profileUrl: profileUrl
      }
    });

  } catch (error) {
    console.error('LINE test error:', error);
    return res.status(500).json({
      message: 'Error creating rich menu',
      error: error.message
    });
  }
};
