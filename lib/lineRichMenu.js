const QRCode = require('qrcode');
const Jimp = require('jimp');
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

  // Load fonts
  const font = await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE);
  const fontMedium = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
  const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);

  // Create base image
  const image = new Jimp(width, height, 0x4A90E2FF); // Blue background

  // Top section (843px) - already blue from background

  // Add title text
  image.print(
    font,
    0,
    80,
    {
      text: '我的專屬 QR Code',
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
    },
    width
  );

  image.print(
    fontMedium,
    0,
    240,
    {
      text: 'My Personal QR Code',
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
    },
    width
  );

  // Load and composite QR code
  const qrImage = await Jimp.read(qrCodeBuffer);
  qrImage.resize(400, 400);
  const qrX = Math.floor((width - 400) / 2);
  const qrY = 320;
  image.composite(qrImage, qrX, qrY);

  // Member ID text
  image.print(
    fontSmall,
    0,
    760,
    {
      text: `Member ID: ${memberId}`,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
    },
    width
  );

  // Bottom left button: View Profile (green)
  const greenButton = new Jimp(1250, 843, 0x50C878FF);
  greenButton.print(
    fontMedium,
    0,
    320,
    {
      text: '查看個人檔案',
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
    },
    1250
  );
  greenButton.print(
    fontSmall,
    0,
    420,
    {
      text: 'View Profile',
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
    },
    1250
  );
  image.composite(greenButton, 0, 843);

  // Bottom right button: Get Member ID (orange)
  const orangeButton = new Jimp(1250, 843, 0xFFA500FF);
  orangeButton.print(
    fontMedium,
    0,
    320,
    {
      text: '我的團員編號',
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
    },
    1250
  );
  orangeButton.print(
    fontSmall,
    0,
    420,
    {
      text: 'My Member ID',
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
    },
    1250
  );
  image.composite(orangeButton, 1250, 843);

  // Convert to PNG buffer
  return await image.getBufferAsync(Jimp.MIME_PNG);
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
