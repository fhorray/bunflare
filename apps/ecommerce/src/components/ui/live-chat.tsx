import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MessageCircle, Send, X, Bot, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { $user } from '../../client/store';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  senderName?: string;
}

export function EdgeLiveChat() {
  const user = useStore($user);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Support is online. How can we help with your order?",
      sender: 'agent',
      timestamp: new Date()
    }
  ]);
  const [status, setStatus] = useState<'connecting' | 'online' | 'error'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Stable identity to prevent session fragmentation
  const identity = useMemo(() => {
    if (user) return { id: user.id, name: user.name };
    
    let anonId = sessionStorage.getItem('chat_anon_id');
    if (!anonId) {
      anonId = Math.floor(1000 + Math.random() * 9000).toString();
      sessionStorage.setItem('chat_anon_id', anonId);
    }
    return { id: `anon_${anonId}`, name: `Anonymous #${anonId}` };
  }, [user]);

  useEffect(() => {
    if (isOpen && !wsRef.current) {
      connect();
    }
  }, [isOpen, identity]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const connect = () => {
    if (wsRef.current) wsRef.current.close();
    
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const params = new URLSearchParams({
        userId: identity.id,
        name: identity.name,
        admin: 'false'
      });
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/support?${params.toString()}`);
      
      ws.onopen = () => setStatus('online');
      ws.onclose = () => {
        setStatus('connecting');
        wsRef.current = null;
      };
      ws.onerror = () => setStatus('error');
      
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(typeof e.data === 'string' ? e.data : new TextDecoder().decode(e.data));
          
          if (data.userId === identity.id) {
            setMessages(prev => {
              // 1. Check for duplicates (history replay or other tabs)
              if (prev.find(m => m.id === data.id)) return prev;
              
              // 2. Clear out any "local pending" messages that match this text if they exist
              const filtered = prev.filter(m => !(m.id.startsWith('pending_') && m.text === data.text));
              
              return [...filtered, {
                id: data.id,
                text: data.text,
                sender: data.sender === 'agent' ? 'agent' : 'user',
                timestamp: new Date(data.timestamp),
                senderName: data.senderName
              }];
            });
          }
        } catch (err) {
          console.error("Failed to parse message", err);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      setStatus('error');
    }
  };

  const sendMessage = () => {
    if (!message.trim() || !wsRef.current || status !== 'online') return;
    
    const text = message.trim();
    const pendingId = `pending_${Date.now()}`;

    // Add local echo immediately for responsiveness
    setMessages(prev => [...prev, {
        id: pendingId,
        text: text,
        sender: 'user',
        timestamp: new Date(),
        senderName: identity.name
    }]);

    wsRef.current.send(JSON.stringify({ text }));
    setMessage('');
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] font-sans">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-3 bg-slate-900 text-white px-6 py-4 shadow-2xl hover:bg-blue-600 transition-all group"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Support</span>
            <div className="relative">
              <MessageCircle className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full border-2 border-slate-900 group-hover:border-blue-600" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="w-96 bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Precision Header */}
            <div className="bg-slate-900 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-blue-600 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-white leading-none">Global Support</h3>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-[9px] font-bold uppercase text-slate-400 tracking-tighter">
                      {status === 'online' ? 'Systems Nominal' : 'Reconnecting...'}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-500 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Message Area */}
            <div 
              ref={scrollRef}
              className="h-[400px] overflow-y-auto p-6 bg-slate-50 space-y-4 scroll-smooth"
            >
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${msg.sender === 'user' ? 'order-1' : 'order-1'}`}>
                    <div className={`p-4 text-xs leading-relaxed font-medium ${
                      msg.sender === 'user' 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'bg-white border border-slate-200 text-slate-900 shadow-sm'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] font-bold uppercase text-slate-400 mt-2 block tracking-tight">
                      {msg.sender === 'user' ? 'Verified Buyer' : 'Agent Support'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Wrapper */}
            <div className="p-4 bg-white border-t border-slate-200">
              <div className="relative group flex items-center">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your message..."
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-xs focus:outline-none focus:border-blue-600 focus:bg-white transition-all pr-12"
                />
                <button
                  onClick={sendMessage}
                  disabled={!message.trim() || status !== 'online'}
                  className="absolute right-2 p-2 text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-slate-300">
                <span>Secure Edge Connection</span>
                <div className="flex items-center gap-1 text-blue-500">
                  <Check className="h-3 w-3" />
                  <span>Verified</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
