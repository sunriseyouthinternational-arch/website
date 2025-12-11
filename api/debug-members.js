const connectDB = require('../lib/mongodb');
const { Member } = require('../db/models');

/**
 * Debug endpoint to view all members and their LINE/registration status
 * GET /api/debug-members
 */
module.exports = async (req, res) => {
  try {
    await connectDB();

    // Get all members
    const allMembers = await Member.find({}).select('memberId name registrationCompleted line.userId line.displayName createdAt').lean();

    // Count different statuses
    const stats = {
      total: allMembers.length,
      withLineAccounts: allMembers.filter(m => m.line?.userId).length,
      registrationCompleted: allMembers.filter(m => m.registrationCompleted).length,
      withLineAndCompleted: allMembers.filter(m => m.line?.userId && m.registrationCompleted).length,
      withLineButNotCompleted: allMembers.filter(m => m.line?.userId && !m.registrationCompleted).length,
      noLineAccount: allMembers.filter(m => !m.line?.userId).length
    };

    // Group members by status
    const membersByStatus = {
      readyForRichMenu: allMembers.filter(m => m.line?.userId && m.registrationCompleted),
      hasLineButNotCompleted: allMembers.filter(m => m.line?.userId && !m.registrationCompleted),
      noLineAccount: allMembers.filter(m => !m.line?.userId)
    };

    return res.status(200).json({
      success: true,
      stats,
      membersByStatus,
      allMembers: allMembers.map(m => ({
        memberId: m.memberId,
        name: m.name || 'Not set',
        hasLineAccount: !!m.line?.userId,
        lineUserId: m.line?.userId || null,
        lineDisplayName: m.line?.displayName || null,
        registrationCompleted: m.registrationCompleted || false,
        createdAt: m.createdAt
      }))
    });

  } catch (error) {
    console.error('Debug members error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching members',
      error: error.message
    });
  }
};
