import React from "react";
import { Star, ArrowRight } from "lucide-react";

interface Startup {
  id: string;
  name: string;
  category: string;
  country: string;
  featured?: boolean;
  description?: string;
}

interface StartupsToWatchProps {
  startups?: Startup[];
  onSelect?: (id: string) => void;
}

export default function StartupsToWatch({ startups, onSelect }: StartupsToWatchProps) {
  const defaultStartups: Startup[] = [
    { id: "1", name: "PayHero", category: "Fintech", country: "South Africa", featured: true, description: "Embedded payments infrastructure for SaaS platforms" },
    { id: "2", name: "Awarri AI", category: "AI", country: "Nigeria", featured: false, description: "Computer vision for supply chain optimization" },
    { id: "3", name: "Kobwa", category: "ClimateTech", country: "Kenya", featured: false, description: "Carbon credit marketplace for African projects" },
    { id: "4", name: "MediStore", category: "HealthTech", country: "Egypt", featured: true, description: "Inventory management for pharmacies" },
    { id: "5", name: "ShipAfrika", category: "Logistics", country: "Ghana", featured: false, description: "Cross-border logistics platform" },
    { id: "6", name: "EduSpark", category: "EdTech", country: "Nigeria", featured: false, description: "AI-powered tutoring for STEM subjects" },
    { id: "7", name: "PowerGrid", category: "Energy", country: "South Africa", featured: true, description: "Microgrid management for rural communities" },
    { id: "8", name: "AgriLink", category: "AgriTech", country: "Kenya", featured: false, description: "Market access for smallholder farmers" },
  ];

  const displayStartups = startups || defaultStartups;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Fintech: "bg-emerald-100 text-emerald-800 border-emerald-200",
      AI: "bg-purple-100 text-purple-800 border-purple-200",
      ClimateTech: "bg-green-100 text-green-800 border-green-200",
      HealthTech: "bg-rose-100 text-rose-800 border-rose-200",
      Logistics: "bg-amber-100 text-amber-800 border-amber-200",
      EdTech: "bg-blue-100 text-blue-800 border-blue-200",
      Energy: "bg-orange-100 text-orange-800 border-orange-200",
      AgriTech: "bg-lime-100 text-lime-800 border-lime-200",
    };
    return colors[category] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <section className="bg-white py-20" id="startups">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent mb-4">
              Startups to Watch
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-charcoal tracking-tight">
              {displayStartups.length} companies
            </h2>
            <p className="text-gray-600 text-lg mt-3 max-w-2xl">
              The most promising African startups shaping the future.
            </p>
          </div>
          <button 
            onClick={() => {
              const startupsSection = document.getElementById("startups");
              if (startupsSection) {
                startupsSection.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
            className="hidden sm:inline-flex items-center gap-2 px-6 py-3 bg-charcoal text-white font-bold text-xs uppercase tracking-wider rounded-full hover:bg-charcoal-light transition-all"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Startups Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayStartups.map((startup, index) => (
            <article
              key={startup.id}
              onClick={() => onSelect && onSelect(startup.id)}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect && onSelect(startup.id); } }}
              className={`group cursor-pointer card-luxury bg-white rounded-2xl overflow-hidden border transition-all ${
                startup.featured
                  ? "border-accent/30 shadow-lg shadow-amber-100/50"
                  : "border-gray-100 hover:border-emerald-200"
              }`}
            >
              <div className="p-6">
                {/* Number & Featured Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-gray-400 font-bold">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {startup.featured && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                      <Star className="w-3 h-3 fill-amber-700" />
                      Featured
                    </span>
                  )}
                </div>

                {/* Startup Info */}
                <h3 className="font-display text-xl font-extrabold text-charcoal mb-2 group-hover:text-emerald-800 transition-colors">
                  {startup.name}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2">
                  {startup.description}
                </p>

                {/* Category & Country */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${getCategoryColor(startup.category)}`}>
                    {startup.category}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    {startup.country}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}