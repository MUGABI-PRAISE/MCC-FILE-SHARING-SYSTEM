import '../styles/FileCard.css';
export default function FileCard({ file, isSelected, isExpanded, onClick, onToggleMessage }) {
    return (
      <div className={`file-card ${isSelected ? 'selected' : ''}`} onClick={onClick}>
        {file.isNew && <div className="new-badge">NEW</div>}
        <div className="file-icon">
          {file.type === 'pdf' && <span className="pdf">PDF</span>}
          {file.type === 'doc' && <span className="doc">DOC</span>}
          {file.type === 'docx' && <span className="doc">DOC</span>}
          {file.type === 'ppt' && <span className="ppt">PPT</span>}
          {file.type === 'pptx' && <span className="ppt">PPT</span>}
          {file.type === 'txt' && <span className="txt">TXT</span>}
          {file.type === 'xls' && <span className="xls">XLS</span>}
          {file.type === 'xlsx' && <span className="xls">XLS</span>}
          {file.type === 'zip' && <span className="zip">ZIP</span>}
          {file.type === 'rar' && <span className="zip">RAR</span>}
          {file.type === 'jpg' && <span className="jpg">JPG</span>}
          {file.type === 'jpeg' && <span className="jpg">JPG</span>}
          {file.type === 'png' && <span className="png">PNG</span>}
          {file.type === 'gif' && <span className="gif">GIF</span>}
          {file.type === 'bmp' && <span className="jpg">BMP</span>}
          {file.type === 'svg' && <span className="png">SVG</span>}
          {file.type === 'mp4' && <span className="mp4">MP4</span>}
          {file.type === 'mov' && <span className="mov">MOV</span>}
          {file.type === 'avi' && <span className="mp4">AVI</span>}
          {file.type === 'wmv' && <span className="mov">WMV</span>}
          {file.type === 'mp3' && <span className="mp3">MP3</span>}
          {file.type === 'wav' && <span className="mp3">WAV</span>}
          {file.type === 'ogg' && <span className="mp3">OGG</span>}
          {file.type === 'js' && <span className="default">JS</span>}
          {file.type === 'html' && <span className="default">HTML</span>}
          {file.type === 'css' && <span className="default">CSS</span>}
          {file.type === 'py' && <span className="default">PY</span>}
          {file.type === 'java' && <span className="default">JAVA</span>}
          {!['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'xls', 'xlsx', 'zip', 'rar', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'mp4', 'mov', 'avi', 'wmv', 'mp3', 'wav', 'ogg', 'js', 'html', 'css', 'py', 'java'].includes(file.type) && 
            <span className="default">{file.type.toUpperCase()}</span>}

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