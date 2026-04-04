import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wifi, WifiOff, Zap, Send, MessageSquare } from 'lucide-react';

export function RealtimeView() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected');
  const [messages, setMessages] = useState<
    { id: number; text: string; type: 'in' | 'out' | 'sys' }[]
  >([]);
  const [inputMessage, setInputMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const connectWs = () => {
    setWsStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);

    socket.onopen = () => {
      setWsStatus('connected');
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text: 'Connected to edge hub', type: 'sys' },
      ]);
    };

    socket.onmessage = (event) => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text: event.data, type: 'in' },
      ]);
    };

    socket.onclose = () => {
      setWsStatus('disconnected');
      setWs(null);
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text: 'Disconnected', type: 'sys' },
      ]);
    };

    setWs(socket);
  };

  const disconnectWs = () => {
    ws?.close();
  };

  const sendMessage = () => {
    if (ws && inputMessage) {
      ws.send(inputMessage);
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text: inputMessage, type: 'out' },
      ]);
      setInputMessage('');
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Wifi className="w-6 h-6 text-teal-600" />
          Real-time Architecture
        </h2>
        <p className="text-slate-500 text-sm">
          Visualize bi-directional data flow powered by Cloudflare's
          WebSocketPair.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="py-0 flex flex-col border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-teal-600" />
                <div>
                  <CardTitle className="text-base font-bold">
                    Message Hub
                  </CardTitle>
                  <CardDescription className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Websockets (Wss)
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {wsStatus === 'connected' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={disconnectWs}
                    className="h-8 px-4 text-[10px] font-bold border-slate-200 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <WifiOff className="w-3 h-3 mr-2" /> DISCONNECT
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={connectWs}
                    disabled={wsStatus === 'connecting'}
                    className="h-8 px-4 text-[10px] font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors"
                  >
                    <Wifi className="w-3 h-3 mr-2" />{' '}
                    {wsStatus === 'connecting' ? 'CONNECTING...' : 'CONNECT'}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-6 flex-1 flex flex-col">
            <div
              ref={scrollRef}
              className="flex-1 bg-slate-50 rounded-lg border border-slate-200 p-4 overflow-y-auto space-y-4 min-h-[350px] shadow-inner"
            >
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                  <Zap className="w-8 h-8 opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    Connect to participate
                  </p>
                </div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.type === 'out' ? 'items-end' : m.type === 'sys' ? 'items-center' : 'items-start'}`}
                >
                  <div
                    className={`px-4 py-2 rounded-lg max-w-[80%] text-sm transition-colors ${
                      m.type === 'out'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : m.type === 'sys'
                          ? 'bg-slate-200/50 text-[9px] text-slate-500 tracking-wider uppercase font-bold py-0.5 px-2 rounded-full border border-slate-200'
                          : 'bg-white border border-slate-200 text-slate-800 shadow-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.type !== 'sys' && (
                    <span className="text-[9px] text-slate-400 mt-1 px-1 font-mono">
                      {new Date(m.id).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  wsStatus === 'connected'
                    ? 'Type your message...'
                    : 'Establish a connection first'
                }
                disabled={wsStatus !== 'connected'}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="h-10 bg-transparent border-none focus-visible:ring-0 placeholder:text-slate-400 text-slate-700"
              />
              <Button
                onClick={sendMessage}
                disabled={wsStatus !== 'connected' || !inputMessage}
                size="icon"
                className="h-10 w-10 bg-slate-900 hover:bg-slate-800 text-white rounded-md transition-colors"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
