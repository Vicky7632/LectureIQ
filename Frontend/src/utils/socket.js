import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket?.connected) return;

    const url =
      import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

    this.socket = io(url, {
      withCredentials: true,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    this.socket.on("connect", () => {
      console.log("✅ Socket connected:", this.socket.id);
    });

    this.socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    this.socket.on("connect_error", (err) => {
      console.error("Connection error:", err.message);
    });

    this.socket.on("reconnect_attempt", () => {
      console.log("🔄 Reconnecting...");
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  }

  disconnect() {
    if (!this.socket) return;

    this.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
  }

  emit(event, ...args) {
    if (!this.socket?.connected) {
      console.warn(`⚠ Socket not connected. Cannot emit ${event}`);
      return;
    }
    this.socket.emit(event, ...args);
  }

  on(event, callback) {
    if (!this.socket) return;

    this.socket.on(event, callback);

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
      const updated =
        this.listeners.get(event)?.filter((cb) => cb !== callback) || [];
      this.listeners.set(event, updated);
    } else {
      this.socket.off(event);
      this.listeners.delete(event);
    }
  }

  removeAllListeners() {
    if (!this.socket) return;

    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((cb) => {
        this.socket.off(event, cb);
      });
    });

    this.listeners.clear();
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

const socketService = new SocketService();
export default socketService;