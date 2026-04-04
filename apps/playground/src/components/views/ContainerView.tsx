import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Box,
  Play,
  RotateCcw,
  Zap,
  CheckCircle2,
  Cpu,
  Server,
  Activity,
  History,
  Terminal,
  Clock,
} from 'lucide-react';

export function ContainerView() {
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'starting' | 'running'>('idle');
  const [uptime, setUptime] = useState(0);

  const requestInstance = async () => {
    if (loading) return;

    setLoading(true);
    setStatus('starting');
    setResponse(null);
    setUptime(0);

    try {
      // Simulate container boot delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const res = await fetch('/api/container/test');
      const text = await res.text();

      setResponse(text);
      setStatus('running');
      setUptime(Math.floor(Math.random() * 100) + 1);
    } catch (e) {
      setResponse('Error: Could not reach container instance');
      setStatus('idle');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Box className="w-6 h-6 text-orange-600" />
          Cloudflare Containers
        </h2>
        <p className="text-slate-500 text-sm">
          Run your own Docker images on Region:Earth. Highly scalable, on-demand
          compute instances controlled by your Worker.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="py-0 lg:col-span-3 shadow-sm border-slate-200 bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5 text-orange-600" />
                <div>
                  <CardTitle className="text-base font-bold">
                    Instance Orchestration
                  </CardTitle>
                  <CardDescription className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Image: playground-worker-imageprocessor
                  </CardDescription>
                </div>
              </div>
              <div
                className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${
                  status === 'running'
                    ? 'bg-emerald-100 text-emerald-700'
                    : status === 'starting'
                      ? 'bg-amber-100 text-amber-700 animate-pulse'
                      : 'bg-slate-100 text-slate-500'
                }`}
              >
                {status}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-12">
            <div className="flex items-center justify-between">
              <div className="flex gap-12">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Runtime
                  </span>
                  <p className="text-sm font-bold text-slate-900">
                    Python 3.11
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Default Port
                  </span>
                  <p className="text-sm font-bold text-slate-900">8080</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Memory Limit
                  </span>
                  <p className="text-sm font-bold text-slate-900">256MB</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Uptime
                  </span>
                  <p className="text-sm font-bold text-slate-900 font-mono">
                    {uptime}s
                  </p>
                </div>
              </div>

              <Button
                onClick={requestInstance}
                disabled={loading}
                className="h-10 px-6 bg-orange-600 hover:bg-orange-700 text-white rounded-md font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <RotateCcw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                {loading ? 'BOOTING...' : 'LAUNCH INSTANCE'}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 tracking-tight uppercase flex items-center gap-2">
                  <Terminal className="w-3 h-3" />
                  Execution Output
                </h3>
                {response && (
                  <span className="text-[10px] font-mono text-emerald-600">
                    HTTP 200 OK
                  </span>
                )}
              </div>
              <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 min-h-[140px] font-mono text-sm leading-relaxed shadow-inner overflow-hidden relative">
                {!response && !loading && (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 italic text-xs">
                    No instance active. Click launch to start.
                  </div>
                )}
                {loading && (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-4 w-3/4 bg-slate-200 rounded" />
                    <div className="h-4 w-1/2 bg-slate-200 rounded" />
                    <div className="h-4 w-2/3 bg-slate-200 rounded" />
                  </div>
                )}
                {response && (
                  <div className="text-slate-700 whitespace-pre-wrap">
                    <span className="text-slate-400 mr-2">$</span> {response}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="py-0 p-6 shadow-sm border-slate-200 bg-white group hover:border-orange-200 transition-colors">
            <div className="space-y-3">
              <Zap className="w-6 h-6 text-slate-300 group-hover:text-orange-500 transition-colors" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight leading-tight uppercase">
                Hot Starts
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Cloudflare optimizes container warm-up to ensure low-latency
                Cold Starts via Region:Earth placement.
              </p>
            </div>
          </Card>

          <Card className="py-0 p-6 shadow-sm border-slate-200 bg-white group hover:border-orange-200 transition-colors">
            <div className="space-y-3">
              <Clock className="w-6 h-6 text-slate-300 group-hover:text-orange-500 transition-colors" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight leading-tight uppercase">
                Scale to Zero
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Instances automatically sleep after 10m of inactivity to
                minimize resource consumption and costs.
              </p>
            </div>
          </Card>

          <Card className="py-0 p-6 shadow-sm border-slate-200 bg-white group hover:border-orange-200 transition-colors">
            <div className="space-y-3">
              <History className="w-6 h-6 text-slate-300 group-hover:text-orange-500 transition-colors" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight leading-tight uppercase">
                Audit Logs
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-mono">
                2026-04-03: DEPLOYED_V1
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
