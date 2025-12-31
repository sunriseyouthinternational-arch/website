const connectDB = require('../lib/mongodb');
const { AssociationMeeting, Member } = require('../db/models');
const axios = require('axios');

module.exports = async (req, res) => {
  const { action, meetingId, memberId } = req.query;

  try {
    await connectDB();

    // Get all meetings or filter by status
    if (req.method === 'GET' && !action) {
      const { status } = req.query;
      const query = status ? { status } : {};

      const meetings = await AssociationMeeting.find(query)
        .sort({ date: 1 })
        .lean();

      return res.status(200).json({ meetings });
    }

    // Get single meeting details
    if (req.method === 'GET' && action === 'details' && meetingId) {
      const meeting = await AssociationMeeting.findById(meetingId).lean();

      if (!meeting) {
        return res.status(404).json({ message: '找不到會議 / Meeting not found' });
      }

      return res.status(200).json({ meeting });
    }

    // Get member's meeting stats
    if (req.method === 'GET' && action === 'member-stats' && memberId) {
      const member = await Member.findOne({ memberId }).lean();

      if (!member) {
        return res.status(404).json({ message: '找不到會員 / Member not found' });
      }

      // Count meetings attended this year
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1);
      const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

      const meetingsAttended = await AssociationMeeting.countDocuments({
        'participants': {
          $elemMatch: {
            memberId: member._id,
            attended: true
          }
        },
        date: { $gte: yearStart, $lte: yearEnd }
      });

      return res.status(200).json({
        memberSince: member.membershipUpgradedDate || member.membershipStartDate,
        meetingsAttendedThisYear: meetingsAttended,
        currentYear
      });
    }

    // Create new meeting (Admin only)
    if (req.method === 'POST' && !action) {
      const { agenda, date, time, location, memberType, sendLineAnnouncement, meetingType, zoomUrl, mandatory } = req.body;

      if (!agenda || !date || !time || !memberType) {
        return res.status(400).json({ message: '缺少必要欄位 / Missing required fields' });
      }

      const meeting = new AssociationMeeting({
        agenda,
        date: new Date(date),
        time,
        meetingType: meetingType || 'in-person',
        location,
        zoomUrl,
        memberType,
        mandatory: mandatory || false,
        sendLineAnnouncement: sendLineAnnouncement || false,
        participants: [],
        absences: [],
        status: 'upcoming'
      });

      await meeting.save();

      // Send LINE announcement if requested
      if (sendLineAnnouncement) {
        try {
          // Get all 協會會員 members with LINE accounts
          const associationMembers = await Member.find({
            membershipStatus: '協會會員',
            'line.userId': { $exists: true, $ne: null }
          }).lean();

          // Send announcement to each member via LINE
          const lineAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

          if (lineAccessToken && associationMembers.length > 0) {
            const announceMessage = {
              type: 'text',
              text: `📢 協會會議通知\n\n議程：${agenda}\n日期：${new Date(date).toLocaleDateString('zh-TW')}\n時間：${time}\n地點：${location || '待定'}\n\n請至個人檔案頁面查看詳情並報名。`
            };

            // Send to all members (batch send)
            for (const member of associationMembers) {
              try {
                await axios.post(
                  'https://api.line.me/v2/bot/message/push',
                  {
                    to: member.line.userId,
                    messages: [announceMessage]
                  },
                  {
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${lineAccessToken}`
                    }
                  }
                );
              } catch (lineError) {
                console.error(`Failed to send LINE message to ${member.memberId}:`, lineError.message);
              }
            }
          }
        } catch (error) {
          console.error('LINE announcement error:', error);
          // Don't fail the meeting creation if LINE fails
        }
      }

      return res.status(201).json({
        message: '會議建立成功 / Meeting created successfully',
        meeting
      });
    }

    // Register for meeting
    if (req.method === 'POST' && action === 'register') {
      const { meetingId, memberId } = req.body;

      if (!meetingId || !memberId) {
        return res.status(400).json({ message: '缺少必要欄位 / Missing required fields' });
      }

      const meeting = await AssociationMeeting.findById(meetingId);

      if (!meeting) {
        return res.status(404).json({ message: '找不到會議 / Meeting not found' });
      }

      const member = await Member.findOne({ memberId });

      if (!member) {
        return res.status(404).json({ message: '找不到會員 / Member not found' });
      }

      // Check if member is 協會會員
      if (member.membershipStatus !== '協會會員') {
        return res.status(403).json({
          message: '只有協會會員可以報名會議 / Only association members can register for meetings'
        });
      }

      // Check if already registered
      const alreadyRegistered = meeting.participants.some(
        p => p.memberId.toString() === member._id.toString()
      );

      if (alreadyRegistered) {
        return res.status(400).json({
          message: '您已經報名此會議 / You are already registered for this meeting'
        });
      }

      // Add participant
      meeting.participants.push({
        memberId: member._id,
        memberName: member.name,
        memberIdString: member.memberId,
        registeredAt: new Date(),
        attended: false
      });

      await meeting.save();

      return res.status(200).json({
        message: '報名成功 / Registration successful',
        meeting
      });
    }

    // Update meeting (Admin only)
    if (req.method === 'PUT' && meetingId && !action) {
      const updates = req.body;

      const meeting = await AssociationMeeting.findById(meetingId);

      if (!meeting) {
        return res.status(404).json({ message: '找不到會議 / Meeting not found' });
      }

      // If status is being changed to completed or cancelled, delete all absence forms
      if (updates.status && (updates.status === 'completed' || updates.status === 'cancelled')) {
        if (meeting.absences && meeting.absences.length > 0) {
          console.log(`[Meeting Status Update] Deleting ${meeting.absences.length} absence forms for meeting ${meetingId} (status: ${updates.status})`);
          meeting.absences = [];
        }
      }

      // Update allowed fields
      if (updates.agenda) meeting.agenda = updates.agenda;
      if (updates.date) meeting.date = new Date(updates.date);
      if (updates.time) meeting.time = updates.time;
      if (updates.meetingType) meeting.meetingType = updates.meetingType;
      if (updates.location !== undefined) meeting.location = updates.location;
      if (updates.zoomUrl !== undefined) meeting.zoomUrl = updates.zoomUrl;
      if (updates.memberType) meeting.memberType = updates.memberType;
      if (updates.mandatory !== undefined) meeting.mandatory = updates.mandatory;
      if (updates.status) meeting.status = updates.status;

      await meeting.save();

      return res.status(200).json({
        message: '會議更新成功 / Meeting updated successfully',
        meeting
      });
    }

    // Update attendance (Admin only)
    if (req.method === 'PUT' && action === 'attendance') {
      const { meetingId, participantId, attended } = req.body;

      if (!meetingId || !participantId || attended === undefined) {
        return res.status(400).json({ message: '缺少必要欄位 / Missing required fields' });
      }

      const meeting = await AssociationMeeting.findById(meetingId);

      if (!meeting) {
        return res.status(404).json({ message: '找不到會議 / Meeting not found' });
      }

      const participant = meeting.participants.id(participantId);

      if (!participant) {
        return res.status(404).json({ message: '找不到參與者 / Participant not found' });
      }

      participant.attended = attended;
      await meeting.save();

      return res.status(200).json({
        message: '出席狀態更新成功 / Attendance updated successfully',
        meeting
      });
    }

    // Delete meeting (Admin only)
    if (req.method === 'DELETE' && meetingId) {
      const meeting = await AssociationMeeting.findById(meetingId);

      if (!meeting) {
        return res.status(404).json({ message: '找不到會議 / Meeting not found' });
      }

      await AssociationMeeting.findByIdAndDelete(meetingId);

      return res.status(200).json({
        message: '會議已刪除 / Meeting deleted successfully',
        meetingId
      });
    }

    // Submit absence form
    if (req.method === 'POST' && action === 'submit-absence') {
      const { memberId, formImage } = req.body;

      if (!meetingId || !memberId || !formImage) {
        return res.status(400).json({ message: 'Meeting ID, member ID, and form image are required' });
      }

      // Verify the meeting exists and is mandatory
      const meeting = await AssociationMeeting.findById(meetingId);
      if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found' });
      }

      if (!meeting.mandatory) {
        return res.status(400).json({ message: 'This meeting is not mandatory' });
      }

      // Get member info
      const member = await Member.findOne({ memberId });
      if (!member) {
        return res.status(404).json({ message: 'Member not found' });
      }

      // Check if user already submitted an absence request
      const existingAbsence = meeting.absences.find(
        absence => absence.memberIdString === memberId
      );

      if (existingAbsence) {
        return res.status(400).json({
          message: 'You have already submitted an absence request for this meeting'
        });
      }

      // Store absence form in MongoDB
      meeting.absences.push({
        memberId: member._id,
        memberName: member.name,
        memberIdString: member.memberId,
        requestedAt: new Date(),
        formImage: formImage // Base64 encoded image
      });

      await meeting.save();

      return res.status(200).json({
        message: 'Absence request submitted successfully'
      });
    }

    // Approve absence request (Admin only)
    if (req.method === 'POST' && action === 'approve-absence') {
      const { absenceId } = req.body;

      if (!meetingId || !absenceId) {
        return res.status(400).json({ message: 'Meeting ID and absence ID are required' });
      }

      const meeting = await AssociationMeeting.findById(meetingId);
      if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found' });
      }

      const absence = meeting.absences.id(absenceId);
      if (!absence) {
        return res.status(404).json({ message: 'Absence request not found' });
      }

      absence.approved = true;
      absence.approvedAt = new Date();

      await meeting.save();

      return res.status(200).json({
        message: 'Absence request approved successfully',
        absence
      });
    }

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Association meeting error:', error);
    res.status(500).json({ message: '服務器錯誤 / Server error' });
  }
};
