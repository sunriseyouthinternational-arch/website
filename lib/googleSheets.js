const { google } = require('googleapis');
const path = require('path');

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID;
    this.sheetName = 'Sheet1';
  }

  async authenticate() {
    try {
      // Use service account credentials from environment or file
      let credentials;

      if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        // Parse from environment variable (for production)
        credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      } else if (process.env.GOOGLE_SERVICE_ACCOUNT_PATH) {
        // Load from file path
        credentials = require(path.resolve(process.env.GOOGLE_SERVICE_ACCOUNT_PATH));
      } else {
        throw new Error('Google service account credentials not configured');
      }

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      return true;
    } catch (error) {
      console.error('[GoogleSheets] Authentication error:', error.message);
      throw error;
    }
  }

  async ensureSheetExists() {
    if (!this.sheets) await this.authenticate();

    try {
      // Get spreadsheet metadata
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      const sheetExists = response.data.sheets.some(
        sheet => sheet.properties.title === this.sheetName
      );

      if (!sheetExists) {
        // Create the sheet
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            requests: [{
              addSheet: {
                properties: {
                  title: this.sheetName
                }
              }
            }]
          }
        });
        console.log(`[GoogleSheets] Created sheet: ${this.sheetName}`);
      }

      // Ensure headers exist
      await this.ensureHeaders();
    } catch (error) {
      console.error('[GoogleSheets] Error ensuring sheet exists:', error.message);
      throw error;
    }
  }

  async ensureHeaders() {
    const headers = [
      'Member ID',
      'Name',
      'English Alias',
      'Gender',
      'Birth Date',
      'Phone',
      'Mobile',
      'LINE ID',
      'LINE User ID',
      'LINE Display Name',
      'Registration Completed',
      'Referral Code',
      'Referred By',
      'Points',
      'Membership Status',
      'Membership Start Date',
      'Membership Upgraded Date',
      'Payment Status',
      'Payment Method',
      'Role',
      'Family Members Count',
      'Coupons Count',
      'Enrollments Count',
      'Created At',
      'Updated At'
    ];

    try {
      // Check if headers exist
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A1:Y1`
      });

      if (!response.data.values || response.data.values.length === 0) {
        // Write headers
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A1`,
          valueInputOption: 'RAW',
          resource: {
            values: [headers]
          }
        });
        console.log('[GoogleSheets] Headers created');
      }
    } catch (error) {
      console.error('[GoogleSheets] Error ensuring headers:', error.message);
      throw error;
    }
  }

  formatMemberRow(member) {
    // Format member data into row array matching headers
    return [
      member.memberId || '',
      member.name || '',
      member.englishAlias || '',
      member.gender || '',
      member.birthDate ? new Date(member.birthDate).toISOString().split('T')[0] : '',
      member.contact?.phone || '',
      member.contact?.mobile || '',
      member.contact?.lineId || '',
      member.line?.userId || '',
      member.line?.displayName || '',
      member.registrationCompleted ? 'Yes' : 'No',
      member.referralCode || '',
      member.referredBy?.memberId || member.referredBy || '',
      member.points || 0,
      member.membershipStatus || '',
      member.membershipStartDate ? new Date(member.membershipStartDate).toISOString().split('T')[0] : '',
      member.membershipUpgradedDate ? new Date(member.membershipUpgradedDate).toISOString().split('T')[0] : '',
      member.membershipPaymentStatus || '',
      member.membershipPaymentMethod || '',
      member.role || '',
      member.familyMembers?.length || 0,
      member.coupons?.length || 0,
      member.enrollments?.length || 0,
      member.createdAt ? new Date(member.createdAt).toISOString() : '',
      member.updatedAt ? new Date(member.updatedAt).toISOString() : ''
    ];
  }

  async findMemberRow(memberId) {
    if (!this.sheets) await this.authenticate();

    try {
      // Get all member IDs from column A
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:A`
      });

      const values = response.data.values || [];

      // Find row index (skip header row)
      for (let i = 1; i < values.length; i++) {
        if (values[i][0] === memberId) {
          return i + 1; // Return 1-based row number
        }
      }

      return null;
    } catch (error) {
      console.error('[GoogleSheets] Error finding member row:', error.message);
      return null;
    }
  }

  async syncMember(member) {
    if (!this.spreadsheetId) {
      console.log('[GoogleSheets] Spreadsheet ID not configured, skipping sync');
      return;
    }

    try {
      await this.ensureSheetExists();

      const row = this.formatMemberRow(member);
      const existingRow = await this.findMemberRow(member.memberId);

      if (existingRow) {
        // Update existing row
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A${existingRow}`,
          valueInputOption: 'RAW',
          resource: {
            values: [row]
          }
        });
        console.log(`[GoogleSheets] Updated member ${member.memberId} at row ${existingRow}`);
      } else {
        // Append new row
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A:A`,
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          resource: {
            values: [row]
          }
        });
        console.log(`[GoogleSheets] Added new member ${member.memberId}`);
      }
    } catch (error) {
      console.error(`[GoogleSheets] Error syncing member ${member.memberId}:`, error.message);
      // Don't throw - we don't want to break the main operation if sheets sync fails
    }
  }

  async syncAllMembers(members) {
    if (!this.spreadsheetId) {
      throw new Error('Spreadsheet ID not configured');
    }

    try {
      await this.ensureSheetExists();

      // Format all members
      const rows = members.map(member => this.formatMemberRow(member));

      // Clear existing data (keep headers)
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A2:Y`
      });

      // Write all data at once
      if (rows.length > 0) {
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A2`,
          valueInputOption: 'RAW',
          resource: {
            values: rows
          }
        });
      }

      console.log(`[GoogleSheets] Synced ${members.length} members`);
      return { success: true, count: members.length };
    } catch (error) {
      console.error('[GoogleSheets] Error syncing all members:', error.message);
      throw error;
    }
  }
}

module.exports = new GoogleSheetsService();
