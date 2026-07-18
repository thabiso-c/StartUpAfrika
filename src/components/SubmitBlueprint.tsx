import React, { useState } from "react";
import { CheckCircle, ArrowRight, ArrowLeft, Send, Sparkles, HelpCircle, FileText, Info } from "lucide-react";

export default function SubmitBlueprint() {
  const [step, setStep] = useState(1);
  const [founderName, setFounderName] = useState("");
  const [startupName, setStartupName] = useState("");
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState({
    spark: "",
    mvp: "",
    techStack: "",
    traction: "",
    revenue: "",
    lesson: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof typeof answers, value: string) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!founderName || !startupName || !email) {
      setError("Please fill in all contact information.");
      setStep(1);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          founderName,
          startupName,
          email,
          answers,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || "Submission failed. Please try again.");
      }
    } catch (err) {
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fade-in" id="submission-success">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6 border border-emerald-200">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Blueprint Submitted!</h2>
        <p className="text-base text-gray-600 max-w-lg mx-auto leading-relaxed mb-8">
          Thank you for sharing your journey, {founderName}. Host Thabiso will review your application. If your startup's technical and tactical insights align with our focus, we will contact you at <strong>{email}</strong> to finalize the article graphics.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setStep(1);
            setFounderName("");
            setStartupName("");
            setEmail("");
            setAnswers({
              spark: "",
              mvp: "",
              techStack: "",
              traction: "",
              revenue: "",
              lesson: "",
            });
          }}
          className="px-6 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
        >
          Submit Another Story
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" id="submit-blueprint-view">
      {/* Step Progress Bar */}
      <div className="mb-10 flex items-center justify-between max-w-sm mx-auto" id="submission-progress-bar">
        <div className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-full text-xs font-mono font-bold flex items-center justify-center border transition-all ${
              step >= 1
                ? "bg-emerald-600 border-emerald-600 text-white"
                : "bg-gray-100 border-gray-200 text-gray-400"
            }`}
          >
            1
          </span>
          <span className="text-xs font-bold text-gray-800">Founder Credentials</span>
        </div>
        <div className="flex-grow h-[1px] bg-gray-200 mx-3"></div>
        <div className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-full text-xs font-mono font-bold flex items-center justify-center border transition-all ${
              step === 2
                ? "bg-emerald-600 border-emerald-600 text-white"
                : "bg-gray-100 border-gray-200 text-gray-400"
            }`}
          >
            2
          </span>
          <span className="text-xs font-bold text-gray-800">The 6-Step Blueprint</span>
        </div>
      </div>

      <div className="bg-white border border-gray-150 p-6 sm:p-10 rounded-2xl shadow-sm">
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Share Your Product's Blueprint</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            African tech is built on local, practical realities. Share your product blueprint with over 1,420+ subscribers who are eager to learn from your technical setup and distribution strategies.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-xs flex items-start gap-2.5">
            <Info className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-5 animate-fade-in" id="submit-step-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Founder Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={founderName}
                    onChange={(e) => setFounderName(e.target.value)}
                    placeholder="e.g. Odunayo Eweniyi"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Startup or Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={startupName}
                    onChange={(e) => setStartupName(e.target.value)}
                    placeholder="e.g. PiggyVest"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Contact Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. odunayo@piggyvest.com"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-gray-400"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (founderName && startupName && email) {
                      setStep(2);
                    } else {
                      setError("Please fill in all contact information.");
                    }
                  }}
                  className="px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl text-sm shadow-sm hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  Continue to Questions
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in" id="submit-step-2">
              <div className="bg-emerald-50/50 border border-emerald-100/30 p-4 rounded-xl flex items-start gap-2.5 mb-2">
                <Sparkles className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Tip: Be as detailed and technical as possible. Include exact tools, database types, framework variations, and acquisition pathways!
                </p>
              </div>

              {/* Spark */}
              <div>
                <label className="block text-xs font-mono font-bold text-gray-500 uppercase tracking-wider mb-2">
                  1. The Spark (Inspiration)
                </label>
                <textarea
                  rows={3}
                  required
                  value={answers.spark}
                  onChange={(e) => handleInputChange("spark", e.target.value)}
                  placeholder="What was the exact moment, realization, or problem that inspired you to build this?"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-gray-400"
                />
              </div>

              {/* MVP */}
              <div>
                <label className="block text-xs font-mono font-bold text-gray-500 uppercase tracking-wider mb-2">
                  2. The MVP (First Version)
                </label>
                <textarea
                  rows={3}
                  required
                  value={answers.mvp}
                  onChange={(e) => handleInputChange("mvp", e.target.value)}
                  placeholder="What did the very first, minimal version of the product look like, and how long did it take you to build?"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-gray-400"
                />
              </div>

              {/* Tech Stack */}
              <div>
                <label className="block text-xs font-mono font-bold text-gray-500 uppercase tracking-wider mb-2">
                  3. The Tech Stack (Engineering Setup)
                </label>
                <textarea
                  rows={3}
                  required
                  value={answers.techStack}
                  onChange={(e) => handleInputChange("techStack", e.target.value)}
                  placeholder="What backend, frontend, database, hosted providers, and payment gateways power your product today?"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-gray-400"
                />
              </div>

              {/* Traction */}
              <div>
                <label className="block text-xs font-mono font-bold text-gray-500 uppercase tracking-wider mb-2">
                  4. Gaining Traction (First 100 Paying Users)
                </label>
                <textarea
                  rows={3}
                  required
                  value={answers.traction}
                  onChange={(e) => handleInputChange("traction", e.target.value)}
                  placeholder="What local marketing or onboarding pathways did you use to penetrate the market and get your first 100 paid users?"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-gray-400"
                />
              </div>

              {/* Revenue */}
              <div>
                <label className="block text-xs font-mono font-bold text-gray-500 uppercase tracking-wider mb-2">
                  5. The Revenue Model & Profitability
                </label>
                <textarea
                  rows={3}
                  required
                  value={answers.revenue}
                  onChange={(e) => handleInputChange("revenue", e.target.value)}
                  placeholder="What is your primary revenue model, and how long did it take your startup to reach financial self-sufficiency?"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-gray-400"
                />
              </div>

              {/* Lesson */}
              <div>
                <label className="block text-xs font-mono font-bold text-gray-500 uppercase tracking-wider mb-2">
                  6. The Lesson (Mistake to Avoid)
                </label>
                <textarea
                  rows={3}
                  required
                  value={answers.lesson}
                  onChange={(e) => handleInputChange("lesson", e.target.value)}
                  placeholder="What is one major tactical mistake you made early on that cost time or money, which other African developers should avoid?"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-gray-400"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold rounded-xl text-sm shadow-sm transition-all flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back Info
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold rounded-xl text-sm shadow-sm transition-all flex items-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Blueprint
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
