// test-sheets.js
const { google } = require('googleapis');
const path = require('path');

async function test() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'google-credentials.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
  });

  const client = await auth.getClient();
  console.log('Service account email:', client.email);

  const sheets = google.sheets({ version: 'v4', auth });
  try {
    const res = await sheets.spreadsheets.create({
      resource: { properties: { title: 'Test Sheet' } },
      fields: 'spreadsheetId,spreadsheetUrl',
    });
    console.log('SUCCESS:', res.data);
  } catch (err) {
    console.error('FULL ERROR:', JSON.stringify(err.response?.data, null, 2));
  }
}
test();