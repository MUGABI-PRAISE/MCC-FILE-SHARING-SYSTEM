// src/components/chat/ChatAvatar.jsx
import React from 'react';
import { pickColor } from './utils/colors';
import { initialsFromName } from './utils/format';

/* Avatar component: displays photo if available, otherwise initials with color */
export default function ChatAvatar({ chat, otherParticipant, size = 40 }) {
  // chat may be group or direct
  if (chat?.is_group) {
    if (chat.avatar_url) {
      return <img className="chat-avatar" src={chat.avatar_url} alt={chat.name || 'Group'} style={{ width: size, height: size }} />;
    }
    const name = chat.name || 'Group';
    return (
      <div className="chat-avatar avatar-generated" style={{ width: size, height: size, background: pickColor(name) }}>
        <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} aria-hidden>
          <path fill="#fff" d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM8 11c1.657 0 3-1.343 3-3S9.657 5 8 5 5 6.343 5 8s1.343 3 3 3zM8 13c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zM18 13c-.29 0-.62.02-.97.06C17.46 14.12 18 15.5 18 17v2h4v-2.5c0-2.33-4.67-3.5-4-3.5z"/>
        </svg>
      </div>
    );
  }
  // direct chat: otherParticipant passed in by caller
  if (otherParticipant?.avatar_url) {
    return <img className="chat-avatar" src={otherParticipant.avatar_url} alt={otherParticipant.name || 'User'} style={{ width: size, height: size }} />;
  }
  const displayName = otherParticipant?.name || `${otherParticipant?.first_name || ''} ${otherParticipant?.last_name || ''}` || 'User';
  return (
    <div className="chat-avatar avatar-generated" style={{ width: size, height: size, background: pickColor(displayName) }}>
      <span className="avatar-initials">{initialsFromName(displayName)}</span>
    </div>
  );
}
