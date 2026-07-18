import React, { useState } from "react";
import { Lock, Mail, Eye, EyeOff, Loader } from "lucide-react";
import logo from "../../assets/images/logo.png";
import EditorDashboard from "./EditorDashboard";

export default function EditorGate() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem("editor_token"));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/editor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed.");
      sessionStorage.setItem("editor_token", data.token);
      setToken(data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (token) return <EditorDashboard token={token} onLogout={() => { sessionStorage.removeItem("editor_token"); setToken(null); }} />;

  return (
    <div className="min-h-screen bg-[#0a0f0d] flex flex-col items-center justify-center px-4" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-900/20 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-10">
          <img src={logo} alt="Startup Afrika" className="w-16 h-16 object-contain mb-4" />
          <h1 className="text-white text-2xl font-bold tracking-wide">Editorial Workspace</h1>
          <p className="text-emerald-400/70 text-sm mt-1 tracking-wider uppercase">Startup Afrika · Private</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span className="text-white/70 text-sm font-medium">Restricted Access</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white/8 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl pl-10 pr-12 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white/8 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm tracking-wide"
            >
              {loading ? <><Loader className="w-4 h-4 animate-spin" /> Verifying…</> : "Enter Editorial Workspace"}
            </button>
          </form>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Startup Afrika · Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}
