import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, User, Sparkles, Trash2, LogIn, LogOut, Send } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Message } from '../types';

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState({ name: '', content: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  const adminUser = import.meta.env.VITE_ADMIN_USER;
  const adminPass = import.meta.env.VITE_ADMIN_PASS;
  const isAdminConfigured = useMemo(() => Boolean(adminUser && adminPass), [adminUser, adminPass]);

  // Ambil pesan dari Supabase saat pertama kali load
  useEffect(() => {
    const fetchMessages = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setMessages(
          data.map((m) => ({
            id: m.id,
            author: m.author,
            avatar:
              m.avatar ??
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.author)}&backgroundColor=b6e3f4`,
            content: m.content,
            timestamp: m.created_at ? new Date(m.created_at).toLocaleString() : 'Just now',
          }))
        );
      } else if (error) {
        setAuthError(error.message);
      }
    };
    fetchMessages();
  }, []);

  // Kirim pesan ke Supabase
  const handlePostMessage = async () => {
    if (!supabase) {
      setAuthError('Supabase not configured (check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)');
      return;
    }
    if (!newMessage.name.trim() || !newMessage.content.trim()) return;

    setIsSubmitting(true);
    setAuthError(null);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        author: newMessage.name.trim(),
        content: newMessage.content.trim(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newMessage.name)}&backgroundColor=b6e3f4`,
      })
      .select()
      .single();

    if (error) {
      setAuthError(error.message);
    } else if (data) {
      setMessages([
        {
          id: data.id,
          author: data.author,
          avatar: data.avatar,
          content: data.content,
          timestamp: data.created_at ? new Date(data.created_at).toLocaleString() : 'Just now',
        },
        ...messages,
      ]);
      setNewMessage({ name: '', content: '' });
    }

    setIsSubmitting(false);
  };

  // Login admin sederhana (username/password dari env)
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminConfigured) {
      setAuthError('Set VITE_ADMIN_USER dan VITE_ADMIN_PASS dulu.');
      return;
    }
    if (loginForm.username === adminUser && loginForm.password === adminPass) {
      setIsAdmin(true);
      setAuthError(null);
      setLoginForm({ username: '', password: '' });
    } else {
      setAuthError('Invalid admin username or password.');
    }
  };

  // Hapus pesan (butuh admin)
  const handleDelete = async (id: string) => {
    if (!isAdmin || !supabase) return;
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (!error) {
      setMessages(messages.filter((m) => m.id !== id));
    } else {
      setAuthError(error.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 w-full">
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
                disabled={isSubmitting || !newMessage.name.trim() || !newMessage.content.trim()}
                className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm text-sm flex items-center gap-2"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Message'}
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-4">
          Messages from S203
        </h2>

        {/* Admin login / status */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 max-w-xl">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            {isAdmin ? <LogOut size={18} /> : <LogIn size={18} />}
            <span>{isAdmin ? 'Admin mode enabled' : 'Admin login'}</span>
          </div>
          {isAdmin ? (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Delete buttons are visible. Remember to log out when finished.</span>
              <button
                onClick={() => {
                  setIsAdmin(false);
                  setAuthError(null);
                }}
                className="text-blue-600 font-semibold hover:underline"
              >
                Log out
              </button>
            </div>
          ) : (
            <form className="grid grid-cols-1 sm:grid-cols-3 gap-3" onSubmit={handleAdminLogin}>
              <input
                type="text"
                placeholder="Username"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
              >
                Login
              </button>
            </form>
          )}
          {authError && <p className="text-sm text-red-600">{authError}</p>}
          {!isAdminConfigured && (
            <p className="text-xs text-amber-600">
              Admin credentials not set. Add VITE_ADMIN_USER and VITE_ADMIN_PASS in .env.local.
            </p>
          )}
        </div>

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
              {isAdmin && (
                <button
                  onClick={() => handleDelete(msg.id)}
                  className="self-end flex items-center gap-2 text-xs text-red-600 font-semibold hover:text-red-700"
                >
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
          ))}

          {messages.length === 0 && (
            <div className="min-h-[200px] border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 gap-3 text-gray-400">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-2">
                <Sparkles size={24} />
              </div>
              <p className="font-semibold text-gray-500">No messages yet.</p>
              <p className="text-xs max-w-[200px]">Be the first to share a Christmas wish!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
