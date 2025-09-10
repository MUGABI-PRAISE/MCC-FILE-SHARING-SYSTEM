// src/services/useNotifications.js
import { useEffect, useRef } from "react";

/**
 * useNotifications
 * Opens a WebSocket and streams server events to your callback.
 *
 * @param {string} token - JWT access token (required).
 * @param {(event: any) => void} onEvent - Handler for parsed messages (required).
 */
// import { useRef } from "react";

export default function useNotifications(token, onEvent) {
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  useEffect(() => {
    if (!token || wsRef.current) return; // ⛔ prevent multiple sockets

    console.log(`SOCKET PATH: ${process.env.REACT_APP_WS_BASE_URL}`);
    const wsUrl = `${process.env.REACT_APP_WS_BASE_URL}/ws/notifications/?token=${token}`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log("✅ WebSocket connected");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.type) {
          const normalized = data.payload
            ? { type: data.type, payload: data.payload }
            : data;
          onEvent(normalized);
        }
      } catch (err) {
        console.error("WS: failed to parse message", err);
      }
    };

    socket.onclose = () => {
      console.warn("❌ WS closed. Reconnecting in 3s...");
      wsRef.current = null;
      reconnectTimerRef.current = setTimeout(() => {
        wsRef.current = null;
      }, 3000);
    };

    socket.onerror = (err) => {
      console.error("⚠️ WS error", err);
      socket.close();
    };

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [token, onEvent]);
}
