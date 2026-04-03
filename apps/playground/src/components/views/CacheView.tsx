import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, RefreshCcw, Loader2, MinusCircle, PlusCircle, Trash2, CheckCircle2 } from "lucide-react";

export function CacheView() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isIncrementing, setIsIncrementing] = useState(false);

  useEffect(() => {
    readKV();
  }, []);

  const readKV = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/redis");
      const data = await res.json();
      if (data.count !== undefined) setCount(data.count);
    } finally {
      setLoading(false);
    }
  };

  const incrementKV = async () => {
    setIsIncrementing(true);
    try {
      const res = await fetch("/api/redis", { method: "POST" });
      const data = await res.json();
      if (data.count !== undefined) setCount(data.count);
    } finally {
      setIsIncrementing(false);
    }
  };

  const deleteKV = async () => {
    await fetch("/api/redis/delete", { method: "POST" });
    readKV();
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">KV Cache</h2>
          <p className="text-muted-foreground">Key-Value storage management with Bun.redis mapping.</p>
        </div>
        <Button onClick={readKV} variant="outline" size="sm" className="gap-2" disabled={loading}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-500 fill-green-500/20" />
              Counter Control
            </CardTitle>
            <CardDescription>Persistent key-value simulation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-10 py-8">
            <div className="flex items-center justify-center gap-8 bg-muted/20 p-12 rounded-3xl border border-border/40 group">
                <div className="text-center space-y-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] block">KV Value</span>
                    <div className="text-7xl font-extrabold tracking-tighter text-green-500 group-hover:scale-110 transition-transform cursor-default">
                        {count !== null ? count : "?"}
                    </div>
                    <span className="text-xs text-muted-foreground/60 font-medium">playground_count</span>
                </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={incrementKV} 
                disabled={isIncrementing} 
                className="w-full bg-green-500 hover:bg-green-600 gap-2 font-bold py-6 text-base tracking-tight"
              >
                {isIncrementing ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
                Increment Value
              </Button>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <Button onClick={deleteKV} variant="destructive" className="gap-2 font-semibold">
                    <Trash2 className="w-4 h-4" />
                    Reset
                </Button>
                <Button onClick={readKV} variant="secondary" className="gap-2 font-semibold">
                    <RefreshCcw className="w-4 h-4" />
                    Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Zap className="w-48 h-48 text-green-500 rotate-6" />
            </div>
          <CardHeader>
            <CardTitle>KV Status</CardTitle>
            <CardDescription>Local emulator information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <div className="space-y-0.5">
                        <p className="text-sm font-bold tracking-tight uppercase">KV namespace: REDIS</p>
                        <p className="text-xs text-muted-foreground">Mapped to local SQLite backend.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <div className="space-y-0.5">
                        <p className="text-sm font-bold tracking-tight uppercase">Persistence: Enabled</p>
                        <p className="text-xs text-muted-foreground">State persists across server reloads.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <div className="space-y-0.5">
                        <p className="text-sm font-bold tracking-tight uppercase">Transform: Bun.redis</p>
                        <p className="text-xs text-muted-foreground">Automated Cloudflare KV mapping active.</p>
                    </div>
                </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border/50 mt-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Architecture Tip</p>
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                    "Use Bun.redis locally; the plugin automatically translates calls to the 
                    appropriate KV Namespace in production workers."
                </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
