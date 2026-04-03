import type { ReactNode } from 'react';
import {
  LayoutDashboard,
  Database,
  HardDrive,
  Zap,
  Terminal,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'overview' | 'database' | 'storage' | 'cache';

interface LayoutProps {
  children: ReactNode;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'database', label: 'Database (D1)', icon: Database },
    { id: 'storage', label: 'Storage (R2)', icon: HardDrive },
    { id: 'cache', label: 'Cache (KV)', icon: Zap },
  ] as const;

  return (
    <div className="flex h-screen w-full bg-background/95 backdrop-blur-sm overflow-hidden border">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card/30 backdrop-blur-md flex flex-col z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(270,95%,75%)] to-[hsl(25,95%,60%)] flex items-center justify-center">
            <Zap className="w-5 h-5 text-white fill-white/20" />
          </div>
          <h1 className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Playground
          </h1>
        </div>

        <nav className="flex-1 px-3 space-y-1">
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
                  'w-4 h-4 transition-transform group-hover:scale-110',
                  activeTab === item.id
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground',
                )}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {activeTab === item.id && (
                <ChevronRight className="w-3 h-3 text-primary-foreground/50" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t space-y-2">
          <a
            href="https://github.com/fhorray/bun-cloudflare-plugin"
            target="_blank"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors px-4 py-2"
          >
            <Terminal className="w-3 h-3" />
            Documentation
            <ExternalLink className="w-2 h-2 ml-auto" />
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-14 border-b flex items-center px-8 bg-background/50 backdrop-blur-xs justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Service /
            </span>
            <span className="text-sm font-semibold capitalize tracking-tight">
              {activeTab === 'overview' ? 'System Dashboard' : activeTab}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-muted-foreground">
              LOCAL DEV BINDINGS ACTIVE
            </span>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="container mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
