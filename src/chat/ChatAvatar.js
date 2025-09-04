// src/components/ChatAvatar.js
import React from 'react';

function ChatAvatar({ chat, userInfo, size = 40 }) {
  if (chat.is_group) {
    // Group chat placeholder
    return (
      <div 
        className="chat-avatar group-avatar"
        style={{ width: size, height: size }}
      >
        👥
      </div>
    );
  } else {
    // Individual chat - first letter of the other participant's name
    const otherParticipant = chat.participants?.find(p => p.id !== userInfo?.id);
    const displayName = otherParticipant?.name || otherParticipant?.first_name || 'U';
    const initial = displayName.charAt(0).toUpperCase();
    
    return (
      <div 
        className="chat-avatar individual-avatar"
        style={{ width: size, height: size }}
      >
        {initial}
      </div>
    );
  }
}

export default ChatAvatar;