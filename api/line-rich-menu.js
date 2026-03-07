const line = require('@line/bot-sdk');

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
    // Rich Menu configuration
    // Image size: 2500 x 1686 px
    const richMenu = {
      size: {
        width: 2500,
        height: 1686
      },
      selected: true,
      areas: [
        // Button 1: Profile - Top button (full width)
        // x: 0, y: 215, w: 2500, h: 735.5
        {
          bounds: {
            x: 0,
            y: 215,
            width: 2500,
            height: 735
          },
          action: {
            type: 'uri',
            label: 'Profile',
            uri: 'https://www.sunriseyouth.org/profile'
          }
        },
        // Button 2: Referral Code - Bottom left
        // x: 0, y: 950.5, w: 833.3, h: 735.5
        {
          bounds: {
            x: 0,
            y: 950,
            width: 833,
            height: 735
          },
          action: {
            type: 'postback',
            label: 'Referral Code',
            data: 'action=share_referral_code'
          }
        },
        // Button 3: Classes - Bottom middle
        // x: 833.3, y: 950.5, w: 833.3, h: 735.5
        {
          bounds: {
            x: 833,
            y: 950,
            width: 834,
            height: 735
          },
          action: {
            type: 'uri',
            label: 'Classes',
            uri: 'https://www.sunriseyouth.org/profile?tab=classes'
          }
        },
        // Button 4: Coupons - Bottom right
        // x: 1666.7, y: 950.5, w: 833.3, h: 735.5
        {
          bounds: {
            x: 1667,
            y: 950,
            width: 833,
            height: 735
          },
          action: {
            type: 'uri',
            label: 'Coupons',
            uri: 'https://www.sunriseyouth.org/profile?tab=coupons'
          }
        }
      ]
    };

    // Set the rich menu
    const response = await client.createRichMenu(richMenu);
    console.log('[line-rich-menu] Rich menu created:', response);

    return res.status(200).json({
      message: 'Rich menu created successfully',
      richMenuId: response
    });
  } catch (error) {
    console.error('[line-rich-menu] Error:', error);
    return res.status(500).json({
      message: 'Failed to create rich menu',
      error: error.message
    });
  }
};
