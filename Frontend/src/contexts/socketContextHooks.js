import { createContext, useContext } from 'react';

export const SharedSocketContext = createContext({ socket: null, error: '' });

export const useSocket = () => useContext(SharedSocketContext).socket;
export const useSocketError = () => useContext(SharedSocketContext).error;
