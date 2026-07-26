import React, { useState, useEffect } from "react";
import { Vote, CheckCircle2, Trophy, Award, Sparkles, Loader2 } from "lucide-react";
import { ArticlePoll } from "../../types";

interface Props {
  user: any | null;
  publishedArticles: any[];
}

export default function ArticlePollSection({ user, publishedArticles }: Props) {
  const [poll, setPoll] = useState<ArticlePoll | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [votedArticleId, setVotedArticleId] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [message, setMessage] = useState("");

  const currentEmail = user?.email || guestEmail;

  const fetchPolls = async () => {
    try {
      const res = await fetch("/api/community/polls");
      if (res.ok) {
        const polls: ArticlePoll[] = await res.json();
        if (polls.length > 0) {
          const currentPoll = polls[0];
          setPoll(currentPoll);

          // Check if current user already voted
          if (currentEmail) {
            const foundOpt = currentPoll.options.find((opt) =>
              opt.votedBy?.includes(currentEmail)
            );
            if (foundOpt) {
              setVotedArticleId(foundOpt.articleId);
            }
          }
        }
      }
    } catch (e) {
      console.error("Error fetching poll:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, [currentEmail]);

  const handleVote = async (articleId: string) => {
    if (!currentEmail) {
      setMessage("Please enter your email below to cast your member vote.");
      return;
    }

    if (!poll) return;

    setVoting(true);
    setMessage("");

    try {
      const res = await fetch(`/api/community/polls/${poll.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, userEmail: currentEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to vote");

      setPoll(data.poll);
      setVotedArticleId(articleId);
      setMessage("🎉 Your vote has been recorded on StartUpAfrika!");
    } catch (err: any) {
      setMessage(err.message || "Failed to vote.");
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 font-medium">
        Loading Monthly Article Poll...
      </div>
    );
  }

  if (!poll) return null;

  return (
    <div className="bg-gradient-to-br from-stone-900 via-emerald-950 to-stone-900 text-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-emerald-800/40 space-y-6 animate-fade-in" id="article-poll-section">
      {/* Poll Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-emerald-500/30">
                Official Platform Poll
              </span>
              <span className="text-white/40 text-xs">• {poll.totalVotes} Member Votes Cast</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1 tracking-tight">{poll.monthTitle}</h2>
            <p className="text-xs text-stone-300/80 mt-0.5 leading-relaxed">{poll.description}</p>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Guest Email Input if not signed in */}
      {!user && !votedArticleId && (
        <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col sm:flex-row items-center gap-3">
          <span className="text-xs text-stone-300 font-semibold shrink-0">Cast Vote as Member:</span>
          <input
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            placeholder="Enter your email address to vote..."
            className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-stone-400 outline-none focus:border-emerald-500"
          />
        </div>
      )}

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {poll.options.map((opt) => {
          const votePercent = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
          const isVoted = votedArticleId === opt.articleId;

          return (
            <div
              key={opt.articleId}
              onClick={() => !voting && handleVote(opt.articleId)}
              className={`relative p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isVoted
                  ? "bg-emerald-900/40 border-emerald-500/80 ring-2 ring-emerald-500/30 shadow-lg"
                  : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-emerald-500/40"
              }`}
            >
              {/* Top Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {opt.startupName}
                </span>

                {isVoted && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> Voted
                  </span>
                )}
              </div>

              {/* Title & Founder */}
              <div>
                <h3 className="font-extrabold text-white text-sm leading-snug line-clamp-2">{opt.title}</h3>
                <p className="text-xs text-stone-400 mt-1 font-medium">Founder: {opt.founderName}</p>
              </div>

              {/* Progress Bar & Votes */}
              <div className="mt-5 space-y-1.5 pt-3 border-t border-white/10">
                <div className="flex justify-between items-center text-xs font-bold text-stone-300">
                  <span>{opt.votes} Votes</span>
                  <span className="text-emerald-400 font-mono">{votePercent}%</span>
                </div>

                {/* Bar */}
                <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${votePercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
