// src/components/ChatList.js
import React from 'react';
import ChatAvatar from './ChatAvatar';

function ChatList({
  view,
  setView,
  filter,
  setFilter,
  searchQuery,
  setSearchQuery,
  loadingChats,
  filteredChats,
  activeChat,
  openChat,
  startDirect,
  offices,
  myOfficeId,
  showChatOptions,
  setShowChatOptions,
  handleChatAction,
  groupName,
  setGroupName,
  selectedOffices,
  toggleOffice,
  createGroup,
  userInfo
}) {
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="chat-left">
      <div className="chat-left-header">
        <h3>Chats</h3>
        <div className="chat-left-actions">
          <button className={`chip ${view==='newDirect'?'active':''}`} onClick={() => setView('newDirect')}>New Chat</button>
          <button className={`chip ${view==='newGroup'?'active':''}`} onClick={() => setView('newGroup')}>New Group</button>
        </div>
      </div>

      {/* Search bar */}
      <div className="chat-search-container">
        <input
          type="text"
          className="chat-search-input"
          placeholder="Search chats..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
        {searchQuery && (
          <button className="chat-search-clear" onClick={clearSearch}>
            ×
          </button>
        )}
      </div>

      {/* Filter buttons */}
      <div className="chat-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={`filter-btn ${filter === 'individual' ? 'active' : ''}`}
          onClick={() => setFilter('individual')}
        >
          Individual
        </button>
        <button 
          className={`filter-btn ${filter === 'groups' ? 'active' : ''}`}
          onClick={() => setFilter('groups')}
        >
          Groups
        </button>
      </div>

      {/* Archived chats link */}
      {view !== 'archived' && (
        <div className="archived-chats-link">
          <button onClick={() => setView('archived')}>
            View Archived Chats
          </button>
        </div>
      )}

      {view === 'archived' && (
        <div className="archived-chats-header">
          <h4>Archived Chats</h4>
          <button onClick={() => setView('chats')}>Back to Active</button>
        </div>
      )}

      {view === 'chats' && (
        <div className="chat-list">
          {loadingChats && <div className="loading">Loading chats...</div>}
          {filteredChats.length === 0 ? (
            <div className="no-chats-message">
              {searchQuery ? 'No matching chats found' : `No ${filter === 'all' ? '' : filter} chats`}
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={`chat-list-item ${activeChat && activeChat.id === chat.id ? 'active' : ''}`}
              >
                <div className="chat-item-content" onClick={() => openChat(chat)}>
                  <ChatAvatar chat={chat} userInfo={userInfo} size={48} />
                  
                  <div className="cli-content">
                    <div className="cli-title">
                      <span className="cli-name">
                        {chat.is_group 
                          ? (chat.name || 'Group') 
                          : (chat.participants?.find(p => p.id !== userInfo?.id)?.name || 'Unknown')
                        }
                        {chat.pinned && <span className="pin-indicator"> 📌</span>}
                      </span>
                    </div>
                    <div className="cli-preview">
                      {chat.last_message ? (
                        <>
                          <span className="cli-sender">
                            {chat.last_message.sender.first_name}:
                          </span>
                          <span className="cli-text">
                            {chat.last_message.is_deleted ? 'Message deleted' : (chat.last_message.content || (chat.last_message.voice_note ? '🎤 Voice note' : ''))}
                          </span>
                          <span className="cli-time">{chat.last_message.ago}</span>
                        </>
                      ) : (
                        <span className="cli-text empty">No messages yet</span>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  className="chat-options-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowChatOptions(chat);
                  }}
                >
                  ⋮
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {view === 'newDirect' && (
        <div className="new-chat">
          <h4>Start a direct chat</h4>
          <div className="office-list">
            {offices.filter(o => o.id !== myOfficeId).map((o) => (
              <button key={o.id} className="office-item" onClick={() => startDirect(o.id)}>{o.name}</button>
            ))}
          </div>
          <button className="secondary" onClick={() => setView('chats')}>Back</button>
        </div>
      )}

      {view === 'newGroup' && (
        <div className="new-group">
          <h4>Create a group</h4>
          <input 
            className="input" 
            placeholder="Group name" 
            value={groupName} 
            onChange={e => setGroupName(e.target.value)} 
          />
          <div className="office-picker">
            {offices.filter(o => o.id !== myOfficeId).map((o) => (
              <label key={o.id} className="office-pill">
                <input
                  type="checkbox"
                  checked={selectedOffices.includes(o.id)}
                  onChange={() => toggleOffice(o.id)}
                />
                <span>{o.name}</span>
              </label>
            ))}
          </div>
          <div className="row">
            <button className="primary" onClick={createGroup}>Create</button>
            <button className="secondary" onClick={() => setView('chats')}>Cancel</button>
          </div>
        </div>
      )}

      {view === 'archived' && (
        <div className="chat-list">
          {loadingChats && <div className="loading">Loading archived chats...</div>}
          {filteredChats.length === 0 ? (
            <div className="no-chats-message">No archived chats</div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                className="chat-list-item archived"
                onClick={() => openChat(chat)}
              >
                <ChatAvatar chat={chat} userInfo={userInfo} size={48} />
                
                <div className="cli-content">
                  <div className="cli-title">
                    <span className="cli-name">
                      {chat.is_group 
                        ? (chat.name || 'Group') 
                        : (chat.participants?.find(p => p.id !== userInfo?.id)?.name || 'Unknown')
                      }
                    </span>
                  </div>
                  <div className="cli-preview">
                    <span className="archived-label">Archived</span>
                    {chat.last_message && (
                      <span className="cli-time">{chat.last_message.ago}</span>
                    )}
                  </div>
                </div>

                <button 
                  className="chat-options-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowChatOptions(chat);
                  }}
                >
                  ⋮
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default ChatList;