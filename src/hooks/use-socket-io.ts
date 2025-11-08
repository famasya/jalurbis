import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

const baseUrl = "https://gps.brtnusantara.com:5100";

export const useSocketIO = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Create socket instance with Socket.IO client
    const socket: Socket = io(baseUrl, {
      path: "/socket.io",
      transports: ["websocket", "polling"], // Try WebSocket first, fallback to polling
      extraHeaders: {
        Origin: "wss://gps.brtnusantara.com:5100",
      },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection event listeners
    socket.on("connect", () => {
      console.log("Socket.IO connected with sid:", socket.id);
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket.IO disconnected:", reason);
      setIsConnected(false);
      setIsConnecting(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket.IO connection error:", err);
      setError(err);
      setIsConnecting(false);
      setIsConnected(false);
    });

    socket.on("error", (err) => {
      console.error("Socket.IO error:", err);
      setError(err);
    });

    // Listen for all events from server
    socket.onAny((eventName, ...args) => {
      console.log("Socket.IO event received:", eventName, args);
      setData({
        event: eventName,
        payload: args,
        timestamp: Date.now(),
      });
    });

    // Cleanup on unmount
    return () => {
      console.log("Cleaning up Socket.IO connection");
      socket.close();
    };
  }, []); // Empty dependency array - only run once on mount

  return {
    isConnected,
    isConnecting,
    data,
    error,
  };
};
