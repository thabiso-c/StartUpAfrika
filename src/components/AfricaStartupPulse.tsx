import React from "react";
import { TrendingUp, Globe, Building2, BarChart3 } from "lucide-react";

export default function AfricaStartupPulse() {
  const pulseData = [
    { region: "South Africa", startups: 312, funding: "R2.4B", growth: 78 },
    { region: "Nigeria", startups: 284, funding: "R1.8B", growth: 92 },
    { region: "Kenya", startups: 198, funding: "R1.2B", growth: 85 },
    { region: "Egypt", startups: 156, funding: "R0.9B", growth: 71 },
  ];

  const stats = [
    { label: "Startups Tracked", value: "950+", icon: Building2 },
    { label: "Active Markets", value: "18", icon: Globe },
    { label: "Total Funding", value: "R6.3B", icon: TrendingUp },
    { label: "YoY Growth", value: "+84%", icon: BarChart3 },
  ];

  return (
    <section className="bg-charcoal text-white py-20 lg:py-24" id="startup-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 lg:mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent mb-4">
            Ecosystem Intelligence
          </p>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
            Africa Startup Pulse
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl leading-relaxed">
            Real-time tracking of Africa's most promising startups, funding rounds, and market movements.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8 hover:bg-white/10 transition-all duration-300"
            >
              <stat.icon className="w-8 h-8 text-accent mb-4" />
              <div className="font-display text-3xl lg:text-4xl font-extrabold text-white mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Regional Breakdown */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 lg:p-12">
          <h3 className="font-display text-2xl font-bold text-white mb-8">
            Regional Breakdown
          </h3>
          <div className="space-y-8">
            {pulseData.map((region, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-display text-xl font-bold text-white">
                      {region.region}
                    </h4>
                    <p className="text-sm text-gray-400 mt-1">
                      {region.startups} startups · {region.funding} raised
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-accent font-bold text-lg">
                      +{region.growth}%
                    </div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">
                      Growth
                    </div>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${region.growth}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-6">
            Explore detailed profiles of {pulseData.reduce((acc, r) => acc + r.startups, 0)}+ startups across Africa
          </p>
          <button className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-charcoal font-bold text-sm tracking-wider uppercase rounded-full hover:bg-white transition-all shadow-xl">
            Explore the Ecosystem
            <TrendingUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}