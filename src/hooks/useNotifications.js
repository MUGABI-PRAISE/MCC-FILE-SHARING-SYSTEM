// src/services/useNotifications.js
import { useEffect, useRef } from "react";

/**
 * useNotifications
 * Opens a WebSocket and streams server events to your callback.
 *
 * @param {string} token - JWT access token (required).
 * @param {(event: any) => void} onEvent - Handler for parsed messages (required).
 */
export default function useNotifications(token, onEvent) {
  const wsRef = useRef(null);

  useEffect(() => {
    if (!token || typeof onEvent !== "function") return;

    let socket;
    let reconnectTimer;

    const connect = () => {
      const wsUrl = `${process.env.REACT_APP_WS_BASE_URL}/ws/notifications/?token=${token}`;

      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        // Connected ✅
        console.log("WebSocket connected");
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Some server messages look like: { type: "file.shared", payload: {...} }
          // Others (like your chat echo) may not have payload wrapper.
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
        // Optionally auto-reconnect after a short delay
        // console.warn("WS: closed. Reconnecting in 3s...");
        // reconnectTimer = setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error("WS: error", err);
        // Close to trigger onclose (and optional reconnect)
        socket.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [token, onEvent]);
}
