import React, { useState, useEffect } from "react";
import { Trophy, Flame, User, Award, Sparkles } from "lucide-react";

interface Props {
  user: any | null;
}

interface Member {
  rank: number;
  name: string;
  role: string;
  email: string;
  avatar: string;
  points: number;
  topicsCount: number;
  badge: string;
}

export default function LeaderboardSection({ user }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealLeaderboard = async () => {
      try {
        const res = await fetch("/api/community/topics");
        if (res.ok) {
          const topics = await res.json();
          const userMap = new Map<string, Member>();

          // Aggregate points from real topics
          topics.forEach((t: any) => {
            const email = t.authorEmail || "member@startupafrika.co.za";
            const existing = userMap.get(email) || {
              rank: 0,
              name: t.authorName || "Community Member",
              role: t.authorRole || "Founder / Developer",
              email,
              avatar: t.authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(t.authorName || "Member")}`,
              points: 0,
              topicsCount: 0,
              badge: "Builder",
            };

            existing.topicsCount += 1;
            existing.points += 50 + (t.upvotes || 0) * 10;
            userMap.set(email, existing);
          });

          // Include current logged in user if present and not in map
          if (user && user.email && !userMap.has(user.email)) {
            userMap.set(user.email, {
              rank: 0,
              name: user.name || user.email.split("@")[0],
              role: "Community Member",
              email: user.email,
              avatar: user.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.email)}`,
              points: 10,
              topicsCount: 0,
              badge: "Active Member",
            });
          }

          const sorted = Array.from(userMap.values())
            .sort((a, b) => b.points - a.points)
            .map((m, idx) => ({ ...m, rank: idx + 1 }));

          setMembers(sorted);
        }
      } catch (err) {
        console.error("Error building leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRealLeaderboard();
  }, [user]);

  return (
    <div className="space-y-6 animate-fade-in" id="community-leaderboard">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-emerald-950 border border-amber-800/40 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white">Top African Builder Leaderboard</h2>
            <p className="text-xs text-stone-300">
              Karma points earned through upvoted discussions, accepted challenge submissions, and community participation.
            </p>
          </div>
        </div>
      </div>

      {/* Leaderboard Table / Empty State */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-xs">
            Calculating community karma...
          </div>
        ) : members.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">No Leaderboard Members Yet</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Be the first community member to start a discussion or solve a coding challenge to earn karma points and claim #1 on the leaderboard!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {members.map((member) => (
              <div
                key={member.email}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-stone-50 transition-all"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Rank Badge */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 ${
                      member.rank === 1
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : member.rank === 2
                        ? "bg-slate-200 text-slate-800"
                        : member.rank === 3
                        ? "bg-amber-700/20 text-amber-900"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    #{member.rank}
                  </div>

                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-10 h-10 rounded-full border border-gray-200 shrink-0 object-cover"
                  />

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-gray-900 text-xs sm:text-sm">{member.name}</h3>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold">
                        {member.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">{member.role}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 sm:gap-6 shrink-0 text-right">
                  <div className="hidden sm:block">
                    <span className="block text-xs font-bold text-gray-900">{member.topicsCount} Topics</span>
                    <span className="text-[10px] text-gray-400">Created</span>
                  </div>

                  <div className="px-3 py-1.5 bg-emerald-900 text-emerald-300 rounded-xl font-mono text-xs font-bold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>{member.points} pts</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
