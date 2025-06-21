// FileModal.js
import Modal from './Modal';
import '../styles/FileModal.css';

export default function FileModal({ file, onClose }) {
  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <div className="modal-file-icon">
          {file.type === 'pdf' && <span className="pdf">PDF</span>}
          {file.type === 'doc' && <span className="doc">DOC</span>}
          {file.type === 'ppt' && <span className="ppt">PPT</span>}
          {file.type === 'txt' && <span className="txt">TXT</span>}
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
          <div className="file-preview-placeholder">
            {file.type === 'pdf' && 'PDF Preview'}
            {file.type === 'doc' && 'Document Preview'}
            {file.type === 'ppt' && 'Presentation Preview'}
            {file.type === 'txt' && 'Text Content Preview'}
          </div>
        </div>
      </div>

      <div className="modal-actions">
        <button className="modal-button download">
          <span>↓</span> Download
        </button>
        <button className="modal-button share">
          <span>↗</span> Share
        </button>
        <button className="modal-button delete">
          <span>🗑</span> Delete
        </button>
      </div>
    </Modal>
  );
}
