import React from "react";
import { authClient } from "../lib/auth-client";
import { useNavigate } from "@tanstack/react-router";

export function Dashboard() {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authClient.signOut();
    navigate({ to: "/auth" });
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fafafa]">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session || !session.user) {
    navigate({ to: "/auth" });
    return null;
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col antialiased">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center text-white text-xs font-black">BF</div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900">Bunflare Console</h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto p-6 md:p-12 flex-1">
        <div className="mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Welcome, {session.user.name}</h2>
          <p className="text-slate-500 font-medium">Manage your edge deployment and account settings.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200/60 rounded-xl p-8 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">User Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Email</p>
                  <p className="text-slate-900 font-semibold">{session.user.email}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Account ID</p>
                  <p className="text-slate-400 font-mono text-xs truncate">{session.user.id}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200/60 rounded-xl p-8 shadow-sm">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <h4 className="font-bold text-slate-900 mb-1">Traffic</h4>
                <p className="text-slate-500 text-sm">Real-time edge metrics.</p>
              </div>
              <div className="bg-white border border-slate-200/60 rounded-xl p-8 shadow-sm">
                <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="font-bold text-slate-900 mb-1">Security</h4>
                <p className="text-slate-500 text-sm">WAF and DDoS protection.</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 text-white rounded-xl p-8 shadow-lg shadow-slate-200">
              <h3 className="text-lg font-bold mb-6">Status</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Environment</span>
                  <span className="font-bold">Production</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Runtime</span>
                  <span className="font-bold text-orange-400">Bunflare Edge</span>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-center text-sm">
                  <span className="text-slate-400">Region</span>
                  <span className="font-bold">Global (200+)</span>
                </div>
              </div>
            </div>

            <div className="p-8 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-xl hover:border-orange-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-bold text-slate-700">Network Status</span>
              </div>
              <span className="text-xs font-bold text-slate-400">UP</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
