import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Database,
  HardDrive,
  Zap,
  Terminal,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, usePathname } from "buncf/router";

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  const navItems = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/database", label: "Database (D1)", icon: Database },
    { href: "/storage", label: "Storage (R2)", icon: HardDrive },
    { href: "/cache", label: "Cache (KV)", icon: Zap },
  ] as const;

  const currentTab = navItems.find(item => item.href === pathname) || navItems[0];

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
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "w-full nav-item group flex items-center gap-3 px-4 py-2 rounded-md transition-colors",
                pathname === item.href ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <item.icon
                className={cn(
                  "w-4 h-4 transition-transform group-hover:scale-110",
                  pathname === item.href ? "text-primary-foreground" : "text-muted-foreground"
                )}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {pathname === item.href && (
                <ChevronRight className="w-3 h-3 text-primary-foreground/50" />
              )}
            </Link>
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
              {currentTab ? (currentTab.href === "/" ? "System Dashboard" : currentTab.label) : "Dashboard"}
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
