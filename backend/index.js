// backend/index.js
const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

const corsOptions = {
  origin: 'https://piso-3f93b.web.app', // o '*'
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Configuración de Google Drive
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'credenciales.json'), // Pega aquí tu archivo de credenciales
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

app.post('/upload', upload.single('image'), async (req, res) => {
    try {
      const driveService = google.drive({ version: 'v3', auth: await auth.getClient() });
  
      const fileMetadata = {
        name: req.file.originalname,
        parents: ['1VtAO0H7nAbPM_NxxIvt54PYEFFC8NbXL'],  // Asigna el archivo a la carpeta raíz visible
      };
      const media = {
        mimeType: req.file.mimetype,
        body: fs.createReadStream(req.file.path),
      };
  
      const response = await driveService.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, parents',
      });
  
      // Hacer archivo público
      await driveService.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
  
      // Elimina archivo temporal
      fs.unlinkSync(req.file.path);
  
      res.status(200).json({ fileId: response.data.id });
    } catch (error) {
      console.error('Error al subir a Google Drive:', error);
      res.status(500).send('Error al subir la imagen');
    }
  });
  

app.listen(3001, () => {
  console.log('Servidor escuchando en http://localhost:3001');
});
