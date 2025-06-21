import '../styles/DashboardHeader.css';
export default function DashboardHeader({ onSendFile }) {
    return (
      <div className="dashboard-header">
        <h1>File Sharing Dashboard</h1>
        <div className="upload-area">
          <button class="send-file-button" onClick={onSendFile}>
            <svg class="icon" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
                Send File
          </button>
        </div>
      </div>
    );
  }