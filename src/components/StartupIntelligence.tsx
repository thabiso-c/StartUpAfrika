import React from "react";
import { TrendingUp, TrendingDown, DollarSign, Activity, Globe, BarChart3 } from "lucide-react";

export default function StartupIntelligence() {
  const stats = [
    { label: "Funding Raised", value: "$1.4B", change: "-18%", trend: "down", period: "YoY" },
    { label: "Deals Tracked", value: "312", change: "+24%", trend: "up", period: "YoY" },
    { label: "Countries", value: "18", change: "+3", trend: "up", period: "This year" },
    { label: "Fastest Sector", value: "AI", change: "↑", trend: "up", period: "Q3 2026" },
  ];

  const fundingByCountry = [
    { country: "South Africa", amount: 42, flag: "🇿🇦" },
    { country: "Nigeria", amount: 35, flag: "🇳🇬" },
    { country: "Egypt", amount: 22, flag: "🇪🇬" },
    { country: "Kenya", amount: 20, flag: "🇰🇪" },
    { country: "Ghana", amount: 12, flag: "🇬🇭" },
  ];

  const maxAmount = Math.max(...fundingByCountry.map(c => c.amount));

  return (
    <section className="bg-charcoal text-white py-20" id="intelligence">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent mb-4">
            Africa Startup Intelligence
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight">
            Real-time ecosystem data
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl">
            Track funding, deals, and trends across Africa's startup ecosystem.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <p className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                {stat.label}
              </p>
              <p className="font-display text-3xl sm:text-4xl font-extrabold text-white mb-2">
                {stat.value}
              </p>
              <div className="flex items-center gap-2">
                {stat.trend === "up" ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                )}
                <span className={`text-sm font-semibold ${stat.trend === "up" ? "text-emerald-400" : "text-rose-400"}`}>
                  {stat.change}
                </span>
                <span className="text-xs text-gray-400">{stat.period}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Funding by Country */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-12">
          <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="w-6 h-6 text-accent" />
            <h3 className="font-display text-2xl font-bold">
              Startup Funding by Country
            </h3>
          </div>
          <div className="space-y-6">
            {fundingByCountry.map((item) => (
              <div key={item.country}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.flag}</span>
                    <span className="font-semibold text-white">{item.country}</span>
                  </div>
                  <span className="font-mono text-sm text-gray-300">
                    ${item.amount}M
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-amber-400 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(item.amount / maxAmount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}