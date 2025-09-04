// Updated ChatButton.js
import { useState } from 'react';
import '../styles/ChatButton.css';
import ChatModal from './ChatModal';

export default function ChatButton({ offices }) {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <div className="chat-fab-container">
        <button 
          className="chat-fab" 
          onClick={() => setOpen(true)} 
          title="Open chat"
          aria-label="Open chat"
        >
          <span className="chat-icon">💬</span>
        </button>
      </div>
      {open && <ChatModal onClose={() => setOpen(false)} offices={offices} />}
    </>
  );
}