import React from "react";
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

  // Editorial Hero with strong visual hierarchy
  return (
    <section className="bg-off-white pt-16 pb-20 border-b border-gray-100" id="hero-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Premium editorial hero: big headline dominates */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent mb-6">
            Africa's Startup Ecosystem
          </p>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold text-charcoal leading-[0.95] mb-8 tracking-tight">
            The biggest stories shaping Africa's technology economy
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto mb-10 font-light">
            Curated intelligence for founders, investors, and operators building the future of African tech.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#latest-stories"
              className="inline-flex items-center gap-2 px-8 py-4 bg-charcoal text-white font-bold text-sm tracking-wider uppercase rounded-full hover:bg-charcoal-light transition-all hover:shadow-xl"
            >
              Explore the latest
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#intelligence"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-charcoal font-bold text-sm tracking-wider uppercase rounded-full border border-gray-200 hover:border-charcoal hover:shadow-md transition-all"
            >
              View intelligence
              <TrendingUp className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Split layout: main featured story + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Main featured story */}
          <div className="lg:col-span-8">
            {featuredArticle && (
              <article
                onClick={() => featuredArticle.id && onSelectArticle && onSelectArticle(featuredArticle.id)}
                className="group cursor-pointer card-luxury bg-white rounded-2xl overflow-hidden border border-gray-100"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                  {featuredArticle.coverImage ? (
                    <img 
                      src={featuredArticle.coverImage} 
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-charcoal via-emerald-rich to-emerald-deep" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-6 left-6">
                    <span className="inline-block bg-accent text-charcoal text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md">
                      Featured
                    </span>
                  </div>
                </div>
                <div className="p-8 sm:p-10">
                  <div className="mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                      {featuredArticle.category || "Editorial"}
                    </span>
                  </div>
                  <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-charcoal leading-[1.1] mb-4 group-hover:text-emerald-800 transition-colors">
                    {featuredArticle.title}
                  </h2>
                  <p className="text-gray-600 leading-relaxed line-clamp-2 mb-6 text-base">
                    {featuredArticle.subtitle || featuredArticle.description || ""}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 font-mono">
                    <span className="font-bold text-charcoal">
                      {featuredArticle.founderName || "Startup Afrika"}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span>
                      {new Date(featuredArticle.updatedAt || featuredArticle.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </span>
                    {featuredArticle.readTime && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span>{featuredArticle.readTime} min read</span>
                      </>
                    )}
                  </div>
                </div>
              </article>
            )}
            
            {/* Loading state for featured article */}
            {articlesLoading && (
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="aspect-[16/9] bg-gray-200" />
                <div className="p-8 sm:p-10 space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-8 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: latest, categories, subscribe card */}
          <div className="lg:col-span-4 space-y-8">
            {/* Newsletter / Subscribe card */}
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
                {["Startups", "Funding", "AI", "Fintech", "Founders", "Markets", "Policy", "South Africa"].map((topic) => (
                  <button
                    key={topic}
                    className="px-3 py-1.5 rounded-full bg-warm-white text-[11px] font-bold uppercase tracking-wider text-gray-700 hover:bg-charcoal hover:text-white transition-all border border-gray-200"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}