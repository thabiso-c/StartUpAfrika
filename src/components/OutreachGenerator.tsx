import React, { useState } from "react";
import { Sparkles, Copy, Check, Info, Cpu, FileText, Send, HelpCircle } from "lucide-react";

export default function OutreachGenerator() {
  const [startupName, setStartupName] = useState("");
  const [description, setDescription] = useState("");
  const [targetAchievements, setTargetAchievements] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    subject: string;
    emailBody: string;
    customQuestions: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [copiedQuestions, setCopiedQuestions] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startupName || !description) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupName,
          description,
          targetAchievements,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || "Generation failed. Please try again.");
      }
    } catch (err) {
      setError("Failed to connect to backend server. Make sure the server is active.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" id="outreach-generator-view">
      {/* Introduction Banner */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 sm:p-8 mb-8 flex flex-col md:flex-row items-start gap-6">
        <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-sm shadow-emerald-200">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">AI Outreach & Custom Question Generator</h2>
          <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
            Streamline your founder recruitment process. Enter any African startup's details below, and Gemini will generate a custom, highly personalized peer-to-peer cold outreach email (leveraging your Slyzah credentials) along with 6 highly technical interview questions tailored specifically to their market, sector, and product stack.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Panel: 5 Columns */}
        <div className="lg:col-span-5 bg-white border border-gray-100 p-6 rounded-2xl shadow-sm h-fit">
          <h3 className="font-sans font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
            <Cpu className="w-4.5 h-4.5 text-emerald-600" />
            Startup Input
          </h3>

          <form onSubmit={handleGenerate} className="space-y-5">
            <div>
              <label className="block text-xs font-mono font-bold text-gray-500 uppercase tracking-wider mb-2">
                Startup Name *
              </label>
              <input
                type="text"
                required
                value={startupName}
                onChange={(e) => setStartupName(e.target.value)}
                placeholder="e.g. AfriHarvest"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-gray-500 uppercase tracking-wider mb-2">
                Brief Product Description *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. A digital supply chain marketplace connecting smallholder agritech farmers in rural Kenya directly with retail supermarkets in Nairobi."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-gray-500 uppercase tracking-wider mb-2">
                Notable Achievements / Focus Niche (Optional)
              </label>
              <input
                type="text"
                value={targetAchievements}
                onChange={(e) => setTargetAchievements(e.target.value)}
                placeholder="e.g. Recently integrated M-Pesa escrow; raised seed round."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-gray-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl text-sm shadow-sm hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Crafting Campaign...
                </>
              ) : (
                <>
                  <Sparkles className="w-4.5 h-4.5" />
                  Generate Custom Pitch
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-xs flex items-start gap-2">
              <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Output Panel: 7 Columns */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="space-y-6 animate-fade-in" id="generator-results">
              {/* Subject & Email block */}
              <div className="bg-white border border-gray-150 rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                  <h4 className="font-sans font-bold text-gray-900 text-sm tracking-tight flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-600" />
                    Customized Email Campaign
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(result.subject, setCopiedSubject)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-500 hover:text-emerald-700 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors shadow-sm"
                    >
                      {copiedSubject ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      Subject
                    </button>
                    <button
                      onClick={() => handleCopy(result.emailBody, setCopiedBody)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-500 hover:text-emerald-700 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors shadow-sm"
                    >
                      {copiedBody ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      Email Body
                    </button>
                  </div>
                </div>

                <div className="space-y-3 font-mono text-xs text-gray-800 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  <p>
                    <span className="text-gray-400">Subject:</span> {result.subject}
                  </p>
                  <hr className="border-gray-100" />
                  <p className="whitespace-pre-line leading-relaxed text-gray-700">{result.emailBody}</p>
                </div>
              </div>

              {/* Custom Questions block */}
              <div className="bg-white border border-gray-150 rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                  <h4 className="font-sans font-bold text-gray-900 text-sm tracking-tight flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-emerald-600" />
                    Customized Blueprint Questions (6-Step Blueprint)
                  </h4>
                  <button
                    onClick={() =>
                      handleCopy(result.customQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n\n"), setCopiedQuestions)
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-500 hover:text-emerald-700 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors shadow-sm"
                  >
                    {copiedQuestions ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    Copy All
                  </button>
                </div>

                <div className="space-y-4">
                  {result.customQuestions.map((question, index) => (
                    <div key={index} className="flex gap-3">
                      <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <p className="text-sm text-gray-700 font-medium leading-relaxed mt-0.5">{question}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[300px] border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-gray-400">
              <Sparkles className="w-8 h-8 text-gray-300 mb-3 animate-pulse" />
              <p className="text-sm font-medium">Outreach workspace empty</p>
              <p className="text-xs text-gray-400 max-w-xs mt-1">
                Fill in the startup details on the left and hit generate to craft custom, peer-vouched outreach strategies.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
