const Jimp = require('jimp');
const line = require('@line/bot-sdk');

/**
 * Creates a personalized rich menu for a LINE user with login button
 * @param {Object} client - LINE Messaging API client
 * @param {string} lineUserId - LINE user ID
 * @param {string} memberId - Member ID
 * @param {string} profileUrl - Profile URL
 * @param {string} displayName - User's display name
 * @returns {string} Rich menu ID
 */
async function createPersonalizedRichMenu(client, lineUserId, memberId, profileUrl, displayName) {
  try {
    // Step 1: Create rich menu image
    const richMenuImage = await createRichMenuImage(memberId, displayName);

    // Step 2: Create rich menu object in LINE
    // Image dimensions: 2500 x 1686 pixels
    // Top row: 843px height
    // Bottom row: 843px height, split into 3 equal sections (833px each)
    const baseUrl = process.env.FRONTEND_URL || 'https://website-five-chi-99.vercel.app';

    const richMenu = {
      size: {
        width: 2500,
        height: 1686
      },
      selected: true,
      name: `Member ${memberId}`,
      chatBarText: '會員選單 Member Menu',
      areas: [
        // Top row - Personal Info / Membership (leads to profile page)
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
        // Bottom left - Classes & Activities
        {
          bounds: {
            x: 0,
            y: 843,
            width: 833,
            height: 843
          },
          action: {
            type: 'uri',
            uri: `${baseUrl}/classes-activities`
          }
        },
        // Bottom middle - Points & Gifts
        {
          bounds: {
            x: 834,
            y: 843,
            width: 833,
            height: 843
          },
          action: {
            type: 'message',
            text: '點數/禮物 Points & Gifts'
          }
        },
        // Bottom right - Referral Code
        {
          bounds: {
            x: 1667,
            y: 843,
            width: 833,
            height: 843
          },
          action: {
            type: 'message',
            text: '邀請碼 Referral Code'
          }
        }
      ]
    };

    // Create the rich menu
    const richMenuId = await client.createRichMenu(richMenu);
    console.log('Rich menu created:', richMenuId);

    // Step 3: Upload image to rich menu
    await client.setRichMenuImage(richMenuId, richMenuImage, 'image/png');
    console.log('Rich menu image uploaded');

    // Step 4: Link rich menu to user
    await client.linkRichMenuToUser(lineUserId, richMenuId);
    console.log('Rich menu linked to user:', lineUserId);

    return richMenuId;

  } catch (error) {
    console.error('Error creating personalized rich menu:', error);
    throw error;
  }
}

/**
 * Creates a rich menu image with login button and profile access
 * @param {string} memberId - Member ID
 * @param {string} displayName - User's display name
 * @returns {Buffer} Rich menu image buffer
 */
async function createRichMenuImage(memberId, displayName) {
  // Rich menu dimensions: 2500x1686 (tall format)
  const width = 2500;
  const height = 1686;

  // Load fonts
  const fontLarge = await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE);
  const fontMedium = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
  const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);

  // Create base image
  const image = new Jimp(width, height, 0x4A90E2FF); // Blue background

  // Top section (843px) - Login button
  // Add "LOGIN" text in large font
  image.print(
    fontLarge,
    0,
    200,
    {
      text: '登入 LOGIN',
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
    },
    width
  );

  // Add subtitle
  image.print(
    fontMedium,
    0,
    380,
    {
      text: '點擊進入個人檔案',
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
    },
    width
  );

  image.print(
    fontSmall,
    0,
    480,
    {
      text: 'Tap to access your profile',
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
    },
    width
  );

  // Member ID display
  image.print(
    fontSmall,
    0,
    580,
    {
      text: `Member ID: ${memberId}`,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
    },
    width
  );

  // Display name
  if (displayName) {
    image.print(
      fontSmall,
      0,
      640,
      {
        text: displayName,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
      },
      width
    );
  }

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
