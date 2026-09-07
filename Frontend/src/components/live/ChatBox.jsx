import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ChatBox = ({ isOpen, onClose }) => {
  const { sessionId } = useParams();
  const { user } = useSelector((state) => state.auth);
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('lecture:receiveMessage', handleMessage);
    return () => socket.off('lecture:receiveMessage', handleMessage);
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const messageData = {
      sessionId,
      message: input,
      userId: user?._id,
      senderName: `${user?.firstName} ${user?.lastName}`,
    };
    socket.emit('lecture:sendMessage', messageData);
    setInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white shadow-xl rounded-lg border flex flex-col z-50">
      <div className="flex justify-between items-center p-3 border-b">
        <h3 className="font-semibold">Live Chat</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 h-64 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.userId === user?._id ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-3 py-2 rounded-lg max-w-xs ${
              msg.userId === user?._id ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}>
              {msg.userId !== user?._id && (
                <p className="text-xs font-bold mb-1">{msg.senderName}</p>
              )}
              <p>{msg.message}</p>
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
        />
        <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded-r text-sm">Send</button>
      </form>
    </div>
  );
};

export default ChatBox;