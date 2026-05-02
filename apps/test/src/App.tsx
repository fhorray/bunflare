import React from "react";
import logo from "../public/logo.png";

export function App() {
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-8 text-slate-900 antialiased text-center">
      <div className="mb-8">
        <img src={logo} width="180" height="180" alt="Bunflare Logo" />
      </div>

      <div className="mb-12">
        <h1 className="text-7xl font-bold tracking-tighter text-slate-950">
          bun<span className="text-orange-600">flare</span>
        </h1>
        <p className="text-slate-500 font-medium tracking-wide">Write Bun, Deploy Cloudflare.</p>
      </div>

      <p className="text-slate-500 text-xl font-medium mb-12">
        Start editing <code className="bg-slate-100 px-3 py-1 rounded-xl text-orange-600 font-mono">src/App.tsx</code>
      </p>

      <div className="flex gap-4">
        <a
          href="https://github.com/fhorray/bunflare"
          target="_blank"
          className="bg-orange-600 text-white font-bold px-10 py-4 rounded-xl hover:bg-orange-700 transition-all duration-300 shadow-sm cursor-pointer"
        >
          Documentation
        </a>
      </div>

      <footer className="absolute bottom-12 text-slate-400 text-xs font-bold tracking-[0.2em] uppercase">
        Built with 🧡 by Bunflare
      </footer>
    </div>
  );
}
