import type { ReactNode } from 'react';
import {
  LayoutDashboard,
  Database,
  HardDrive,
  Zap,
  Globe,
  Wifi,
  Cpu,
  Activity,
  Terminal,
  ExternalLink,
  Box,
  Search,
  Monitor,
  Timer,
  Calendar,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tab } from '../App';

interface LayoutProps {
  children: ReactNode;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      color: 'text-indigo-600',
    },
    {
      id: 'database',
      label: 'Database (D1)',
      icon: Database,
      color: 'text-blue-600',
    },
    { id: 'storage', label: 'Storage (R2)', icon: HardDrive, color: 'text-orange-600' },
    { id: 'edge', label: 'Edge Utilities', icon: Layers, color: 'text-violet-600' },
    { id: 'cache', label: 'Cache (KV)', icon: Activity, color: 'text-emerald-600' },
    { id: 'routing', label: 'Routing', icon: Globe, color: 'text-sky-600' },
    {
      id: 'realtime',
      label: 'Real-time (WS)',
      icon: Wifi,
      color: 'text-teal-600',
    },
    {
      id: 'persistence',
      label: 'Persistence (DO)',
      icon: Cpu,
      color: 'text-purple-600',
    },
    {
      id: 'automation',
      label: 'Automation (WF)',
      icon: Activity,
      color: 'text-amber-600',
    },
    {
      id: 'containers',
      label: 'Containers',
      icon: Box,
      color: 'text-orange-600',
    },
    {
      id: 'queues',
      label: 'Queues',
      icon: Timer,
      color: 'text-rose-600',
    },
    {
      id: 'crons',
      label: 'Crons',
      icon: Calendar,
      color: 'text-emerald-600',
    },
    {
      id: 'seo',
      label: 'SEO & Utils',
      icon: Search,
      color: 'text-cyan-600',
    },
    {
      id: 'browser',
      label: 'Browser (Puppeteer)',
      icon: Monitor,
      color: 'text-pink-600',
    },
  ] as const;

  return (
    <div className="flex h-screen w-full bg-white text-slate-950 overflow-hidden font-sans">
      
      {/* Sidebar - Clean Light Layout */}
      <aside className="w-64 border-r border-slate-100 bg-white flex flex-col z-20">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center shadow-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-black text-lg tracking-tighter text-slate-950 leading-none">
              Playground
            </h1>
            <span className="text-[9px] text-slate-400 font-black tracking-[0.2em] uppercase mt-1">
              bunflare core
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-hide py-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'w-full nav-item group',
                activeTab === item.id ? 'nav-item-active' : 'nav-item-inactive font-medium',
              )}
            >
              <item.icon
                className={cn(
                  'w-4 h-4 transition-transform duration-300 group-hover:scale-110',
                  activeTab === item.id ? 'text-indigo-600' : item.color,
                )}
              />
              <span className="flex-1 text-left tracking-tight">
                {item.label}
              </span>
              {activeTab === item.id && (
                <div className="w-1 h-3 rounded-full bg-indigo-600 shadow-sm" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-slate-50">
          <a
            href="https://github.com/fhorray/bun-cloudflare-plugin"
            target="_blank"
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 hover:text-slate-950 transition-colors px-4 py-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100"
          >
            <Terminal className="w-3.5 h-3.5" />
            Source Code
            <ExternalLink className="w-2.5 h-2.5 ml-auto opacity-30" />
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Subtle Background Accent */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04] z-0">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[128px] animate-pulse" />
          <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-[128px] animate-pulse delay-700" />
        </div>

        {/* Top Header */}
        <header className="h-16 border-b border-slate-100 flex items-center px-10 bg-white/70 backdrop-blur-md justify-between z-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-80">
                Bunflare /
              </span>
              <span className="text-sm font-black capitalize text-slate-950 tracking-tight">
                {activeTab === 'overview'
                  ? 'System Dashboard'
                  : navItems.find((n) => n.id === activeTab)?.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="badge-premium flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Runtime Active
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 z-0 relative scrollbar-hide">
          <div className="container mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
