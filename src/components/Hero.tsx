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

  // Editorial Hero with strong visual hierarchy - Phase 2: More dominant and premium
  return (
    <section className="bg-charcoal text-white pt-16 pb-0 min-h-[60vh] lg:min-h-[70vh] relative overflow-hidden" id="hero-section">
      {/* Subtle texture overlay for premium feel */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-charcoal/95 z-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        {/* Premium editorial hero: Compelling tagline and CTA */}
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

        {/* FEATURED STORY with dominant imagery - 50-60% of initial viewport */}
        {featuredArticle && (
          <div className="pb-16 lg:pb-20">
            <div className="max-w-7xl mx-auto">
              <div 
                onClick={() => featuredArticle.id && onSelectArticle && onSelectArticle(featuredArticle.id)}
                className="group cursor-pointer relative"
              >
                {/* Massive featured image */}
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
                  
                  {/* Featured label */}
                  <div className="absolute top-6 left-6 z-30">
                    <span className="inline-block bg-accent text-charcoal text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-md shadow-lg">
                      Featured
                    </span>
                  </div>

                  {/* Content overlay */}
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
      </div>
    </section>
  );
}