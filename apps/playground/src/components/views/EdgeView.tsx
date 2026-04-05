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
  Zap,
  ShieldAlert,
  Flag,
  RefreshCw,
  CheckCircle2,
  Users,
  Terminal,
} from 'lucide-react';

export function EdgeView() {
  const [cacheStatus, setCacheStatus] = useState<'idle' | 'loading' | 'hit' | 'miss'>('idle');
  const [cacheTime, setCacheTime] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const [rateLimitStatus, setRateLimitStatus] = useState<'idle' | 'loading' | 'success' | 'limited'>('idle');
  
  const [flagStatus, setFlagStatus] = useState<'idle' | 'updating'>('idle');
  const [isFlagEnabled, setIsFlagEnabled] = useState(false);
  const [bannerContent, setBannerContent] = useState('');
  const [simulatedUserId, setSimulatedUserId] = useState('user-123');

  const fetchWithCache = async () => {
    const start = performance.now();
    setCacheStatus('loading');
    try {
      const res = await fetch('/api/cache/leaderboard');
      const data = (await res.json()) as { data: any[]; source: 'hit' | 'miss' };
      const end = performance.now();
      setLeaderboard(data.data);
      setCacheTime(Math.round(end - start));
      setCacheStatus(data.source === 'hit' ? 'hit' : 'miss');
    } catch (e) {
      setCacheStatus('idle');
    }
  };

  const testRateLimit = async () => {
    setRateLimitStatus('loading');
    try {
      const res = await fetch('/api/auth/login', { method: 'POST' });
      if (res.status === 429) {
        setRateLimitStatus('limited');
      } else {
        setRateLimitStatus('success');
        setTimeout(() => setRateLimitStatus('idle'), 2000);
      }
    } catch (e) {
      setRateLimitStatus('idle');
    }
  };

  const toggleFlag = async () => {
    setFlagStatus('updating');
    const newState = !isFlagEnabled;
    try {
      await fetch('/api/edge/flags/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'new_homepage_banner',
          enabled: newState,
        }),
      });
      setIsFlagEnabled(newState);
      checkFlag();
    } catch (e) {}
    setFlagStatus('idle');
  };

  const checkFlag = async (uid = simulatedUserId) => {
    try {
      const res = await fetch(`/api/edge/banner?userId=${uid}`);
      const data = (await res.json()) as { content: string; enabled: boolean };
      setBannerContent(data.content);
    } catch (e) {}
  };

  useEffect(() => {
    checkFlag();
  }, [simulatedUserId]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tight text-slate-950">
          Edge Utilities
        </h2>
        <p className="text-slate-500 max-w-2xl leading-relaxed font-medium">
          Supercharge your worker with native Cloudflare request orchestration and global cache optimization.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Smart Cache Card - Light Indigo Theme */}
        <Card className="glass-card border-indigo-100 overflow-hidden group shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-indigo-50/30">
            <div>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <Zap className="h-5 w-5 text-indigo-500 animate-pulse" /> Smart Cache
              </CardTitle>
              <CardDescription className="text-indigo-400 font-bold text-[10px] uppercase tracking-wider">
                cache.getOrSet() • 60s TTL
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchWithCache}
              disabled={cacheStatus === 'loading'}
              className="border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-600 font-bold"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${cacheStatus === 'loading' ? 'animate-spin' : ''}`} />
              Fetch
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 relative overflow-hidden">
               <div className="flex-1 space-y-1">
                 <span className="text-[10px] uppercase text-indigo-400 font-black tracking-widest">Cache Logic</span>
                 <div className="flex items-center gap-2">
                   {cacheStatus === 'hit' ? (
                     <Badge className="bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-500/20">HIT</Badge>
                   ) : cacheStatus === 'miss' ? (
                     <Badge className="bg-orange-500 text-white border-0 shadow-lg shadow-orange-500/20">MISS</Badge>
                   ) : (
                     <Badge variant="outline" className="border-indigo-200 text-indigo-400 bg-white">IDLE</Badge>
                   )}
                 </div>
               </div>
               <div className="text-right space-y-1">
                 <span className="text-[10px] uppercase text-indigo-400 font-black tracking-widest">Latency</span>
                 <p className="text-2xl font-black text-indigo-950">
                   {cacheTime ? `${cacheTime}ms` : '--'}
                 </p>
               </div>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-white overflow-hidden shadow-sm">
              <table className="w-full text-xs">
                <thead className="bg-indigo-50/50 uppercase text-[9px] text-indigo-500 font-black tracking-widest border-b border-indigo-100">
                  <tr>
                    <th className="px-5 py-3 text-left">Edge Record</th>
                    <th className="px-5 py-3 text-right">Metric</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-5 py-8 text-center italic text-slate-300">
                        Click fetch to simulate Edge activity...
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((p) => (
                      <tr key={p.name} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-5 py-3 font-bold text-slate-700">{p.name}</td>
                        <td className="px-5 py-3 text-right font-black text-indigo-600">{p.score}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Rate Limiting Card - Light Violet Theme */}
        <Card className="glass-card border-violet-100 overflow-hidden shadow-sm">
          <CardHeader className="bg-violet-50/30">
            <CardTitle className="flex items-center gap-2 text-violet-900">
              <ShieldAlert className="h-5 w-5 text-violet-500" /> Rate Limiting
            </CardTitle>
            <CardDescription className="text-violet-400 font-bold text-[10px] uppercase tracking-wider">
              ratelimit() • IP Protection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="p-6 rounded-2xl bg-violet-50/50 border border-violet-100 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-black text-violet-950 tracking-tight">Security Simulation</p>
                <div className="flex gap-2">
                   <Badge variant="outline" className="text-[9px] border-violet-200 text-violet-500 font-black bg-white">5 REQ / MIN</Badge>
                </div>
              </div>
              <Button
                variant={rateLimitStatus === 'limited' ? 'destructive' : 'default'}
                onClick={testRateLimit}
                disabled={rateLimitStatus === 'loading'}
                className={rateLimitStatus === 'limited' ? 'bg-red-600 shadow-lg shadow-red-600/20' : 'bg-slate-950 border-0 hover:bg-slate-900 shadow-xl shadow-slate-900/10'}
              >
                {rateLimitStatus === 'limited' ? 'BLOCKED' : 'Test Barrier'}
              </Button>
            </div>

            {rateLimitStatus === 'limited' ? (
              <div className="flex items-start gap-4 p-5 rounded-2xl bg-red-50 border border-red-100 text-red-600 animate-in zoom-in-95 duration-300">
                <ShieldAlert className="w-6 h-6 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-black uppercase tracking-widest">WAF Result: 429</p>
                  <p className="text-xs text-red-500 font-medium">
                    Traffic exceeds safety margins. Verification required or cool-down mandatory.
                  </p>
                </div>
              </div>
            ) : rateLimitStatus === 'success' ? (
               <div className="flex items-center gap-3 p-5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 animate-in fade-in duration-300">
                 <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                 <p className="text-xs font-black uppercase tracking-widest">Validation Passed</p>
               </div>
            ) : (
                <div className="flex items-center gap-3 p-5 rounded-2xl bg-white border border-slate-100 text-slate-300 opacity-60">
                   <div className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" />
                   <p className="text-[10px] font-black uppercase tracking-widest">Barrier Monitoring Active</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Flags Card - Light Blue Theme */}
      <Card className="glass-card border-blue-100 overflow-hidden shadow-lg relative">
        <CardHeader className="flex flex-row items-center justify-between relative z-10 bg-blue-50/20">
          <div>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Flag className="h-5 w-5 text-blue-500" /> Feature Flags
            </CardTitle>
            <CardDescription className="text-blue-400 font-bold text-[10px] uppercase tracking-wider">
              KV + Deterministic Consistency
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFlag}
            disabled={flagStatus === 'updating'}
            className="border-blue-200 bg-white text-blue-600 font-bold hover:bg-blue-50"
          >
            {flagStatus === 'updating' && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
            {isFlagEnabled ? 'Deactivate Feature' : 'Activate Feature'}
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6 relative z-10 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
             
             <div className="lg:col-span-2 space-y-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-4">
                   <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400">User Identity</span>
                   </div>
                   <div className="space-y-2">
                      {['user-123', 'admin-99', 'guest-777'].map(uid => (
                        <button
                          key={uid}
                          onClick={() => setSimulatedUserId(uid)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${simulatedUserId === uid ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-[1.02]' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                        >
                          <span>{uid}</span>
                          {simulatedUserId === uid && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                   </div>
                </div>
                
                <div className="p-5 rounded-2xl bg-slate-50/50 border border-slate-100">
                   <div className="flex items-center gap-2 mb-2">
                      <Terminal className="w-4 h-4 text-slate-900" />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400">Logic</span>
                   </div>
                   <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                     Deterministic MurmurHash3 evaluation on <code className="text-blue-600 bg-blue-50 px-1 rounded">KV</code> ensures same ID gets same result.
                   </p>
                </div>
             </div>

             <div className="lg:col-span-3">
                <div className={`p-12 rounded-3xl border-2 transition-all duration-700 flex flex-col items-center justify-center text-center gap-8 relative overflow-hidden ${isFlagEnabled ? 'bg-blue-50 border-blue-200 shadow-inner' : 'bg-white border-slate-100 opacity-60'}`}>
                   
                   <div className={`p-6 rounded-3xl transition-all duration-700 ${isFlagEnabled ? 'bg-blue-600 text-white rotate-12 shadow-2xl shadow-blue-600/30' : 'bg-slate-100 text-slate-300'}`}>
                      <Flag className="h-10 w-10 shrink-0" />
                   </div>
                   
                   <div className="space-y-3 relative z-10">
                      <h3 className={`text-2xl font-black tracking-tight transition-all duration-500 ${isFlagEnabled ? 'text-blue-950' : 'text-slate-300'}`}>
                        {isFlagEnabled ? 'Experimental Variant' : 'Legacy Baseline'}
                      </h3>
                      <div className={`text-xs py-2.5 px-8 rounded-full inline-block font-bold shadow-sm ${isFlagEnabled ? 'bg-white text-blue-600 border border-blue-100 italic' : 'bg-slate-50 text-slate-300'}`}>
                        {bannerContent || "Initializing..."}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
