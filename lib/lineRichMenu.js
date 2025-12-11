const fs = require('fs').promises;
const path = require('path');
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
    // Step 1: Load rich menu image from file
    const richMenuImage = await loadRichMenuImage();

    // Step 2: Create rich menu object in LINE
    // Image dimensions: 2500 x 1686 pixels
    // Top row: 843px height
    // Bottom row: 843px height, split into 3 equal sections (833px each)
    const baseUrl = process.env.FRONTEND_URL || 'https://www.sunriseyouth.org';

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
        // Bottom left - Classes & Activities (opens profile with courses tab)
        {
          bounds: {
            x: 0,
            y: 843,
            width: 833,
            height: 843
          },
          action: {
            type: 'uri',
            uri: `${profileUrl}?tab=courses`
          }
        },
        // Bottom middle - Points & Gifts (opens profile with points tab)
        {
          bounds: {
            x: 834,
            y: 843,
            width: 833,
            height: 843
          },
          action: {
            type: 'uri',
            uri: `${profileUrl}?tab=points`
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
 * Loads the rich menu image from the public folder
 * @returns {Buffer} Rich menu image buffer
 */
async function loadRichMenuImage() {
  try {
    // Try to load from public/images/rich-menu/richmenu.png
    const imagePath = path.join(process.cwd(), 'public', 'images', 'rich-menu', 'richmenu.png');
    console.log('Loading rich menu image from:', imagePath);

    const imageBuffer = await fs.readFile(imagePath);
    console.log('Rich menu image loaded successfully');

    return imageBuffer;
  } catch (error) {
    console.error('Error loading rich menu image:', error);
    throw new Error('Rich menu image not found. Please upload richmenu.png to /public/images/rich-menu/');
  }
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
