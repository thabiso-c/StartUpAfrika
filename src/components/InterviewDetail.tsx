import React from "react";
import { ArrowLeft, MapPin, Calendar, Cpu, Zap, Hammer, Code2, TrendingUp, DollarSign, AlertTriangle, ShieldCheck, Share2 } from "lucide-react";
import { Interview } from "../types";

interface InterviewDetailProps {
  interview: Interview;
  onBack: () => void;
}

export default function InterviewDetail({ interview, onBack }: InterviewDetailProps) {
  // Safe color maps for consistent style
  const colorMap: Record<
    string,
    { text: string; bg: string; border: string; accent: string; badge: string; shadow: string }
  > = {
    emerald: {
      text: "text-emerald-800",
      bg: "bg-emerald-50/60",
      border: "border-emerald-100",
      accent: "bg-emerald-600",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
      shadow: "shadow-emerald-100",
    },
    blue: {
      text: "text-blue-800",
      bg: "bg-blue-50/60",
      border: "border-blue-100",
      accent: "bg-blue-600",
      badge: "bg-blue-50 text-blue-700 border-blue-100",
      shadow: "shadow-blue-100",
    },
    indigo: {
      text: "text-indigo-800",
      bg: "bg-indigo-50/60",
      border: "border-indigo-100",
      accent: "bg-indigo-600",
      badge: "bg-indigo-50 text-indigo-700 border-indigo-100",
      shadow: "shadow-indigo-100",
    },
    amber: {
      text: "text-amber-800",
      bg: "bg-amber-50/60",
      border: "border-amber-100",
      accent: "bg-amber-600",
      badge: "bg-amber-50 text-amber-700 border-amber-100",
      shadow: "shadow-amber-100",
    },
  };

  const scheme = colorMap[interview.accentColor] || colorMap.emerald;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${interview.startupName} Blueprint - Startup Afrika`,
        text: `Check out how ${interview.founderName} built and scaled ${interview.startupName}!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard! Share it with fellow founders.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" id="interview-detail-view">
      {/* Back Nav Bar */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-emerald-700 transition-colors py-2"
          id="detail-back-button"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blueprints
        </button>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:text-emerald-700 hover:bg-gray-50 transition-colors shadow-sm"
          id="detail-share-button"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share Blueprint
        </button>
      </div>

      {/* Main Grid: Header & Blueprint content Left, Tech Specs Sidebar Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left 8 Columns: Article */}
        <div className="lg:col-span-8">
          {/* Header Metadata block */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-md border ${scheme.badge}`}>
                {interview.startupName} Blueprint
              </span>
              <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {interview.location}
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
              {interview.title}
            </h2>

            <p className="text-lg text-gray-600 leading-relaxed italic mb-8 border-l-4 border-emerald-500/30 pl-4">
              &ldquo;{interview.subtitle}&rdquo;
            </p>

            {/* Founder Profile Card */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 mb-8">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                {interview.founderName[0]}
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">{interview.founderName}</p>
                <p className="text-xs font-mono text-gray-500">
                  {interview.founderRole} @ {interview.startupName} • Founded in {interview.foundedYear}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-4 p-5 bg-emerald-50/20 border border-emerald-100/30 rounded-2xl mb-12">
            {interview.stats.map((st) => (
              <div key={st.label} className="text-center sm:text-left">
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">{st.label}</p>
                <p className="text-base sm:text-lg font-mono font-extrabold text-emerald-800">{st.value}</p>
              </div>
            ))}
          </div>

          {/* 6 Questions Deep Dive Section */}
          <div className="space-y-12" id="answers-container">
            {/* Q1: Spark */}
            <section className="scroll-mt-20">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${scheme.bg} ${scheme.text}`}>
                  <Zap className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 font-sans">
                  The Spark: What inspired you to start?
                </h4>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base pl-1 p-1">
                {interview.answers.spark}
              </p>
            </section>

            {/* Q2: MVP */}
            <section className="scroll-mt-20">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${scheme.bg} ${scheme.text}`}>
                  <Hammer className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 font-sans">
                  The MVP: What did the first version look like?
                </h4>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base pl-1 p-1">
                {interview.answers.mvp}
              </p>
            </section>

            {/* Q3: Tech Stack */}
            <section className="scroll-mt-20">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${scheme.bg} ${scheme.text}`}>
                  <Code2 className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 font-sans">
                  The Tech Stack: How is it built?
                </h4>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base pl-1 p-1 mb-4">
                {interview.answers.techStackDetails}
              </p>
            </section>

            {/* Q4: Traction */}
            <section className="scroll-mt-20">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${scheme.bg} ${scheme.text}`}>
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 font-sans">
                  Gaining Traction: Acquiring the first 100 paying users?
                </h4>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base pl-1 p-1">
                {interview.answers.traction}
              </p>
            </section>

            {/* Q5: Revenue */}
            <section className="scroll-mt-20">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${scheme.bg} ${scheme.text}`}>
                  <DollarSign className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 font-sans">
                  The Revenue: What is the business model?
                </h4>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base pl-1 p-1">
                {interview.answers.revenue}
              </p>
            </section>

            {/* Q6: Lesson */}
            <section className="scroll-mt-20">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${scheme.bg} ${scheme.text}`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 font-sans text-rose-800">
                  The Lesson: One mistake other African developers should avoid?
                </h4>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base pl-1 p-1 border-l-2 border-rose-200 bg-rose-50/10 p-3 rounded-r-xl">
                {interview.answers.lesson}
              </p>
            </section>
          </div>
        </div>

        {/* Right 4 Columns: Specs & Tech Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Architecture Box */}
          <div className="border border-gray-150 rounded-2xl p-6 bg-white shadow-sm">
            <h3 className="font-sans font-bold text-gray-900 text-sm tracking-tight mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600" />
              Technical Blueprint
            </h3>

            {/* Tech Stack Pills list */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              {interview.techStack.map((tech) => (
                <span
                  key={tech}
                  className="text-xs font-mono bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-100/50"
                >
                  {tech}
                </span>
              ))}
            </div>

            {/* Custom styled architecture visualizer block */}
            <div className="bg-gray-950 rounded-xl p-4 font-mono text-[10px] text-emerald-400 overflow-x-auto leading-relaxed border border-gray-800">
              <p className="text-gray-500 mb-2">// Flow Diagram</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>Client React App</span>
                  <span className="text-gray-600">&rarr;</span>
                  <span className="text-amber-300">Vite CDN</span>
                </div>
                <div className="text-center text-gray-600 py-1">| (REST/WebSockets)</div>
                <div className="flex items-center justify-between">
                  <span>Express API Node</span>
                  <span className="text-gray-600">&rarr;</span>
                  <span className="text-teal-300">Secure Escrow</span>
                </div>
                <div className="text-center text-gray-600 py-1">| (ORM Query)</div>
                <div className="flex items-center justify-between">
                  <span>Primary DB Cluster</span>
                  <span className="text-gray-600">&rarr;</span>
                  <span className="text-emerald-300">PCI Pay Gateway</span>
                </div>
              </div>
              <p className="text-[9px] text-gray-500 mt-3 pt-2 border-t border-gray-800">
                Host: Cloud Run Docker VPS
              </p>
            </div>
          </div>

          {/* Quick host quote note */}
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 text-center">
            <ShieldCheck className="w-7 h-7 text-emerald-600 mx-auto mb-2" />
            <h4 className="font-sans font-bold text-emerald-900 text-xs tracking-wider uppercase mb-1">
              Verified Blueprint
            </h4>
            <p className="text-xs text-emerald-700 leading-relaxed">
              This profile has been verified directly by Host Thabiso for technical accuracy and practical ecosystem relevance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
