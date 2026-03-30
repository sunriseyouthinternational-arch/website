require('dotenv').config();
const axios = require('axios');

// ========== CONFIGURATION ==========
// To send a new flex message, only modify these values:
// 1. imageUrl: Direct image URL from Imgur (e.g., https://i.imgur.com/xxxxx.png or .jpg)
//    - Recommended resolution: 1040x676px (20:13 aspect ratio)
//    - Max file size: 10MB (1MB recommended)
// 2. altText: Short text shown in push notification
// 3. bodyText: Main message content (supports line breaks with \n or template literals)
// 4. buttonLabel: Text on the button
// 5. buttonUrl: URL to open when button is clicked
const CONFIG = {
  imageUrl: 'https://i.imgur.com/Wr73Jxo.jpeg',
  altText: '📣 4月活動公告',
  bodyText: `📣 4月活動公告

📚 小主播訓練課程
4/4 (Sat) 13:30–16:00｜Gabe
4/11 (Sat) 13:30–16:00｜Gabe

⚽ 足球比賽現場拍攝
4/5 (Sun) 13:00–15:00｜西屯足球場
4/12 (Sun) 11:30–13:00｜逢甲大學

✨ 報名方式
請至 LINE@ 會員中心完成登記`,
  buttonLabel: '前往會員中心',
  buttonUrl: 'https://www.sunriseyouth.org/profile?tab=classes'
};
// ===================================

async function broadcastFlexMessage() {
  try {
    const flexMessage = {
      type: 'flex',
      altText: CONFIG.altText,
      contents: {
        type: 'bubble',
        hero: {
          type: 'image',
          url: CONFIG.imageUrl,
          size: 'full',
          aspectRatio: '20:13',
          aspectMode: 'cover'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: CONFIG.bodyText,
              wrap: true,
              size: 'md',
              color: '#333333'
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              action: {
                type: 'uri',
                label: CONFIG.buttonLabel,
                uri: CONFIG.buttonUrl
              },
              style: 'primary'
            }
          ]
        }
      }
    };

    const response = await axios.post('https://api.line.me/v2/bot/message/broadcast', {
      messages: [flexMessage]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
      }
    });

    console.log('✓ LINE broadcast sent successfully:', response.status);
    process.exit(0);
  } catch (error) {
    console.error('✗ LINE broadcast error:', error.response?.data || error.message);
    process.exit(1);
  }
}

broadcastFlexMessage();
