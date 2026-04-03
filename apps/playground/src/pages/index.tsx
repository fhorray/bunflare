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

export const meta = () => [
  { title: "Dashboard | Buncf Playground" },
  { name: "description", content: "System overview of your Buncf environment" }
];

export default function OverviewPage() {
  const stats = [
    {
      title: 'D1 Database',
      icon: Database,
      color: 'text-blue-500',
      desc: 'SQLite Relational Data',
    },
    {
      title: 'R2 Storage',
      icon: HardDrive,
      color: 'text-orange-500',
      desc: 'Object Storage (File I/O)',
    },
    {
      title: 'KV Cache',
      icon: Zap,
      color: 'text-green-500',
      desc: 'Key-Value Store',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">System Overview</h2>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          Welcome to the Bun + Cloudflare playground. Monitor your local
          emulators and test your worker transformation logic in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="glass-card overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon
                className={`h-4 w-4 ${stat.color} group-hover:scale-125 transition-transform`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Active</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <CardTitle>Worker Environment</CardTitle>
              <CardDescription>Detected local bindings</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-mono font-medium tracking-tight">
                  DB binding
                </span>
              </div>
              <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-bold uppercase">
                Ready
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-3">
                <Box className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-mono font-medium tracking-tight">
                  BUCKET binding
                </span>
              </div>
              <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-bold uppercase">
                Ready
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-mono font-medium tracking-tight">
                  REDIS binding
                </span>
              </div>
              <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-bold uppercase">
                Ready
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card relative overflow-hidden group border-primary/20">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-32 h-32 text-primary rotate-12" />
          </div>
          <CardHeader>
            <CardTitle>Architecture Status</CardTitle>
            <CardDescription>
              Transformation pipeline operational
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              The Bun Cloudflare Plugin is automatically mapping your native Bun
              APIs to Cloudflare equivalents. Total transforms applied to
              current server:
            </p>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-extrabold tracking-tighter">
                100%
              </span>
              <span className="text-sm font-semibold text-primary underline underline-offset-4 decoration-primary/30">
                Pure Bun
              </span>
            </div>
            <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:gap-3 transition-all">
              Full Technical Report <ArrowRight className="w-3 h-3" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
