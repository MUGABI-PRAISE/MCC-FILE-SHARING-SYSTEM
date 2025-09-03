// src/components/ChatButton.js
import { useState } from 'react';
import '../styles/Chat.css';
import ChatModal from './ChatModal';

export default function ChatButton({ offices }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="chat-fab" onClick={() => setOpen(true)} title="Open chat">
        💬
      </button>
      {open && <ChatModal onClose={() => setOpen(false)} offices={offices} />}
    </>
  );
}
