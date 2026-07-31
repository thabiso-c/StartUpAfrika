import React, { useState, useEffect } from "react";
import { Newspaper, TrendingUp, ArrowRight, ExternalLink, Clock } from "lucide-react";

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
  articleId?: string;
}

interface NewsSectionProps {
  onSelectArticle?: (id: string) => void;
}

const NEWS_CACHE_KEY = "sa_news_cache_v1";
const NEWS_CACHE_TS_KEY = "sa_news_cache_ts_v1";
const NEWS_STALE_MS = 5 * 60 * 1000; // 5 minutes

export default function NewsSection({ onSelectArticle }: NewsSectionProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      // Step 1: Paint instantly from localStorage cache (if fresh enough)
      try {
        const cachedTs = localStorage.getItem(NEWS_CACHE_TS_KEY);
        const cachedData = localStorage.getItem(NEWS_CACHE_KEY);
        if (cachedTs && cachedData) {
          const age = Date.now() - parseInt(cachedTs);
          if (age < NEWS_STALE_MS) {
            const parsed = JSON.parse(cachedData) as NewsArticle[];
            if (parsed.length > 0) {
              setArticles(parsed);
              setLoading(false);
              return; // Cache is fresh, no need to fetch
            }
          }
        }
      } catch (_) {}

      // Step 2: Fetch fresh data from server
      try {
        const res = await fetch("/api/news");
        const data = await res.json();

        if (data.error) {
          setError(data.error);
        } else if (data.articles && data.articles.length > 0) {
          setArticles(data.articles);
          // Persist to localStorage for instant load on next visit
          try {
            localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(data.articles));
            localStorage.setItem(NEWS_CACHE_TS_KEY, Date.now().toString());
          } catch (_) {}
        } else {
          setError("No news articles available at this time.");
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching news:", err);
        // Try to serve stale cache as fallback
        try {
          const cachedData = localStorage.getItem(NEWS_CACHE_KEY);
          if (cachedData) {
            const parsed = JSON.parse(cachedData) as NewsArticle[];
            if (parsed.length > 0) {
              setArticles(parsed);
              setLoading(false);
              return;
            }
          }
        } catch (_) {}
        setError("Unable to load news at this time.");
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleArticleClick = (articleId?: string) => {
    if (!articleId) return;
    if (onSelectArticle) {
      onSelectArticle(articleId);
    }
  };

  if (loading) {
    return (
      <div className="bg-white py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-8">
            <Newspaper className="w-5 h-5 text-accent" />
            <h3 className="font-display text-2xl font-bold text-charcoal">
              Latest African Tech & Startup News
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-5 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-xl mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-8">
            <Newspaper className="w-5 h-5 text-accent" />
            <h3 className="font-display text-2xl font-bold text-charcoal">
              Latest African Tech & Startup News
            </h3>
          </div>
          <div className="text-center py-12 text-gray-400 text-sm">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-20 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-accent" />
            <h3 className="font-display text-2xl font-bold text-charcoal">
              Latest African Tech & Startup News
            </h3>
          </div>
          <TrendingUp className="w-5 h-5 text-emerald-600" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {articles.slice(0, 8).map((article, index) => (
            <article
              key={index}
              onClick={() => handleArticleClick(article.articleId)}
              className="group cursor-pointer card-luxury bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-emerald-200 transition-all"
            >
              {article.imageUrl && (
                <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                  <img 
                    src={article.imageUrl} 
                    alt={article.title}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="p-5">
                <h4 className="font-display text-base font-bold text-charcoal leading-snug mb-2 group-hover:text-emerald-800 transition-colors line-clamp-2">
                  {article.title}
                </h4>
                {article.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {article.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-medium text-charcoal">Startup Afrika</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(article.publishedAt)}
                  </span>
                </div>
                <div className="mt-3 flex items-center text-emerald-600 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Read more <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}