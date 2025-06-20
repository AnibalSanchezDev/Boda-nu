import { useState, useEffect } from 'react';
import './App.css';
import { storage } from './firebaseConfig';
import { ref, uploadBytes, listAll, getDownloadURL } from 'firebase/storage';

function App() {
  const [file, setFile] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchImages = async () => {
    try {
      const listRef = ref(storage, 'images/');
      const res = await listAll(listRef);
      const urls = await Promise.all(res.items.map(item => getDownloadURL(item)));
      setImages(urls);
    } catch (error) {
      console.error("Error fetching images from Firebase Storage:", error);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleUpload = async () => { // Usar async/await para mejor control
    if (!file || file.length === 0) {
      alert('Please select files first!');
      return;
    }

    setLoading(true);
    const fileArray = Array.from(file);
    const successfulUploads = [];
    const failedUploads = [];

    for (const fileItem of fileArray) {
      try {
        // Subir a Firebase Storage
        const storageRef = ref(storage, `images/${fileItem.name}`);
        await uploadBytes(storageRef, fileItem);
        console.log(`Uploaded ${fileItem.name} to Firebase Storage.`);

        // Subir a Google Drive
        await uploadToDrive(fileItem);
        console.log(`Uploaded ${fileItem.name} to Google Drive.`);
        successfulUploads.push(fileItem.name);

      } catch (error) {
        console.error(`Error uploading ${fileItem.name}:`, error);
        failedUploads.push(fileItem.name);
      }
    }

    setLoading(false);

    if (successfulUploads.length > 0) {
      alert(`Successfully uploaded ${successfulUploads.length} files: ${successfulUploads.join(', ')}`);
    }
    if (failedUploads.length > 0) {
      alert(`Failed to upload ${failedUploads.length} files: ${failedUploads.join(', ')}. Check console for details.`);
    }

    fetchImages(); // Actualizar la lista de imágenes después de las subidas
  };

  const uploadToDrive = async (fileItem) => {
    const formData = new FormData();
    formData.append('image', fileItem, fileItem.name); // Asegúrate que 'image' coincide con upload.single('image')
    console.log('Enviando archivo a Drive:', fileItem.name);

    try {
      const res = await fetch('https://us-central1-piso-3f93b.cloudfunctions.net/api/upload', {
        method: 'POST',
        body: formData,
        // No Content-Type header needed for FormData; fetch sets it automatically
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status} - ${errText}`);
      }
      const data = await res.json();
      console.log('Imagen subida a Google Drive. ID:', data.fileId);
    } catch (error) {
      console.error('Error subiendo a Drive:', error);
      throw error; // Re-throw para que handleUpload pueda capturarlo
    }
  };

  return (
    <>
      <p>Boda Nuria Y</p>
      <div>
        <input type="file" onChange={(e) => setFile(e.target.files)} multiple />
        <button onClick={handleUpload} disabled={loading}>
          {loading ? 'Subiendo...' : 'Subir fotos'}
        </button>
        <button
          onClick={() => window.open('https://drive.google.com/drive/folders/1VtAO0H7nAbPM_NxxIvt54PYEFFC8NbXL?usp=sharing', '_blank')}
          style={{ marginLeft: '10px' }}
        >
          DRIVE
        </button>
      </div>

      {loading && (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      )}

      <div className="gallery-container">
        {images.map((url, index) => (
          <div key={index} className="gallery-item">
            <img
              src={url}
              alt={`Uploaded ${index}`}
              className="gallery-image"
            />
          </div>
        ))}
      </div>
    </>
  );
}

export default App;