import Modal from './Modal';
import '../styles/FileModal.css';

export default function FileModal({ file, onClose, onDeleteSuccess }) {
  const isPDF = file.type === 'pdf';
  const isText = file.type === 'txt';
  const fileUrl = file.fileUrl;


  // delete a file
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      console.log("Attempting to delete file with ID:", file.id);
      const response = await fetch(`http://localhost:8000/filesharing/documents/${file.id}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // if you're using JWT
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 204) {
        alert('File deleted successfully.');
        onClose(); // Close the modal
        if (onDeleteSuccess) onDeleteSuccess(file.id); // Notify parent!
      } else {alert(`you're not allowed to delete this file`);
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
            <p>{file.message}</p>
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