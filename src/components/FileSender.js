import { useState } from 'react';
import Modal from './Modal';
import RichTextEditor from './RichTextEditor';
import Toast from './Toast';
import '../styles/FileSender.css';
import Button from './buttons/Button';
import { authFetch } from '../services/FetchAuth';

export default function FileSender({ offices, onClose, onSendComplete }) {
  // States for form input fields
  const [title, setTitle] = useState('');           // Document title
  const [file, setFile] = useState(null);           // File to be uploaded (if mode is 'upload')
  const [message, setMessage] = useState('');       // Optional message to accompany the file
  const [selectedOffices, setSelectedOffices] = useState([]); // List of selected office IDs
  const [mode, setMode] = useState(null);           // 'new' for creating a file, 'upload' for uploading
  const [content, setContent] = useState('');       // Document body text if mode is 'new'
  const [toast, setToast] = useState(null);         // Toast notification { message, type }

  /**
   * Handles submission of the file to the backend API.
   * Validates fields, constructs a FormData object,
   * and sends a POST request with proper headers.
   */
  const handleSend = async () => {
    // Basic validation for required fields
    if (!title || selectedOffices.length === 0 || (mode === 'new' && !content) || (mode === 'upload' && !file)) {
      setToast({ message: 'Please fill out all required fields.', type: 'error' });
      return;
    }

    // Construct the form data for submission (multipart/form-data)
    const formData = new FormData();
    formData.append('document_title', title);
    formData.append('message', message);
    selectedOffices.forEach(id => formData.append('offices', id)); // add each selected office ID

    // Add file — either uploaded file or generated from content
    if (mode === 'upload') {
      formData.append('file', file);
    } else {
      // If creating new content, convert it to a text file Blob
      const blob = new Blob([content], { type: 'text/plain' });
      const filename = `${title.replace(/\s+/g, '_')}.txt`;
      formData.append('file', blob, filename);
    }

    try {
      // Send POST request to your Django API
      const response = await authFetch(`${process.env.REACT_APP_API_URL}/filesharing/documents/send/`, {
        method: 'POST',
        body: formData
      });

      // Handle API response
      if (response.ok) {
        const data = await response.json();
        setToast({ message: 'File sent successfully!', type: 'success' });
        console.log('file sent successfully');
        onSendComplete(data);       // Notify parent about the successful submission
        setTimeout(onClose, 1500);  // Close the modal after a short delay
      } else {
        const errorData = await response.json();
        console.error('Upload failed:', errorData);
        setToast({ message: 'Failed to send document.', type: 'error' });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setToast({ message: 'An error occurred while sending the file.', type: 'error' });
    }
  };

  /**
   * Toggles selection of an office.
   * Adds or removes the office ID from selectedOffices state.
   */
  const toggleOffice = (id) => {
    setSelectedOffices(prev =>
      prev.includes(id) ? prev.filter(officeId => officeId !== id) : [...prev, id]
    );
  };

  return (
    <>
      {/* Toast notification component */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={5000}
        />
      )}

      {/* File sending modal */}
      <Modal onClose={onClose}>
        {/* Step 1: Choose sending mode (upload vs create new) */}
        {!mode ? (
          <div className="mode-selection">
            <h2 className="modal-title">Send New File</h2>
            <p className="modal-subtitle">Choose how you'd like to create your file</p>

            {/* Option buttons for mode selection */}
            <div className="mode-options">
              <button className="mode-card" onClick={() => setMode('new')}>
                <div className="mode-icon">📝</div>
                <h3>Create New File</h3>
                <p>Start with a blank document and compose your content</p>
              </button>
              <button className="mode-card" onClick={() => setMode('upload')}>
                <div className="mode-icon">📁</div>
                <h3>Upload File</h3>
                <p>Select an existing file from your device</p>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Step 2: Form to upload or create file */}
            <div className="send-form">
              <h2 className="modal-title">
                {mode === 'new' ? 'Create & Send Document' : 'Upload & Send File'}
              </h2>

              {/* Title input */}
              <div className="form-group">
                <label className="form-label">
                  Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter file title"
                />
              </div>

              {/* File upload area (if upload mode) */}
              {mode === 'upload' ? (
                <div className="form-group">
                  <label className="form-label">
                    Select File <span className="required">*</span>
                  </label>
                  <div className="file-upload-area">
                    <input
                      type="file"
                      id="file-upload"
                      className="file-input"
                      onChange={(e) => setFile(e.target.files[0])}
                    />
                    <label htmlFor="file-upload" className="file-upload-label">
                      {file ? (
                        <>
                          <span className="file-name">{file.name}</span>
                          <span className="file-size">({(file.size / (1024 * 1024)).toFixed(1)} MB)</span>
                        </>
                      ) : (
                        <>
                          {/* Upload icon + text */}
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                            <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M17 8L12 3M12 3L7 8M12 3V15" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>Click to browse or drag & drop</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              ) : (
                // Rich text editor (if creating new file)
                <div className="form-group">
                  <label className="form-label">
                    Document Content <span className="required">*</span>
                  </label>
                  <RichTextEditor content={content} setContent={setContent} />
                </div>
              )}

              {/* Optional message textarea */}
              <div className="form-group">
                <label className="form-label">Optional Message</label>
                <textarea
                  className="form-textarea"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a message for recipients..."
                  rows="3"
                />
              </div>

              {/* Office selection checkboxes */}
              <div className="form-group">
                <label className="form-label">
                  Select Offices <span className="required">*</span>
                </label>
                <div className="office-selection">
                  {offices.map(office => (
                    <div key={office.id} className="office-option">
                      <input
                        type="checkbox"
                        id={`office-${office.id}`}
                        checked={selectedOffices.includes(office.id)}
                        onChange={() => toggleOffice(office.id)}
                        className="office-checkbox"
                      />
                      <label htmlFor={`office-${office.id}`} className="office-label">
                        {office.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="form-actions">
                <Button
                  onClick={handleSend}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  }
                  className="send-button"
                  value="Send File"
                />
                <Button onClick={onClose} className="cancel-button" value="Cancel" />
              </div>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
