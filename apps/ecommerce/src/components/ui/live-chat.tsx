import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { MessageSquare, X, Send, ShieldCheck, User } from 'lucide-react';
import { Button } from './button';
import { $user } from '@/client/store';

export function EdgeLiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{from: string, role?: string, text: string, time?: string}[]>([]);
  const [input, setInput] = useState('');
  const user = useStore($user);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (isOpen && !ws.current) {
       const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
       ws.current = new WebSocket(`${protocol}//${window.location.host}/ws/support`);
       
       ws.current.onmessage = (event) => {
           try {
              const data = JSON.parse(event.data);
              // Only add if it's not from ourselves (Durable Objects ws.publish sends to everyone)
              // Actually ws.publish in DO sends to everyone except the sender if use 'exclude' is used,
              // but Bunflare's default ws.publish sends to all matching subscribers.
              // To simplify, we keep all and the UI handles the 'You' side.
              setMessages(prev => [...prev, { from: data.from, role: data.role, text: data.text, time: data.time }]);
           } catch(e) {
              setMessages(prev => [...prev, { from: 'Unknown', text: event.data }]);
           }
       };
       ws.current.onopen = () => {
           setMessages(prev => [...prev, { from: 'System', text: '[Connected to Edge Support Node]' }]);
       };
    }
    return () => {
       if (!isOpen && ws.current) {
          ws.current.close();
          ws.current = null;
          setMessages([]);
       }
    };
  }, [isOpen]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !ws.current) return;
    
    const payload = {
        from: user?.name || 'Anonymous',
        role: user?.role || 'user',
        text: input
    };

    ws.current.send(JSON.stringify(payload));
    setInput('');
  };

  if (!isOpen) {
     return (
        <button 
           onClick={() => setIsOpen(true)}
           className="fixed bottom-6 right-6 bg-slate-900 text-white p-4 rounded-none shadow-xl hover:bg-blue-600 transition-colors z-50 flex items-center gap-3"
        >
           <MessageSquare className="h-5 w-5" />
           <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Edge Support</span>
        </button>
     );
  }

  return (
      <div className="fixed bottom-6 right-6 w-80 bg-white border border-slate-200 shadow-2xl z-50 flex flex-col">
          <div className="bg-slate-900 text-white p-4 flex justify-between items-center border-b border-transparent">
             <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Live Node Chat</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-slate-400">
                    <User className="h-2 w-2" />
                    <span>Active as {user?.name || 'Guest'} ({user?.role || 'user'})</span>
                </div>
             </div>
             <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
             </button>
          </div>
          
          <div className="flex-1 p-4 h-80 overflow-y-auto space-y-4 bg-slate-50 text-xs font-mono">
             {messages.map((msg, i) => (
                 <div key={i} className={`flex flex-col ${msg.from === user?.name ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1 mb-1">
                        {msg.role === 'admin' && <ShieldCheck className="h-3 w-3 text-blue-600" />}
                        <span className={`text-[9px] font-bold uppercase ${msg.from === user?.name ? 'text-blue-600' : 'text-slate-400'}`}>
                            {msg.from === user?.name ? 'You' : msg.from}
                        </span>
                    </div>
                    <div className={`p-3 max-w-[85%] ${msg.from === user?.name ? 'bg-blue-600 text-white' : msg.from === 'System' ? 'bg-slate-200 text-slate-600 italic' : 'bg-white border border-slate-200 text-slate-900'}`}>
                       {msg.text}
                    </div>
                 </div>
             ))}
          </div>
          
          <form onSubmit={sendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              <input 
                 type="text" 
                 value={input}
                 onChange={e => setInput(e.target.value)}
                 placeholder="Transmit message..."
                 className="flex-1 h-10 px-3 text-xs border border-slate-200 focus:outline-none focus:border-blue-600 rounded-none bg-slate-50"
              />
              <Button type="submit" size="icon" className="h-10 w-10 rounded-none bg-slate-900 hover:bg-blue-600">
                  <Send className="h-4 w-4" />
              </Button>
          </form>
      </div>
  );
}
