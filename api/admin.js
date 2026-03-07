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

        console.log('[admin] Creating rich menu:', JSON.stringify(richMenu, null, 2));

        // Use LINE Messaging API v3 to create rich menu
        const https = require('https');
        const richMenuResponse = await new Promise((resolve, reject) => {
          const options = {
            hostname: 'api.line.me',
            port: 443,
            path: '/v2/bot/richmenu',
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
              'Content-Type': 'application/json',
              'Content-Length': JSON.stringify(richMenu).length
            }
          };

          const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
              if (res.statusCode === 200) {
                console.log('[admin] Rich menu creation response:', data);
                resolve(JSON.parse(data));
              } else {
                reject(new Error(`HTTP ${res.statusCode}: ${data}`));
              }
            });
          });

          req.on('error', reject);
          req.write(JSON.stringify(richMenu));
          req.end();
        });

        console.log('[admin] Rich menu response object:', JSON.stringify(richMenuResponse));
        const richMenuId = richMenuResponse.richMenuId || richMenuResponse;
        console.log('[admin] Rich menu created with ID:', richMenuId);

        // Upload the rich menu image
        const fs = require('fs');
        const path = require('path');
        const imagePath = path.join(process.cwd(), 'public/images/richmenu/richmenu.png');

        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);

          await new Promise((resolve, reject) => {
            const imageOptions = {
              hostname: 'api.line.me',
              port: 443,
              path: `/v2/bot/richmenu/${richMenuId}/image`,
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
                'Content-Type': 'image/png',
                'Content-Length': imageBuffer.length
              }
            };

            const req = https.request(imageOptions, (res) => {
              let data = '';
              res.on('data', (chunk) => { data += chunk; });
              res.on('end', () => {
                console.log('[admin] Image upload response status:', res.statusCode);
                if (res.statusCode === 200) {
                  resolve();
                } else {
                  console.error('[admin] Image upload failed:', res.statusCode, data);
                  reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
              });
            });

            req.on('error', reject);
            req.write(imageBuffer);
            req.end();
          });

          console.log('[admin] Rich menu image uploaded');
        } else {
          console.warn('[admin] Rich menu image not found at', imagePath);
        }

        return res.status(200).json({
          message: 'Rich menu created successfully',
          richMenuId: richMenuId
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
