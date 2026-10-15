import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { SharedSocketContext } from './socketContextHooks';
import {
  resolveSocketUrl,
  socketClientOptions,
} from './socketClientConfig';

let sharedSocket = null;
let disconnectTimer = null;

export const SocketProvider = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [connection, setConnection] = useState({ socket: null, error: '' });

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    if (disconnectTimer) {
      clearTimeout(disconnectTimer);
      disconnectTimer = null;
    }

    if (!sharedSocket) {
      const socketUrl = resolveSocketUrl({
        configuredSocketUrl: import.meta.env.VITE_SOCKET_URL,
        configuredApiUrl: import.meta.env.VITE_API_URL,
        isDevelopment: import.meta.env.DEV,
        frontendOrigin: window.location.origin,
      });
      sharedSocket = io(socketUrl, socketClientOptions);
    }

    const socket = sharedSocket;
    const handleConnect = () => {
      console.info('Socket connected');
      setConnection({ socket, error: '' });
    };
    const handleDisconnect = (reason) => {
      console.info('Socket disconnected:', reason);
      setConnection({ socket, error: 'Disconnected. Reconnecting…' });
    };
    const handleConnectError = (error) => {
      console.error('Socket connection failed:', error.message);
      setConnection({ socket, error: error.message });
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    if (socket.connected) {
      queueMicrotask(handleConnect);
    } else {
      socket.connect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);

      disconnectTimer = setTimeout(() => {
        if (sharedSocket === socket) {
          socket.disconnect();
          sharedSocket = null;
        }
        disconnectTimer = null;
      }, 0);
    };
  }, [isAuthenticated]);

  const contextValue = isAuthenticated ? connection : { socket: null, error: '' };

  return (
    <SharedSocketContext.Provider value={contextValue}>
      {children}
    </SharedSocketContext.Provider>
  );
};