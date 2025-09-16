// ChatButton.js
import { useEffect, useState } from 'react';
import '../styles/ChatButton.css';
import ChatModal from './chat/ChatModal';


export default function ChatButton({ offices, initialTotalUnread = 0 }) {
  const [open, setOpen] = useState(false);
  const [totalUnread, setTotalUnread] = useState(initialTotalUnread);

  // NOTE:
  // If you have a global store for unread counts (e.g., Redux or context),
  // wire it here. For now we keep it local. When ChatModal mounts it can
  // send an event or set up a shared callback to update this badge.
  // For a temporary approach: listen to window events for unread changes:
  useEffect(() => {
    const handler = (e) => {
      if (e?.detail?.type === 'chat:unread:update') {
        setTotalUnread(e.detail.total || 0);
      }
    };
    window.addEventListener('chat:unread:update', handler);
    return () => window.removeEventListener('chat:unread:update', handler);
  }, []);

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
          {totalUnread > 0 && <span className="fab-badge">{totalUnread}</span>}
        </button>
      </div>
      {open && <ChatModal onClose={() => setOpen(false)} offices={offices} />}
    </>
  );
}
