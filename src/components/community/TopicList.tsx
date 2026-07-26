import React, { useState } from "react";
import { MessageSquare, ThumbsUp, ThumbsDown, Pin, Code, Clock, Search, Filter, Plus, Flame, Sparkles } from "lucide-react";
import { CommunityTopic } from "../../types";

interface Props {
  topics: CommunityTopic[];
  user: any | null;
  onSelectTopic: (topic: CommunityTopic) => void;
  onCreateTopicClick: () => void;
  onVoteTopic: (topicId: string, voteType: "up" | "down") => void;
}

export default function TopicList({
  topics,
  user,
  onSelectTopic,
  onCreateTopicClick,
  onVoteTopic,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"TRENDING" | "LATEST">("TRENDING");

  const categories = [
    "ALL",
    "Founders & Pitch",
    "Engineering & Dev",
    "Featured Article Debates",
    "Show & Tell",
    "Coding Challenges",
    "General Discussion",
  ];

  const filteredTopics = topics.filter((t) => {
    const matchesCategory =
      selectedCategory === "ALL" || t.category === selectedCategory;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const sortedTopics = [...filteredTopics].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    if (sortBy === "TRENDING") {
      return (b.upvotes + (b.commentCount || 0) * 2) - (a.upvotes + (a.commentCount || 0) * 2);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-5" id="topic-list-container">
      {/* Search & Action Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics, tech stacks, founders..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs">
              <button
                onClick={() => setSortBy("TRENDING")}
                className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  sortBy === "TRENDING"
                    ? "bg-white text-emerald-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" /> Trending
              </button>
              <button
                onClick={() => setSortBy("LATEST")}
                className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  sortBy === "LATEST"
                    ? "bg-white text-emerald-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-emerald-600" /> Latest
              </button>
            </div>

            <button
              onClick={onCreateTopicClick}
              className="px-4 py-2 bg-emerald-800 text-white font-extrabold rounded-xl text-xs hover:bg-emerald-900 transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Start Topic
            </button>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-emerald-900 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat === "ALL" ? "All Discussions" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* List of Topics */}
      {sortedTopics.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-3">
          <MessageSquare className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-base font-bold text-gray-900">No discussions found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Be the pioneer! Start the first community topic in this category to get the conversation going.
          </p>
          <button
            onClick={onCreateTopicClick}
            className="px-4 py-2 bg-emerald-800 text-white font-bold rounded-xl text-xs hover:bg-emerald-900 inline-flex items-center gap-1.5 mt-2"
          >
            <Plus className="w-4 h-4" /> Start Discussion
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTopics.map((topic) => (
            <div
              key={topic.id}
              className="bg-white border border-gray-200 hover:border-emerald-500/50 rounded-2xl p-5 transition-all shadow-sm hover:shadow-md cursor-pointer flex flex-col sm:flex-row items-start justify-between gap-4 group"
              onClick={() => onSelectTopic(topic)}
            >
              <div className="space-y-2 flex-1">
                {/* Meta Header */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {topic.isPinned && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px] uppercase flex items-center gap-1">
                      <Pin className="w-3 h-3 text-amber-600" /> Pinned
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold text-[10px]">
                    {topic.category}
                  </span>
                  <span className="text-gray-400 text-[11px]">• Posted by {topic.authorName}</span>
                </div>

                {/* Topic Title */}
                <h3 className="font-extrabold text-gray-900 text-base leading-snug group-hover:text-emerald-700 transition-colors">
                  {topic.title}
                </h3>

                {/* Content snippet */}
                <p className="text-gray-600 text-xs line-clamp-2 leading-relaxed">
                  {topic.content}
                </p>

                {topic.codeSnippet && (
                  <div className="p-2 bg-stone-900 rounded-lg font-mono text-[10px] text-emerald-400 inline-flex items-center gap-1.5 border border-stone-800">
                    <Code className="w-3 h-3 text-emerald-400" /> Code snippet attached ({topic.codeLanguage || "TS"})
                  </div>
                )}

                {/* Tags */}
                {topic.tags && topic.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1">
                    {topic.tags.map((tag, idx) => (
                      <span key={idx} className="text-[10px] text-gray-400 font-semibold bg-gray-50 px-2 py-0.5 rounded border border-gray-150">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats & Actions Right */}
              <div
                className="flex sm:flex-col items-center justify-between sm:justify-center gap-3 shrink-0 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Upvote Pill */}
                <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 p-1 rounded-xl">
                  <button
                    onClick={() => onVoteTopic(topic.id, "up")}
                    className="p-1.5 hover:bg-white rounded-lg text-emerald-700 font-bold text-xs flex items-center gap-1"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{topic.upvotes || 0}</span>
                  </button>
                </div>

                {/* Comment Counter */}
                <div className="flex items-center gap-1 text-gray-500 font-bold text-xs">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>{topic.commentCount || 0} comments</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
