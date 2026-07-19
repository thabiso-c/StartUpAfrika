import React, { useState } from "react";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { User } from "firebase/auth";

export default function Hero({ 
  user,
  featuredArticle,
  onSelect
}: { 
  user?: User | null;
  featuredArticle?: any;
  onSelect?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus({
          type: "success",
          message: "You're on the list! Welcome to Startup Afrika.",
        });
        setEmail("");
      } else {
        setStatus({
          type: "error",
          message: data.error || "Something went wrong. Please try again.",
        });
      }
    } catch (err) {
      setStatus({
        type: "error",
        message: "Unable to connect to the server. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" id="hero-section">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Big Featured Card */}
        <div 
          onClick={onSelect}
          className="lg:col-span-9 overflow-hidden rounded-[20px] bg-gradient-to-r from-stone-950 via-emerald-950 to-[#0c3121] text-white flex flex-col md:flex-row justify-between min-h-[500px] relative border border-emerald-900/30 shadow-sm cursor-pointer hover:border-emerald-500/50 transition-all group"
          id="featured-banner-card"
        >
          {/* Card Left Text Section */}
          <div className="p-10 sm:p-12 flex flex-col justify-between max-w-2xl z-10 relative">
            <div>
              {/* Featured Yellow Pill */}
              <span className="inline-block bg-amber-400 text-black text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md mb-8">
                Featured
              </span>
              
              {/* Massive Bold Title */}
              <h2 className="text-4xl sm:text-5xl md:text-[44px] font-extrabold tracking-tight leading-[1.08] text-white mb-6 group-hover:text-emerald-300 transition-colors">
                {featuredArticle ? featuredArticle.title : "Welcome to Slyzah"}
              </h2>
            </div>
            
            {/* Meta Info */}
            <p className="text-sm font-semibold text-stone-300 uppercase tracking-wider">
              {featuredArticle 
                ? `${featuredArticle.founderName || "Founder"} – ${new Date(featuredArticle.updatedAt || featuredArticle.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
                : "No curation has been featured yet."}
            </p>
          </div>

          {/* Right Section */}
          <div className="w-full md:w-[50%] h-[300px] md:h-auto relative overflow-hidden shrink-0">
            {featuredArticle?.coverImage ? (
              <img 
                src={featuredArticle.coverImage} 
                alt={featuredArticle.founderName || "Featured Article"} 
                className="w-full h-full object-cover md:absolute md:inset-0 select-none"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-emerald-950/40 flex items-center justify-center border-l border-emerald-900/20">
                <span className="text-stone-400 text-xs font-mono">// Slyzah Digital</span>
              </div>
            )}
            {/* Subtle blending gradient from green image to dark background */}
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-emerald-950 to-transparent hidden md:block"></div>
          </div>
        </div>

        {/* Right Column: Subscripts subscription card */}
        <div 
          className="lg:col-span-3 flex flex-col justify-center bg-white p-6 sm:p-8"
          id="subscripts-panel"
        >
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
            Subscripts
          </h3>
          
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Subscribe to new updated interviews for readability like Substack.
          </p>

          {user ? (
            <div className="text-center py-6 bg-emerald-50 rounded-xl border border-emerald-100">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
              <p className="font-semibold text-emerald-900">You are signed in!</p>
              <p className="text-sm text-emerald-700 mt-1">You'll receive all updates at {user.email}.</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-3.5">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                  disabled={loading}
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-800 text-white font-bold tracking-wider uppercase rounded-lg text-xs transition-all hover:bg-emerald-900 active:scale-95 flex items-center justify-center"
              >
                {loading ? "SUBSCRIBING..." : "SUBSCRIBE"}
              </button>
            </form>
          )}

          {/* Inline alert messages */}
          {status && !user && (
            <div
              className={`mt-4 p-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 ${
                status.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                  : "bg-rose-50 text-rose-800 border border-rose-100"
              }`}
            >
              {status.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{status.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}