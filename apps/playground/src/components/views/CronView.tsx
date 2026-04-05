import React, { useState } from 'react';
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
  Clock, 
  Calendar, 
  RefreshCw, 
  Zap,
  History
} from 'lucide-react';

export function CronView() {
  const [lastRuns, setLastRuns] = useState<{ id: string; cron: string; time: string; status: string }[]>([
    { id: 'run-1', cron: '*/1 * * * *', time: '1 minute ago', status: 'Success' },
    { id: 'run-0', cron: '*/1 * * * *', time: '2 minutes ago', status: 'Success' },
  ]);

  const triggerMockCron = async () => {
    try {
      await fetch('/api/cron/mock', { method: 'POST' });
      setLastRuns([
        { id: 'run-' + Date.now(), cron: '*/1 * * * *', time: 'just now (mock)', status: 'Success' },
        ...lastRuns
      ]);
    } catch (e) {}
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Scheduled Tasks</h2>
        <p className="text-slate-500 max-w-2xl leading-relaxed">
          Automate routine tasks with Cron Triggers. Bunflare automatically detects
          your <code>cron()</code> helpers and configures the infrastructure.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-card bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-100 font-mono text-[10px] uppercase font-bold tracking-widest">*/1 * * * *</Badge>
            </div>
            <CardTitle className="text-slate-900 font-bold">Cleanup Task</CardTitle>
            <CardDescription className="text-slate-500 font-medium">Runs every minute to purge expired logs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-inner">
              <div className="p-3 rounded-full bg-emerald-100 text-emerald-600 shadow-sm border border-emerald-50">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">Active Schedule</p>
                <p className="text-xs text-slate-400 font-mono">Next run in 34 seconds</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Enabled</span>
              </div>
            </div>

            <Button 
                onClick={triggerMockCron}
                className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold border-0 shadow-sm transition-all shadow-indigo-100"
            >
              <Zap className="w-4 h-4 fill-current" /> Trigger Now (Mock)
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 mb-2">
            <div>
              <CardTitle className="text-slate-900 font-bold">Execution History</CardTitle>
              <CardDescription className="text-slate-500 font-medium">Recent trigger logs</CardDescription>
            </div>
            <History className="w-5 h-5 text-slate-300" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-1">
              {lastRuns.map((run) => (
                <div key={run.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100 hover:border-slate-200 hover:bg-white transition-all shadow-sm group">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-tighter opacity-80">{run.cron}</span>
                    <span className="text-xs text-slate-500 font-medium">{run.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500 text-white border-0 text-[8px] uppercase tracking-widest font-black shadow-sm">
                       {run.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="glass-card bg-white border-slate-200 shadow-sm relative group cursor-pointer hover:bg-slate-50/50 transition-all border-l-4 border-l-indigo-500">
          <CardHeader className="pb-2">
             <Calendar className="w-4 h-4 mb-2 text-indigo-500" />
             <CardTitle className="text-sm font-bold text-slate-900">Daily Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400 font-mono mb-3">0 8 * * *</p>
            <Button variant="link" className="p-0 h-auto text-[10px] font-bold uppercase tracking-tight text-indigo-600 hover:text-indigo-700">View Implementation</Button>
          </CardContent>
        </Card>
        
        <Card className="glass-card bg-slate-50/50 border-slate-200 opacity-60 grayscale pointer-events-none">
          <CardHeader className="pb-2">
             <Calendar className="w-4 h-4 mb-2 text-slate-400" />
             <CardTitle className="text-sm font-bold text-slate-400">Weekly Backup</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-300 font-mono mb-2">0 0 * * 0</p>
            <p className="text-[10px] text-slate-400 italic">Not configured locally</p>
          </CardContent>
        </Card>

        <Card className="glass-card bg-white border-dashed border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer group flex items-center justify-center">
           <div className="flex flex-col items-center gap-3 py-8">
              <div className="p-3 rounded-full border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shadow-sm">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">Add Agendamento</span>
           </div>
        </Card>
      </div>
    </div>
  );
}
