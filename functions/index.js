const functions = require('firebase-functions');
const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const busboy = require('busboy');

// =============================================================================
// HELPER FUNCTIONS (Defined at the top for clarity)
// =============================================================================

/**
 * Loads local credentials from credenciales.json for local development.
 */
function loadLocalCredentials() {
  try {
    const credPath = path.join(__dirname, 'credenciales.json');
    if (fs.existsSync(credPath)) {
      console.log('Loading local credentials from credenciales.json...');
      const content = fs.readFileSync(credPath, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('Could not load local credentials. This is normal if not running locally.', err.message);
  }
  return null;
}


// =============================================================================
// EXPRESS APP SETUP
// =============================================================================

const app = express();
app.use(cors({ origin: true })); // Use cors with origin:true for Firebase

// =============================================================================
// API ROUTES
// =============================================================================

// IMPORTANT: The file upload route comes BEFORE any general JSON body parser.
app.post('/upload', (req, res) => {
  const bb = busboy({ headers: req.headers });

  // This will hold our credentials and auth client
  let auth;
  try {
    const localCreds = loadLocalCredentials();
    let credentials;
    if (localCreds) {
      credentials = localCreds;
    } else {
      const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
      if (!process.env.GOOGLE_CLIENT_EMAIL || !privateKey) {
        throw new Error('Server credentials are not configured.');
      }
      credentials = {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      };
    }
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
  } catch (error) {
    console.error("Authentication setup failed:", error);
    return res.status(500).send('Server authentication failed.');
  }

  bb.on('file', async (name, file, info) => {
    // We only care about the file field named 'image'
    if (name !== 'image') {
      // Drain the stream for any other file fields to prevent the request from hanging
      file.resume();
      return;
    }

    const { filename, mimeType } = info;
    console.log(`Streaming file to Google Drive: ${filename}`);

    try {
      const driveService = google.drive({ version: 'v3', auth: await auth.getClient() });
      const fileMetadata = {
        name: filename,
        parents: ['1VtAO0H7nAbPM_NxxIvt54PYEFFC8NbXL'],
      };
      const media = {
        mimeType: mimeType,
        body: file, // CRUCIAL: We are now passing the live stream 'file' directly
      };

      const response = await driveService.files.create({
        resource: fileMetadata,
        media,
        fields: 'id',
      });
      
      await driveService.permissions.create({
        fileId: response.data.id,
        requestBody: { role: 'reader', type: 'anyone' },
      });

      console.log('Successfully streamed file to Google Drive. File ID:', response.data.id);
      // It's important to send the response here, once this specific file is done
      if (!res.headersSent) {
          res.status(200).json({ fileId: response.data.id });
      }

    } catch (error) {
      console.error('Error during Google Drive upload stream:', error);
       if (!res.headersSent) {
          res.status(500).send('An error occurred during the final upload step.');
       }
    }
  });
  
  // End the request by piping the raw body to busboy.
  if (req.rawBody) {
    bb.end(req.rawBody);
  } else {
    req.pipe(bb);
  }
});
// Example of another route that could use the JSON parser
app.get('/hello', (req, res) => {
    res.status(200).json({ message: "Hello World!" });
});


// =============================================================================
// FIREBASE EXPORTS
// =============================================================================


exports.api = functions.https.onRequest(app);