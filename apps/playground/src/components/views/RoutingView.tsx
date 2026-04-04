import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Terminal as TerminalIcon, Zap } from 'lucide-react';

export function RoutingView() {
  const [routeParam, setRouteParam] = useState('123');
  const [routeResponse, setRouteResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testDynamicRoute = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/native/${routeParam}`);
      const data = await res.json();
      setRouteResponse(data);
    } catch (e) {
      setRouteResponse({ error: 'Failed to fetch' });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Globe className="w-6 h-6 text-indigo-600" />
          Native Routing
        </h2>
        <p className="text-slate-500 text-sm">
          Test URLPattern matching and dynamic parameter extraction using
          buncf's native router.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">
                  Dynamic Parameters
                </CardTitle>
                <CardDescription className="text-slate-500 text-xs">
                  Matches <code>/api/native/:id</code> using native URLPattern
                </CardDescription>
              </div>
              <div className="badge-premium">Middleware</div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex gap-3 max-w-xl">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">
                  /api/native/
                </span>
                <Input
                  value={routeParam}
                  onChange={(e) => setRouteParam(e.target.value)}
                  className="pl-20 h-10 bg-white border-slate-200 focus:ring-1 focus:ring-indigo-500/20 font-mono text-sm rounded-md"
                  placeholder="id"
                />
              </div>
              <Button
                onClick={testDynamicRoute}
                disabled={loading}
                className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold transition-colors"
              >
                {loading ? '...' : 'Execute'}
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TerminalIcon className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Response
                </span>
              </div>
              <div className="terminal-area min-h-[200px] bg-slate-50 border-slate-200 p-4 overflow-auto">
                {routeResponse ? (
                  <pre className="text-slate-800 text-sm leading-relaxed">
                    {JSON.stringify(routeResponse, null, 2)}
                  </pre>
                ) : (
                  <div className="h-[150px] flex flex-col items-center justify-center text-slate-300 gap-2">
                    <Zap className="w-8 h-8 opacity-20" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">
                      Awaiting request
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
