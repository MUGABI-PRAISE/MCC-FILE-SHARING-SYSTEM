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

export default function Dashboard({ offices, setIsAuthenticated }) {
  const [showFileSender, setShowFileSender] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState('recent');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [notification, setNotification] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedMessages, setExpandedMessages] = useState({});
  const [sentFiles, setSentFiles] = useState([]);
  const [loadingSentFiles, setLoadingSentFiles] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeTab === 'sent') {
      fetchSentFiles();
    }
  }, [activeTab]);

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
      const transformedFiles = data.map(file => ({
        id: file.id,
        name: file.document_title || file.file.split('/').pop(),
        type: file.file_type.split('/').pop().split('.').pop().toLowerCase(),
        size: file.file_size,
        date: file.sent_at,
        message: file.message || '',
        fileUrl: file.file
      }));

      setSentFiles(transformedFiles);
    } catch (err) {
      setError(err.message || 'Failed to fetch sent files');
      console.error('Error fetching sent files:', err);
    } finally {
      setLoadingSentFiles(false);
    }
  };

  const handleSendComplete = (sentFile) => {
    setNotification({ type: 'success', message: 'File sent successfully!' });
    fetchSentFiles(); // Refresh sent files list
  };

  const handleFileClick = (file) => {
    setSelectedFile(file);
  };

  const closeModal = () => {
    setSelectedFile(null);
  };

  const recentFiles = [
    { id: '1', name: 'Quarterly_Report_2023.pdf', type: 'pdf', size: '2.4 MB', sharedBy: 'Finance Dept', date: '2 hours ago', isNew: true, message: 'Please review the Q3 financials before the meeting tomorrow lorem...' },
    { id: '2', name: 'Budget_Approval.docx', type: 'doc', size: '1.1 MB', sharedBy: 'Planning Office', date: '1 day ago', isNew: true, message: 'Final budget approval for the new project' },
    { id: '3', name: 'Staff_Meeting_Minutes.pdf', type: 'pdf', size: '3.2 MB', sharedBy: 'HR Department', date: '3 days ago', isNew: true, message: "Minutes from last week's all-hands meeting" },
    { id: '4', name: 'Project_Proposal.pptx', type: 'ppt', size: '5.7 MB', sharedBy: 'Engineering', date: '1 week ago', isNew: true, message: 'Initial proposal for the new infrastructure project' }
  ];

  const receivedFiles = [...recentFiles, { id: '5', name: 'Personal_Notes.txt', type: 'txt', size: '12 KB', date: 'Yesterday', isNew: false, message: 'Quick notes from the client call' }, { id: '6', name: 'Presentation_Slides.pptx', type: 'ppt', size: '8.2 MB', date: 'Last week', isNew: false }].sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleFileSelect = (fileId, isNew) => {
    setSelectedFiles(prev => prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]);
    if (isNew) setUnreadCount(prev => prev - 1);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'received') setUnreadCount(0);
    if (tab === 'profile') console.log('Navigating to user profile...');
  };

  const toggleMessage = (fileId) => {
    setExpandedMessages(prev => ({ ...prev, [fileId]: !prev[fileId] }));
  };

  const user = {
    name: localStorage.getItem('firstName') + ' ' + localStorage.getItem('lastName'),
    position: localStorage.getItem('position'),
    // avatarUrl: 'https://via.placeholder.com/150'
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
        
        {loadingSentFiles && activeTab === 'sent' && (
          <div className="loading-indicator">Loading sent files...</div>
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