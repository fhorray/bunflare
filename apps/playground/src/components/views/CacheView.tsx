import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  Search,
  RefreshCw,
  HardDrive,
  FileJson,
  Key,
  Clock,
  ExternalLink,
} from 'lucide-react';

export function CacheView() {
  const [keys, setKeys] = useState<{ name: string; expiration?: number }[]>([
    { name: 'last_cron_run' },
    { name: 'queue_logs' },
    { name: 'active_flags' },
    { name: 'REDIS:stats' },
  ]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [keyValue, setKeyValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchKeys = async () => {
    setIsLoading(true);
    // In a real environment, we'd fetch from env.KV.list()
    setTimeout(() => {
      setIsLoading(false);
    }, 400);
  };

  const loadValue = async (key: string) => {
    setSelectedKey(key);
    setKeyValue(null);
    try {
      if (key === 'queue_logs') {
        const res = await fetch('/api/queue/logs');
        const data = await res.json();
        setKeyValue(JSON.stringify(data.logs, null, 2));
      } else if (key === 'last_cron_run') {
        const res = await fetch('/api/cron/mock', { method: 'POST' }); // Just to get a fresh time simulate
        setKeyValue(new Date().toISOString());
      } else {
        setKeyValue('{\n  "status": "active",\n  "namespace": "Production",\n  "last_updated": "' + new Date().toISOString() + '"\n}');
      }
    } catch (e) {
      setKeyValue('Error loading value');
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tight text-slate-950">
          KV Storage Explorer
        </h2>
        <p className="text-slate-500 max-w-2xl leading-relaxed font-medium">
          High-performance global persistence. Directly inspect your Cloudflare KV namespaces and managed bindings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left: Key List - Emerald Light Theme */}
        <Card className="lg:col-span-4 glass-card border-emerald-100 overflow-hidden shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 bg-emerald-50/30">
            <div>
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Namespaces</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={fetchKeys} className="text-emerald-600 hover:bg-emerald-50/50">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent className="px-2 pb-2 pt-4">
             <div className="space-y-1">
                {keys.map(k => (
                  <button
                    key={k.name}
                    onClick={() => loadValue(k.name)}
                    className={`w-full text-left px-5 py-3.5 rounded-2xl flex items-center gap-3 transition-all ${selectedKey === k.name ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 scale-[1.02]' : 'hover:bg-emerald-50/50 text-slate-500'}`}
                  >
                    <Key className={`h-3.5 w-3.5 ${selectedKey === k.name ? 'text-white' : 'text-emerald-500/40'}`} />
                    <span className="text-xs font-bold font-mono truncate">{k.name}</span>
                  </button>
                ))}
             </div>
          </CardContent>
        </Card>

        {/* Right: Value Viewer - Cyan Light Theme */}
        <Card className="lg:col-span-8 glass-card border-cyan-100 overflow-hidden h-full flex flex-col shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-cyan-50 bg-cyan-50/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-600 text-white shadow-lg shadow-cyan-600/20">
                 <HardDrive className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-black text-slate-900 truncate">
                  {selectedKey || 'Select a key to view'}
                </CardTitle>
                {selectedKey && <CardDescription className="text-[9px] text-cyan-600 uppercase font-black tracking-widest">Live Metadata</CardDescription>}
              </div>
            </div>
            {selectedKey && (
              <Badge className="bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-500/20">READY</Badge>
            )}
          </CardHeader>
          <CardContent className="flex-1 p-0 relative min-h-[450px]">
             {selectedKey ? (
               <div className="absolute inset-0 overflow-auto p-8 font-mono text-[13px] bg-white scrollbar-hide">
                  {keyValue ? (
                    <div className="space-y-6">
                       <div className="flex items-center gap-2 text-cyan-500 text-[10px] font-black uppercase tracking-[0.15em] mb-4">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Last synced: {new Date().toLocaleTimeString()}</span>
                       </div>
                       <pre className="text-slate-700 bg-slate-50 p-6 rounded-3xl border border-slate-100/50 leading-relaxed break-all whitespace-pre-wrap selection:bg-cyan-500/20 selection:text-cyan-950">
                         {keyValue}
                       </pre>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-5 text-cyan-600/20">
                       <RefreshCw className="h-10 w-10 animate-spin" />
                       <span className="text-[10px] font-black tracking-widest uppercase">Fetching from Edge Registry...</span>
                    </div>
                  )}
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center h-full p-12 text-center space-y-6 opacity-30">
                  <FileJson className="h-20 w-20 text-slate-200" />
                  <div className="space-y-2">
                    <p className="text-sm font-black uppercase tracking-widest text-slate-950">No Key Selected</p>
                    <p className="text-xs font-bold text-slate-400">Discover live state across the global Cloudflare network.</p>
                  </div>
               </div>
             )}
          </CardContent>
        </Card>
      </div>

      {/* Info Panel - Cyan/Emerald Glass Light */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="p-6 rounded-3xl bg-emerald-50/50 border border-emerald-100 space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-emerald-600">
               <Database className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">Global Ops</span>
            </div>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">
              Standard <code>env.KV</code> with eventually consistent global availability and ultra-low read latency.
            </p>
         </div>
         <div className="p-6 rounded-3xl bg-cyan-50/50 border border-cyan-100 space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-cyan-600">
               <Search className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">Efficiency</span>
            </div>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">
              Optimized for high-read applications. Bunflare manages multiple namespaces with unified API access.
            </p>
         </div>
         <div className="p-6 rounded-3xl bg-white border border-slate-100 space-y-3 flex flex-col justify-center items-center text-center shadow-sm">
            <Button variant="link" className="text-cyan-600 font-black uppercase tracking-widest text-[10px] h-auto p-0 flex items-center gap-2 group">
               View Cloudflare Dashboard
               <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Button>
            <p className="text-[9px] text-slate-400 font-bold">Inspect quotas, TTLs, and usage metrics</p>
         </div>
      </div>
    </div>
  );
}
