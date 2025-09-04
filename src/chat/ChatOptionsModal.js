// src/components/ChatOptionsModal.js
import React from 'react';
import Modal from '../components/Modal';
function ChatOptionsModal({ chat, onAction, onClose }) {
  const isArchived = chat.archived;
  const isPinned = chat.pinned;

  const handleAction = (action) => {
    onAction(action, chat.id);
  };

  return (
    <Modal onClose={onClose}>
      <div className="chat-options-modal">
        <h3>Chat Options</h3>
        
        <div className="options-list">
          {isPinned ? (
            <button onClick={() => handleAction('unpin')}>
              Unpin Chat
            </button>
          ) : (
            <button onClick={() => handleAction('pin')}>
              Pin Chat
            </button>
          )}
          
          {isArchived ? (
            <button onClick={() => handleAction('unarchive')}>
              Unarchive Chat
            </button>
          ) : (
            <button onClick={() => handleAction('archive')}>
              Archive Chat
            </button>
          )}
          
          <button 
            className="danger" 
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this chat?')) {
                handleAction('delete');
              }
            }}
          >
            Delete Chat
          </button>
        </div>
        
        <div className="modal-actions">
          <button className="secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
}

export default ChatOptionsModal;