import React, { useState, useEffect } from "react";
import { ExternalLink, Newspaper, TrendingUp } from "lucide-react";

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
}

export default function NewsSection() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        // Using NewsAPI for tech/AI news - you'll need to add NEWSAPI_KEY to your environment
        const apiKey = process.env.VITE_NEWSAPI_KEY;
        
        if (!apiKey) {
          // Fallback: Show placeholder message if no API key
          setError("News API key not configured. Add VITE_NEWSAPI_KEY to your environment variables.");
          setLoading(false);
          return;
        }

        // Fetch AI/Tech news
        const aiResponse = await fetch(
          `https://newsapi.org/v2/everything?q=AI+artificial+intelligence+technology&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`
        );

        // Fetch African startup news
        const africaResponse = await fetch(
          `https://newsapi.org/v2/everything?q=African+startup+entrepreneurship+innovation&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`
        );

        if (!aiResponse.ok || !africaResponse.ok) {
          throw new Error("Failed to fetch news");
        }

        const aiData = await aiResponse.json();
        const africaData = await africaResponse.json();

        const combined = [
          ...(aiData.articles || []).map((a: any) => ({
            title: a.title,
            description: a.description || "",
            url: a.url,
            source: a.source.name,
            publishedAt: a.publishedAt,
            imageUrl: a.urlToImage,
          })),
          ...(africaData.articles || []).map((a: any) => ({
            title: a.title,
            description: a.description || "",
            url: a.url,
            source: a.source.name,
            publishedAt: a.publishedAt,
            imageUrl: a.urlToImage,
          })),
        ];

        // Remove duplicates by URL
        const unique = combined.filter((article, index, self) =>
          index === self.findIndex((a) => a.url === article.url)
        );

        // Sort by date
        unique.sort((a, b) => 
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );

        setArticles(unique.slice(0, 8));
        setLoading(false);
      } catch (err) {
        console.error("Error fetching news:", err);
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

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-center gap-2 mb-8 pb-3 border-b border-gray-100">
          <Newspaper className="w-5 h-5 text-emerald-600" />
          <h3 className="font-sans font-bold text-gray-900 text-lg">
            Latest Founder News
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-center gap-2 mb-8 pb-3 border-b border-gray-100">
          <Newspaper className="w-5 h-5 text-emerald-600" />
          <h3 className="font-sans font-bold text-gray-900 text-lg">
            Latest Founder News
          </h3>
        </div>
        <div className="text-center py-12 text-gray-400 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="flex items-center gap-2 mb-8 pb-3 border-b border-gray-100">
        <Newspaper className="w-5 h-5 text-emerald-600" />
        <h3 className="font-sans font-bold text-gray-900 text-lg">
          Latest Founder News
        </h3>
        <TrendingUp className="w-4 h-4 text-emerald-500 ml-1" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {articles.map((article, index) => (
          <a
            key={index}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-emerald-300 transition-all"
          >
            {article.imageUrl && (
              <div className="h-32 overflow-hidden rounded-md mb-3 bg-gray-100">
                <img 
                  src={article.imageUrl} 
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <h4 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-emerald-700 transition-colors">
              {article.title}
            </h4>
            <p className="text-xs text-gray-500 line-clamp-2 mb-2">
              {article.description}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="font-medium">{article.source}</span>
              <span>{formatDate(article.publishedAt)}</span>
            </div>
            <div className="mt-2 flex items-center text-emerald-600 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              Read more <ExternalLink className="w-3 h-3 ml-1" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}