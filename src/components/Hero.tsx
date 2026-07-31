import React, { useState } from "react";
import { Mail, CheckCircle2, AlertCircle, TrendingUp, ArrowRight } from "lucide-react";
import { User } from "firebase/auth";

export default function Hero({ 
  user,
  featuredArticle,
  previousArticles,
  onSelectArticle,
  articlesLoading
}: { 
  user?: User | null;
  featuredArticle?: any;
  previousArticles?: any[];
  onSelectArticle?: (id: string) => void;
  articlesLoading?: boolean;
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
    <section className="bg-charcoal text-white pt-16 pb-0 min-h-[60vh] lg:min-h-[70vh] relative overflow-hidden" id="hero-section">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-charcoal/95 z-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="max-w-5xl mx-auto text-center mb-12 lg:mb-16 pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent mb-6">
            African Startup Intelligence
          </p>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-white leading-[0.95] mb-8 tracking-tight">
            The biggest stories shaping Africa's technology economy
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto mb-10 font-light">
            Curated intelligence for founders, investors, and operators building the future of African tech.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#latest-stories"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-charcoal font-bold text-sm tracking-wider uppercase rounded-full hover:bg-accent hover:scale-105 transition-all shadow-2xl"
            >
              Explore Stories
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#intelligence"
              className="inline-flex items-center gap-2 px-8 py-4 bg-transparent text-white font-bold text-sm tracking-wider uppercase rounded-full border-2 border-white/30 hover:border-white hover:bg-white/10 transition-all"
            >
              View Intelligence
              <TrendingUp className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* FEATURED STORY with dominant imagery */}
        {featuredArticle && (
          <div className="pb-16 lg:pb-20">
            <div className="max-w-7xl mx-auto">
              <div 
                onClick={() => featuredArticle.id && onSelectArticle && onSelectArticle(featuredArticle.id)}
                className="group cursor-pointer relative"
              >
                <div className="relative aspect-[16/9] lg:aspect-[21/9] w-full overflow-hidden rounded-none lg:rounded-2xl shadow-2xl">
                  {featuredArticle.coverImage ? (
                    <img 
                      src={featuredArticle.coverImage} 
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-1000 ease-out"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-charcoal via-emerald-rich to-charcoal-light" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  
                  <div className="absolute top-6 left-6 z-30">
                    <span className="inline-block bg-accent text-charcoal text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-md shadow-lg">
                      Featured
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12 text-white">
                    <div className="max-w-4xl">
                      <div className="mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-accent">
                          {featuredArticle.category || "Editorial"}
                        </span>
                      </div>
                      <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-[1.1] mb-4 group-hover:text-accent transition-colors">
                        {featuredArticle.title}
                      </h2>
                      <p className="text-lg text-gray-200 leading-relaxed line-clamp-2 mb-6 max-w-3xl">
                        {featuredArticle.subtitle || featuredArticle.description || ""}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-300 font-mono">
                        <span className="font-bold text-white">
                          {featuredArticle.founderName || "Startup Afrika"}
                        </span>
                        <span className="text-gray-500">•</span>
                        <span>
                          {new Date(featuredArticle.updatedAt || featuredArticle.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </span>
                        {featuredArticle.readTime && (
                          <>
                            <span className="text-gray-500">•</span>
                            <span>{featuredArticle.readTime} min read</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading state for featured article */}
        {articlesLoading && (
          <div className="pb-16 lg:pb-20">
            <div className="w-full aspect-[21/9] bg-gray-800 rounded-none lg:rounded-2xl animate-pulse" />
          </div>
        )}

        {/* Sidebar: subscribe card */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-display text-xl font-bold text-charcoal mb-2">
              The Africa Startup Brief
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              What matters in Africa's tech ecosystem — delivered weekly.
            </p>
            {user ? (
              <div className="text-center py-8 bg-emerald-50 rounded-xl border border-emerald-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                <p className="font-semibold text-emerald-900 text-sm">You're on the list!</p>
                <p className="text-xs text-emerald-700 mt-1">{user.email}</p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-3.5">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-charcoal text-white font-bold tracking-wider text-xs uppercase rounded-xl transition-all hover:bg-charcoal-light active:scale-95 disabled:opacity-60"
                >
                  {loading ? "SUBSCRIBING..." : "Subscribe →"}
                </button>
              </form>
            )}
            {status && !user && (
              <div
                className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-start gap-2.5 ${
                  status.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                    : "bg-rose-50 text-rose-800 border border-rose-100"
                }`}
              >
                {status.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{status.message}</span>
              </div>
            )}
          </div>

          {/* Smart navigation / category shortcuts */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100">
            <h4 className="font-display text-xs font-bold uppercase tracking-widest text-charcoal mb-4">
              Explore Topics
            </h4>
            <div className="flex flex-wrap gap-2">
              {[
                { name: "Startups", query: "startups", category: "Startups" },
                { name: "Funding", query: "funding", category: "Funding" },
                { name: "AI", query: "artificial intelligence", category: "AI" },
                { name: "Fintech", query: "fintech", category: "Fintech" },
                { name: "Founders", query: "founder", category: "Founders" },
                { name: "Markets", query: "markets", category: "Markets" },
                { name: "Policy", query: "policy", category: "Policy" },
                { name: "South Africa", query: "South Africa", category: "Markets" },
              ].map((topic) => (
                <button
                  key={topic.name}
                  onClick={() => {
                    window.location.hash = 'community';
                  }}
                  className="px-3 py-1.5 rounded-full bg-warm-white text-[11px] font-bold uppercase tracking-wider text-gray-700 hover:bg-charcoal hover:text-white transition-all border border-gray-200 cursor-pointer"
                >
                  {topic.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}