// Updated DashboardHeader.js (File Button)
import '../styles/DashboardHeader.css';

export default function DashboardHeader({ onSendFile }) {
  return (
    <div className="file-fab-container">
      <button className="file-fab" onClick={onSendFile} title="Send file" aria-label="Send file">
        <svg className="file-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11 15H13V9H16L12 4L8 9H11V15M15 17H9V15H5V21H19V15H15V17Z"/>
        </svg>
      </button>
    </div>
  );
}