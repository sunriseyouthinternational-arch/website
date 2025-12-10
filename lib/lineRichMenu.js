const QRCode = require('qrcode');
const { createCanvas, loadImage } = require('canvas');
const line = require('@line/bot-sdk');

/**
 * Creates a personalized rich menu for a LINE user with their unique QR code
 * @param {Object} client - LINE Messaging API client
 * @param {string} lineUserId - LINE user ID
 * @param {string} memberId - Member ID
 * @param {string} profileUrl - Profile URL to encode in QR code
 * @param {string} displayName - User's display name
 * @returns {string} Rich menu ID
 */
async function createPersonalizedRichMenu(client, lineUserId, memberId, profileUrl, displayName) {
  try {
    // Step 1: Generate QR code as buffer
    const qrCodeBuffer = await QRCode.toBuffer(profileUrl, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 500,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Step 2: Create rich menu image with QR code
    const richMenuImage = await createRichMenuImage(qrCodeBuffer, memberId, displayName);

    // Step 3: Create rich menu object in LINE
    const richMenu = {
      size: {
        width: 2500,
        height: 1686
      },
      selected: true,
      name: `Member ${memberId}`,
      chatBarText: '我的團員資料 My Profile',
      areas: [
        {
          bounds: {
            x: 0,
            y: 0,
            width: 2500,
            height: 843
          },
          action: {
            type: 'uri',
            uri: profileUrl
          }
        },
        {
          bounds: {
            x: 0,
            y: 843,
            width: 1250,
            height: 843
          },
          action: {
            type: 'uri',
            uri: profileUrl
          }
        },
        {
          bounds: {
            x: 1250,
            y: 843,
            width: 1250,
            height: 843
          },
          action: {
            type: 'message',
            text: '我的團員編號 My Member ID'
          }
        }
      ]
    };

    // Create the rich menu
    const richMenuId = await client.createRichMenu(richMenu);
    console.log('Rich menu created:', richMenuId);

    // Step 4: Upload image to rich menu
    await client.setRichMenuImage(richMenuId, richMenuImage, 'image/png');
    console.log('Rich menu image uploaded');

    // Step 5: Link rich menu to user
    await client.linkRichMenuToUser(lineUserId, richMenuId);
    console.log('Rich menu linked to user:', lineUserId);

    return richMenuId;

  } catch (error) {
    console.error('Error creating personalized rich menu:', error);
    throw error;
  }
}

/**
 * Creates a rich menu image with QR code and text
 * @param {Buffer} qrCodeBuffer - QR code image buffer
 * @param {string} memberId - Member ID
 * @param {string} displayName - User's display name
 * @returns {Buffer} Rich menu image buffer
 */
async function createRichMenuImage(qrCodeBuffer, memberId, displayName) {
  // Rich menu dimensions: 2500x1686 (tall format)
  const width = 2500;
  const height = 1686;

  // Create canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Top section: QR Code area (blue background)
  ctx.fillStyle = '#4A90E2';
  ctx.fillRect(0, 0, width, 843);

  // Title text
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.font = 'bold 80px Arial, sans-serif';
  ctx.fillText('我的專屬 QR Code', 1250, 120);

  ctx.font = '60px Arial, sans-serif';
  ctx.fillText('My Personal QR Code', 1250, 220);

  // Load and draw QR code
  const qrImage = await loadImage(qrCodeBuffer);
  const qrSize = 400;
  const qrX = Math.floor((width - qrSize) / 2);
  const qrY = 280;
  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

  // Member ID text
  ctx.font = '50px Arial, sans-serif';
  ctx.fillText(`團員編號 Member ID: ${memberId}`, 1250, 750);

  // Bottom left button: View Profile (green)
  ctx.fillStyle = '#50C878';
  ctx.fillRect(0, 843, 1250, 843);

  ctx.fillStyle = 'white';
  ctx.font = 'bold 70px Arial, sans-serif';
  ctx.fillText('查看個人檔案', 625, 1200);
  ctx.font = '50px Arial, sans-serif';
  ctx.fillText('View Profile', 625, 1300);

  // Bottom right button: Get Member ID (orange)
  ctx.fillStyle = '#FFA500';
  ctx.fillRect(1250, 843, 1250, 843);

  ctx.fillStyle = 'white';
  ctx.font = 'bold 70px Arial, sans-serif';
  ctx.fillText('我的團員編號', 1875, 1200);
  ctx.font = '50px Arial, sans-serif';
  ctx.fillText('My Member ID', 1875, 1300);

  // Convert to PNG buffer
  return canvas.toBuffer('image/png');
}

/**
 * Deletes a rich menu and unlinks it from user
 * @param {Object} client - LINE Messaging API client
 * @param {string} lineUserId - LINE user ID
 * @param {string} richMenuId - Rich menu ID to delete
 */
async function deletePersonalizedRichMenu(client, lineUserId, richMenuId) {
  try {
    // Unlink from user first
    await client.unlinkRichMenuFromUser(lineUserId);
    console.log('Rich menu unlinked from user:', lineUserId);

    // Delete the rich menu
    await client.deleteRichMenu(richMenuId);
    console.log('Rich menu deleted:', richMenuId);

  } catch (error) {
    console.error('Error deleting rich menu:', error);
    throw error;
  }
}

module.exports = {
  createPersonalizedRichMenu,
  deletePersonalizedRichMenu
};
