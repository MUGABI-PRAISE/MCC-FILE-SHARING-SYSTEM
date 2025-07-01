import React from 'react';
import '../styles/UserProfile.css';
import { FaUser } from 'react-icons/fa';

export default function UserProfile({ user, onClick }) {
  //return early if user is not yet set
  if (!user) return null; // guard line
  return (
    <div className="user-profile" onClick={onClick} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') onClick(); }}>
      {user.avatarUrl ? (
        <img 
          src={user.avatarUrl} 
          className="user-profile__avatar" 
          alt={``}
        />
      ) : (
        <FaUser className="user-profile__avatar" />
      )}
      <div className="user-profile__text">
        <span className="user-profile__name">{user.name}</span>
        <br />
        {user.position && <span className="user-profile__position">{user.position}</span>}
      </div>
    </div>
  );
}