import React, { useState } from "react";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";

export default function Hero() {
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
          className="lg:col-span-8 overflow-hidden rounded-[20px] bg-gradient-to-r from-stone-950 via-emerald-950 to-[#0c3121] text-white flex flex-col md:flex-row justify-between min-h-[380px] relative border border-emerald-900/30 shadow-sm"
          id="featured-banner-card"
        >
          {/* Card Left Text Section */}
          <div className="p-8 sm:p-10 flex flex-col justify-between max-w-xl z-10 relative">
            <div>
              {/* Featured Yellow Pill */}
              <span className="inline-block bg-amber-400 text-black text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md mb-6">
                Featured
              </span>
              
              {/* Massive Bold Title */}
              <h2 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold tracking-tight leading-[1.08] text-white mb-4">
                HOW WE BUILT SLYZAH: <br />
                Thabiso's Story
              </h2>
            </div>
            
            {/* Meta Info */}
            <p className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
              Founder – March 2026
            </p>
          </div>

          {/* Right Section: Smiling Female Founder Portrait */}
          <div className="w-full md:w-[45%] h-[260px] md:h-auto relative overflow-hidden shrink-0">
            <img 
              src="/src/assets/images/female_founder_green_1784393420701.jpg" 
              alt="Thabiso - Slyzah Founder" 
              className="w-full h-full object-cover md:absolute md:inset-0 select-none"
              referrerPolicy="no-referrer"
            />
            {/* Subtle blending gradient from green image to dark background */}
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-emerald-950 to-transparent hidden md:block"></div>
          </div>
        </div>

        {/* Right Column: Subscripts subscription card */}
        <div 
          className="lg:col-span-4 flex flex-col justify-center bg-white p-6 sm:p-8"
          id="subscripts-panel"
        >
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
            Subscripts
          </h3>
          
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Subscribe to new updated interviews for readability like Substack.
          </p>

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

          {/* Inline alert messages */}
          {status && (
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

