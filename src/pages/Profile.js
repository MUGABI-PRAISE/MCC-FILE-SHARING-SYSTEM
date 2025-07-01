import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../styles/Profile.css';
import '../styles/Dashboard.css';

function Profile({ user, setIsAuthenticated }) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({ ...user });
  const fileInputRef = useRef(null);
  const [tempImage, setTempImage] = useState(null);

  if (!user) return null;

  // Handle tab change from Sidebar
  const handleTabChange = (tab) => {
    if (tab === 'profile') return; // already on profile
    navigate(`/dashboard?tab=${tab}`); // pass tab via query
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedUser({ ...user });
    setTempImage(null);
  };

  const handleSave = async () => {
  try {
    // Prepare data to send (clone editedUser to avoid mutating state)
    const updatedData = { ...editedUser };

    // If tempImage is set, assume it's a base64 string and send as profile_picture
    if (tempImage) {
      updatedData.profile_picture = tempImage;
    }

    // If office is an object, you might want to send just an ID or handle it as needed
    if (typeof updatedData.office === 'object' && updatedData.office !== null) {
      // Example: send office id only if your backend expects this
      updatedData.office = updatedData.office.id || null;
    }

    // Remove fields that shouldn't be sent if any (like username if read-only)
    delete updatedData.username; // if username not editable on backend

    // Make PATCH request to update user
    const response = await fetch('localhost:8000/filesharing/me/', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`, // Adjust if using another auth scheme
      },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to update profile:', errorData);
      alert('Failed to update profile. Please try again.');
      return;
    }

    const updatedUser = await response.json();

    // Update local state & UI
    setIsEditing(false);
    setTempImage(null);

    // Update parent user data if needed
    // You could call a prop function or context here
    // For example, if `setUser` prop exists: setUser(updatedUser);

    // Optionally refresh your page or user info
    // Or update `editedUser` with fresh data from server
    setEditedUser(updatedUser);

    alert('Profile updated successfully!');
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('An error occurred while updating profile.');
  }
};


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    // Format date to ISO string for consistency
    const date = value ? new Date(value).toISOString() : null;
    setEditedUser(prev => ({
      ...prev,
      [name]: date
    }));
  };

  const handleImageClick = () => {
    if (isEditing) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result);
      };
      reader.readAsDataURL(file);
      // You would typically upload the image to your server here
      // and update the user's profile_picture with the new URL
    }
  };

  const renderEditableField = (name, value, type = 'text') => {
    if (!isEditing) return value;

    if (type === 'date') {
      const dateValue = value ? new Date(value).toISOString().split('T')[0] : '';
      return (
        <input
          type="date"
          name={name}
          value={dateValue}
          onChange={handleDateChange}
          className="profile-input"
        />
      );
    }

    return (
      <input
        type={type}
        name={name}
        value={value || ''}
        onChange={handleInputChange}
        className="profile-input"
      />
    );
  };

  return (
    <div className="app-container">
      <Sidebar
        activeTab="profile"
        onTabChange={handleTabChange}
        setIsAuthenticated={setIsAuthenticated}
      />

      <div className="profile-main">
        <div className="profile-container">
          <div className="profile-header">
            <div 
              className={`profile-avatar ${isEditing ? 'editable' : ''}`} 
              onClick={handleImageClick}
            >
              {tempImage ? (
                <img src={tempImage} alt="Preview" />
              ) : user.profile_picture ? (
                <img src={user.profile_picture} alt={`${user.first_name} ${user.last_name}`} />
              ) : (
                <div className="avatar-placeholder">
                  {isEditing ? (
                    <div className="camera-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="36px" height="36px">
                        <path d="M0 0h24v24H0z" fill="none"/>
                        <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
                      </svg>
                    </div>
                  ) : (
                    <>
                      {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                    </>
                  )}
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              {isEditing && !tempImage && !user.profile_picture && (
                <div className="upload-hint">Click to upload</div>
              )}
            </div>
            <h1>
              {isEditing ? (
                <div className="name-edit">
                  <input
                    type="text"
                    name="first_name"
                    value={editedUser.first_name || ''}
                    onChange={handleInputChange}
                    className="profile-input name-input"
                  />
                  <input
                    type="text"
                    name="last_name"
                    value={editedUser.last_name || ''}
                    onChange={handleInputChange}
                    className="profile-input name-input"
                  />
                </div>
              ) : (
                `${user.first_name} ${user.last_name}`
              )}
            </h1>
            <p className="profile-title">
              {isEditing ? (
                <input
                  type="text"
                  name="position"
                  value={editedUser.position || ''}
                  onChange={handleInputChange}
                  className="profile-input"
                />
              ) : (
                user.position
              )}
            </p>
            <p className="profile-office">
              {isEditing ? (
                <input
                  type="text"
                  name="office"
                  value={editedUser.office?.name || ''}
                  onChange={handleInputChange}
                  className="profile-input"
                />
              ) : (
                user.office?.name
              )}
            </p>
          </div>

          <div className="profile-details">
            <div className="detail-card">
              <h3>Personal Information</h3>
              <div className="detail-row">
                <span className="detail-label">Username:</span>
                <span className="detail-value">{user.username}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">
                  {renderEditableField('email', editedUser.email, 'email')}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date of Birth:</span>
                <span className="detail-value">
                  {renderEditableField('date_of_birth', editedUser.date_of_birth, 'date')}
                </span>
              </div>
            </div>

            <div className="detail-card">
              <h3>Employment Details</h3>
              <div className="detail-row">
                <span className="detail-label">Position:</span>
                <span className="detail-value">
                  {renderEditableField('position', editedUser.position)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Office:</span>
                <span className="detail-value">
                  {renderEditableField('office', editedUser.office?.name)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date of Appointment:</span>
                <span className="detail-value">
                  {renderEditableField('date_of_appointment', editedUser.date_of_appointment, 'date')}
                </span>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            {isEditing ? (
              <>
                <button className="profile-button save" onClick={handleSave}>Save Changes</button>
                <button className="profile-button cancel" onClick={handleCancelEdit}>Cancel</button>
              </>
            ) : (
              <>
                <button className="profile-button edit" onClick={handleEditClick}>Edit Profile</button>
                <button className="profile-button change-password">Change Password</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;