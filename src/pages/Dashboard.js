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
import {authFetch} from '../services/FetchAuth';
import {useNavigate} from 'react-router-dom';

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
  const navigate = useNavigate();

  // set the user's name
  const user = userInfo ? {
    ...userInfo,
    name: `${userInfo.first_name} ${userInfo.last_name}`
  } : null;
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

  // handle deleted files
  const handleDeleteSuccess = (deletedId) => {
  setSentFiles(prevFiles =>
    prevFiles.filter(file => file.id !== deletedId) // return all files except the one that has been deleted
  );
};

  // Fetch Sent Files
  const fetchSentFiles = async () => {
    try {
      setLoadingSentFiles(true);
      setError(null);
      const response = await authFetch('http://localhost:8000/filesharing/documents/sent/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Something went wrong. please login again`);
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
      setError(null);
      const response = await authFetch('http://localhost:8000/filesharing/documents/received/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Something went wrong. please login again`);
        throw new Error(`HTTP error! status: ${response.status}`);// for debugging purposes
      }

      const data = await response.json();
      const transformed = data.map(item => ({
        id: item.id,
        name: item.document.document_title || item.document.file.split('/').pop(),
        type: item.document.file_type,
        size: item.document.file_size,
        date: item.document.sent_at,
        message: item.document.message || '',
        fileUrl: item.document.file,
        sharedBy: item.document.sender.office?.name || 'Unknown',
        isNew: !item.is_read
      }));
      // console.log(item.date);
      setReceivedFiles(transformed);
      setUnreadCount(transformed.filter(f => f.isNew).length);
    } catch (err) {
      setError(err.message || 'Failed to fetch sent files');
      console.error('Error fetching sent files:', err);
    } finally {
      setLoadingReceivedFiles(false);
    }
  };

  // Fetch Recent Files (limit 4)
  const fetchRecentFiles = async () => {
    try {
      setError(null);
      const response = await authFetch('http://localhost:8000/filesharing/documents/recent/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Something went wrong. please login again`);
      }

      const data = await response.json();
      const transformed = data.map(item => ({
        id: item.id,
        name: item.document.document_title || item.document.file.split('/').pop(),
        type: item.document.file_type,
        size: item.document.file_size,
        date: item.document.sent_at,
        message: item.document.message || '',
        fileUrl: item.document.file,
        sharedBy: item.document.sender.office?.name || 'Unknown',
        isNew: !item.is_read
      }));
      setRecentFiles(transformed);
    } catch (err) {
      setError(err.message || 'Failed to fetch sent files');
      console.error('Error fetching sent files:', err);
    }
  };
  

  const handleSendComplete = () => {
    setNotification({ type: 'success', message: 'File sent successfully!' });
    fetchSentFiles(); // Refresh sent files list
  };
  //logout the user
  // const handleLogout = () => {
  //     // 1. Clear JWT token from localStorage
  //     localStorage.removeItem('token');
  //     localStorage.removeItem('refreshToken');
  //     localStorage.removeItem('firstName');
  //     localStorage.removeItem('lastName');
  //     localStorage.removeItem('position');
  //     setIsAuthenticated(false); // ✅ Re-render routes and force redirect
  //     // 2. (Optional) Call backend logout endpoint if using blacklisting
  //     // fetch('http://localhost:8000/api/logout/', {
  //     //   method: 'POST',
  //     //   headers: {
  //     //     'Authorization': `Bearer ${localStorage.getItem('token')}`,
  //     //     'Content-Type': 'application/json'
  //     //   }
  //     // });
  
  //     // 3. Redirect user to login page
  //     navigate("/login", { replace: true });
  //   };
    
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
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        setIsAuthenticated={setIsAuthenticated} 
      />
      
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

        {/* check for errors on different tabs */}
        {error && activeTab === 'sent' && (
          <div className="error-message">{error}</div>
        )}

        {error && activeTab === 'received' && (
          <div className="error-message">{error}</div>
        )}

        {error && activeTab === 'recent' && (
          <div className="error-message">{error}</div>
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
        {selectedFile && <FileModal file={selectedFile} onClose={closeModal} onDeleteSuccess={handleDeleteSuccess} />}
      </div>
    </div>
  );
}
