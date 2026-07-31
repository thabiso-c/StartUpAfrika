import React from "react";
import { Bookmark, ArrowRight } from "lucide-react";

interface Article {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  category?: string;
  founderName?: string;
  updatedAt?: string;
  readTime?: number;
}

interface EditorsPickProps {
  article?: Article | null;
  onSelect?: (id: string) => void;
}

export default function EditorsPick({ article, onSelect }: EditorsPickProps) {
  const defaultArticle: Article = {
    id: "editors-pick-1",
    title: "The African founders building beyond fintech",
    description: "While fintech dominates headlines, a new generation of founders is solving hard problems in climate, health, and logistics across the continent.",
    category: "Founders",
    founderName: "Startup Afrika Editorial",
    readTime: 8,
  };

  const displayArticle = article || defaultArticle;

  return (
    <section className="bg-warm-white py-20 border-y border-gray-100" id="editors-pick">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Label */}
        <div className="flex items-center gap-3 mb-8">
          <Bookmark className="w-5 h-5 text-accent" />
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">
            Editor's Pick
          </p>
        </div>

        {/* Featured Article */}
        <article
          onClick={() => displayArticle.id && onSelect && onSelect(displayArticle.id)}
          className="group cursor-pointer"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Image */}
            <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-gray-100">
              {displayArticle.coverImage ? (
                <img 
                  src={displayArticle.coverImage} 
                  alt={displayArticle.title}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-charcoal via-emerald-rich to-emerald-deep flex items-center justify-center">
                  <div className="text-white/20 font-display text-6xl font-extrabold">
                    SA
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex flex-col justify-center">
              {displayArticle.category && (
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-4">
                  {displayArticle.category}
                </span>
              )}
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-charcoal leading-[1.1] mb-6 group-hover:text-emerald-800 transition-colors">
                {displayArticle.title}
              </h2>
              {displayArticle.description && (
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  {displayArticle.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="font-semibold text-charcoal">
                  {displayArticle.founderName || "Startup Afrika"}
                </span>
                {displayArticle.readTime && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span>{displayArticle.readTime} min read</span>
                  </>
                )}
              </div>
              <div className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-charcoal group-hover:text-emerald-700 transition-colors">
                Read full story
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}