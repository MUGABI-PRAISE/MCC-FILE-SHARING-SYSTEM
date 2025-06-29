import Modal from './Modal';
import '../styles/FileModal.css';

export default function FileModal({ file, onClose }) {
  const isPDF = file.type === 'pdf';
  const isText = file.type === 'txt';
  const fileUrl = file.fileUrl;

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
        <button className="modal-button delete">
          🗑 Delete
        </button>
      </div>
    </Modal>
  );
}