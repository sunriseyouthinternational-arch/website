const connectDB = require('../lib/mongodb');
const { Member, Class, Activity } = require('../db/models');
const line = require('@line/bot-sdk');

const lineClient = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

module.exports = async (req, res) => {
  const { resource, action, classId, activityId, participantId, memberId } = req.query;

  try {
    await connectDB();

    // Dashboard stats
    if (resource === 'stats') {
      const totalMembers = await Member.countDocuments();
      const activeClasses = await Class.countDocuments({ status: 'active' });
      const activeActivities = await Activity.countDocuments({ status: 'active' });

      return res.status(200).json({
        totalMembers,
        activeClasses,
        activeActivities
      });
    }

    // Referral leaderboard
    if (resource === 'referral-leaderboard') {
      // Get all members with their referral counts
      const members = await Member.find({ registrationCompleted: true })
        .select('memberId name referralCode')
        .lean();

      // Count referrals for each member
      const leaderboard = await Promise.all(
        members.map(async (member) => {
          const referralCount = await Member.countDocuments({
            referredBy: member._id,
            registrationCompleted: true
          });

          return {
            memberId: member.memberId,
            name: member.name,
            referralCode: member.referralCode,
            referralCount
          };
        })
      );

      // Filter out members with 0 referrals and sort by count (highest first)
      const rankedLeaderboard = leaderboard
        .filter(m => m.referralCount > 0)
        .sort((a, b) => b.referralCount - a.referralCount);

      return res.status(200).json({ leaderboard: rankedLeaderboard });
    }

    // Helper for HTTPS requests (used by line-rich-menu actions)
    function lineRequest(options, body) {
      return new Promise((resolve, reject) => {
        const req = require('https').request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            console.log(`[admin] ${options.path} -> ${res.statusCode}: ${data || '(empty)'}`);
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

    // LINE Rich Menu setup
    if (resource === 'line-rich-menu' && action === 'setup') {
      try {
        if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
          return res.status(500).json({
            message: 'LINE_CHANNEL_ACCESS_TOKEN not configured',
            error: 'Missing environment variable'
          });
        }

        const richMenu = {
          name: 'Sunrise Youth Menu',
          size: {
            width: 2500,
            height: 1686
          },
          selected: true,
          chatBarText: 'Menu',
          areas: [
            // Button 1: Profile - Top button (full width)
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

        const fs = require('fs');
        const path = require('path');
        const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        const richMenuBody = JSON.stringify(richMenu);

        // Step 1: Create rich menu
        console.log('[admin] Step 1: Creating rich menu...');
        const createResponse = await lineRequest({
          hostname: 'api.line.me',
          port: 443,
          path: '/v2/bot/richmenu',
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(richMenuBody)
          }
        }, richMenuBody);

        const richMenuId = createResponse.richMenuId;
        console.log('[admin] Rich menu created:', richMenuId);

        // Step 2: Upload image (uses api-data.line.me, path ends with /content)
        const imagePath = path.join(process.cwd(), 'public/images/richmenu/richmenu.jpg');
        if (!fs.existsSync(imagePath)) {
          return res.status(500).json({
            message: 'Rich menu created but image not found',
            richMenuId,
            imagePath
          });
        }

        const imageBuffer = fs.readFileSync(imagePath);
        console.log('[admin] Step 2: Uploading image (%d bytes)...', imageBuffer.length);
        await lineRequest({
          hostname: 'api-data.line.me',
          port: 443,
          path: `/v2/bot/richmenu/${richMenuId}/content`,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'image/jpeg',
            'Content-Length': imageBuffer.length
          }
        }, imageBuffer);
        console.log('[admin] Image uploaded successfully');

        // Step 3: Set as default rich menu for all users
        console.log('[admin] Step 3: Setting as default rich menu...');
        await lineRequest({
          hostname: 'api.line.me',
          port: 443,
          path: `/v2/bot/user/all/richmenu/${richMenuId}`,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Length': 0
          }
        });
        console.log('[admin] Default rich menu set');

        return res.status(200).json({
          message: 'Rich menu created, image uploaded, and set as default',
          richMenuId
        });
      } catch (error) {
        console.error('[admin] Rich menu error:', error.message);
        console.error('[admin] Full error:', error);
        return res.status(500).json({
          message: 'Failed to create rich menu',
          error: error.message,
          details: error.response?.data || error.toString()
        });
      }
    }

    // LINE Rich Menu regenerate
    if (resource === 'line-rich-menu' && action === 'regenerate') {
      try {
        const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (!token) {
          return res.status(500).json({
            message: 'LINE_CHANNEL_ACCESS_TOKEN not configured',
            error: 'Missing environment variable'
          });
        }

        const { memberId: queryMemberId, lineUserId } = req.query;

        // Determine which members to process
        let members = [];

        if (queryMemberId) {
          // Specific member by memberId
          const member = await Member.findOne({ memberId: queryMemberId });
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
          console.log(`[admin] Processing member: ${member.memberId} (${member.line?.userId})`);

          try {
            if (!member.line?.userId) {
              console.log(`[admin] Skipping ${member.memberId} - no LINE user ID`);
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
            console.log(`[admin] Step 1: Clearing old rich menu assignment for ${member.memberId}...`);
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
              console.log(`[admin] Old rich menu assignment cleared for ${member.memberId}`);
            } catch (err) {
              // It's okay if there's no old menu to delete
              console.log(`[admin] No old menu to delete (${err.message.substring(0, 50)})`);
            }

            console.log(`[admin] ${member.memberId} regenerated successfully`);
            results.push({
              memberId: member.memberId,
              name: member.name,
              lineUserId: member.line.userId,
              success: true
            });
          } catch (error) {
            console.error(`[admin] Error processing ${member.memberId}:`, error.message);
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
        console.error('[admin] Regenerate error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to regenerate rich menus',
          error: error.message
        });
      }
    }

    // List all members
    if (resource === 'members' && !action) {
      const members = await Member.find().sort({ createdAt: -1 });
      return res.status(200).json({ members });
    }

    // Update class payment status
    if (resource === 'class-payment' && req.method === 'PUT') {
      const { paid } = req.body;
      const classItem = await Class.findById(classId);

      if (!classItem) {
        return res.status(404).json({ message: '找不到課程 / Class not found' });
      }

      const participant = classItem.participants.id(participantId);

      if (!participant) {
        return res.status(404).json({ message: '找不到參與者 / Participant not found' });
      }

      participant.paid = paid;
      await classItem.save();

      const member = await Member.findById(participant.memberId);
      if (member) {
        const enrollment = member.enrollments.find(
          e => e.itemId.toString() === classItem._id.toString() && e.type === 'class'
        );
        if (enrollment) {
          enrollment.paid = paid;
          await member.save();
        }
      }

      return res.status(200).json({
        message: '付款狀態更新成功 / Payment status updated successfully',
        class: classItem
      });
    }

    // Update activity payment status
    if (resource === 'activity-payment' && req.method === 'PUT') {
      const { paid } = req.body;
      const activity = await Activity.findById(activityId);

      if (!activity) {
        return res.status(404).json({ message: '找不到活動 / Activity not found' });
      }

      const participant = activity.participants.id(participantId);

      if (!participant) {
        return res.status(404).json({ message: '找不到參與者 / Participant not found' });
      }

      participant.paid = paid;
      await activity.save();

      const member = await Member.findById(participant.memberId);
      if (member) {
        const enrollment = member.enrollments.find(
          e => e.itemId.toString() === activity._id.toString() && e.type === 'activity'
        );
        if (enrollment) {
          enrollment.paid = paid;
          await member.save();
        }
      }

      return res.status(200).json({
        message: '付款狀態更新成功 / Payment status updated successfully',
        activity
      });
    }

    // Update class payment method
    if (resource === 'class-payment-method' && req.method === 'PUT') {
      const { paymentMethod } = req.body;
      const classItem = await Class.findById(classId);

      if (!classItem) {
        return res.status(404).json({ message: '找不到課程 / Class not found' });
      }

      const participant = classItem.participants.id(participantId);

      if (!participant) {
        return res.status(404).json({ message: '找不到參與者 / Participant not found' });
      }

      participant.paymentMethod = paymentMethod;
      await classItem.save();

      return res.status(200).json({
        message: '付款方式更新成功 / Payment method updated successfully',
        class: classItem
      });
    }

    // Update activity payment method
    if (resource === 'activity-payment-method' && req.method === 'PUT') {
      const { paymentMethod } = req.body;
      const activity = await Activity.findById(activityId);

      if (!activity) {
        return res.status(404).json({ message: '找不到活動 / Activity not found' });
      }

      const participant = activity.participants.id(participantId);

      if (!participant) {
        return res.status(404).json({ message: '找不到參與者 / Participant not found' });
      }

      participant.paymentMethod = paymentMethod;
      await activity.save();

      return res.status(200).json({
        message: '付款方式更新成功 / Payment method updated successfully',
        activity
      });
    }

    // Update membership status
    if (resource === 'membership-status' && req.method === 'PUT') {
      const { membershipStatus } = req.body;
      const memberIdToUpdate = memberId || req.body.memberId;

      if (!memberIdToUpdate || !membershipStatus) {
        return res.status(400).json({ message: '缺少必要欄位 / Missing required fields' });
      }

      const member = await Member.findById(memberIdToUpdate);

      if (!member) {
        return res.status(404).json({ message: '找不到會員 / Member not found' });
      }

      // Update membership status
      const previousStatus = member.membershipStatus;
      member.membershipStatus = membershipStatus;

      // If upgrading to 協會會員 and not already upgraded, set upgrade date
      if (membershipStatus === '協會會員' && previousStatus !== '協會會員') {
        member.membershipUpgradedDate = new Date();
      }

      await member.save();

      return res.status(200).json({
        message: '會籍狀態更新成功 / Membership status updated successfully',
        member
      });
    }

    // Update member role
    if (resource === 'member-role' && req.method === 'PUT') {
      const { role } = req.body;
      const memberIdToUpdate = memberId || req.body.memberId;

      if (!memberIdToUpdate || !role) {
        return res.status(400).json({ message: '缺少必要欄位 / Missing required fields' });
      }

      const member = await Member.findById(memberIdToUpdate);

      if (!member) {
        return res.status(404).json({ message: '找不到會員 / Member not found' });
      }

      member.role = role;
      await member.save();

      return res.status(200).json({
        message: '角色更新成功 / Role updated successfully',
        member
      });
    }

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Admin operation error:', error);
    res.status(500).json({ message: '服務器錯誤 / Server error' });
  }
};
