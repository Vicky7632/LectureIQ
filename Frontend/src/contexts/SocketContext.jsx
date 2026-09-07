// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { io } from 'socket.io-client';

// const SocketContext = createContext();

// export const useSocket = () => useContext(SocketContext);

// export const SocketProvider = ({ children }) => {
//   const [socket, setSocket] = useState(null);

//   useEffect(() => {
//     const newSocket = io('http://localhost:3000', {
//   withCredentials: true,
//   transports: ['websocket', 'polling'],
//   reconnection: true,
//   reconnectionAttempts: 5,
//   reconnectionDelay: 1000,
// });
//     newSocket.on('connect', () => console.log('✅ Socket connected:', newSocket.id));
//   newSocket.on('disconnect', (reason) => console.log('❌ Socket disconnected, reason:', reason));
//   newSocket.on('connect_error', (err) => console.log('🔴 Socket connect error:', err.message));
//     setSocket(newSocket);

//     return () => {
//       console.log('🧹 Cleaning up socket...');
//       newSocket.disconnect();
//     };
//   }, []);

//   return (
//     <SocketContext.Provider value={socket}>
//       {children}
//     </SocketContext.Provider>
//   );
// };
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => console.log('✅ Socket connected:', newSocket.id));
    newSocket.on('disconnect', (reason) => console.log('❌ Socket disconnected, reason:', reason));
    newSocket.on('connect_error', (err) => console.log('🔴 Socket connect error:', err.message));

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};