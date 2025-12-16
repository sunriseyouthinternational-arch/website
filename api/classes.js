const connectDB = require('../lib/mongodb');
const { Class, ClassInfo, Member } = require('../db/models');
const lineClient = require('../lib/lineClient');

module.exports = async (req, res) => {
  const { id, action } = req.query;

  try {
    await connectDB();

    // Enroll in class
    if (action === 'enroll' && req.method === 'POST') {
      const { memberId } = req.body;

      const classItem = await Class.findById(id).populate('classInfoId').populate('teacherId');
      const member = await Member.findOne({ memberId });

      if (!classItem) {
        return res.status(404).json({ message: '找不到課程 / Class not found' });
      }

      if (!member) {
        return res.status(404).json({ message: '找不到團員 / Member not found' });
      }

      if (classItem.currentParticipants >= classItem.classInfoId.maxParticipants) {
        return res.status(400).json({ message: '課程已滿 / Class is full' });
      }

      const alreadyEnrolled = classItem.participants.some(
        p => p.memberId.toString() === member._id.toString()
      );

      if (alreadyEnrolled) {
        return res.status(400).json({ message: '已經報名此課程 / Already enrolled in this class' });
      }

      classItem.participants.push({
        memberId: member._id,
        memberName: member.name,
        paid: false
      });

      await classItem.save();

      member.enrollments.push({
        type: 'class',
        itemId: classItem._id,
        itemName: classItem.classInfoId.name,
        paid: false
      });

      await member.save();

      return res.status(200).json({
        message: '報名成功！請記得於課程現場繳費。 / Enrollment successful! Please remember to pay at the venue.',
        class: classItem
      });
    }

    // List all classes or create new
    if (!id) {
      if (req.method === 'GET') {
        const classes = await Class.find({ status: 'active' })
          .populate('classInfoId')
          .populate('teacherId')
          .sort({ createdAt: -1 });
        return res.status(200).json({ classes });
      }

      if (req.method === 'POST') {
        const { classInfoId, teacherId, teacher, time, date, location, announceOnLine } = req.body;

        // Verify classInfo exists
        const classInfo = await ClassInfo.findById(classInfoId);
        if (!classInfo) {
          return res.status(404).json({ message: '找不到課程資訊 / Class info not found' });
        }

        const classItem = new Class({
          classInfoId,
          teacherId: teacherId || null,
          teacher,
          time,
          date: new Date(date),
          location: location || '',
          announceOnLine: announceOnLine || false
        });

        await classItem.save();

        // Send LINE announcement if requested
        if (announceOnLine && !classItem.lineAnnouncementSent) {
          try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 'https://sunriseyouth.org';
            const classDetailsUrl = `${apiUrl}/profile?tab=courses&classId=${classItem._id}`;

            const formattedDate = new Date(date).toLocaleDateString('zh-TW', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            });

            const message = {
              type: 'flex',
              altText: `新課程：${classInfo.name}`,
              contents: {
                type: 'bubble',
                hero: classInfo.banner ? {
                  type: 'image',
                  url: classInfo.banner.startsWith('data:') ? `${apiUrl}/default-class-banner.jpg` : `${apiUrl}${classInfo.banner}`,
                  size: 'full',
                  aspectRatio: '5:3',
                  aspectMode: 'cover'
                } : undefined,
                body: {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'text',
                      text: '新課程通知',
                      weight: 'bold',
                      size: 'xl',
                      color: '#667eea'
                    },
                    {
                      type: 'text',
                      text: classInfo.name,
                      weight: 'bold',
                      size: 'xxl',
                      margin: 'md'
                    },
                    {
                      type: 'text',
                      text: classInfo.description,
                      size: 'sm',
                      color: '#666666',
                      margin: 'md',
                      wrap: true
                    },
                    {
                      type: 'separator',
                      margin: 'xl'
                    },
                    {
                      type: 'box',
                      layout: 'vertical',
                      margin: 'lg',
                      spacing: 'sm',
                      contents: [
                        {
                          type: 'box',
                          layout: 'baseline',
                          spacing: 'sm',
                          contents: [
                            {
                              type: 'text',
                              text: '日期',
                              color: '#aaaaaa',
                              size: 'sm',
                              flex: 1
                            },
                            {
                              type: 'text',
                              text: formattedDate,
                              wrap: true,
                              color: '#666666',
                              size: 'sm',
                              flex: 4
                            }
                          ]
                        },
                        {
                          type: 'box',
                          layout: 'baseline',
                          spacing: 'sm',
                          contents: [
                            {
                              type: 'text',
                              text: '時間',
                              color: '#aaaaaa',
                              size: 'sm',
                              flex: 1
                            },
                            {
                              type: 'text',
                              text: time,
                              wrap: true,
                              color: '#666666',
                              size: 'sm',
                              flex: 4
                            }
                          ]
                        },
                        {
                          type: 'box',
                          layout: 'baseline',
                          spacing: 'sm',
                          contents: [
                            {
                              type: 'text',
                              text: '教師',
                              color: '#aaaaaa',
                              size: 'sm',
                              flex: 1
                            },
                            {
                              type: 'text',
                              text: teacher,
                              wrap: true,
                              color: '#666666',
                              size: 'sm',
                              flex: 4
                            }
                          ]
                        },
                        location ? {
                          type: 'box',
                          layout: 'baseline',
                          spacing: 'sm',
                          contents: [
                            {
                              type: 'text',
                              text: '地點',
                              color: '#aaaaaa',
                              size: 'sm',
                              flex: 1
                            },
                            {
                              type: 'text',
                              text: location,
                              wrap: true,
                              color: '#666666',
                              size: 'sm',
                              flex: 4
                            }
                          ]
                        } : null,
                        {
                          type: 'box',
                          layout: 'baseline',
                          spacing: 'sm',
                          contents: [
                            {
                              type: 'text',
                              text: '費用',
                              color: '#aaaaaa',
                              size: 'sm',
                              flex: 1
                            },
                            {
                              type: 'text',
                              text: `NT$ ${classInfo.cost}`,
                              wrap: true,
                              color: '#666666',
                              size: 'sm',
                              flex: 4
                            }
                          ]
                        }
                      ].filter(Boolean)
                    }
                  ]
                },
                footer: {
                  type: 'box',
                  layout: 'vertical',
                  spacing: 'sm',
                  contents: [
                    {
                      type: 'button',
                      style: 'primary',
                      height: 'sm',
                      action: {
                        type: 'uri',
                        label: '查看詳情並報名',
                        uri: classDetailsUrl
                      }
                    }
                  ],
                  flex: 0
                }
              }
            };

            await lineClient.broadcast(message);
            classItem.lineAnnouncementSent = true;
            await classItem.save();
          } catch (lineError) {
            console.error('LINE announcement error:', lineError);
            // Don't fail the class creation if LINE announcement fails
          }
        }

        return res.status(201).json({
          message: '課程創建成功 / Class created successfully',
          class: classItem
        });
      }
    }

    // Get/Update/Delete specific class
    if (id) {
      if (req.method === 'GET') {
        const classItem = await Class.findById(id).populate('classInfoId').populate('teacherId');

        if (!classItem) {
          return res.status(404).json({ message: '找不到課程 / Class not found' });
        }

        return res.status(200).json({ class: classItem });
      }

      if (req.method === 'PUT') {
        const classItem = await Class.findByIdAndUpdate(id, req.body, { new: true });

        if (!classItem) {
          return res.status(404).json({ message: '找不到課程 / Class not found' });
        }

        return res.status(200).json({
          message: '課程更新成功 / Class updated successfully',
          class: classItem
        });
      }

      if (req.method === 'DELETE') {
        const classItem = await Class.findByIdAndDelete(id);

        if (!classItem) {
          return res.status(404).json({ message: '找不到課程 / Class not found' });
        }

        // Update enrollment status for all participants
        await Member.updateMany(
          { 'enrollments.itemId': id },
          { $set: { 'enrollments.$[elem].status': 'cancelled' } },
          { arrayFilters: [{ 'elem.itemId': id }] }
        );

        return res.status(200).json({ message: '課程刪除成功 / Class deleted successfully' });
      }
    }

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Class operation error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: '服務器錯誤 / Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
