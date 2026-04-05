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
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export function CacheView() {
  const [cacheStatus, setCacheStatus] = useState<
    'idle' | 'loading' | 'hit' | 'miss'
  >('idle');
  const [cacheTime, setCacheTime] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const [rateLimitStatus, setRateLimitStatus] = useState<
    'idle' | 'loading' | 'success' | 'limited'
  >('idle');
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  const [flagStatus, setFlagStatus] = useState<'idle' | 'updating'>('idle');
  const [isFlagEnabled, setIsFlagEnabled] = useState(false);
  const [bannerContent, setBannerContent] = useState('');

  const fetchWithCache = async () => {
    const start = performance.now();
    setCacheStatus('loading');
    try {
      const res = await fetch('/api/cache/leaderboard');
      const data = (await res.json()) as {
        data: any[];
        source: 'hit' | 'miss';
      };
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
        setRetryAfter(60); // Simulated
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

  const checkFlag = async () => {
    try {
      const res = await fetch('/api/edge/banner');
      const data = (await res.json()) as {
        content: string;
        enabled: boolean;
      };
      setBannerContent(data.content);
      setIsFlagEnabled(data.enabled);
    } catch (e) {}
  };

  useEffect(() => {
    checkFlag();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Edge Utilities</h2>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          High-performance caching, request throttling, and feature toggles.
          Bunflare simplifies complex Cloudflare Edge APIs into
          developer-friendly helpers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Smart Cache Card */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" /> Smart Cache
              </CardTitle>
              <CardDescription>
                Automatic Edge Caching via <code>cache.getOrSet()</code>
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchWithCache}
              disabled={cacheStatus === 'loading'}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${cacheStatus === 'loading' ? 'animate-spin' : ''}`}
              />
              Fetch List
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-black/20 border border-white/5">
              <div className="flex-1">
                <span className="text-[10px] uppercase text-muted-foreground font-bold">
                  Status
                </span>
                <div className="flex items-center gap-2">
                  {cacheStatus === 'hit' ? (
                    <Badge className="bg-green-500/20 text-green-500">
                      CACHE HIT
                    </Badge>
                  ) : cacheStatus === 'miss' ? (
                    <Badge className="bg-orange-500/20 text-orange-500">
                      CACHE MISS
                    </Badge>
                  ) : (
                    <Badge variant="outline">IDLE</Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-muted-foreground font-bold">
                  Latency
                </span>
                <p className="text-lg font-mono font-bold text-primary">
                  {cacheTime ? `${cacheTime}ms` : '--'}
                </p>
              </div>
            </div>

            <div className="rounded-md border border-white/5 bg-black/40 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-white/5 uppercase text-[10px] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left">Player</th>
                    <th className="px-4 py-2 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-4 py-4 text-center italic text-muted-foreground"
                      >
                        Click fetch to see results
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((p) => (
                      <tr key={p.name}>
                        <td className="px-4 py-2 font-medium">{p.name}</td>
                        <td className="px-4 py-2 text-right font-mono">
                          {p.score}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Rate Limiting Card */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" /> Rate Limiting
            </CardTitle>
            <CardDescription>
              Protect your APIs with <code>rateLimit()</code> middleware
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-lg bg-black/20 border border-white/5 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Spam the Login Button</p>
                <p className="text-xs text-muted-foreground">
                  Threshold: 5 req / minute
                </p>
              </div>
              <Button
                variant={
                  rateLimitStatus === 'limited' ? 'destructive' : 'default'
                }
                onClick={testRateLimit}
                disabled={rateLimitStatus === 'loading'}
              >
                {rateLimitStatus === 'limited' ? 'BLOCKED' : 'Try Login'}
              </Button>
            </div>

            {rateLimitStatus === 'limited' && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold uppercase tracking-tight">
                    429: Too Many Requests
                  </p>
                  <p className="text-xs">
                    Edge successfully blocked your request. Try again in{' '}
                    {retryAfter}s.
                  </p>
                </div>
              </div>
            )}

            {rateLimitStatus === 'success' && (
              <div className="flex items-center gap-2 text-xs text-green-500 bg-green-500/10 p-2 rounded border border-green-500/20">
                <CheckCircle2 className="w-3 h-3" /> Request accepted
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Flags Card */}
      <Card className="glass-card border-primary/20 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-blue-500" /> Feature Flags
            </CardTitle>
            <CardDescription>
              Instant Edge-side A/B testing via KV
            </CardDescription>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleFlag}
            disabled={flagStatus === 'updating'}
          >
            {flagStatus === 'updating' ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {isFlagEnabled ? 'Disable Global Feature' : 'Enable Global Feature'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative group">
            <div
              className={`p-12 rounded-xl border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center text-center gap-4 ${isFlagEnabled ? 'bg-primary/5 border-primary/30' : 'bg-black/20 border-white/5'}`}
            >
              <div
                className={`p-4 rounded-full transition-transform duration-500 ${isFlagEnabled ? 'bg-primary/20 scale-110 rotate-12' : 'bg-white/5'}`}
              >
                <Flag
                  className={`h-8 w-8 ${isFlagEnabled ? 'text-primary' : 'text-muted-foreground'}`}
                />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight transition-colors">
                  {isFlagEnabled
                    ? 'Experimental UI Active'
                    : 'Standard Experience'}
                </h3>
                <p
                  className={`text-sm transition-colors ${isFlagEnabled ? 'text-primary/70' : 'text-muted-foreground'}`}
                >
                  "{bannerContent}"
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-black/20 border border-white/5 text-sm">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                Implementation
              </span>
              <p>
                Backed by <code>FLAGS_KV</code> for sub-millisecond evaluation.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-black/20 border border-white/5 text-sm">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                Consistency
              </span>
              <p>
                Percentage rollouts use deterministic hashing of user
                identifiers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
