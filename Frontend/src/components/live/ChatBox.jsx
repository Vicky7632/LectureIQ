import React, { useState, useEffect, useRef } from 'react';
import { useSocket, useSocketError } from '../../contexts/socketContextHooks';
import { useSelector } from 'react-redux';

const ChatBox = ({ isOpen, onClose, lectureId, roomJoined }) => {
  const { user } = useSelector((state) => state.auth);
  const socket = useSocket();
  const connectionError = useSocketError();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (payload) => {
      if (payload?.lectureId !== lectureId || !payload.message?.id) return;
      setMessages((previous) => {
        if (previous.some((message) => message.id === payload.message.id)) {
          return previous;
        }
        return [...previous, payload.message];
      });
    };

    const handleConnectError = (connectError) => {
      setError(connectError.message || 'Unable to connect to live chat.');
    };
    const handleConnect = () => setError('');
    const handleDisconnect = () => setError('Disconnected. Reconnecting to live chat…');

    socket.on('lecture:receiveMessage', handleMessage);
    socket.on('connect_error', handleConnectError);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('lecture:receiveMessage', handleMessage);
      socket.off('connect_error', handleConnectError);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket, lectureId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !socket || !roomJoined) return;

    socket.emit('lecture:sendMessage', { lectureId, text }, (response) => {
      if (!response?.ok) {
        setError(response?.error || 'Message could not be sent.');
        return;
      }
      setError('');
      setInput('');
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white shadow-xl rounded-lg border flex flex-col z-50">
      <div className="flex justify-between items-center p-3 border-b">
        <h3 className="font-semibold">Live Chat</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 h-64 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender.id === user?._id ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-3 py-2 rounded-lg max-w-xs ${
              msg.sender.id === user?._id ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}>
            <p className="text-xs font-bold mb-1">
              {msg.sender.id === user?._id
                ? 'You'
                : `${msg.sender.firstName} ${msg.sender.lastName}`.trim()}
            </p>
            <p>{msg.text}</p>
            <time className="mt-1 block text-right text-xs opacity-75" dateTime={msg.createdAt}>
              {new Date(msg.createdAt).toLocaleTimeString()}
            </time>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="p-3 border-t flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded-l px-2 py-1 text-sm"
          placeholder="Type a message..."
          maxLength={1000}
          disabled={!roomJoined || !socket?.connected}
        />
        <button
          type="submit"
          disabled={!roomJoined || !socket?.connected || !input.trim()}
          className="bg-blue-500 text-white px-3 py-1 rounded-r text-sm disabled:opacity-50"
        >
          Send
        </button>
      </form>
      {(error || connectionError) && (
        <p role="alert" className="px-3 pb-3 text-sm text-red-600">
          {error || connectionError}
        </p>
      )}
      {!error && !connectionError && !socket?.connected && (
        <p className="px-3 pb-3 text-sm text-gray-500">Connecting to live chat…</p>
      )}
      {!error && !connectionError && socket?.connected && !roomJoined && (
        <p className="px-3 pb-3 text-sm text-gray-500">Joining live chat…</p>
      )}
    </div>
  );
};

export default ChatBox;