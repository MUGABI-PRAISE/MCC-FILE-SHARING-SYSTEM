import { useState } from 'react';
import '../styles/ComposeFile.css';

export default function ComposeFile({ onFileReady, onBack }) {
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('txt');

  const handleSubmit = () => {
    if (!fileName.trim()) {
      alert('Please enter a file name');
      return;
    }

    onFileReady({
      name: fileName,
      type: fileType,
      content,
      size: `${(content.length / 1024).toFixed(2)} KB`,
      isUploaded: false
    });
  };

  return (
    <div className="compose-container">
      <h2>Compose New File</h2>
      
      <div className="form-group">
        <label>File Name:</label>
        <input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          placeholder="Enter file name"
        />
      </div>

      <div className="form-group">
        <label>File Type:</label>
        <select value={fileType} onChange={(e) => setFileType(e.target.value)}>
          <option value="txt">Text File (.txt)</option>
          <option value="md">Markdown (.md)</option>
          <option value="html">HTML (.html)</option>
        </select>
      </div>

      <div className="form-group">
        <label>Content:</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your content here..."
          rows={10}
        />
      </div>

      <div className="action-buttons">
        <button className="secondary-button" onClick={onBack}>
          ← Back
        </button>
        <button className="primary-button" onClick={handleSubmit}>
          Continue →
        </button>
      </div>
    </div>
  );
}