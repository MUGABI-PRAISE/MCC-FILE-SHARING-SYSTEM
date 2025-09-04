// src/components/MessageComposer.js
import React from 'react';

function MessageComposer({
  input,
  setInput,
  recording,
  handleSend,
  startRecording,
  stopRecording,
  showEmojiPicker,
  setShowEmojiPicker
}) {

  const onSend = () => {
    const content = input.trim();
    if (!content) return;
    handleSend(content);
    setInput('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="chat-composer">
      <button 
        className="emoji-btn"
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        title="Add emoji"
      >
        😊
      </button>
      
      <input
        className="input"
        placeholder="Type a message"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
      />
      
      <button 
        className={`mic-btn ${recording ? 'rec' : ''}`} 
        onClick={recording ? stopRecording : startRecording}
        title={recording ? 'Stop recording' : 'Record voice message'}
      >
        {recording ? '■' : '🎤'}
      </button>
      
      <button 
        className="send-btn" 
        onClick={onSend}
        disabled={!input.trim()}
      >
        Send
      </button>
    </div>
  );
}

export default MessageComposer;