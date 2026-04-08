const connectDB = require('../lib/mongodb');
const { Member } = require('../db/models');
const googleSheets = require('../lib/googleSheets');

module.exports = async (req, res) => {
  try {
    await connectDB();

    // POST /api/sheets-sync - Sync all members to Google Sheets
    if (req.method === 'POST') {
      console.log('[Sheets Sync] Starting bulk sync...');

      // Fetch all members with referredBy populated
      const members = await Member.find({}).populate('referredBy', 'memberId').lean();

      console.log(`[Sheets Sync] Found ${members.length} members to sync`);

      // Sync to Google Sheets
      const result = await googleSheets.syncAllMembers(members);

      return res.status(200).json({
        message: `成功同步 ${result.count} 位會員 / Successfully synced ${result.count} members`,
        count: result.count
      });
    }

    // GET /api/sheets-sync - Check sync status
    if (req.method === 'GET') {
      const memberCount = await Member.countDocuments({});

      return res.status(200).json({
        message: 'Google Sheets sync service is ready',
        totalMembers: memberCount,
        configured: !!process.env.GOOGLE_SHEET_ID
      });
    }

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('[Sheets Sync] Error:', error);
    res.status(500).json({
      message: '同步失敗 / Sync failed',
      error: error.message
    });
  }
};
