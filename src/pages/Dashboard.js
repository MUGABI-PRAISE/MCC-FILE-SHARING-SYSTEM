// src/pages/Dashboard.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
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
import { authFetch } from '../services/FetchAuth';
import { useNavigate } from 'react-router-dom';
import AuthWatcher from '../services/AuthWatcher';
import useNotifications from '../hooks/useNotifications';

// ---------- Utilities to keep arrays consistent and avoid duplicates ----------

// Upsert by id for "Sent" items (id === document id)
function upsertSent(prev, newItem) {
  const idx = prev.findIndex((f) => f.id === newItem.id);
  if (idx === -1) return [newItem, ...prev];
  const copy = [...prev];
  copy[idx] = { ...copy[idx], ...newItem };
  return copy;
}

// Upsert by id for "Received" items (id === DocumentRecipient id)
function upsertReceived(prev, newItem) {
  const idx = prev.findIndex((f) => f.id === newItem.id);
  if (idx === -1) return [newItem, ...prev];
  const copy = [...prev];
  copy[idx] = { ...copy[idx], ...newItem };
  return copy;
}

// Transform a server "file.shared" payload → your Sent UI shape
function transformSentFromWS(doc) {
  // doc is payload_base (sender event) OR payload_base + recipient (recipient event)
  return {
    id: doc.document_id,
    name: doc.document_title || (typeof doc.file_url === 'string' ? doc.file_url.split('/').pop() : 'Untitled'),
    type: doc.file_type,
    size: doc.file_size,
    date: doc.timestamp,
    message: doc.message || '',
    fileUrl: doc.file_url
  };
}

// Transform a server "file.shared" payload → your Received UI shape
function transformReceivedFromWS(doc) {
  // Your fetchReceivedFiles maps to this shape:
  // {
  //   id: item.id (DocumentRecipient id),
  //   name, type, size, date, message, fileUrl, sharedBy, isNew
  // }
  const docName =
    doc.document_title || (typeof doc.file_url === 'string' ? doc.file_url.split('/').pop() : 'Untitled');

  return {
    id: doc.recipient?.document_recipient_id, // recipient row id
    name: docName,
    type: doc.file_type,
    size: doc.file_size,
    date: doc.timestamp, // you were showing document.sent_at; timestamp is when created
    message: doc.message || '',
    fileUrl: doc.file_url,
    sharedBy: doc.sender
      ? `${doc.sender.first_name || ''} ${doc.sender.last_name || ''}`.trim() || 'Unknown'
      : 'Unknown',
    isNew: true
  };
}

export default function Dashboard({ userInfo, offices }) {
  const [showFileSender, setShowFileSender] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState('recent');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [notification, setNotification] = useState(null);
  const [expandedMessages, setExpandedMessages] = useState({});
  const [sentFiles, setSentFiles] = useState([]);
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [loadingSentFiles, setLoadingSentFiles] = useState(false);
  const [loadingReceivedFiles, setLoadingReceivedFiles] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Ref to track previous received files count for sound notification
  const prevReceivedCountRef = useRef(0);
  const notificationSoundRef = useRef(null);

  // ===== Unread count is derived directly from receivedFiles (no separate state) =====
  const unreadCount = useMemo(
    () => receivedFiles.filter((f) => f.isNew).length,
    [receivedFiles]
  );

  // Initialize notification sound
  useEffect(() => {
    notificationSoundRef.current = new Audio('/sound.mp3');
    
    // Clean up audio element on unmount
    return () => {
      if (notificationSoundRef.current) {
        notificationSoundRef.current.pause();
        notificationSoundRef.current = null;
      }
    };
  }, []);

  // Play sound when new notifications arrive
  useEffect(() => {
    // Only play sound if:
    // 1. We have received files
    // 2. The count has increased
    // 3. The user is not currently viewing the received tab (optional)
    if (receivedFiles.length > 0 && 
        receivedFiles.length > prevReceivedCountRef.current &&
        activeTab !== 'received') {
      playNotificationSound();
    }
    
    // Update the previous count reference
    prevReceivedCountRef.current = receivedFiles.length;
  }, [receivedFiles.length, activeTab]); // Only depend on length and activeTab

  const playNotificationSound = () => {
    if (notificationSoundRef.current) {
      // Reset the audio to start from beginning
      notificationSoundRef.current.currentTime = 0;
      notificationSoundRef.current.play().catch(error => {
        console.log('Audio play failed:', error);
        // Some browsers require user interaction first
      });
    }
  };

  // set the user's name (unchanged)
  const storedUser = JSON.parse(localStorage.getItem('userInfo'));
  const user = storedUser
    ? {
        ...storedUser,
        name: `${storedUser.first_name} ${storedUser.last_name}`
      }
    : null;

  const token = localStorage.getItem('token');

  /////////////////////////////////////////////////////////////////////////////////////////////
  //    USE EFFECT HOOKS                                                                    //
  ///////////////////////////////////////////////////////////////////////////////////////////
  //fetch files on mount
  useEffect(() => {
    fetchReceivedFiles(); // Load unread count immediately (for badge)
    // Optionally also load sent on mount so "Recent" can show quickly
    fetchSentFiles();
  }, []); // eslint-disable-line

  // Automatically fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'sent') {
      fetchSentFiles();
    } else if (activeTab === 'received') {
      fetchReceivedFiles();
    } else if (activeTab === 'recent') {
      // currently "recent" is derived below; you can refresh received if you want
    }
  }, [activeTab]); // eslint-disable-line

  // ---------- WebSocket: listen and update state in real-time ----------
  useNotifications(token, (evt) => {
    // evt like: { type: "file.shared", payload: {...} }
    const type = evt.type;
    const payload = evt.payload || evt; // normalize (in case payload wrapper missing)

    switch (type) {
      case 'file.shared': {
        // Sender event: payload has NO recipient -> update Sent for the sender.
        // Recipient event: payload.recipient exists -> update Received for that office.
        // We can safely handle both.

        // If we are the sender, push into Sent
        if (payload?.sender?.id && userInfo?.id && payload.sender.id === userInfo.id) {
          const sentItem = transformSentFromWS(payload);
          setSentFiles((prev) => upsertSent(prev, sentItem));
        }

        // If this event targets our office, push into Received & mark isNew
        if (payload?.recipient?.office_id && userInfo?.office?.id) {
          if (payload.recipient.office_id === userInfo.office.id) {
            const recItem = transformReceivedFromWS(payload);
            if (recItem.id) {
              setReceivedFiles((prev) => upsertReceived(prev, recItem));
            } else {
              // Fallback: if we don't have a recipient id, avoid inserting a broken row
              console.warn('WS received file.shared without recipient id; skipping insert');
            }
          }
        }

        // Optional toast/banner
        // setNotification({ type: 'info', message: 'New file event received' });
        break;
      }

      case 'file.deleted': {
        const { document_id } = payload || {};
        if (!document_id) return;

        // Remove from Sent by document id
        setSentFiles((prev) => prev.filter((f) => f.id !== document_id));

        // Remove from Received by matching document id inside "fileUrl/name" is not reliable;
        // If your FilesGrid needs it removed by recipient rows, do nothing or refetch.
        // If you want aggressive cleanup, you could track a hidden mapping.
        setReceivedFiles((prev) =>
          prev.filter((f) => f.id !== document_id && f.document_id !== document_id)
        );

        break;
      }

      case 'file.read': {
        // A recipient marked as read; you might want to reflect that in "Sent" (e.g. read receipts).
        // For now we can ignore, or add a banner.
        // setNotification({ type: 'info', message: 'Your file was read' });
        break;
      }

      default:
        // console.log('WS: unhandled', evt);
        break;
    }
  });

  // Rest of the code remains the same...
  // [Keep all your existing functions like fetchSentFiles, fetchReceivedFiles, etc.]

  ///////////////////////////////////////////////////////////////////////////////////////
  //                              API CALLS                                           //
  /////////////////////////////////////////////////////////////////////////////////////
  // Fetch Sent Files
  const fetchSentFiles = async () => {
    try {
      setLoadingSentFiles(true);
      setError(null);
      const response = await authFetch(`${process.env.REACT_APP_API_URL}/filesharing/documents/sent/`, {
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
        fileUrl: file.file_url
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
      const response = await authFetch(`${process.env.REACT_APP_API_URL}/filesharing/documents/received/`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Something went wrong. please login again`);
      }

      const data = await response.json();
      const transformed = data.map(item => ({
        id: item.id, // DocumentRecipient id
        name: item.document.document_title || item.document.file.split('/').pop(),
        type: item.document.file_type,
        size: item.document.file_size,
        date: item.document.sent_at,
        message: item.document.message || '',
        fileUrl: item.document.file_url,
        sharedBy: item.document.sender?.office?.name || 'Unknown',
        isNew: !item.is_read
      }));
      setReceivedFiles(transformed);
    } catch (err) {
      setError(err.message || 'Failed to fetch received files');
      console.error('Error fetching received files:', err);
    } finally {
      setLoadingReceivedFiles(false);
    }
  };

  ///////////////////////////////////////////////////////////////////////////////////////////
  //                      OTHER FUNCTIONS                                                 //
  /////////////////////////////////////////////////////////////////////////////////////////
  const handleSendComplete = () => {
    // Refresh Sent via REST (in case any metadata was added server-side)
    fetchSentFiles();
    // Optionally show a banner
    // setNotification({ type: 'success', message: 'File sent successfully!' });
  };

  const handleFileClick = (file) => {
    setSelectedFile(file);
  };

  const closeModal = () => {
    setSelectedFile(null);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'profile') console.log('Navigating to user profile...');
  };

  const toggleMessage = (fileId) => {
    setExpandedMessages(prev => ({
      ...prev,
      [fileId]: !prev[fileId]
    }));
  };

  // When a file is opened/read in the modal, mark as read locally
  const handleFileRead = (fileId) => {
    setReceivedFiles(prevFiles =>
      prevFiles.map(file =>
        file.id === fileId ? { ...file, isNew: false } : file
      )
    );
  };

  // recent files are the first four of the received files by date desc
  const recentFiles = useMemo(
    () =>
      receivedFiles
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 4),
    [receivedFiles]
  );

  return (
    <>
      <AuthWatcher />
      <div className="app-container">
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        <div className="dashboard-top-right">
          <UserProfile user={user} onClick={() => navigate('profile')} />
        </div>

        <div className="dashboard-container">
          <NotificationBanner notification={notification} />
          <DashboardHeader onSendFile={() => setShowFileSender(true)} />

          {showFileSender && (
            <div className="modal-overlay">
              <FileSender
                offices={offices}
                onClose={() => setShowFileSender(false)}
                onSendComplete={handleSendComplete}
              />
            </div>
          )}

          <DashboardTabs
            activeTab={activeTab}
            unreadCount={unreadCount}
            onTabChange={handleTabChange}
          />
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

          {/* <QuickActions /> */}
          {selectedFile && (
            <FileModal
              file={selectedFile}
              onClose={closeModal}
              onDeleteSuccess={(deletedId) => {
                // Remove from Sent immediately
                setSentFiles(prev => prev.filter(file => file.id !== deletedId));
              }}
              onFileRead={handleFileRead}
            />
          )}
        </div>
      </div>
    </>
  );
}