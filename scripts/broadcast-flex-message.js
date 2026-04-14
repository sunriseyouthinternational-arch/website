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
  imageUrl: 'https://i.imgur.com/bS7AomI.jpeg',
  altText: '📢 4/25 地球日淨灘活動通知',
  bodyText: `📢 4/25 地球日淨灘活動通知

🗓 4/25（六）
⏰ 09:00–11:00
📍 台中大安 南莊海堤（439號附近）

一起來為地球出一分力 🌍💚
我們會提供手套、垃圾袋等基本工具，現場也有四輪車協助清運。

☀️ 請自備：水、防曬、防風用品

🔗 詳情參考FB：
https://www.facebook.com/share/p/1BAL9wbtJ9/?mibextid=wwXIfr

🌦 天氣與最新資訊將持續更新`,
  buttonLabel: '查看活動詳情',
  buttonUrl: 'https://www.sunriseyouth.org/profile/?tab=activities&activityName=%E5%9C%B0%E7%90%83%E6%97%A5%E6%B7%A8%E7%81%98%E6%B4%BB%E5%8B%95'
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
