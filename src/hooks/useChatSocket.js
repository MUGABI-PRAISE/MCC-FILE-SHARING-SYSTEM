// src/hooks/useChatSocket.js
import { useEffect, useRef, useCallback } from 'react';

export default function useChatSocket(token, { onEvent } = {}) {
  const wsRef = useRef(null);

  const send = useCallback((payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  useEffect(() => {
    if (!token) return;

    const url = `${process.env.REACT_APP_WS_BASE_URL}/ws/chat/?token=${token}`;
    const socket = new WebSocket(url);
    wsRef.current = socket;

    socket.onopen = () => {
      // console.log('Chat socket connected');
    };

    socket.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        onEvent && onEvent(data);
      } catch (e) {
        console.error('chat ws parse error', e);
      }
    };

    socket.onerror = (e) => {
      console.error('chat ws error', e);
    };

    socket.onclose = () => {
      // optionally reconnect
      // setTimeout(() => { ... }, 2000);
    };

    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) socket.close();
    };
  }, [token, onEvent]);

  return {
    send,
    subscribe: (chatId) => send({ action: 'subscribe', chat_id: chatId }),
    unsubscribe: (chatId) => send({ action: 'unsubscribe', chat_id: chatId }),
    sendMessage: ({ chatId, content, voiceNote, tempId }) =>
      send({ action: 'send_message', chat_id: chatId, content, voice_note: voiceNote, temp_id: tempId }),
    editMessage: ({ messageId, newContent }) =>
      send({ action: 'edit_message', message_id: messageId, new_content: newContent }),
    deleteMessageForAll: ({ messageId }) =>
      send({ action: 'delete_message', message_id: messageId, for_all: true }),
    deleteMessageForMe: ({ messageId }) =>
      send({ action: 'delete_message', message_id: messageId, for_all: false }),
    readUpTo: ({ chatId, upToMessageId }) =>
      send({ action: 'read_messages', chat_id: chatId, up_to_message_id: upToMessageId }),
  };
}
