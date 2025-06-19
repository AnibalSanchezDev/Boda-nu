import { useState, useEffect } from 'react';
import './App.css';
import { storage } from './firebaseConfig';
import { ref, uploadBytes, listAll, getDownloadURL } from 'firebase/storage';

function App() {
  const [file, setFile] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchImages = async () => {
    const listRef = ref(storage, 'images/');
    const res = await listAll(listRef);
    const urls = await Promise.all(res.items.map(item => getDownloadURL(item)));
    setImages(urls);
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleUpload = () => {
    if (!file) {
      alert('Please select a file first!');
      return;
    }

    const fileArray = Array.from(file);
    setLoading(true);

    const uploadPromises = fileArray.map(fileItem => {
      const storageRef = ref(storage, `images/${fileItem.name}`);
      return uploadBytes(storageRef, fileItem);
    });

    Promise.all(uploadPromises).then(() => {
      Promise.all(fileArray.map(fileItem => uploadToDrive(fileItem)))
      .then(() => {
        alert('All files uploaded successfully to Firebase and Google Drive!');
        fetchImages();
        setLoading(false);
      })
      .catch((error) => {
        alert('Error uploading files to Google Drive!');
        setLoading(false);
      });
  }).catch((error) => {
    alert('Error uploading files to Firebase!');
    setLoading(false);
  });
};

  const uploadToDrive = async (fileItem) => {
    const formData = new FormData();
    formData.append('file', fileItem);
  
    try {
      const res = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      console.log('Imagen subida a Google Drive. ID:', data.fileId);
    } catch (error) {
      console.error('Error subiendo a Drive:', error);
    }
  };

  return (
    <>
      <p>Boda Nuria Y Jorge</p>
      <div>
        <input type="file" onChange={(e) => setFile(e.target.files)} multiple />
        <button onClick={handleUpload}>Subir fotos</button>
        <button
    onClick={() => window.open('https://drive.google.com/drive/folders/1VtAO0H7nAbPM_NxxIvt54PYEFFC8NbXL?usp=sharing', '_blank')}
    style={{ marginLeft: '10px' }}
  >
    Drive con las fotos
  </button>
      </div>

      {loading && (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      )}

      <div className="gallery-container">
        {images.map((url, index) => (
         <div
         key={index}
         className="gallery-item"
       >
       
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
