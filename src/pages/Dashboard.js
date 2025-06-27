import { useState } from 'react';
import '../styles/Dashboard.css';
import Sidebar from '../components/Sidebar'; // responsible for the sidebar navigation
import UserProfile from '../components/UserProfile'; // responsible for displaying user profile information
import FileModal from '../components/FileModal';
import FileSender from '../components/FileSender'; // responsible for the file sending process
import NotificationBanner from '../components/NotificationBanner';
import DashboardHeader from '../components/DashboardHeader';
import DashboardTabs from '../components/DashboardTabs';
import SelectedActions from '../components/SelectedActions';
import QuickActions from '../components/QuickActions';
import FilesGrid from '../components/FilesGrid';

export default function Dashboard({ offices }) {
  const [showFileSender, setShowFileSender] = useState(false); // trigger the file sender to be shown when send file button is clicked.
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState('recent');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [notification, setNotification] = useState(null);
  const [unreadCount, setUnreadCount] = useState();
  const [expandedMessages, setExpandedMessages] = useState({});


  const handleSendComplete = (sentFile) => {
    alert('File sent:', sentFile);
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

  const sentFiles = [
    { id: '7', name: 'Annual_Report.pdf', type: 'pdf', size: '3.8 MB', date: 'Today', message: 'Annual financial report for 2023' },
    { id: '8', name: 'Project_Update.docx', type: 'doc', size: '2.1 MB', date: '2 days ago', message: 'Weekly update on the marketing campaign progress' },
    { id: '9', name: 'Meeting_Invite.pptx', type: 'ppt', size: '1.5 MB', date: '1 week ago' }
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  //simulated user
  const user = {
    name: 'Bi sure',
    avatarUrl: 'https://via.placeholder.com/150'
  };
  const handleFileSelect = (fileId, isNew) => {
    setSelectedFiles(prev => prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]);
    if (isNew) setUnreadCount(prev => prev - 1);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);

    if (tab === 'received') {
      setUnreadCount(0);
    }

    if (tab === 'profile') {
      console.log('Navigating to user profile...');
      // If needed, load profile data here or redirect.
    }

    // You can add more tab-specific logic if needed
  };


  const toggleMessage = (fileId) => {
    setExpandedMessages(prev => ({ ...prev, [fileId]: !prev[fileId] }));
  };

  return (
    <div className="app-container"> 
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="dashboard-top-right">
          <UserProfile
            user={user}
            onClick={() => handleTabChange('profile')} // Navigate to profile tab or route
          />
        </div>

      <div className="dashboard-container">
        

        <NotificationBanner notification={notification} />
        <DashboardHeader   onSendFile={() => setShowFileSender(true)} />
        {showFileSender && (
          <div className="modal-overlay">
            <FileSender offices={offices} onClose={() => setShowFileSender(false)} onSendComplete={handleSendComplete} />
              
          </div>
        )}
        <DashboardTabs activeTab={activeTab} unreadCount={unreadCount} onTabChange={handleTabChange} />
        <SelectedActions selectedFiles={selectedFiles} />
        <FilesGrid activeTab={activeTab} recentFiles={recentFiles} receivedFiles={receivedFiles} sentFiles={sentFiles} selectedFiles={selectedFiles} expandedMessages={expandedMessages} onFileClick={handleFileClick} onToggleMessage={toggleMessage} />
        <QuickActions />
        {selectedFile && <FileModal file={selectedFile} onClose={closeModal} />}
        
      </div>
    </div> 
  );
}
