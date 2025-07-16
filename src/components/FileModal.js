import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import '../styles/FileModal.css';
import { authFetch } from '../services/FetchAuth';

export default function FileModal({ file, onClose, onDeleteSuccess, onFileRead }) {
  const [showFullMessage, setShowFullMessage] = useState(false);
  const isPDF = file.type === 'pdf';
  const isText = file.type === 'txt';
  const fileUrl = file.fileUrl;

  // Mark file as read when modal opens
  useEffect(() => {
    const markAsRead = async () => {
      if (file.sharedBy && file.isNew) {
        try {
          const response = await authFetch(`http://localhost:8000/filesharing/documents/markasread/${file.id}/`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Failed to mark file as read: ${response.status} - ${errorText}`);
            return;        
          } else {
            console.log(`file ${file.id} has been marked read`);
            if (onFileRead) {
              onFileRead(file.id);
            }
          }
        } catch (error) {
          console.error('❌ Error marking file as read:', error);
        }
      }
    };
    markAsRead();
  }, [file.id, file.isNew, file.sharedBy]);

  // Delete file handler
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`http://localhost:8000/filesharing/documents/${file.id}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 204) {
        alert('File deleted successfully.');
        onClose();
        if (onDeleteSuccess) onDeleteSuccess(file.id);
      } else {
        alert(`You're not allowed to delete this file`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to the server.');
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <div className="modal-file-icon">
          {isPDF && <span className="pdf">PDF</span>}
          {file.type === 'doc' && <span className="doc">DOC</span>}
          {file.type === 'ppt' && <span className="ppt">PPT</span>}
          {isText && <span className="txt">TXT</span>}
          {file.type === 'zip' && <span className="zip">ZIP</span>}
        </div>
        <h2>{file.name}</h2>
        <div className="modal-file-meta">
          <span>{file.size}</span>
          {file.sharedBy && <span>Shared by: {file.sharedBy}</span>}
          <span>{file.date}</span>
        </div>
      </div>
  
      <div className="modal-body">
        {file.message && (
          <div className="modal-message">
            <h4>Message:</h4>
            <div className={`message-content ${!showFullMessage && file.message.split('\n').length > 30 ? 'truncated' : ''}`}>
              {file.message}
            </div>
            {file.message.split('\n').length > 30 && (
              <button 
                className="read-more-btn" 
                onClick={() => setShowFullMessage(!showFullMessage)}
              >
                {showFullMessage ? 'Show less' : 'Read more...'}
              </button>
            )}
          </div>
        )}
  
        <div className="modal-preview">
          <div className="file-preview-container">
            {['pdf', 'txt'].includes(file.type) ? (
              <iframe
                src={file.fileUrl}
                width="100%"
                height="400px"
                title="File Preview"
                className="file-iframe"
              ></iframe>
            ) : (
              <div className={`file-preview-placeholder ${file.type}`}>
                <div className="file-preview-icon">
                  {file.type === 'doc' ? '📝' : 
                   file.type === 'ppt' ? '📊' : 
                   file.type === 'zip' ? '🗄️' : '📄'}
                </div>
                <div className="file-preview-message">
                  {file.type === 'doc' ? 'Word document preview not available' : 
                   file.type === 'ppt' ? 'PowerPoint preview not available' : 
                   file.type === 'zip' ? 'Compressed folder (download to view)' : 'No preview available'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  
      <div className="modal-actions">
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="modal-button view">
          🔍 View Full
        </a>
        <a href={fileUrl} download className="modal-button download">
          ↓ Download
        </a>
        <button className="modal-button share">
          ↗ Share
        </button>
        <button className="modal-button delete" onClick={handleDelete}>
          🗑 Delete
        </button>
      </div>
    </Modal>
  );
}