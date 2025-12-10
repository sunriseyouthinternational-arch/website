const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
});

/**
 * Test endpoint to send a push message to yourself
 * You need to provide your LINE user ID
 *
 * To get your LINE user ID:
 * 1. Add the Official Account as a friend
 * 2. Send any message
 * 3. Check Vercel logs for "LINE event: message" - it will show your user ID
 *
 * Usage: GET /api/line-test-message?userId=U1234567890abcdef
 */
module.exports = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing userId parameter',
        usage: '/api/line-test-message?userId=U1234567890abcdef',
        instructions: 'Send a message to your Official Account first, then check Vercel logs to find your user ID'
      });
    }

    // Try to send a push message
    await client.pushMessage({
      to: userId,
      messages: [{
        type: 'text',
        text: '🧪 Test message from Vercel!\n這是來自 Vercel 的測試訊息！\n\nIf you see this, push messages are working! ✅'
      }]
    });

    return res.status(200).json({
      success: true,
      message: 'Push message sent successfully!',
      userId: userId,
      note: 'Check your LINE app - you should receive a message'
    });

  } catch (error) {
    console.error('LINE test message error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data || 'No additional details',
      suggestion: 'Check if your LINE_CHANNEL_ACCESS_TOKEN is correct'
    });
  }
};
