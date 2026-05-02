import React from "react";
import { Link } from "@tanstack/react-router";
import logo from "../public/logo.png";

export function App() {
  return (
    <div className="min-h-screen bg-[#fafafa] relative overflow-hidden flex flex-col items-center">
      {/* Subtle Background Elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-orange-100/30 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[35rem] h-[35rem] bg-blue-50/40 blur-[100px] rounded-full -z-10" />

      <main className="max-w-4xl w-full px-6 pt-32 pb-20 flex flex-col items-center text-center">
        <div className="mb-12 animate-bounce-subtle">
          <img src={logo} width="100" height="100" alt="Bunflare Logo" className="opacity-90" />
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-8 leading-[1.1]">
          Write <span className="text-orange-600">Bun</span> <br />
          Deploy <span className="text-slate-400">Cloudflare</span>.
        </h1>

        <p className="max-w-xl text-xl text-slate-500 font-medium mb-12 leading-relaxed">
          The high-performance bridge between Bun and the edge. <br className="hidden md:block" />
          Build scalable fullstack apps with zero friction.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/auth"
            className="btn-primary flex items-center gap-3 px-10"
          >
            Get Started
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <a
            href="https://github.com/fhorray/bunflare"
            target="_blank"
            className="px-8 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all duration-300 shadow-sm"
          >
            Documentation
          </a>
        </div>

        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          {[
            { title: "Drizzle + PG", desc: "Native Hyperdrive support for ultra-fast database queries." },
            { title: "Better Auth", desc: "Pre-configured authentication that just works." },
            { title: "HMR + Local", desc: "Instant feedback loop with local Docker emulation." }
          ].map((feature, i) => (
            <div key={i} className="p-8 bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-2xl hover:border-orange-200 transition-colors">
              <h3 className="text-lg font-bold mb-2 text-slate-900">{feature.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="mt-auto py-12 text-slate-400 text-xs font-bold tracking-[0.2em] uppercase">
        Built with 🧡 by Bunflare
      </footer>
    </div>
  );
}
