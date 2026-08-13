// utils/googleSheets.js
const { google } = require('googleapis');

const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);

oAuth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
const drive = google.drive({ version: 'v3', auth: oAuth2Client });

/**
 * Creates a new Google Sheet for a refund cycle.
 * Columns: Name | Roll Number | Email | Bank Name | Account Holder Name | Account Number | IFSC Code | Branch Name | Submitted At
 */
async function createRefundSheet(title, adminEmail = null) {
    try {
        const resource = {
            properties: { title },
            sheets: [
                {
                    properties: {
                        title: 'Refund Submissions',
                        gridProperties: { frozenRowCount: 1 },
                    },
                },
            ],
        };

        const response = await sheets.spreadsheets.create({
            resource,
            fields: 'spreadsheetId,spreadsheetUrl',
        });

        const spreadsheetId = response.data.spreadsheetId;
        const spreadsheetUrl = response.data.spreadsheetUrl;

        // Header row — now includes Bank Name and Branch Name
        const headers = [[
            'Student Name',
            'Roll Number',
            'Email',
            'Bank Name',
            'Account Holder Name',
            'Account Number',
            'IFSC Code',
            'Branch Name',
            'Submitted At',
        ]];

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Refund Submissions!A1:I1',
            valueInputOption: 'USER_ENTERED',
            resource: { values: headers },
        });

        if (adminEmail) {
            try {
                await drive.permissions.create({
                    fileId: spreadsheetId,
                    requestBody: {
                        role: 'writer',
                        type: 'user',
                        emailAddress: adminEmail,
                    },
                });
            } catch (shareErr) {
                console.error('Warning: failed to share sheet with admin email:', shareErr.response?.data?.error || shareErr.message);
            }
        }

        return { spreadsheetId, spreadsheetUrl };
    } catch (error) {
        console.error('Error creating Google Sheet:', error.response?.data?.error || error.message);
        throw error;
    }
}

/**
 * Appends a student submission row to the sheet.
 */
async function appendRefundToSheet(spreadsheetId, studentData) {
    try {
        const values = [[
            studentData.name,
            studentData.roll_number,
            studentData.email,
            studentData.bank_name,
            studentData.account_holder_name,
            `'${studentData.account_number}`, // leading ' forces text format in Sheets
            studentData.ifsc_code,
            studentData.branch_name,
            new Date(studentData.updated_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        ]];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Refund Submissions!A:I',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: { values },
        });
    } catch (error) {
        console.error('Error appending row to Google Sheet:', error.response?.data?.error || error.message);
        // Silently swallow — DB submission must not fail because of a Sheets error
    }
}

module.exports = { createRefundSheet, appendRefundToSheet };