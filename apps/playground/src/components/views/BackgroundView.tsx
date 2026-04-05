import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Timer,
  Zap,
  Send,
  Code,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export function BackgroundView() {
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [message, setMessage] = useState('');

  const runBackgroundTask = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/tasks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delay: 3000 }),
      });
      const data = (await res.json()) as any;
      if (res.ok) {
        setStatus('success');
        setMessage(data.message);
      } else {
        throw new Error(data.error || 'Failed to dispatch task');
      }
    } catch (e: any) {
      setStatus('error');
      setMessage(e.message);
    }
  };

  const runQueueTask = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/tasks/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'TEST_EVENT', timestamp: Date.now() }),
      });
      const data = (await res.json()) as { message: string; error?: string };
      if (res.ok) {
        setStatus('success');
        setMessage(data.message);
      } else {
        throw new Error(data.error || 'Queue error');
      }
    } catch (e: any) {
      setStatus('error');
      setMessage(e.message);
    }
  };

  const features = [
    {
      title: 'Context-Aware',
      icon: Zap,
      color: 'text-rose-500',
      desc: 'Automatic access to ctx.waitUntil without manual prop-drilling.',
    },
    {
      title: 'Fire-and-Forget',
      icon: Send,
      color: 'text-blue-500',
      desc: 'Return responses immediately while processing complex logic in the background.',
    },
    {
      title: 'Queue Integration',
      icon: Clock,
      color: 'text-amber-500',
      desc: 'Simple tasks.enqueue() API to offload work to Cloudflare Queues.',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 leading-none">
          Background Tasks
        </h2>
        <p className="text-muted-foreground max-w-2xl leading-relaxed mt-2">
          Cloudflare Workers normally terminate as soon as a response is sent.
          Bunflare provides a global orchestration layer that keeps your worker
          alive for critical background processing like analytics, emails, or
          data sync.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="glass-card overflow-hidden group"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {feature.title}
              </CardTitle>
              <feature.icon
                className={`h-4 w-4 ${feature.color} group-hover:scale-125 transition-transform`}
              />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* --- LIVE TEST SECTION --- */}
      <Card className="glass-card border-slate-900/5 shadow-xl">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-900 text-white">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Interactive Task Runner</CardTitle>
              <CardDescription>Test orchestration in real-time</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                  Dispatch Actions
                </h4>
                <p className="text-xs text-slate-500">
                  Trigger a background operation. The UI will update instantly
                  while the task continues server-side.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={runBackgroundTask}
                  disabled={status === 'loading'}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  {status === 'loading' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Timer className="w-4 h-4" />
                  )}
                  Run 3s Task
                </button>

                <button
                  onClick={runQueueTask}
                  disabled={status === 'loading'}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  {status === 'loading' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  Enqueue Message
                </button>
              </div>

              {status !== 'idle' && (
                <div
                  className={`p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
                    status === 'success'
                      ? 'bg-emerald-50 border border-emerald-100'
                      : 'bg-rose-50 border border-rose-100'
                  }`}
                >
                  {status === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  )}
                  <div className="space-y-1">
                    <p
                      className={`text-sm font-bold ${status === 'success' ? 'text-emerald-900' : 'text-rose-900'}`}
                    >
                      {status === 'success'
                        ? 'Task Dispatched'
                        : 'Execution Error'}
                    </p>
                    <p
                      className={`text-xs ${status === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}
                    >
                      {message}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Backend Implementation
                </span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-[10px] sm:text-xs overflow-x-auto font-mono leading-relaxed border border-slate-800">
                {`tasks.background(async () => {
  // This runs after Response
  await slowOperation();
  console.log("Task done!");
});`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
