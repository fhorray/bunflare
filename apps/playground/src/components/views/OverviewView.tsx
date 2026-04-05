import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Database,
  HardDrive,
  Zap,
  Box,
  Activity,
  Settings,
  ArrowRight,
} from 'lucide-react';

export function OverviewView() {
  const stats = [
    {
      title: 'Database (D1)',
      icon: Database,
      color: 'text-blue-600',
      desc: 'Edge-native SQLite persistence',
      bg: 'bg-blue-50/50',
    },
    {
      title: 'Storage (R2)',
      icon: HardDrive,
      color: 'text-orange-600',
      desc: 'S3-compatible object storage',
      bg: 'bg-orange-50/50',
    },
    {
      title: 'Global KV',
      icon: Zap,
      color: 'text-emerald-600',
      desc: 'Low-latency key-value store',
      bg: 'bg-emerald-50/50',
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black tracking-tight text-slate-950">System Dashboard</h2>
        <p className="text-slate-500 max-w-2xl leading-relaxed font-medium">
          Welcome to the Bunflare Playground. Monitor your simulated Cloudflare environment and verify your worker's logic in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat) => (
          <Card key={stat.title} className={`glass-card border-slate-100 overflow-hidden group shadow-sm hover:shadow-md transition-all`}>
            <CardHeader className={`flex flex-row items-center justify-between pb-3 ${stat.bg}`}>
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {stat.title}
              </CardTitle>
              <stat.icon
                className={`h-4 w-4 ${stat.color} group-hover:scale-125 transition-transform duration-500`}
              />
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xl font-black text-slate-900 tracking-tight">Active</div>
                <span className="text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                  Online
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
        <Card className="glass-card border-indigo-100 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center gap-5 bg-indigo-50/30 border-b border-indigo-50">
            <div className="p-3 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-600/20">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg font-black text-indigo-950 tracking-tight">Worker Context</CardTitle>
              <CardDescription className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Global Bindings</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-8 pb-8 flex-1">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-black font-mono tracking-tight text-slate-700">
                  env.DB
                </span>
              </div>
              <span className="text-[8px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                Mapping Active
              </span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                <Box className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-black font-mono tracking-tight text-slate-700">
                  env.BUCKET
                </span>
              </div>
              <span className="text-[8px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                Mapping Active
              </span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-black font-mono tracking-tight text-slate-700">
                  env.REDIS
                </span>
              </div>
              <span className="text-[8px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                Mapping Active
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card relative overflow-hidden group border-slate-950 bg-slate-950 shadow-2xl flex flex-col justify-center p-12">
          {/* Subtle Glow for the dark card in light mode */}
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 transition-all duration-700">
            <Activity className="w-48 h-48 text-white rotate-12" />
          </div>
          
          <div className="relative z-10 space-y-8">
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-white tracking-tighter">Architecture Native</h3>
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Plugin Synchronization: 100%</p>
            </div>
            
            <div className="flex items-end gap-3">
              <span className="text-7xl font-black tracking-tighter text-white">100</span>
              <span className="text-xl font-black text-indigo-400 uppercase tracking-widest mb-1">%</span>
            </div>

            <div className="space-y-4">
               <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-sm">
                 Evaluation successful. Every native Bun API call is being correctly intercepted and mapped to its Cloudflare counterpart without performance overhead.
               </p>
               <button className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-indigo-400 hover:text-white transition-all group">
                 Deep Inspection <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
