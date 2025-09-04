// src/components/ChatHeader.js
import React from 'react';
import ChatAvatar from './ChatAvatar';

function ChatHeader({ activeChat, userInfo, setShowGroupSettings }) {
  const isAdmin = activeChat.is_group && 
                 activeChat.admin_id === userInfo.id;
  
  return (
    <div className="chat-right-header">
      <ChatAvatar chat={activeChat} userInfo={userInfo} size={40} />
      
      <div className="title">
        {activeChat.is_group ? (activeChat.name || 'Group') : 'Direct chat'}
        <div className="subtitle">
          {activeChat.participants.map(p => p.name).join(', ')}
        </div>
      </div>
      
      {activeChat.is_group && (
        <div className="chat-header-actions">
          <button 
            className="icon-btn" 
            onClick={() => setShowGroupSettings(true)}
            title="Group settings"
          >
            ⋮
          </button>
        </div>
      )}
    </div>
  );
}

export default ChatHeader;