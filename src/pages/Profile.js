import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../styles/Profile.css';
import '../styles/Dashboard.css';

function Profile({ user, setIsAuthenticated }) {
  const navigate = useNavigate();

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
            <div className="profile-avatar">
              {user.profile_picture ? (
                <img src={user.profile_picture} alt={`${user.first_name} ${user.last_name}`} />
              ) : (
                <div className="avatar-placeholder">
                  {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                </div>
              )}
            </div>
            <h1>{user.first_name} {user.last_name}</h1>
            <p className="profile-title">{user.position}</p>
            <p className="profile-office">{user.office?.name}</p>
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
                <span className="detail-value">{user.email}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date of Birth:</span>
                <span className="detail-value">{formatDate(user.date_of_birth)}</span>
              </div>
            </div>

            <div className="detail-card">
              <h3>Employment Details</h3>
              <div className="detail-row">
                <span className="detail-label">Position:</span>
                <span className="detail-value">{user.position}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Office:</span>
                <span className="detail-value">{user.office?.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date of Appointment:</span>
                <span className="detail-value">{formatDate(user.date_of_appointment)}</span>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button className="profile-button edit">Edit Profile</button>
            <button className="profile-button change-password">Change Password</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
