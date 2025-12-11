const line = require('@line/bot-sdk');
const connectDB = require('../lib/mongodb');
const { Member } = require('../db/models');
const { createPersonalizedRichMenu } = require('../lib/lineRichMenu');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
});

/**
 * Endpoint to regenerate rich menus for members with LINE accounts
 * Usage:
 *   GET /api/line-regenerate-menus - Regenerate for ALL members with completed registration
 *   GET /api/line-regenerate-menus?memberId=M123456 - Regenerate for specific member
 *   GET /api/line-regenerate-menus?lineUserId=U1234567890abcdef - Regenerate by LINE user ID
 *   GET /api/line-regenerate-menus?force=true - Regenerate even for members without completed registration
 */
module.exports = async (req, res) => {
  try {
    const { memberId, lineUserId, force } = req.query;

    await connectDB();

    let members;

    // Find specific member
    if (memberId) {
      const member = await Member.findOne({ memberId });
      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Member not found',
          memberId
        });
      }
      members = [member];
    } else if (lineUserId) {
      const member = await Member.findOne({ 'line.userId': lineUserId });
      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Member with LINE account not found',
          lineUserId
        });
      }
      members = [member];
    } else {
      // Find all members with LINE accounts
      const query = {
        'line.userId': { $exists: true, $ne: null }
      };

      // Only require completed registration if force is not set
      if (force !== 'true') {
        query.registrationCompleted = true;
      }

      members = await Member.find(query);
    }

    if (members.length === 0) {
      // Provide helpful debug information
      const allMembers = await Member.find({}).select('memberId registrationCompleted line.userId').lean();
      const debugInfo = {
        total: allMembers.length,
        withLineAccounts: allMembers.filter(m => m.line?.userId).length,
        registrationCompleted: allMembers.filter(m => m.registrationCompleted).length,
        withLineAndCompleted: allMembers.filter(m => m.line?.userId && m.registrationCompleted).length,
        withLineButNotCompleted: allMembers.filter(m => m.line?.userId && !m.registrationCompleted).length
      };

      return res.status(200).json({
        success: true,
        message: force === 'true'
          ? 'No members with LINE accounts found (force mode)'
          : 'No members with LINE accounts and completed registration found',
        processed: 0,
        debugInfo,
        hint: debugInfo.withLineButNotCompleted > 0 && force !== 'true'
          ? 'Some members have LINE accounts but have not completed registration. Use ?force=true to regenerate their menus anyway, or ask them to complete the registration form.'
          : debugInfo.withLineAccounts > 0
            ? 'Some members have LINE accounts. Check if they have completed registration.'
            : 'No members have LINE accounts yet. Members need to follow the official account first.'
      });
    }

    const results = [];
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'www.sunriseyouth.org';
    const baseUrl = process.env.FRONTEND_URL || `${protocol}://${host}`;

    for (const member of members) {
      if (!member.line || !member.line.userId) {
        results.push({
          memberId: member.memberId,
          success: false,
          error: 'No LINE account linked'
        });
        continue;
      }

      try {
        const profileUrl = `${baseUrl}/profile/${member.memberId}`;

        // IMPORTANT: Delete/unlink ANY existing rich menu
        // This handles both:
        // 1. Rich menus in our database (new system)
        // 2. Old rich menus from before system was implemented (not in database)
        try {
          // First, check if user has ANY rich menu linked (via LINE API)
          const existingRichMenuId = await client.getRichMenuIdOfUser(member.line.userId);

          if (existingRichMenuId) {
            console.log(`[${member.memberId}] Found existing rich menu: ${existingRichMenuId}`);

            // Unlink the rich menu from user
            await client.unlinkRichMenuFromUser(member.line.userId);
            console.log(`[${member.memberId}] Unlinked rich menu from user`);

            // Try to delete the rich menu (only works if we own it)
            // Old default rich menus might fail here, but that's okay - unlinking is what matters
            try {
              await client.deleteRichMenu(existingRichMenuId);
              console.log(`[${member.memberId}] Deleted rich menu: ${existingRichMenuId}`);
            } catch (deleteError) {
              console.log(`[${member.memberId}] Could not delete rich menu (might be default): ${deleteError.message}`);
            }
          } else {
            console.log(`[${member.memberId}] No existing rich menu found`);
          }
        } catch (error) {
          // Error getting rich menu ID means user doesn't have one, which is fine
          if (error.message && error.message.includes('404')) {
            console.log(`[${member.memberId}] No rich menu currently linked`);
          } else {
            console.log(`[${member.memberId}] Error checking for existing rich menu:`, error.message);
          }
        }

        // Create new rich menu
        const richMenuId = await createPersonalizedRichMenu(
          client,
          member.line.userId,
          member.memberId,
          profileUrl,
          member.line.displayName || member.name
        );

        // Save rich menu ID
        member.line.richMenuId = richMenuId;
        await member.save();

        results.push({
          memberId: member.memberId,
          name: member.name,
          lineUserId: member.line.userId,
          richMenuId: richMenuId,
          success: true
        });

        console.log(`Rich menu created for ${member.memberId}: ${richMenuId}`);
      } catch (error) {
        console.error(`Failed to create rich menu for ${member.memberId}:`, error);
        results.push({
          memberId: member.memberId,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return res.status(200).json({
      success: true,
      message: `Processed ${members.length} member(s)`,
      summary: {
        total: members.length,
        success: successCount,
        failed: failCount
      },
      results
    });

  } catch (error) {
    console.error('LINE regenerate menus error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error regenerating rich menus',
      error: error.message
    });
  }
};
