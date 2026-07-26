import React, { useState, useEffect } from "react";
import AdminDashboard from "./AdminDashboard";
import { Lock, Mail, ShieldAlert, Key, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import logo from "../assets/images/logo.png";

export default function AdminGate() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(true);
  const [email, setEmail] = useState<string>("letsokothabiso@gmail.com");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const verifyToken = async () => {
    const token = localStorage.getItem("sa_admin_token");
    if (!token) {
      setVerifying(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.valid) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("sa_admin_token");
      }
    } catch (e) {
      console.error("Admin verification failed:", e);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    verifyToken();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    
    // Strict requirement: Only letsokothabiso@gmail.com is authorized
    if (normalizedEmail !== "letsokothabiso@gmail.com") {
      setError("Access Denied: Only letsokothabiso@gmail.com is authorized as Admin.");
      return;
    }

    if (!password) {
      setError("Please enter your admin password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("sa_admin_token", data.token);
        setIsAuthenticated(true);
      } else {
        setError(data.error || "Authentication failed. Check your password.");
      }
    } catch (err) {
      setError("Network error. Could not connect to authentication server.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("sa_admin_token");
    setIsAuthenticated(false);
    setPassword("");
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
        <p className="text-sm font-mono text-stone-400">Verifying Admin authorization...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-white">
        {/* Admin Bar */}
        <div className="bg-stone-950 border-b border-stone-800 px-4 py-2 text-stone-300 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-white">StartUpAfrika Executive Admin</span>
            <span className="text-stone-500">|</span>
            <span className="text-emerald-400">letsokothabiso@gmail.com</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="hover:text-white flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Main Website
            </a>
            <button
              onClick={handleLogout}
              className="text-stone-400 hover:text-rose-400 font-semibold transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>

        <AdminDashboard />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center items-center p-4 antialiased">
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        {/* Decorative ambient bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-600"></div>

        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-stone-800 border border-stone-700 rounded-2xl text-emerald-400 mb-4 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Admin Portal Login</h2>
          <p className="text-xs text-stone-400 mt-1">
            Restricted System Access • <span className="text-emerald-400 font-semibold font-mono">letsokothabiso@gmail.com</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-950/80 border border-rose-600/50 rounded-xl text-rose-200 text-xs flex items-start gap-2.5 animate-shake">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-300">Access Restricted</p>
              <p className="mt-0.5 text-rose-200">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-mono font-bold text-stone-300 uppercase tracking-wider mb-1.5">
              Authorized Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="letsokothabiso@gmail.com"
                className="w-full pl-10 pr-4 py-3 bg-stone-950 border border-stone-800 text-white text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono"
              />
              <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
            </div>
            <p className="text-[10px] text-stone-500 mt-1">Only letsokothabiso@gmail.com has administrative access privileges.</p>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-stone-300 uppercase tracking-wider mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-3 bg-stone-950 border border-stone-800 text-white text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono"
              />
              <Key className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating Admin...</span>
              </>
            ) : (
              <span>Sign In as Admin</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-stone-800 text-center">
          <a
            href="/"
            className="text-xs text-stone-400 hover:text-stone-200 transition-colors inline-flex items-center gap-1 font-mono"
          >
            &larr; Return to StartUpAfrika Main Page
          </a>
        </div>
      </div>
    </div>
  );
}
