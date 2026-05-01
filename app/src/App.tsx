import { useState, useEffect } from 'react';
import logo from '../public/logo.png';
import { ImageUpload } from './ImageUpload';

export function App() {
  const [status, setStatus] = useState<any>(null);
  const [tests, setTests] = useState<any>(null);
  const [counter, setCounter] = useState<number>(0);
  const [redisReport, setRedisReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, testRes, counterRes] = await Promise.all([
          fetch('/api/status').then((r) => r.json()),
          fetch('/api/test').then((r) => r.json()),
          fetch('/api/counter').then((r) => r.json()) as Promise<{ count: number }>,
        ]);
        setStatus(statusRes);
        setTests(testRes);
        setCounter(counterRes.count);
      } catch (err) {
        console.error('Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const incrementCounter = async () => {
    try {
      const res = await fetch('/api/counter', { method: 'POST' });
      const data = await res.json() as { count: number };
      setCounter(data.count);
    } catch (e) {
      console.error("Counter error:", e);
    }
  };

  const runRedisTests = async () => {
    try {
      const res = await fetch('/api/test/redis');
      const data = await res.json();
      setRedisReport(data);
    } catch (e) {
      console.error("Redis test error:", e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-8 text-white antialiased" style={{ background: 'radial-gradient(circle at top center, #1a1a1a 0%, #0a0a0a 100%)' }}>
      <header className="text-center mb-12 mt-8">
        <img
          src={logo}
          className="w-[100px] h-[100px] mb-6 mx-auto transition-transform hover:scale-110 duration-500"
          alt="logo"
        />
        <h1 className="text-[3.5rem] font-extrabold tracking-tight bg-gradient-to-br from-[#ff8800] to-[#ffcc00] bg-clip-text text-transparent leading-none">
          Bunflare + React@@@
        </h1>
        <p className="text-[#a0a0a0] text-xl mt-2 font-normal">
          Fullstack Bun APIs on Cloudflare Workers
        </p>
      </header>

      <main className="w-full max-w-[500px] flex flex-col gap-8">
        {loading ? (
          <p className="text-center text-gray-500 animate-pulse">Loading system status...</p>
        ) : status ? (
          <>
            {/* Counter Component (Uses Bun.redis -> KV) */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-8 rounded-3xl flex justify-between items-center overflow-hidden">
              <div>
                <h3 className="text-sm font-bold text-[#ff8800] uppercase tracking-widest mb-1">Global Counter</h3>
                <p className="text-4xl font-black text-white m-0">{counter}</p>
                <p className="text-[0.65rem] text-gray-500 mt-2 uppercase tracking-tighter">Powered by Bun.redis() ⚡</p>
              </div>
              <button
                onClick={incrementCounter}
                className="bg-gradient-to-br from-[#ff8800] to-[#ffcc00] text-black font-bold px-8 py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,136,0,0.3)]"
              >
                Increment
              </button>
            </div>

            {/* Redis Lab Component */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-10 rounded-3xl flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-[0.1em] m-0">Redis Bridge Lab</h3>
                <button
                  onClick={runRedisTests}
                  className="text-[0.7rem] bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-colors uppercase font-bold"
                >
                  Run Stress Test
                </button>
              </div>

              {redisReport ? (
                <div className="flex flex-col gap-3">
                  {redisReport.results.map((res: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm p-3 bg-white/5 rounded-xl">
                      <span className="text-gray-400">{res.name}</span>
                      <span className={res.status.includes('PASS') ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                        {res.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-center text-gray-600 m-0 italic">Click run to start exhaustive bridge testing</p>
              )}
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-10 rounded-3xl flex flex-col gap-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-[0.1em] text-center m-0">
                System Health
              </h3>

              <div className="flex flex-col gap-2">
                <StatusRow label="API Status" value={status.status} />
                <StatusRow label="Runtime" value={status.runtime} />
                <StatusRow label="SQLite (D1)" value={tests?.sqlite} />
                <StatusRow label="KV (Storage)" value={tests?.kv} />
                <StatusRow label="Crypto (Hash)" value={tests?.crypto} />
              </div>

              <span className="text-[0.7rem] text-gray-600 text-center block mt-4">
                Last update: {new Date(status.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <ImageUpload />
          </>
        ) : (
          <p className="text-center text-red-400 bg-red-500/10 border border-red-500/20 p-6 rounded-2xl">
            Failed to connect to Bunflare API
          </p>
        )}
      </main>
      <footer className="mt-auto pt-16 pb-8 text-[#444] text-sm tracking-widest uppercase text-center w-full">
        Built with 🧡 by Bunflare
      </footer>
    </div>
  );
}

function StatusRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-bold text-[#ffcc00]">{value || 'Pending...'}</span>
    </div>
  );
}
