import '../styles/FileCard.css';
export default function FileCard({ file, isSelected, isExpanded, onClick, onToggleMessage }) {
    return (
      <div className={`file-card ${isSelected ? 'selected' : ''}`} onClick={onClick}>
        {file.isNew && <div className="new-badge">NEW</div>}
        <div className="file-icon">
          {file.type === 'pdf' && <span className="pdf">PDF</span>}
          {file.type === 'doc' && <span className="doc">DOC</span>}
          {file.type === 'ppt' && <span className="ppt">PPT</span>}
          {file.type === 'txt' && <span className="txt">TXT</span>}
        </div>
        <div className="file-info">
          <h3>{file.name}</h3>
          <p>{file.size}</p>
          {file.sharedBy && <p className="shared-by">Shared by: {file.sharedBy}</p>}
          <p className="file-date">{file.date}</p>
          {file.message && (
            <div
              className={`file-message ${isExpanded ? 'expanded' : ''}`}
              onClick={onToggleMessage}
            >
              <div className="message-preview">
                {`${file.message.substring(0, 100)}${file.message.length > 100 ? '...' : ''}`}
              </div>
              {isExpanded && (
                <div className="read-more-hint">Click the file to read more</div>
              )}
              <span className="toggle-message">{isExpanded ? '▲' : '▼'}</span>
            </div>
          )}

        </div>
        <div className="file-options">
          <button className="option-button download">↓</button>
          <button className="option-button share">↗</button>
        </div>
      </div>
    );
  }