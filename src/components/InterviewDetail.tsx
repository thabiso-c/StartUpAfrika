import React, { useState } from "react";
import { ArrowLeft, MapPin, Calendar, Cpu, Zap, Hammer, Code2, TrendingUp, DollarSign, AlertTriangle, ShieldCheck, Share2 } from "lucide-react";
import { Interview } from "../types";

interface InterviewDetailProps {
  interview: Interview;
  onBack: () => void;
}

export default function InterviewDetail({ interview, onBack }: InterviewDetailProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
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
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?blueprint=${interview.id}`;
    if (navigator.share) {
      navigator.share({
        title: `${interview.title} - Startup Afrika`,
        text: `Read the custom blueprint for ${interview.startupName} on Slyzah!`,
        url: shareUrl,
      })
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error(err);
        }
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all shadow-sm ${
            copied 
              ? "bg-emerald-50 border-emerald-200 text-emerald-700 scale-[0.98]" 
              : "border-gray-200 text-gray-600 hover:text-emerald-700 hover:bg-gray-50"
          }`}
          id="detail-share-button"
        >
          {copied ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Link Copied!
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              Share Blueprint
            </>
          )}
        </button>
      </div>

      {/* Cover Image Banner */}
      {interview.coverImage && (
        <div 
          onClick={() => setIsLightboxOpen(true)}
          className="w-full rounded-[24px] overflow-hidden mb-10 shadow-sm border border-gray-150/40 relative cursor-zoom-in hover:opacity-95 transition-all group bg-stone-50 flex items-center justify-center"
          id="detail-cover-image"
        >
          <img 
            src={interview.coverImage} 
            alt={interview.title}
            className="w-full h-auto max-h-[500px] object-contain select-none group-hover:scale-[1.005] transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
              Click to zoom
            </span>
          </div>
        </div>
      )}

      {/* Lightbox Modal overlay on top */}
      {isLightboxOpen && interview.coverImage && (
        <div 
          className="fixed inset-0 bg-stone-950/90 z-50 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl">
            <img 
              src={interview.coverImage} 
              alt={interview.title}
              className="max-w-full max-h-[90vh] object-contain select-none"
              referrerPolicy="no-referrer"
            />
            <button 
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white px-3 py-1.5 rounded-full transition-colors font-sans text-xs font-bold shadow-lg"
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}

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
                {interview.founderName ? interview.founderName[0] : "?"}
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">{interview.founderName}</p>
                <p className="text-xs font-mono text-gray-500">
                  {interview.founderRole || "Founder"} @ {interview.startupName} {interview.foundedYear ? `• Founded in ${interview.foundedYear}` : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          {interview.stats && interview.stats.length > 0 && (
            <div className="grid grid-cols-3 gap-4 p-5 bg-emerald-50/20 border border-emerald-100/30 rounded-2xl mb-12">
              {interview.stats.map((st) => (
                <div key={st.label} className="text-center sm:text-left">
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">{st.label}</p>
                  <p className="text-base sm:text-lg font-mono font-extrabold text-emerald-800">{st.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Rich body content or 6 Questions Deep Dive Section */}
          {interview.body ? (
            <div className="prose prose-emerald max-w-none text-gray-700 leading-relaxed space-y-6" id="article-custom-body">
              <style>{`
                .rich-content h3 {
                  font-size: 1.5rem;
                  font-weight: 800;
                  color: #111827;
                  margin-top: 2rem;
                  margin-bottom: 0.75rem;
                  font-family: 'Space Grotesk', 'Inter', sans-serif;
                }
                .rich-content p {
                  font-size: 1.05rem;
                  line-height: 1.75;
                  color: #374151;
                  margin-bottom: 1.25rem;
                }
                .rich-content img {
                  border-radius: 12px;
                  max-width: 100%;
                  margin: 1.5rem 0;
                  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
                }
                .rich-content strong {
                  font-weight: 700;
                  color: #111827;
                }
              `}</style>
              <div dangerouslySetInnerHTML={{ __html: interview.body }} className="rich-content" />
            </div>
          ) : (
            <div className="space-y-12" id="answers-container">
              {/* Q1: Spark */}
              {interview.answers?.spark && (
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
              )}

              {/* Q2: MVP */}
              {interview.answers?.mvp && (
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
              )}

              {/* Q3: Tech Stack */}
              {interview.answers?.techStackDetails && (
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
              )}

              {/* Q4: Traction */}
              {interview.answers?.traction && (
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
              )}

              {/* Q5: Revenue */}
              {interview.answers?.revenue && (
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
              )}

              {/* Q6: Lesson */}
              {interview.answers?.lesson && (
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
              )}
            </div>
          )}
          </div>

        {/* Right 4 Columns: Specs & Tech Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Architecture Box */}
          {interview.techStack && interview.techStack.length > 0 && (
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
          )}

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
