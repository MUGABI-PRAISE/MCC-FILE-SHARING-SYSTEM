import React from 'react';
import '../styles/UserProfile.css';
import { FaUser } from 'react-icons/fa';

export default function UserProfile({ user, onClick }) {
  // user = { name: string, avatarUrl: string }
  return (
    <div className="user-profile" onClick={onClick} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') onClick(); }}>
      <FaUser
        className="user-profile__avatar"
        aria-label={`${user.name}'s profile`}
      />
      <span className="user-profile__name">{user.name}</span>
    </div>
  );
}
