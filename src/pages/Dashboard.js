import { useState, useEffect } from 'react';
import '../styles/Dashboard.css';
import Sidebar from '../components/Sidebar';
import UserProfile from '../components/UserProfile';
import FileModal from '../components/FileModal';
import FileSender from '../components/FileSender';
import NotificationBanner from '../components/NotificationBanner';
import DashboardHeader from '../components/DashboardHeader';
import DashboardTabs from '../components/DashboardTabs';
import SelectedActions from '../components/SelectedActions';
import QuickActions from '../components/QuickActions';
import FilesGrid from '../components/FilesGrid';

export default function Dashboard({ userInfo, offices, setIsAuthenticated }) {
  const [showFileSender, setShowFileSender] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState('recent');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [notification, setNotification] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedMessages, setExpandedMessages] = useState({});
  const [sentFiles, setSentFiles] = useState([]);
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [loadingSentFiles, setLoadingSentFiles] = useState(false);
  const [loadingReceivedFiles, setLoadingReceivedFiles] = useState(false);
  const [error, setError] = useState(null);

  // Automatically fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'sent') {
      fetchSentFiles();
    } else if (activeTab === 'received') {
      fetchReceivedFiles();
    } else if (activeTab === 'recent') {
      fetchRecentFiles();
    }
  }, [activeTab]);
  // fetch the user
  const user = userInfo;

  // Fetch Sent Files
  const fetchSentFiles = async () => {
    try {
      setLoadingSentFiles(true);
      setError(null);
      const response = await fetch('http://localhost:8000/filesharing/documents/sent/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const transformed = data.map(file => ({
        id: file.id,
        name: file.document_title || file.file.split('/').pop(),
        type: file.file_type,
        size: file.file_size,
        date: file.sent_at,
        message: file.message || '',
        fileUrl: file.file
      }));

      setSentFiles(transformed);
    } catch (err) {
      setError(err.message || 'Failed to fetch sent files');
      console.error('Error fetching sent files:', err);
    } finally {
      setLoadingSentFiles(false);
    }
  };

  // Fetch Received Files
  const fetchReceivedFiles = async () => {
    try {
      setLoadingReceivedFiles(true);
      const response = await fetch('http://localhost:8000/filesharing/documents/received/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const transformed = data.map(item => ({
        id: item.id,
        name: item.document.document_title || item.document.file.split('/').pop(),
        type: item.document.file_type,
        size: item.document.file_size,
        date: item.received_at,
        message: item.document.message || '',
        fileUrl: item.document.file,
        sharedBy: item.document.sender.office?.name || 'Unknown',
        isNew: !item.is_read
      }));
      setReceivedFiles(transformed);
      setUnreadCount(transformed.filter(f => f.isNew).length);
    } catch (err) {
      console.error('Error fetching received files:', err);
    } finally {
      setLoadingReceivedFiles(false);
    }
  };

  // Fetch Recent Files (limit 4)
  const fetchRecentFiles = async () => {
    try {
      const response = await fetch('http://localhost:8000/filesharing/documents/recent/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const transformed = data.map(item => ({
        id: item.id,
        name: item.document.document_title || item.document.file.split('/').pop(),
        type: item.document.file_type,
        size: item.document.file_size,
        date: item.received_at,
        message: item.document.message || '',
        fileUrl: item.document.file,
        sharedBy: item.document.sender.office?.name || 'Unknown',
        isNew: !item.is_read
      }));
      setRecentFiles(transformed);
    } catch (err) {
      console.error('Error fetching recent files:', err);
    }
  };
  

  const handleSendComplete = () => {
    setNotification({ type: 'success', message: 'File sent successfully!' });
    fetchSentFiles(); // Refresh sent files list
  };

  const handleFileClick = (file) => {
    setSelectedFile(file);
  };

  const closeModal = () => {
    setSelectedFile(null);
  };

  const handleFileSelect = (fileId, isNew) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
    if (isNew) {
      setUnreadCount(prev => prev - 1);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'received') setUnreadCount(0);
    if (tab === 'profile') console.log('Navigating to user profile...');
  };

  const toggleMessage = (fileId) => {
    setExpandedMessages(prev => ({
      ...prev,
      [fileId]: !prev[fileId]
    }));
  };


  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} setIsAuthenticated={setIsAuthenticated} />
      
      <div className="dashboard-top-right">
        <UserProfile user={user} onClick={() => handleTabChange('profile')} />
      </div>

      <div className="dashboard-container">
        <NotificationBanner notification={notification} />
        <DashboardHeader onSendFile={() => setShowFileSender(true)} />

        {showFileSender && (
          <div className="modal-overlay">
            <FileSender offices={offices} onClose={() => setShowFileSender(false)} onSendComplete={handleSendComplete} />
          </div>
        )}

        <DashboardTabs activeTab={activeTab} unreadCount={unreadCount} onTabChange={handleTabChange} />
        <SelectedActions selectedFiles={selectedFiles} />

        {(loadingSentFiles || loadingReceivedFiles) && (
          <div className="loading-indicator">Loading files...</div>
        )}

        {error && activeTab === 'sent' && (
          <div className="error-message">Error: {error}</div>
        )}

        <FilesGrid
          activeTab={activeTab}
          recentFiles={recentFiles}
          receivedFiles={receivedFiles}
          sentFiles={sentFiles}
          selectedFiles={selectedFiles}
          expandedMessages={expandedMessages}
          onFileClick={handleFileClick}
          onToggleMessage={toggleMessage}
        />

        <QuickActions />
        {selectedFile && <FileModal file={selectedFile} onClose={closeModal} />}
      </div>
    </div>
  );
}
