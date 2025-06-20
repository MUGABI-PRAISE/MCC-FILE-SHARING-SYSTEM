import { useState } from 'react';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('recent');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [notification, setNotification] = useState(null);

  // Mock data - replace with your actual data
  const recentFiles = [
    { id: '1', name: 'Quarterly_Report_2023.pdf', type: 'pdf', size: '2.4 MB', sharedBy: 'Finance Dept', date: '2 hours ago' },
    { id: '2', name: 'Budget_Approval.docx', type: 'doc', size: '1.1 MB', sharedBy: 'Planning Office', date: '1 day ago' },
    { id: '3', name: 'Staff_Meeting_Minutes.pdf', type: 'pdf', size: '3.2 MB', sharedBy: 'HR Department', date: '3 days ago' },
    { id: '4', name: 'Project_Proposal.pptx', type: 'ppt', size: '5.7 MB', sharedBy: 'Engineering', date: '1 week ago' },
  ];

  const myFiles = [
    { id: '5', name: 'Personal_Notes.txt', type: 'txt', size: '12 KB', date: 'Yesterday' },
    { id: '6', name: 'Presentation_Slides.pptx', type: 'ppt', size: '8.2 MB', date: 'Last week' },
  ];

  const handleFileSelect = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId) 
        : [...prev, fileId]
    );
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Mock upload progress
    setUploadProgress(0);
    setNotification(null);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null) return 0;
        const newProgress = prev + Math.random() * 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setNotification({ type: 'success', message: `${file.name} uploaded successfully!` });
          setTimeout(() => setNotification(null), 3000);
          return 100;
        }
        return newProgress;
      });
    }, 300);

    // In real app, you would actually upload the file here
  };

  return (
    <div className="dashboard-container">
      {notification && (
        <div className={`dashboard-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="dashboard-header">
        <h1>File Sharing Dashboard</h1>
        <div className="upload-area">
          <label className="upload-button">
            <input type="file" onChange={handleUpload} style={{ display: 'none' }} />
            <span>+ Upload File</span>
          </label>
          {uploadProgress !== null && (
            <div className="upload-progress">
              <div 
                className="progress-bar" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'recent' ? 'active' : ''}
          onClick={() => setActiveTab('recent')}
        >
          Recently Shared
        </button>
        <button 
          className={activeTab === 'myfiles' ? 'active' : ''}
          onClick={() => setActiveTab('myfiles')}
        >
          My Files
        </button>
        <button 
          className={activeTab === 'shared' ? 'active' : ''}
          onClick={() => setActiveTab('shared')}
        >
          Shared With Me
        </button>
      </div>

      <div className="file-actions">
        {selectedFiles.length > 0 && (
          <>
            <button className="action-button download">
              Download Selected ({selectedFiles.length})
            </button>
            <button className="action-button share">
              Share Selected
            </button>
            <button className="action-button delete">
              Delete Selected
            </button>
          </>
        )}
      </div>

      <div className="files-grid">
        {(activeTab === 'recent' ? recentFiles : myFiles).map(file => (
          <div 
            key={file.id} 
            className={`file-card ${selectedFiles.includes(file.id) ? 'selected' : ''}`}
            onClick={() => handleFileSelect(file.id)}
          >
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
            </div>
            <div className="file-options">
              <button className="option-button download">↓</button>
              <button className="option-button share">↗</button>
            </div>
          </div>
        ))}
      </div>

      <div className="storage-metrics">
        <div className="storage-info">
          <h3>Storage Usage</h3>
          <div className="storage-bar">
            <div className="storage-used" style={{ width: '65%' }}></div>
          </div>
          <p>4.2 GB of 10 GB used</p>
        </div>
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <button className="quick-button new-folder">+ New Folder</button>
          <button className="quick-button scan-docs">Scan Documents</button>
        </div>
      </div>
    </div>
  );
}