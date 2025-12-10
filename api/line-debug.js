const line = require('@line/bot-sdk');
const connectDB = require('../lib/mongodb');
const { Member } = require('../db/models');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
});

/**
 * Debug endpoint to list all members with LINE accounts
 * Usage: GET /api/line-debug
 */
module.exports = async (req, res) => {
  try {
    // Connect to database
    await connectDB();

    // Find all members with LINE accounts
    const members = await Member.find({
      'line.userId': { $exists: true, $ne: null }
    }).select('memberId name line.userId line.displayName line.richMenuId');

    return res.status(200).json({
      success: true,
      count: members.length,
      members: members.map(m => ({
        memberId: m.memberId,
        name: m.name,
        lineUserId: m.line?.userId || null,
        lineDisplayName: m.line?.displayName || null,
        hasRichMenu: !!m.line?.richMenuId
      }))
    });

  } catch (error) {
    console.error('LINE debug error:', error);
    return res.status(500).json({
      message: 'Error fetching members',
      error: error.message
    });
  }
};
