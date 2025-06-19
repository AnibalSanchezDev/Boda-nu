const { google } = require('googleapis');
const path = require('path');

async function listFiles() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'credenciales.json'),
    scopes: ['https://www.googleapis.com/auth/drive.metadata.readonly'],
  });

  const drive = google.drive({ version: 'v3', auth: await auth.getClient() });

  const FOLDER_ID = '1VtAO0H7nAbPM_NxxIvt54PYEFFC8NbXL';

  const res = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and trashed = false`,
    pageSize: 10,
    fields: 'files(id, name)',
  });

  console.log('Archivos:', res.data.files);
}

listFiles().catch(console.error);
