// src/components/MessageList.js
import React from 'react';
import ExpandableText from './ExpandableText';

function MessageList({
  messages,
  loadingMessages,
  activeChat,
  userInfo,
  myOfficeId,
  messagesContainerRef,
  bottomRef,
  editMessage,
  deleteMessageForAll,
  deleteMessageForMe,
  computeStatus,
  isMine,
  canEditMsg
}) {

  const handleEdit = async (msg) => {
    const newContent = prompt('Edit message:', msg.content);
    if (newContent === null) return;
    editMessage({ messageId: msg.id, newContent });
  };

  const handleDeleteForAll = (msg) => {
    if (!window.confirm('Delete for everyone?')) return;
    deleteMessageForAll({ messageId: msg.id });
  };

  const handleDeleteForMe = (msg) => {
    if (!window.confirm('Delete for me (local only)?')) return;
    deleteMessageForMe({ messageId: msg.id });
  };

  return (
    <div className="chat-messages" ref={messagesContainerRef}>
      {loadingMessages && <div className="loading">Loading messages...</div>}
      {messages.map((m) => {
        const mine = isMine(m, userInfo.id);
        const side = mine ? 'right' : 'left';
        const status = mine ? computeStatus(m, activeChat, myOfficeId) : null;
        const canEdit = canEditMsg(m, userInfo.id);
        
        return (
          <div key={m.id || m.temp_id} className={`msg-row ${side}`}>
            {/* Show sender name in group chats */}
            {activeChat.is_group && !mine && (
              <div className="msg-sender-name">
                {m.sender?.first_name} {m.sender?.last_name}
              </div>
            )}
            
            <div className={`msg-bubble ${mine ? 'mine' : 'theirs'}`}>
              {m.is_deleted ? (
                <div className="deleted-text">This message was deleted</div>
              ) : (
                <>
                  {m.content && (
                    <div className="msg-text">
                      <ExpandableText text={m.content} />
                    </div>
                  )}
                  {m.voice_note && (
                    <div className="voice-note">
                      <audio controls src={m.voice_note} />
                    </div>
                  )}
                </>
              )}

              <div className="msg-meta">
                <span className="time">{formatTime(m.created_at)}</span>
                {mine && (
                  <span className={`ticks ${status}`}>
                    {status === 'sending' && '⏳'}
                    {status === 'sent' && '✓'}
                    {status === 'delivered' && '✓✓'}
                    {status === 'read' && '✓✓'}
                  </span>
                )}
              </div>
            </div>

            {/* Message actions */}
            {!m.is_deleted && (
              <div className={`msg-actions ${mine ? 'mine' : ''}`}>
                {mine && canEdit && (
                  <button className="icon-btn" title="Edit" onClick={() => handleEdit(m)}>
                    ✏️
                  </button>
                )}
                {mine && (
                  <button className="icon-btn" title="Delete for everyone" onClick={() => handleDeleteForAll(m)}>
                    🗑️
                  </button>
                )}
                {!mine && (
                  <button className="icon-btn" title="Delete for me" onClick={() => handleDeleteForMe(m)}>
                    🙈
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

// Helper function
function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default MessageList;