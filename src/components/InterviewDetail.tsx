import React, { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Calendar, Cpu, Zap, Hammer, Code2, TrendingUp, DollarSign, AlertTriangle, ShieldCheck, Share2 } from "lucide-react";
import { Interview } from "../types";
import { detectCountryFromLocation, getFlagImageUrl } from "../utils/countryFlags";

interface InterviewDetailProps {
  interview: Interview;
  onBack: () => void;
}

export default function InterviewDetail({ interview, onBack }: InterviewDetailProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  
  // Reading progress indicator
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <div className="min-h-screen bg-off-white" id="interview-detail-view">
      {/* Reading Progress Indicator */}
      <div className="reading-progress" style={{ width: `${readingProgress}%` }} />
      
      {/* Sticky Nav Bar */}
      <div className="sticky top-[64px] z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-charcoal transition-colors"
            id="detail-back-button"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blueprints
          </button>

          <button
            onClick={handleShare}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
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
      </div>

      {/* Cover Image Banner */}
      {interview.coverImage && (
        <div 
          onClick={() => setIsLightboxOpen(true)}
          className="w-full rounded-[24px] overflow-hidden mb-10 shadow-sm border border-gray-150/40 relative cursor-zoom-in hover:opacity-95 transition-all group bg-stone-50 flex items-center justify-center mx-auto max-w-6xl mt-8"
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left 8 Columns: Article */}
          <div className="lg:col-span-8">
            {/* Category & Location */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-xs font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-md border ${scheme.badge}`}>
                  {interview.startupName} Blueprint
                </span>
                <span className="text-xs text-gray-400 font-mono flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {(() => {
                    const countryInfo = detectCountryFromLocation(interview.location || "");
                    if (countryInfo) {
                      return <>{countryInfo.flag} {interview.location}</>;
                    }
                    return <>{interview.location}</>;
                  })()}
                </span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-charcoal leading-[0.95] mb-6 tracking-tight">
                {interview.title}
              </h1>

              {interview.subtitle && (
                <p className="text-xl text-gray-600 leading-relaxed italic mb-10 border-l-4 border-accent pl-6">
                  &ldquo;{interview.subtitle}&rdquo;
                </p>
              )}

              {/* Founder Profile Card */}
              <div className="flex items-center gap-5 p-5 rounded-2xl bg-white border border-gray-100 mb-10">
                <div className="w-14 h-14 rounded-xl bg-charcoal text-white flex items-center justify-center font-bold text-xl">
                  {interview.founderName ? interview.founderName[0] : "?"}
                </div>
                <div>
                  <p className="text-lg font-bold text-charcoal">{interview.founderName}</p>
                  <p className="text-sm text-gray-500">
                    {interview.founderRole || "Founder"} @ {interview.startupName} {interview.foundedYear ? `• Founded ${interview.foundedYear}` : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            {interview.stats && interview.stats.length > 0 && (
              <div className="grid grid-cols-3 gap-4 p-6 bg-white border border-gray-100 rounded-2xl mb-12">
                {interview.stats.map((st) => (
                  <div key={st.label} className="text-center sm:text-left">
                    <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">{st.label}</p>
                    <p className="text-base sm:text-xl font-mono font-extrabold text-charcoal">{st.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Key Takeaways */}
            {interview.answers && (
              <div className="takeaway-box p-8 rounded-2xl mb-12">
                <h3 className="font-display text-sm font-bold uppercase tracking-widest text-charcoal mb-6">
                  Key Takeaways
                </h3>
                <ul className="space-y-4">
                  {interview.answers.spark && (
                    <li className="flex items-start gap-3">
                      <span className="text-accent font-bold text-sm mt-0.5">01</span>
                      <p className="text-gray-700 leading-relaxed">African startup funding is becoming more selective as investors prioritize sustainable unit economics over growth-at-all-costs.</p>
                    </li>
                  )}
                  {interview.answers.mvp && (
                    <li className="flex items-start gap-3">
                      <span className="text-accent font-bold text-sm mt-0.5">02</span>
                      <p className="text-gray-700 leading-relaxed">Fintech remains dominant, but AI and climate-tech sectors are accelerating rapidly across the continent.</p>
                    </li>
                  )}
                  {interview.answers.lesson && (
                    <li className="flex items-start gap-3">
                      <span className="text-accent font-bold text-sm mt-0.5">03</span>
                      <p className="text-gray-700 leading-relaxed">Customer discovery before writing a single line of code separates successful founders from the rest.</p>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Rich body content or 6 Questions Deep Dive Section */}
            {interview.body ? (
              <div className="prose prose-emerald max-w-none text-gray-700 leading-relaxed space-y-6" id="article-custom-body">
                <style>{`
                  .rich-content h3 {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #1a1a1a;
                    margin-top: 2.5rem;
                    margin-bottom: 1rem;
                    font-family: 'Space Grotesk', 'Inter', sans-serif;
                    letter-spacing: -0.02em;
                  }
                  .rich-content p {
                    font-size: 1.125rem;
                    line-height: 1.8;
                    color: #4b5563;
                    margin-bottom: 1.5rem;
                  }
                  .rich-content img {
                    border-radius: 16px;
                    max-width: 100%;
                    margin: 2rem 0;
                    box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.15);
                  }
                  .rich-content strong {
                    font-weight: 700;
                    color: #1a1a1a;
                  }
                  .rich-content ul {
                    margin-left: 1.5rem;
                    margin-top: 1rem;
                  }
                  .rich-content li {
                    margin-bottom: 0.5rem;
                    color: #4b5563;
                  }
                `}</style>
                <div dangerouslySetInnerHTML={{ __html: interview.body }} className="rich-content" />
              </div>
            ) : (
              <div className="space-y-14" id="answers-container">
                {/* Q1: Spark */}
                {interview.answers?.spark && (
                  <section className="scroll-mt-20">
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`p-2.5 rounded-xl ${scheme.bg} ${scheme.text}`}>
                        <Zap className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold text-charcoal font-display">
                        The Spark
                      </h3>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      What inspired you to start?
                    </h4>
                    <p className="text-gray-700 leading-relaxed text-base sm:text-lg pl-1">
                      {interview.answers.spark}
                    </p>
                  </section>
                )}

                {/* Q2: MVP */}
                {interview.answers?.mvp && (
                  <section className="scroll-mt-20">
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`p-2.5 rounded-xl ${scheme.bg} ${scheme.text}`}>
                        <Hammer className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold text-charcoal font-display">
                        The MVP
                      </h3>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      What did the first version look like?
                    </h4>
                    <p className="text-gray-700 leading-relaxed text-base sm:text-lg pl-1">
                      {interview.answers.mvp}
                    </p>
                  </section>
                )}

                {/* Q3: Tech Stack */}
                {interview.answers?.techStackDetails && (
                  <section className="scroll-mt-20">
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`p-2.5 rounded-xl ${scheme.bg} ${scheme.text}`}>
                        <Code2 className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold text-charcoal font-display">
                        The Tech Stack
                      </h3>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      How is it built?
                    </h4>
                    <p className="text-gray-700 leading-relaxed text-base sm:text-lg pl-1 mb-6">
                      {interview.answers.techStackDetails}
                    </p>
                    
                    {/* Tech tags */}
                    {interview.techStack && interview.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {interview.techStack.map((tech) => (
                          <span
                            key={tech}
                            className="text-xs font-mono bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* Q4: Traction */}
                {interview.answers?.traction && (
                  <section className="scroll-mt-20">
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`p-2.5 rounded-xl ${scheme.bg} ${scheme.text}`}>
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold text-charcoal font-display">
                        Gaining Traction
                      </h3>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Acquiring the first 100 paying users?
                    </h4>
                    <p className="text-gray-700 leading-relaxed text-base sm:text-lg pl-1">
                      {interview.answers.traction}
                    </p>
                  </section>
                )}

                {/* Q5: Revenue */}
                {interview.answers?.revenue && (
                  <section className="scroll-mt-20">
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`p-2.5 rounded-xl ${scheme.bg} ${scheme.text}`}>
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold text-charcoal font-display">
                        The Revenue
                      </h3>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      What is the business model?
                    </h4>
                    <p className="text-gray-700 leading-relaxed text-base sm:text-lg pl-1">
                      {interview.answers.revenue}
                    </p>
                  </section>
                )}

                {/* Q6: Lesson */}
                {interview.answers?.lesson && (
                  <section className="scroll-mt-20">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold text-charcoal font-display">
                        The Lesson
                      </h3>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      One mistake other African developers should avoid?
                    </h4>
                    <div className="bg-rose-50/50 border-l-4 border-rose-300 p-6 rounded-r-xl">
                      <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
                        {interview.answers.lesson}
                      </p>
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-200 my-16" />

             {/* Read Next - Phase 2: Increase session depth */}
             <div className="border-t border-gray-200 my-16">
               <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 lg:p-12 border border-gray-100">
                 <div className="flex items-center gap-4 mb-8">
                   <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                   <h3 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-charcoal">
                     You May Also Like
                   </h3>
                   <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* First recommendation */}
                   <div className="group cursor-pointer bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all duration-300">
                     <div className="aspect-[16/9] overflow-hidden bg-gray-100">
                       <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center">
                         <span className="text-white font-display text-xl font-bold">FINTECH</span>
                       </div>
                     </div>
                     <div className="p-6">
                       <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-2 inline-block">
                         Founder Blueprint
                       </span>
                       <h4 className="font-display text-lg font-bold text-charcoal leading-snug mb-2 group-hover:text-emerald-800 transition-colors">
                       How Yoco built a R2B fintech empire across Africa
                       </h4>
                       <p className="text-sm text-gray-600 line-clamp-2">
                        Starting from a mobile card reader to processing billions in payments.
                       </p>
                     </div>
                   </div>

                   {/* Second recommendation */}
                   <div className="group cursor-pointer bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all duration-300">
                     <div className="aspect-[16/9] overflow-hidden bg-gray-100">
                       <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                         <span className="text-white font-display text-xl font-bold">AI</span>
                       </div>
                     </div>
                     <div className="p-6">
                       <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-2 inline-block">
                         Intelligence
                       </span>
                       <h4 className="font-display text-lg font-bold text-charcoal leading-snug mb-2 group-hover:text-emerald-800 transition-colors">
                        Africa's AI boom: 12 startups to watch in 2025
                       </h4>
                       <p className="text-sm text-gray-600 line-clamp-2">
                        From Lagos to Nairobi, these founders are building the continent's AI infrastructure.
                       </p>
                     </div>
                   </div>
                 </div>

                 {/* More from section */}
                 <div className="mt-10 pt-8 border-t border-gray-200">
                   <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">
                     More from Startup Afrika
                   </p>
                   <div className="flex flex-wrap gap-3">
                     {["Funding", "AI", "Fintech", "Founders", "Markets"].map((topic) => (
                       <button
                         key={topic}
                         className="px-4 py-2 rounded-full bg-white border border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-charcoal hover:text-white transition-all"
                       >
                         {topic}
                       </button>
                     ))}
                   </div>
                 </div>
               </div>
             </div>
          </div>

          {/* Right 4 Columns: Specs & Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Verified Badge */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-charcoal">
                  Verified Blueprint
                </h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                This profile has been verified for technical accuracy and practical ecosystem relevance.
              </p>
            </div>

            {/* Quick Facts */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <h3 className="font-sans font-bold text-charcoal text-sm tracking-tight mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Details
              </h3>
              <div className="space-y-3 text-sm">
                {interview.foundedYear && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Founded</span>
                    <span className="font-semibold text-charcoal">{interview.foundedYear}</span>
                  </div>
                )}
                {interview.location && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location</span>
                    <span className="font-semibold text-charcoal">{interview.location}</span>
                  </div>
                )}
                {interview.startupName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Startup</span>
                    <span className="font-semibold text-charcoal">{interview.startupName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Share Card */}
            <div className="bg-charcoal text-white rounded-2xl p-6">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider mb-3">
                Share this blueprint
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                Help other founders discover this story.
              </p>
              <button
                onClick={handleShare}
                className="w-full py-3 bg-white text-charcoal font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-gray-100 transition-all"
              >
                {copied ? "✓ Copied to Clipboard" : "Share Blueprint"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}