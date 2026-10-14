import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { SharedSocketContext } from './socketContextHooks';

export const SocketProvider = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [connection, setConnection] = useState({ socket: null, error: '' });

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
    const sharedSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    sharedSocket.on('connect', () => {
      console.info('Socket connected');
      setConnection({ socket: sharedSocket, error: '' });
    });
    sharedSocket.on('disconnect', (reason) => {
      console.info('Socket disconnected:', reason);
      setConnection({ socket: sharedSocket, error: 'Disconnected. Reconnecting…' });
    });
    sharedSocket.on('connect_error', (error) => {
      console.error('Socket connection failed:', error.message);
      setConnection({ socket: sharedSocket, error: error.message });
    });

    return () => sharedSocket.disconnect();
  }, [isAuthenticated]);

  const contextValue = isAuthenticated ? connection : { socket: null, error: '' };

  return (
    <SharedSocketContext.Provider value={contextValue}>
      {children}
    </SharedSocketContext.Provider>
  );
};