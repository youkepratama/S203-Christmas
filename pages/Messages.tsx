import React, { useState } from 'react';
import { MessageSquare, User, Check, Sparkles } from 'lucide-react';
import { INITIAL_MESSAGES } from '../constants';
import { Message } from '../types';

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [newMessage, setNewMessage] = useState({ name: '', content: '' });

  const handlePostMessage = () => {
    if (newMessage.name.trim() && newMessage.content.trim()) {
      const msg: Message = {
        id: Date.now().toString(),
        author: newMessage.name,
        // Random avatar from a set or placeholder
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newMessage.name)}&backgroundColor=b6e3f4`,
        content: newMessage.content,
        timestamp: 'Just now',
      };
      setMessages([msg, ...messages]);
      setNewMessage({ name: '', content: '' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 w-full">
      {/* Header */}
      <div className="text-center space-y-4 mb-10">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight font-display">
          Share the Holiday Spirit
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Write a Christmas message for your fellow S203 classmates and spread some festive cheer!
        </p>
      </div>

      {/* Composer */}
      <div className="max-w-3xl mx-auto mb-16">
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 flex gap-4 md:gap-6">
          <div className="hidden sm:block shrink-0">
             <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 overflow-hidden">
                <User size={24} />
             </div>
          </div>
          <div className="flex-1 space-y-4">
            <input
              type="text"
              placeholder="Your Name"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none text-sm bg-gray-50 focus:bg-white transition-all"
              value={newMessage.name}
              onChange={(e) => setNewMessage({ ...newMessage, name: e.target.value })}
            />
            <textarea
              placeholder="Type your message here..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none h-32 resize-none text-sm bg-gray-50 focus:bg-white transition-all"
              value={newMessage.content}
              onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
            />
            <div className="flex justify-end">
              <button
                onClick={handlePostMessage}
                disabled={!newMessage.name.trim() || !newMessage.content.trim()}
                className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm text-sm"
              >
                Submit Message
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-4">
          Messages from S203
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 flex flex-col gap-4 group"
            >
              <div className="flex items-center gap-3">
                <img
                  src={msg.avatar}
                  alt={msg.author}
                  className="w-10 h-10 rounded-full object-cover bg-gray-100"
                />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{msg.author}</h4>
                  <p className="text-xs text-gray-400">{msg.timestamp}</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{msg.content}</p>
            </div>
          ))}

          {/* Empty State / Placeholder */}
          <div className="min-h-[200px] border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 gap-3 text-gray-400">
             <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-2">
                <Sparkles size={24} />
             </div>
             <p className="font-semibold text-gray-500">No more messages yet.</p>
             <p className="text-xs max-w-[200px]">Be the next to share a Christmas wish with your classmates!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;