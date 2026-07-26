import React, { useState, useEffect } from "react";
import { MessageSquare, Trophy, Terminal, Award, Plus, Sparkles, Flame, Users, Code, Key, Rocket } from "lucide-react";
import { CommunityTopic } from "../../types";
import TopicList from "./TopicList";
import CreateTopicModal from "./CreateTopicModal";
import TopicDetailModal from "./TopicDetailModal";
import ArticlePollSection from "./ArticlePollSection";
import CodingChallengesSection from "./CodingChallengesSection";
import LeaderboardSection from "./LeaderboardSection";
import SubmitBlueprint from "../SubmitBlueprint";

interface Props {
  user: any | null;
  onRequestLogin: () => void;
  publishedArticles?: any[];
  initialTab?: "forum" | "poll" | "challenges" | "leaderboard" | "founders";
}

export default function CommunityHub({ user, onRequestLogin, publishedArticles = [], initialTab = "forum" }: Props) {
  const [activeTab, setActiveTab] = useState<"forum" | "poll" | "challenges" | "leaderboard" | "founders">(initialTab);
  const [topics, setTopics] = useState<CommunityTopic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<CommunityTopic | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchTopics = async () => {
    try {
      const res = await fetch("/api/community/topics");
      if (res.ok) {
        const data = await res.json();
        setTopics(data);
      }
    } catch (e) {
      console.error("Error fetching community topics:", e);
    } finally {
      setLoadingTopics(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const handleVoteTopic = async (topicId: string, voteType: "up" | "down") => {
    const userEmail = user?.email || localStorage.getItem("slyzah_demo_user")
      ? JSON.parse(localStorage.getItem("slyzah_demo_user")!).email
      : null;

    if (!userEmail) {
      onRequestLogin();
      return;
    }

    try {
      const res = await fetch(`/api/community/topics/${topicId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail, voteType }),
      });
      if (res.ok) {
        const data = await res.json();
        setTopics((prev) =>
          prev.map((t) => (t.id === topicId ? data.topic : t))
        );
        if (selectedTopic?.id === topicId) {
          setSelectedTopic(data.topic);
        }
      }
    } catch (err) {
      console.error("Vote failed:", err);
    }
  };

  const handleTopicCreated = (newTopic: CommunityTopic) => {
    setTopics((prev) => [newTopic, ...prev]);
  };

  const handleTopicUpdated = (updatedTopic: CommunityTopic) => {
    setTopics((prev) =>
      prev.map((t) => (t.id === updatedTopic.id ? updatedTopic : t))
    );
    setSelectedTopic(updatedTopic);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8" id="community-hub-root">
      {/* Community Hero Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-stone-900 to-emerald-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-extrabold uppercase tracking-widest border border-emerald-500/30">
              <Users className="w-3.5 h-3.5" />
              <span>StartUpAfrika Member Platform</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              African Founders & Developers Tech Community
            </h1>

            <p className="text-xs sm:text-sm text-stone-300/90 leading-relaxed font-normal">
              Connect with fellow coders, founders & builders. Debate featured startup stories, cast monthly article votes, compete in coding challenges, and build in public.
            </p>
          </div>

          {/* Member Card / Action */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-5 rounded-2xl shrink-0 space-y-3 text-xs w-full md:w-72">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <img
                    src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.email || "user")}`}
                    alt="Profile"
                    className="w-10 h-10 rounded-full border-2 border-emerald-400"
                  />
                  <div>
                    <h3 className="font-extrabold text-white text-sm">{user.displayName || user.name || "Member"}</h3>
                    <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
                      Verified Member Builder
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-white/10 font-bold text-[11px]">
                  <span className="text-stone-300">Builder Points:</span>
                  <span className="text-emerald-400 font-mono">240 Karma</span>
                </div>

                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 mt-1"
                >
                  <Plus className="w-4 h-4" /> Start Discussion
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <h3 className="font-extrabold text-white text-sm">Join the Member Space</h3>
                  <p className="text-[11px] text-stone-300 mt-0.5">
                    Sign in to comment on topics, vote on monthly featured articles & submit code solutions!
                  </p>
                </div>

                <button
                  onClick={onRequestLogin}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Key className="w-4 h-4" /> Log In / Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("forum")}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "forum"
              ? "bg-emerald-900 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <span>Discussions & Forum ({topics.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("poll")}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "poll"
              ? "bg-emerald-900 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Featured Article Voting Poll</span>
        </button>

        <button
          onClick={() => setActiveTab("challenges")}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "challenges"
              ? "bg-emerald-900 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Dev Coding Challenges</span>
        </button>

        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "leaderboard"
              ? "bg-emerald-900 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Award className="w-4 h-4 text-amber-400" />
          <span>Builder Leaderboard</span>
        </button>

        <button
          onClick={() => setActiveTab("founders")}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "founders"
              ? "bg-emerald-900 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          id="community-tab-founders"
        >
          <Rocket className="w-4 h-4 text-emerald-400" />
          <span>Submit Founder Story</span>
        </button>
      </div>

      {/* View Content */}
      {activeTab === "forum" && (
        <TopicList
          topics={topics}
          user={user}
          onSelectTopic={(topic) => setSelectedTopic(topic)}
          onCreateTopicClick={() => setIsCreateModalOpen(true)}
          onVoteTopic={handleVoteTopic}
        />
      )}

      {activeTab === "poll" && (
        <ArticlePollSection user={user} publishedArticles={publishedArticles} />
      )}

      {activeTab === "challenges" && <CodingChallengesSection user={user} />}

      {activeTab === "leaderboard" && <LeaderboardSection user={user} />}

      {activeTab === "founders" && <SubmitBlueprint />}

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateTopicModal
          user={user}
          onClose={() => setIsCreateModalOpen(false)}
          onTopicCreated={handleTopicCreated}
          onRequestLogin={onRequestLogin}
        />
      )}

      {selectedTopic && (
        <TopicDetailModal
          topic={selectedTopic}
          user={user}
          onClose={() => setSelectedTopic(null)}
          onTopicUpdated={handleTopicUpdated}
        />
      )}
    </div>
  );
}
