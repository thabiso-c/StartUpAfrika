import React from "react";
import { Clock, ArrowRight, ExternalLink, Bookmark } from "lucide-react";

interface Article {
  id: string;
  title: string;
  description?: string;
  subtitle?: string;
  coverImage?: string;
  category?: string;
  founderName?: string;
  startupName?: string;
  updatedAt?: string;
  createdAt?: string;
  readTime?: number;
  sourceUrl?: string;
}

interface ArticleCardProps {
  article: Article;
  onSelect: (id: string) => void;
  variant?: "featured" | "compact" | "horizontal";
}

export default function ArticleCard({ article, onSelect, variant = "featured" }: ArticleCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "";
    }
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      Funding: "bg-blue-100 text-blue-800 border-blue-200",
      AI: "bg-purple-100 text-purple-800 border-purple-200",
      Fintech: "bg-emerald-100 text-emerald-800 border-emerald-200",
      Startups: "bg-rose-100 text-rose-800 border-rose-200",
      Markets: "bg-amber-100 text-amber-800 border-amber-200",
      Policy: "bg-cyan-100 text-cyan-800 border-cyan-200",
    };
    return colors[category || ""] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  if (variant === "featured") {
    return (
      <article
        onClick={() => onSelect(article.id)}
        className="group cursor-pointer card-luxury bg-white rounded-2xl overflow-hidden border border-gray-100"
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
          {article.coverImage ? (
            <img 
              src={article.coverImage} 
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-charcoal via-emerald-rich to-emerald-deep" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
          {article.category && (
            <div className="absolute top-6 left-6">
              <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md border ${getCategoryColor(article.category)}`}>
                {article.category}
              </span>
            </div>
          )}
        </div>
        <div className="p-8 sm:p-10">
          <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-charcoal leading-[1.1] mb-3 group-hover:text-emerald-800 transition-colors">
            {article.title}
          </h3>
          {article.description && (
            <p className="text-gray-600 leading-relaxed line-clamp-2 mb-4 text-base">
              {article.description}
            </p>
          )}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3 font-mono">
              <span className="font-bold text-charcoal">
                {article.founderName || article.startupName || "Startup Afrika"}
              </span>
              <span className="text-gray-300">•</span>
              <span>{formatDate(article.updatedAt || article.createdAt)}</span>
              {article.readTime && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.readTime} min read
                  </span>
                </>
              )}
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-charcoal group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </article>
    );
  }

  if (variant === "horizontal") {
    return (
      <article
        onClick={() => onSelect(article.id)}
        className="group cursor-pointer bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-emerald-200 transition-all card-luxury flex"
      >
        <div className="w-32 sm:w-48 shrink-0 overflow-hidden bg-gray-100">
          {article.coverImage ? (
            <img 
              src={article.coverImage} 
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-deep to-emerald-rich" />
          )}
        </div>
        <div className="p-5 sm:p-6 flex flex-col justify-between flex-1">
          <div>
            <div className="mb-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${getCategoryColor(article.category)}`}>
                {article.category || "Article"}
              </span>
            </div>
            <h4 className="font-display text-base sm:text-lg font-bold text-charcoal leading-snug mb-2 group-hover:text-emerald-800 transition-colors line-clamp-2">
              {article.title}
            </h4>
            {article.description && (
              <p className="text-sm text-gray-600 line-clamp-2 hidden sm:block">
                {article.description}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono">
              <span>{formatDate(article.updatedAt || article.createdAt)}</span>
              {article.readTime && (
                <>
                  <span className="text-gray-300">•</span>
                  <span>{article.readTime} min read</span>
                </>
              )}
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-charcoal group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </article>
    );
  }

  // Compact variant (default)
  return (
    <article
      onClick={() => onSelect(article.id)}
      className="group cursor-pointer card-luxury bg-white rounded-xl overflow-hidden border border-gray-100"
    >
      {article.coverImage && (
        <div className="aspect-[16/10] overflow-hidden bg-gray-100">
          <img 
            src={article.coverImage} 
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
      <div className="p-5">
        {article.category && (
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border inline-block mb-3 ${getCategoryColor(article.category)}`}>
            {article.category}
          </span>
        )}
        <h4 className="font-display text-base font-bold text-charcoal leading-snug mb-2 group-hover:text-emerald-800 transition-colors line-clamp-2">
          {article.title}
        </h4>
        {article.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {article.description}
          </p>
        )}
        <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-charcoal">
              {article.founderName || article.startupName || "Startup Afrika"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {article.readTime && (
              <>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {article.readTime} min
                </span>
                <span className="text-gray-300">•</span>
              </>
            )}
            <span>{formatDate(article.updatedAt || article.createdAt)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}