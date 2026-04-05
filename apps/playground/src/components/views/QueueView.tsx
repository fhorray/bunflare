import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Layers, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Play
} from 'lucide-react';

export function QueueView() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [logs, setLogs] = useState<{ id: string; body: any; status: string; time: string }[]>([]);

  const sendToQueue = async () => {
    if (!message) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/queue/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: message })
      });
      const data = await res.json() as any;
      if (data.success) {
        setStatus('success');
        setMessage('');
        setTimeout(() => setStatus('idle'), 2000);
      } else {
        setStatus('error');
      }
    } catch (e) {
      setStatus('error');
    }
  };

  const refreshLogs = async () => {
    try {
      const res = await fetch('/api/queue/logs');
      const data = await res.json() as any;
      setLogs(data.logs || []);
    } catch (e) {}
  };

  const triggerMockBatch = async () => {
    try {
      const res = await fetch('/api/queue/mock', { method: 'POST' });
      const data = await res.json() as any;
      if (data.success) {
        refreshLogs();
      }
    } catch (e) {}
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Message Queues</h2>
        <p className="text-slate-500 max-w-2xl leading-relaxed">
          Guaranteed delivery and background processing. Use the <code>queue()</code> helper to
          define consumers that scale automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 glass-card bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-100 font-bold uppercase tracking-wider text-[10px]">TEST_QUEUE</Badge>
            </div>
            <CardTitle className="text-slate-900">Producer</CardTitle>
            <CardDescription className="text-slate-500">Send a message into the queue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Message Body</label>
              <Input 
                placeholder='{ "email": "test@example.com" }' 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-300 focus:ring-indigo-500"
              />
            </div>
            <Button 
              className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm border-0 font-semibold" 
              onClick={sendToQueue}
              disabled={status === 'sending'}
            >
              {status === 'sending' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {status === 'sending' ? 'Sending...' : 'Enqueue Message'}
            </Button>
            
            {status === 'success' && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 p-2 rounded border border-emerald-100">
                <CheckCircle2 className="w-3 h-3" /> Message accepted
              </div>
            )}
            {status === 'error' && (
              <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-100">
                <AlertCircle className="w-3 h-3" /> Failed to send message
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 glass-card bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 mb-2">
            <div>
              <CardTitle className="text-slate-900">Consumer Logs</CardTitle>
              <CardDescription className="text-slate-500">Real-time processing results</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={refreshLogs} className="hover:bg-slate-100 text-slate-400 hover:text-slate-900">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest text-left font-bold border-b border-slate-200">
                    <th className="px-4 py-3 font-bold">Timestamp</th>
                    <th className="px-4 py-3 font-bold">Message ID</th>
                    <th className="px-4 py-3 font-bold">Body</th>
                    <th className="px-4 py-3 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-16 text-center text-slate-400 italic font-medium">
                        No messages processed yet. Send some data to see the consumer in action.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors font-mono text-[11px] text-slate-600">
                        <td className="px-4 py-3 text-slate-400 opacity-60">{log.time}</td>
                        <td className="px-4 py-3 text-indigo-600 font-bold uppercase tracking-tighter">{log.id.slice(0, 8)}...</td>
                        <td className="px-4 py-3 bg-slate-50/50">{JSON.stringify(log.body)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-bold">
                            ACKNOWLEDGED
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-card bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-slate-900 font-bold">Consumer Configuration</CardTitle>
              <CardDescription className="text-slate-500">Defined via <code>queue()</code> helper</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Batch Size</span>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">50</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Max Retries</span>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">3</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card bg-white border-slate-200 shadow-sm relative overflow-hidden group">
          <CardHeader>
            <CardTitle className="text-slate-900 font-bold">Manual Mock Trigger</CardTitle>
            <CardDescription className="text-slate-500">Simulate a queue event locally</CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              In development, Queues are handled through remote bindings. You can force-trigger
              the consumer with a mock batch for rapid logic testing.
             </p>
             <Button 
               onClick={triggerMockBatch}
               className="gap-2 bg-slate-950 hover:bg-black text-white border-0 transition-all font-bold shadow-md shadow-slate-200"
             >
               <Play className="w-4 h-4 fill-current" /> Trigger Mock Batch (10 events)
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
