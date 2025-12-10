const QRCode = require('qrcode');
const sharp = require('sharp');
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

  // Create background
  const background = Buffer.from(
    `<svg width="${width}" height="${height}">
      <!-- Top section: QR Code area -->
      <rect x="0" y="0" width="${width}" height="843" fill="#4A90E2"/>

      <!-- Text: Title -->
      <text x="1250" y="120" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white" text-anchor="middle">
        我的專屬 QR Code
      </text>
      <text x="1250" y="220" font-family="Arial, sans-serif" font-size="60" fill="white" text-anchor="middle">
        My Personal QR Code
      </text>

      <!-- Member ID -->
      <text x="1250" y="750" font-family="Arial, sans-serif" font-size="50" fill="white" text-anchor="middle">
        團員編號 Member ID: ${memberId}
      </text>

      <!-- Bottom left button: View Profile -->
      <rect x="0" y="843" width="1250" height="843" fill="#50C878"/>
      <text x="625" y="1200" font-family="Arial, sans-serif" font-size="70" font-weight="bold" fill="white" text-anchor="middle">
        查看個人檔案
      </text>
      <text x="625" y="1300" font-family="Arial, sans-serif" font-size="50" fill="white" text-anchor="middle">
        View Profile
      </text>

      <!-- Bottom right button: Get Member ID -->
      <rect x="1250" y="843" width="1250" height="843" fill="#FFA500"/>
      <text x="1875" y="1200" font-family="Arial, sans-serif" font-size="70" font-weight="bold" fill="white" text-anchor="middle">
        我的團員編號
      </text>
      <text x="1875" y="1300" font-family="Arial, sans-serif" font-size="50" fill="white" text-anchor="middle">
        My Member ID
      </text>
    </svg>`
  );

  // Resize QR code to fit in the center of top section
  const qrSize = 400;
  const qrX = Math.floor((width - qrSize) / 2);
  const qrY = 280;

  const resizedQR = await sharp(qrCodeBuffer)
    .resize(qrSize, qrSize)
    .toBuffer();

  // Composite QR code onto background
  const finalImage = await sharp(background)
    .composite([
      {
        input: resizedQR,
        top: qrY,
        left: qrX
      }
    ])
    .png()
    .toBuffer();

  return finalImage;
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
