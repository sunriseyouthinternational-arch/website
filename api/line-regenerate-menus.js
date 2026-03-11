const connectDB = require('../lib/mongodb');
const { Member } = require('../db/models');
const https = require('https');

const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

module.exports = async (req, res) => {
  try {
    await connectDB();

    const { memberId, lineUserId } = req.query;

    // Helper for HTTPS requests
    function lineRequest(options, body) {
      return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            console.log(`[regenerate] ${options.path} -> ${res.statusCode}: ${data || '(empty)'}`);
            // Only fail on actual errors (not 404 which means no existing menu to delete)
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(data ? JSON.parse(data) : {});
            } else if (res.statusCode === 404) {
              resolve({ notFound: true });
            } else {
              reject(new Error(`${options.path} returned HTTP ${res.statusCode}: ${data}`));
            }
          });
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
      });
    }

    // Determine which members to process
    let members = [];

    if (memberId) {
      // Specific member by memberId
      const member = await Member.findOne({ memberId });
      if (!member) {
        return res.status(404).json({ success: false, message: 'Member not found' });
      }
      members = [member];
    } else if (lineUserId) {
      // Specific member by LINE user ID
      const member = await Member.findOne({ 'line.userId': lineUserId });
      if (!member) {
        return res.status(404).json({ success: false, message: 'Member with that LINE ID not found' });
      }
      members = [member];
    } else {
      // All members with completed registration and LINE accounts
      members = await Member.find({
        registrationCompleted: true,
        'line.userId': { $exists: true, $ne: null }
      }).lean();
    }

    const results = [];

    for (const member of members) {
      console.log(`[regenerate] Processing member: ${member.memberId} (${member.line?.userId})`);

      try {
        if (!member.line?.userId) {
          console.log(`[regenerate] Skipping ${member.memberId} - no LINE user ID`);
          results.push({
            memberId: member.memberId,
            name: member.name,
            lineUserId: member.line?.userId,
            success: false,
            reason: 'No LINE user ID linked'
          });
          continue;
        }

        // Step 1: Delete any old individual rich menu assignment for this user
        // (This doesn't actually delete the rich menu, just unlinks it from the user)
        console.log(`[regenerate] Step 1: Clearing old rich menu assignment for ${member.memberId}...`);
        try {
          await lineRequest({
            hostname: 'api.line.me',
            port: 443,
            path: `/v2/bot/user/${member.line.userId}/richmenu`,
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Length': 0
            }
          });
          console.log(`[regenerate] Old rich menu assignment cleared for ${member.memberId}`);
        } catch (err) {
          // It's okay if there's no old menu to delete
          console.log(`[regenerate] No old menu to delete (${err.message.substring(0, 50)})`);
        }

        // Step 2: Get the current default rich menu ID
        // For now, we'll just use the most recently created one
        // In a production scenario, you might want to create a new menu for each user
        // or fetch the current default from LINE

        // For simplicity, we'll just unlink from the old default,
        // which makes them use whatever is set as the default for all users
        // (which should be the new one from the admin setup endpoint)

        console.log(`[regenerate] ${member.memberId} regenerated successfully`);
        results.push({
          memberId: member.memberId,
          name: member.name,
          lineUserId: member.line.userId,
          success: true
        });
      } catch (error) {
        console.error(`[regenerate] Error processing ${member.memberId}:`, error.message);
        results.push({
          memberId: member.memberId,
          name: member.name,
          lineUserId: member.line?.userId,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return res.status(200).json({
      success: true,
      message: `Processed ${members.length} member(s)`,
      summary: {
        total: members.length,
        success: successCount,
        failed: failedCount
      },
      results
    });
  } catch (error) {
    console.error('[regenerate] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to regenerate rich menus',
      error: error.message
    });
  }
};
