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
  Zap,
  Cpu,
  RefreshCcw,
  Database,
  ShieldCheck,
  Server,
  Fingerprint,
} from 'lucide-react';

export function PersistenceView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const incrementCounter = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/do/counter');
      const data = await res.json();
      setData(data);
    } catch (e) {
      setData({ error: 'Failed to interact with Durable Object' });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Cpu className="w-6 h-6 text-purple-600" />
          Stateful Clusters
        </h2>
        <p className="text-slate-500 text-sm">
          Interact with <strong>Durable Objects</strong> through buncf's fluid
          API. Durable Objects are globally unique stateful entities on the
          edge.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Interaction Card */}
        <Card className="py-0 lg:col-span-2 shadow-sm border-slate-200 bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Fingerprint className="h-5 w-5 text-purple-600" />
                <div>
                  <CardTitle className="text-base font-bold">
                    Shared Global State
                  </CardTitle>
                  <CardDescription className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Consistency Persistence
                  </CardDescription>
                </div>
              </div>
              <div className="badge-premium">Isolated Context</div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10 p-8 rounded-xl bg-slate-50 border border-slate-200">
              <div className="space-y-2 relative z-10 text-center md:text-left">
                <div className="flex items-center gap-2 px-1">
                  <div className="h-2 w-2 rounded-full bg-purple-500 shadow-sm" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-600">
                    Persistent Counter
                  </span>
                </div>
                <div className="text-6xl font-black tracking-tight text-slate-900">
                  {data?.count !== undefined && loading ? (
                    <span className="opacity-20 animate-pulse">--</span>
                  ) : (
                    (data?.count ?? '0')
                  )}
                </div>
                <div className="flex flex-col gap-1 font-mono text-[9px] text-slate-500 bg-white p-2 rounded-md border border-slate-200">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">OBJECT_ID:</span>
                    <span className="text-slate-900 truncate max-w-[180px]">
                      {data?.id || 'NO_SESSION_ACTIVE'}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={incrementCounter}
                disabled={loading}
                className="h-20 w-20 md:h-24 md:w-24 bg-purple-600 hover:bg-purple-700 text-white shadow-md rounded-2xl flex flex-col gap-1 border-b-4 border-purple-800 transition-all active:border-b-0 active:translate-y-1"
              >
                {loading ? (
                  <RefreshCcw className="w-6 h-6 animate-spin" />
                ) : (
                  <Zap className="w-6 h-6 fill-white" />
                )}
                <span className="text-[10px] font-bold tracking-widest uppercase">
                  Increment
                </span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900">
                    Full Consistency
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Guaranteed single-instance execution within Cloudflare's
                    network.
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <Database className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900">
                    Direct Storage
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    State is persisted automatically via{' '}
                    <code>state.storage</code> bindings.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Column */}
        <div className="space-y-6">
          <Card className="py-0 shadow-sm border-slate-200 bg-white h-full p-6 flex flex-col justify-start gap-6">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                The Fluid API
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                buncf transforms a functional object into a full Durable Object
                class at build time. No boilerplate classes required.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              {[
                {
                  label: 'Class Injection',
                  icon: Server,
                  color: 'text-slate-400',
                },
                {
                  label: 'State Awareness',
                  icon: Cpu,
                  color: 'text-slate-400',
                },
                { label: 'Env Bindings', icon: Zap, color: 'text-slate-400' },
              ].map((feat, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 text-slate-600"
                >
                  <feat.icon className={`w-3.5 h-3.5 ${feat.color}`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    {feat.label}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
