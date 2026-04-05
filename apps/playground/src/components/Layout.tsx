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
      color: 'text-slate-400',
    },
    {
      id: 'database',
      label: 'Database (D1)',
      icon: Database,
      color: 'text-blue-500',
    },
    { id: 'storage', label: 'Storage (R2)', icon: HardDrive, color: 'text-orange-500' },
    { id: 'edge', label: 'Edge & Cache', icon: Zap, color: 'text-yellow-500' },
    { id: 'cache', label: 'Cache (KV)', icon: Activity, color: 'text-pink-500' },
    { id: 'routing', label: 'Routing', icon: Globe, color: 'text-indigo-500' },
    {
      id: 'realtime',
      label: 'Real-time (WS)',
      icon: Wifi,
      color: 'text-teal-500',
    },
    {
      id: 'persistence',
      label: 'Persistence (DO)',
      icon: Cpu,
      color: 'text-purple-500',
    },
    {
      id: 'automation',
      label: 'Automation (WF)',
      icon: Activity,
      color: 'text-amber-500',
    },
    {
      id: 'containers',
      label: 'Containers',
      icon: Box,
      color: 'text-orange-500',
    },
    {
      id: 'queues',
      label: 'Queues',
      icon: Timer,
      color: 'text-rose-500',
    },
    {
      id: 'crons',
      label: 'Crons',
      icon: Calendar,
      color: 'text-emerald-500',
    },
    {
      id: 'seo',
      label: 'SEO & Utils',
      icon: Search,
      color: 'text-cyan-500',
    },
    {
      id: 'browser',
      label: 'Browser (Puppeteer)',
      icon: Monitor,
      color: 'text-pink-600',
    },
  ] as const;

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col z-20">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-lg tracking-tight text-slate-900 leading-none">
              Playground
            </h1>
            <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">
              bunflare core
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'w-full nav-item group',
                activeTab === item.id ? 'nav-item-active' : 'nav-item-inactive',
              )}
            >
              <item.icon
                className={cn(
                  'w-4 h-4',
                  activeTab === item.id ? 'text-slate-900' : item.color,
                )}
              />
              <span className="flex-1 text-left font-medium tracking-tight">
                {item.label}
              </span>
              {activeTab === item.id && (
                <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-slate-100">
          <a
            href="https://github.com/fhorray/bun-cloudflare-plugin"
            target="_blank"
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors px-4 py-2 rounded-lg"
          >
            <Terminal className="w-3.5 h-3.5" />
            Docs & Github
            <ExternalLink className="w-2.5 h-2.5 ml-auto opacity-30" />
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 flex items-center px-10 bg-white justify-between z-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Cloudflare /
              </span>
              <span className="text-sm font-bold capitalize text-slate-900 tracking-tight">
                {activeTab === 'overview'
                  ? 'System Dashboard'
                  : navItems.find((n) => n.id === activeTab)?.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="badge-premium flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Bindings Active
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 z-0 relative">
          <div className="container mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
