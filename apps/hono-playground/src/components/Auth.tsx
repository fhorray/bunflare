import React, { useState } from "react";
import { authClient } from "../lib/auth-client";
import { useNavigate } from "@tanstack/react-router";
import logo from "../../public/logo.png";

export function AuthPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (session) {
      navigate({ to: "/dashboard" });
    }
  }, [session, navigate]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin "></div>
      </div>
    );
  }

  if (session) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] p-6 antialiased">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <img src={logo} width="60" height="60" alt="Bunflare Logo" className="mb-6 opacity-90" />
          <div className="bg-slate-200/50 p-1 rounded-lg flex gap-1 w-fit">
            <button
              onClick={() => setTab("login")}
              className={`px-10 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${tab === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Login
            </button>
            <button
              onClick={() => setTab("register")}
              className={`px-10 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${tab === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Register
            </button>
          </div>
        </div>

        <div className="transition-all duration-300">
          {tab === "login" ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>
    </div>
  );
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: authError } = await authClient.signIn.email({
      email,
      password,
    });

    if (authError) {
      setError(authError.message || "Login failed");
    } else {
      navigate({ to: "/dashboard" });
    }
    setLoading(false);
  };

  return (
    <div className="p-8 md:p-12 bg-white border border-slate-200/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
      <h2 className="text-3xl font-bold tracking-tight mb-2 text-slate-900 text-center">Welcome back</h2>
      <p className="text-slate-500 mb-10 font-medium text-center">Enter your credentials to continue.</p>

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 ml-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="name@example.com"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 ml-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            placeholder="••••••••"
            required
          />
        </div>

        {error && <div className="text-red-600 text-sm font-semibold bg-red-50 p-4 rounded-xl border border-red-100">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-8 py-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-all active:scale-[0.98] shadow-sm disabled:opacity-50 mt-4 cursor-pointer"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: authError } = await authClient.signUp.email({
      email,
      password,
      name,
    });

    if (authError) {
      setError(authError.message || "Registration failed");
    } else {
      navigate({ to: "/dashboard" });
    }
    setLoading(false);
  };

  return (
    <div className="p-8 md:p-12 bg-white border border-slate-200/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
      <h2 className="text-3xl font-bold tracking-tight mb-2 text-slate-900 text-center">Create account</h2>
      <p className="text-slate-500 mb-10 font-medium text-center">Join the Bunflare edge ecosystem.</p>

      <form onSubmit={handleRegister} className="space-y-5">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 ml-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="John Doe"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 ml-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="name@example.com"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 ml-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            placeholder="••••••••"
            required
          />
        </div>

        {error && <div className="text-red-600 text-sm font-semibold bg-red-50 p-4 rounded-xl border border-red-100">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-8 py-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-all active:scale-[0.98] shadow-sm disabled:opacity-50 mt-4 cursor-pointer"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </div>
  );
}

