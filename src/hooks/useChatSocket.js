// Example of how useChatSocket should be implemented
// src/hooks/useChatSocket.js
import { useState, useEffect, useCallback } from 'react';
import { 
  sendMessage as apiSendMessage, 
  editMessage as apiEditMessage,
  deleteMessageForAll as apiDeleteMessageForAll,
  deleteMessageForMe as apiDeleteMessageForMe,
  markMessagesAsRead as apiMarkMessagesAsRead
} from '../services/ChatApi';

export default function useChatSocket(token, { onEvent }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize WebSocket connection here
    const ws = new WebSocket(`${process.env.REACT_APP_WS_URL}/chat/?token=${token}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onEvent(data);
    };
    
    setSocket(ws);
    
    return () => {
      ws.close();
    };
  }, [token, onEvent]);

  const sendMessage = useCallback(async ({ chatId, content, voiceNote, tempId }) => {
    try {
      // Send via WebSocket for real-time
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'chat.message.send',
          chat_id: chatId,
          content,
          voice_note: voiceNote,
          temp_id: tempId
        }));
      }
      
      // Also send via API for persistence
      await apiSendMessage(chatId, content, voiceNote);
    } catch (error) {
      onEvent({ 
        type: 'error', 
        error: error.message,
        temp_id: tempId 
      });
    }
  }, [socket, onEvent]);

  const editMessage = useCallback(async ({ messageId, newContent }) => {
    try {
      // Send via WebSocket
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'chat.message.edit',
          message_id: messageId,
          content: newContent
        }));
      }
      
      // Also update via API
      await apiEditMessage(messageId, newContent);
    } catch (error) {
      onEvent({ 
        type: 'error', 
        error: error.message 
      });
    }
  }, [socket, onEvent]);

  const deleteMessageForAll = useCallback(async ({ messageId }) => {
    try {
      // Send via WebSocket
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'chat.message.delete',
          message_id: messageId
        }));
      }
      
      // Also delete via API
      await apiDeleteMessageForAll(messageId);
    } catch (error) {
      onEvent({ 
        type: 'error', 
        error: error.message 
      });
    }
  }, [socket, onEvent]);

  const deleteMessageForMe = useCallback(async ({ messageId }) => {
    try {
      // Send via WebSocket
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'chat.message.hide',
          message_id: messageId
        }));
      }
      
      // Also hide via API
      await apiDeleteMessageForMe(messageId);
    } catch (error) {
      onEvent({ 
        type: 'error', 
        error: error.message 
      });
    }
  }, [socket, onEvent]);

  const readUpTo = useCallback(async ({ chatId, upToMessageId }) => {
    try {
      // Send via WebSocket
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'chat.message.read',
          chat_id: chatId,
          up_to_message_id: upToMessageId
        }));
      }
      
      // Also mark as read via API
      await apiMarkMessagesAsRead(chatId, upToMessageId);
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }, [socket]);

  const subscribe = useCallback((chatId) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'chat.subscribe',
        chat_id: chatId
      }));
    }
  }, [socket]);

  const unsubscribe = useCallback((chatId) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'chat.unsubscribe',
        chat_id: chatId
      }));
    }
  }, [socket]);

  return {
    subscribe,
    unsubscribe,
    sendMessage,
    editMessage,
    deleteMessageForAll,
    deleteMessageForMe,
    readUpTo
  };
}