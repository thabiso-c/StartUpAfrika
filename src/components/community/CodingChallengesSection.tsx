import React, { useState, useEffect } from "react";
import { Code, Terminal, CheckCircle2, Award, Play, Sparkles, Send, Loader2, FileCode, Check } from "lucide-react";
import { CodingChallenge } from "../../types";

interface Props {
  user: any | null;
}

export default function CodingChallengesSection({ user }: Props) {
  const [challenges, setChallenges] = useState<CodingChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChallenge, setActiveChallenge] = useState<CodingChallenge | null>(null);
  const [codeSolution, setCodeSolution] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [feedback, setFeedback] = useState("");

  const currentEmail = user?.email || guestEmail;
  const currentName = user?.displayName || user?.name || guestName;

  const fetchChallenges = async () => {
    try {
      const res = await fetch("/api/community/challenges");
      if (res.ok) {
        const data = await res.json();
        setChallenges(data);
        if (data.length > 0) {
          setActiveChallenge(data[0]);
          setCodeSolution(data[0].initialTemplate || "");
        }
      }
    } catch (e) {
      console.error("Error fetching challenges:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleSelectChallenge = (ch: CodingChallenge) => {
    setActiveChallenge(ch);
    setCodeSolution(ch.initialTemplate || "");
    setSubmissionSuccess(false);
    setFeedback("");
  };

  const handleSubmitSolution = async () => {
    if (!currentEmail || !currentName) {
      setFeedback("Please enter your name and email address below before submitting your code.");
      return;
    }

    if (!activeChallenge) return;

    setSubmitting(true);
    setFeedback("");

    try {
      const res = await fetch(`/api/community/challenges/${activeChallenge.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeSolution,
          authorName: currentName,
          authorEmail: currentEmail,
          authorAvatar: user?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentEmail)}`
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed.");

      setSubmissionSuccess(true);
      setFeedback(`🎉 Challenge solution verified & accepted! Earned +${activeChallenge.points} Builder Points.`);

      // Update challenge submission count locally
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === activeChallenge.id
            ? { ...c, submissionCount: (c.submissionCount || 0) + 1 }
            : c
        )
      );
    } catch (err: any) {
      setFeedback(err.message || "Failed to submit code.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-medium">Loading Coding Challenges...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in" id="coding-challenges-section">
      {/* Banner */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">African Developer Coding Challenges</h2>
            <p className="text-xs text-stone-400">Solve real-world fintech, USSD, and offline systems challenges. Earn Builder Points & reputation.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Challenge Picker */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <FileCode className="w-4 h-4 text-emerald-600" />
            Active Challenges ({challenges.length})
          </h3>

          <div className="space-y-2">
            {challenges.map((ch) => {
              const isActive = activeChallenge?.id === ch.id;
              return (
                <div
                  key={ch.id}
                  onClick={() => handleSelectChallenge(ch)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isActive
                      ? "bg-emerald-900 text-white border-emerald-700 shadow-md"
                      : "bg-white text-gray-800 border-gray-200 hover:border-emerald-500/40"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-extrabold uppercase">
                    <span
                      className={`px-2 py-0.5 rounded ${
                        ch.difficulty === "Advanced"
                          ? "bg-rose-500/20 text-rose-300"
                          : ch.difficulty === "Intermediate"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {ch.difficulty}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 font-mono">
                      <Award className="w-3 h-3" /> +{ch.points} pts
                    </span>
                  </div>

                  <h4 className="font-extrabold text-xs leading-snug">{ch.title}</h4>
                  <p className={`text-[11px] line-clamp-2 ${isActive ? "text-stone-300" : "text-gray-500"}`}>
                    {ch.description}
                  </p>

                  <div className="pt-2 text-[10px] font-semibold text-emerald-400 flex items-center justify-between">
                    <span>{ch.category}</span>
                    <span>{ch.submissionCount || 0} Submissions</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Code Editor Sandbox */}
        {activeChallenge && (
          <div className="lg:col-span-8 bg-stone-950 border border-stone-800 rounded-2xl p-6 text-white space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-stone-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-extrabold uppercase tracking-widest border border-emerald-500/30">
                    {activeChallenge.difficulty}
                  </span>
                  <span className="text-stone-400 text-xs">• {activeChallenge.category}</span>
                </div>
                <h3 className="text-base font-extrabold text-white mt-1">{activeChallenge.title}</h3>
              </div>
              <div className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-bold font-mono">
                +{activeChallenge.points} Builder Pts
              </div>
            </div>

            {/* Problem Statement */}
            <div className="space-y-2 text-xs leading-relaxed text-stone-300">
              <p className="font-bold text-white">Problem Description:</p>
              <p>{activeChallenge.description}</p>
              <p className="p-3 bg-stone-900 border border-stone-800 rounded-lg font-mono text-[11px] text-emerald-300">
                <span className="text-stone-400 block mb-1 font-sans">Sample Input:</span>
                {activeChallenge.sampleInput}
              </p>
            </div>

            {/* Guest Form if not logged in */}
            {!user && (
              <div className="p-3 bg-stone-900 border border-stone-800 rounded-xl space-y-2 text-xs">
                <p className="font-bold text-emerald-400">Developer Profile Credentials for Submission:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Your Name (e.g. Sbusiso)"
                    className="px-3 py-1.5 bg-stone-950 border border-stone-800 rounded-lg text-xs text-white"
                  />
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="Your Email Address"
                    className="px-3 py-1.5 bg-stone-950 border border-stone-800 rounded-lg text-xs text-white"
                  />
                </div>
              </div>
            )}

            {feedback && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  submissionSuccess
                    ? "bg-emerald-950 border border-emerald-800 text-emerald-300"
                    : "bg-rose-950 border border-rose-800 text-rose-300"
                }`}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>{feedback}</span>
              </div>
            )}

            {/* Code Sandbox */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span className="font-mono text-emerald-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" /> TypeScript / JS Solution Playground
                </span>
              </div>

              <textarea
                rows={9}
                value={codeSolution}
                onChange={(e) => setCodeSolution(e.target.value)}
                className="w-full p-4 bg-black font-mono text-xs text-emerald-400 rounded-xl border border-stone-800 outline-none focus:border-emerald-500 leading-relaxed"
              />
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCodeSolution(activeChallenge.initialTemplate || "")}
                className="text-xs text-stone-400 hover:text-white underline font-mono"
              >
                Reset Template
              </button>

              <button
                onClick={handleSubmitSolution}
                disabled={submitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying Code...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> Run & Submit Solution
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
