import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { type Vehicle, VehicleSchema } from "~/types/map";

const baseUrl = "https://gps.brtnusantara.com:5100";

interface UseSocketIOOptions {
  onVehicleUpdate?: (vehicle: Vehicle) => void;
}

export const useSocketIO = (options?: UseSocketIOOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
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

    // Listen for BRT-* events (vehicle position updates)
    socket.onAny((eventName, ...args) => {
      // Check if this is a BRT vehicle event
      if (typeof eventName === "string" && eventName.startsWith("BRT-")) {
        console.log("Vehicle update received:", eventName, args);

        // Parse the vehicle data - expecting single vehicle object or array with one vehicle
        const rawData = Array.isArray(args[0]) ? args[0][0] : args[0];

        // Validate against VehicleSchema
        const parseResult = VehicleSchema.safeParse(rawData);

        if (parseResult.success) {
          // Call the callback with validated vehicle data
          options?.onVehicleUpdate?.(parseResult.data);
        } else {
          console.error("Invalid vehicle data received:", parseResult.error);
        }
      }
    });

    // Cleanup on unmount
    return () => {
      console.log("Cleaning up Socket.IO connection");
      socket.close();
    };
  }, [options?.onVehicleUpdate]); // Re-run if callback changes

  return {
    isConnected,
    isConnecting,
    error,
  };
};
