import { useState } from 'react';
import '../styles/FileUpload.css';

export default function FileUpload({ onFileReady, onBack }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = () => {
    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    onFileReady({
      name: file.name,
      type: file.name.split('.').pop(),
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      message,
      isUploaded: true,
      file // The actual File object
    });
  };

  return (
    <div className="upload-container">
      <h2>Upload File</h2>
      
      <div className="form-group">
        <label>Select File:</label>
        <div className="file-input-container">
          <label className="file-input-label">
            {file ? file.name : 'Choose a file...'}
            <input
              type="file"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
          {file && (
            <button 
              className="clear-file-button"
              onClick={() => setFile(null)}
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="form-group">
        <label>Optional Message:</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a message (optional)"
          rows={3}
        />
      </div>

      <div className="action-buttons">
        <button className="secondary-button" onClick={onBack}>
          ← Back
        </button>
        <button 
          className="primary-button" 
          onClick={handleSubmit}
          disabled={!file}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}