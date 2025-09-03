// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import '../styles/Settings.css';
import { authFetch } from '../services/FetchAuth';

const Settings = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    office: '',
    department: ''
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    soundEnabled: true,
    desktopAlerts: false
  });
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    autoLogout: 30,
    password: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [storageSettings, setStorageSettings] = useState({
    autoDelete: false,
    autoDeleteAfter: 90,
    maxFileSize: 100,
    allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png']
  });
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ message: '', type: '' });

  // Load user data on component mount
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('userInfo'));
    if (storedUser) {
      setUserData({
        first_name: storedUser.first_name || '',
        last_name: storedUser.last_name || '',
        email: storedUser.email || '',
        phone: storedUser.phone || '',
        office: storedUser.office?.name || '',
        department: storedUser.department || ''
      });
    }

    // In a real app, you would fetch these from your backend
    const savedNotificationSettings = localStorage.getItem('notificationSettings');
    if (savedNotificationSettings) {
      setNotificationSettings(JSON.parse(savedNotificationSettings));
    }

    const savedSecuritySettings = localStorage.getItem('securitySettings');
    if (savedSecuritySettings) {
      setSecuritySettings(JSON.parse(savedSecuritySettings));
    }

    const savedStorageSettings = localStorage.getItem('storageSettings');
    if (savedStorageSettings) {
      setStorageSettings(JSON.parse(savedStorageSettings));
    }
  }, []);

  const handleUserDataChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked, value, type } = e.target;
    setNotificationSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSecurityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecuritySettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleStorageChange = (e) => {
    const { name, value, type, checked } = e.target;
    setStorageSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileTypeToggle = (fileType) => {
    setStorageSettings(prev => {
      const currentTypes = [...prev.allowedFileTypes];
      const index = currentTypes.indexOf(fileType);
      
      if (index > -1) {
        currentTypes.splice(index, 1);
      } else {
        currentTypes.push(fileType);
      }
      
      return { ...prev, allowedFileTypes: currentTypes };
    });
  };

  const saveSettings = async (section) => {
    setIsLoading(true);
    setSaveStatus({ message: '', type: '' });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage (in a real app, this would be an API call)
      if (section === 'notifications') {
        localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
      } else if (section === 'security') {
        localStorage.setItem('securitySettings', JSON.stringify(securitySettings));
      } else if (section === 'storage') {
        localStorage.setItem('storageSettings', JSON.stringify(storageSettings));
      } else if (section === 'profile') {
        // Update user info in localStorage
        const currentUser = JSON.parse(localStorage.getItem('userInfo'));
        const updatedUser = { ...currentUser, ...userData };
        localStorage.setItem('userInfo', JSON.stringify(updatedUser));
        
        // In a real app, you would make an API call to update the user profile
        // const response = await authFetch('/api/user/profile', {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(userData)
        // });
      }
      
      setSaveStatus({ message: 'Settings saved successfully!', type: 'success' });
    } catch (error) {
      setSaveStatus({ message: 'Failed to save settings. Please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
      // Clear status message after 3 seconds
      setTimeout(() => setSaveStatus({ message: '', type: '' }), 3000);
    }
  };

  const resetSection = (section) => {
    if (section === 'notifications') {
      setNotificationSettings({
        emailNotifications: true,
        pushNotifications: false,
        soundEnabled: true,
        desktopAlerts: false
      });
    } else if (section === 'security') {
      setSecuritySettings({
        twoFactorAuth: false,
        autoLogout: 30,
        password: '',
        newPassword: '',
        confirmPassword: ''
      });
    } else if (section === 'storage') {
      setStorageSettings({
        autoDelete: false,
        autoDeleteAfter: 90,
        maxFileSize: 100,
        allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png']
      });
    }
  };

  const renderProfileSection = () => (
    <div className="settings-section">
      <h2>Profile Information</h2>
      <div className="settings-form">
        <div className="form-row">
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              name="first_name"
              value={userData.first_name}
              onChange={handleUserDataChange}
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="last_name"
              value={userData.last_name}
              onChange={handleUserDataChange}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            name="email"
            value={userData.email}
            onChange={handleUserDataChange}
          />
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={userData.phone}
            onChange={handleUserDataChange}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Office</label>
            <input
              type="text"
              name="office"
              value={userData.office}
              onChange={handleUserDataChange}
              disabled
            />
          </div>
          <div className="form-group">
            <label>Department</label>
            <input
              type="text"
              name="department"
              value={userData.department}
              onChange={handleUserDataChange}
            />
          </div>
        </div>
        <div className="form-actions">
          <button 
            className="btn-primary" 
            onClick={() => saveSettings('profile')}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="settings-section">
      <h2>Notification Preferences</h2>
      <div className="settings-form">
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="emailNotifications"
              checked={notificationSettings.emailNotifications}
              onChange={handleNotificationChange}
            />
            <span className="checkmark"></span>
            Email Notifications
          </label>
          <p className="setting-description">Receive email alerts for new files and important updates</p>
        </div>
        
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="pushNotifications"
              checked={notificationSettings.pushNotifications}
              onChange={handleNotificationChange}
            />
            <span className="checkmark"></span>
            Push Notifications
          </label>
          <p className="setting-description">Get browser notifications for new files</p>
        </div>
        
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="soundEnabled"
              checked={notificationSettings.soundEnabled}
              onChange={handleNotificationChange}
            />
            <span className="checkmark"></span>
            Sound Alerts
          </label>
          <p className="setting-description">Play sound when new files arrive</p>
        </div>
        
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="desktopAlerts"
              checked={notificationSettings.desktopAlerts}
              onChange={handleNotificationChange}
            />
            <span className="checkmark"></span>
            Desktop Alerts
          </label>
          <p className="setting-description">Show desktop notifications (requires permission)</p>
        </div>
        
        <div className="form-actions">
          <button 
            className="btn-secondary" 
            onClick={() => resetSection('notifications')}
          >
            Reset to Defaults
          </button>
          <button 
            className="btn-primary" 
            onClick={() => saveSettings('notifications')}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="settings-section">
      <h2>Security Settings</h2>
      <div className="settings-form">
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="twoFactorAuth"
              checked={securitySettings.twoFactorAuth}
              onChange={handleSecurityChange}
            />
            <span className="checkmark"></span>
            Two-Factor Authentication
          </label>
          <p className="setting-description">Add an extra layer of security to your account</p>
        </div>
        
        <div className="form-group">
          <label>Auto Logout After Inactivity (minutes)</label>
          <select
            name="autoLogout"
            value={securitySettings.autoLogout}
            onChange={handleSecurityChange}
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
            <option value={0}>Never</option>
          </select>
        </div>
        
        <h3>Change Password</h3>
        <div className="form-group">
          <label>Current Password</label>
          <input
            type="password"
            name="password"
            value={securitySettings.password}
            onChange={handleSecurityChange}
            placeholder="Enter current password"
          />
        </div>
        <div className="form-group">
          <label>New Password</label>
          <input
            type="password"
            name="newPassword"
            value={securitySettings.newPassword}
            onChange={handleSecurityChange}
            placeholder="Enter new password"
          />
        </div>
        <div className="form-group">
          <label>Confirm New Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={securitySettings.confirmPassword}
            onChange={handleSecurityChange}
            placeholder="Confirm new password"
          />
        </div>
        
        <div className="form-actions">
          <button 
            className="btn-secondary" 
            onClick={() => resetSection('security')}
          >
            Reset
          </button>
          <button 
            className="btn-primary" 
            onClick={() => saveSettings('security')}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Update Security'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderStorageSection = () => (
    <div className="settings-section">
      <h2>Storage Preferences</h2>
      <div className="settings-form">
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="autoDelete"
              checked={storageSettings.autoDelete}
              onChange={handleStorageChange}
            />
            <span className="checkmark"></span>
            Auto-delete Old Files
          </label>
          <p className="setting-description">Automatically remove files after a period of time</p>
        </div>
        
        {storageSettings.autoDelete && (
          <div className="form-group">
            <label>Delete Files After (days)</label>
            <input
              type="number"
              name="autoDeleteAfter"
              value={storageSettings.autoDeleteAfter}
              onChange={handleStorageChange}
              min="1"
              max="365"
            />
          </div>
        )}
        
        <div className="form-group">
          <label>Maximum File Size (MB)</label>
          <select
            name="maxFileSize"
            value={storageSettings.maxFileSize}
            onChange={handleStorageChange}
          >
            <option value={10}>10 MB</option>
            <option value={25}>25 MB</option>
            <option value={50}>50 MB</option>
            <option value={100}>100 MB</option>
            <option value={250}>250 MB</option>
            <option value={500}>500 MB</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Allowed File Types</label>
          <div className="file-types-grid">
            {['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'png', 'txt', 'zip'].map(type => (
              <div 
                key={type} 
                className={`file-type-chip ${storageSettings.allowedFileTypes.includes(type) ? 'active' : ''}`}
                onClick={() => handleFileTypeToggle(type)}
              >
                {type.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            className="btn-secondary" 
            onClick={() => resetSection('storage')}
          >
            Reset to Defaults
          </button>
          <button 
            className="btn-primary" 
            onClick={() => saveSettings('storage')}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="settings-container">
      <div className="settings-sidebar">
        <h2>Settings</h2>
        <div className="settings-menu">
          <button 
            className={activeSection === 'profile' ? 'active' : ''}
            onClick={() => setActiveSection('profile')}
          >
            Profile
          </button>
          <button 
            className={activeSection === 'notifications' ? 'active' : ''}
            onClick={() => setActiveSection('notifications')}
          >
            Notifications
          </button>
          <button 
            className={activeSection === 'security' ? 'active' : ''}
            onClick={() => setActiveSection('security')}
          >
            Security
          </button>
          <button 
            className={activeSection === 'storage' ? 'active' : ''}
            onClick={() => setActiveSection('storage')}
          >
            Storage
          </button>
        </div>
      </div>
      
      <div className="settings-content">
        {saveStatus.message && (
          <div className={`save-status ${saveStatus.type}`}>
            {saveStatus.message}
          </div>
        )}
        
        {activeSection === 'profile' && renderProfileSection()}
        {activeSection === 'notifications' && renderNotificationsSection()}
        {activeSection === 'security' && renderSecuritySection()}
        {activeSection === 'storage' && renderStorageSection()}
      </div>
    </div>
  );
};

export default Settings;