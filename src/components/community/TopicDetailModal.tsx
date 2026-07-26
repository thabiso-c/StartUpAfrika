import React, { useState, useEffect } from "react";
import { X, ThumbsUp, ThumbsDown, MessageSquare, Send, Sparkles, Pin, Code, Clock, User, AlertCircle, Loader2 } from "lucide-react";
import { CommunityTopic, CommunityComment } from "../../types";

interface Props {
  topic: CommunityTopic;
  user: any | null;
  onClose: () => void;
  onTopicUpdated: (updatedTopic: CommunityTopic) => void;
}

export default function TopicDetailModal({ topic, user, onClose, onTopicUpdated }: Props) {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newCommentText, setNewCommentText] = useState("");
  const [includeCode, setIncludeCode] = useState(false);
  const [commentCode, setCommentCode] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [error, setError] = useState("");

  const currentEmail = user?.email || guestEmail;
  const currentName = user?.displayName || user?.name || guestName;

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/community/topics/${topic.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (e) {
      console.error("Error fetching comments:", e);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [topic.id]);

  const handleVoteTopic = async (voteType: "up" | "down") => {
    if (!currentEmail) {
      setError("Please provide your email address to vote.");
      return;
    }

    try {
      const res = await fetch(`/api/community/topics/${topic.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: currentEmail, voteType }),
      });
      if (res.ok) {
        const data = await res.json();
        onTopicUpdated(data.topic);
      }
    } catch (err) {
      console.error("Vote failed:", err);
    }
  };

  const handleVoteComment = async (commentId: string) => {
    if (!currentEmail) {
      setError("Please enter your email to vote.");
      return;
    }

    try {
      const res = await fetch(`/api/community/comments/${commentId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: currentEmail }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? data.comment : c))
        );
      }
    } catch (err) {
      console.error("Comment vote failed:", err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!currentName || !currentEmail) {
      setError("Please provide your name and email to post a comment.");
      return;
    }

    if (!newCommentText.trim()) return;

    setPostingComment(true);

    try {
      const res = await fetch(`/api/community/topics/${topic.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newCommentText,
          codeSnippet: includeCode ? commentCode : undefined,
          authorName: currentName,
          authorEmail: currentEmail,
          authorAvatar: user?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentEmail)}`,
          authorRole: "Tech Member",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post comment");

      setComments((prev) => [...prev, data.comment]);
      setNewCommentText("");
      setCommentCode("");
      setIncludeCode(false);

      // Update local topic comment count
      onTopicUpdated({
        ...topic,
        commentCount: data.commentCount,
      });
    } catch (err: any) {
      setError(err.message || "Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  };

  const isUpvoted = topic.upvotedBy?.includes(currentEmail);
  const isDownvoted = topic.downvotedBy?.includes(currentEmail);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm" id="topic-detail-modal">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-gray-100 shadow-2xl overflow-hidden animate-fade-in max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 via-stone-900 to-emerald-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {topic.isPinned && (
              <span className="p-1 bg-amber-500/20 text-amber-300 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Pin className="w-3 h-3" /> Pinned
              </span>
            )}
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-[11px] font-bold">
              {topic.category}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs leading-relaxed">
          {/* Author info & Vote header */}
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <img
                src={topic.authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(topic.authorEmail)}`}
                alt={topic.authorName}
                className="w-10 h-10 rounded-full border border-gray-200"
              />
              <div>
                <h4 className="font-bold text-gray-900 text-sm">{topic.authorName}</h4>
                <p className="text-[11px] text-gray-500 flex items-center gap-2">
                  <span>{topic.authorRole || "Member Founder"}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(topic.createdAt).toLocaleDateString("en-ZA", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </p>
              </div>
            </div>

            {/* Voting Controls */}
            <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-xl border border-stone-200">
              <button
                onClick={() => handleVoteTopic("up")}
                className={`p-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
                  isUpvoted ? "bg-emerald-600 text-white shadow-sm" : "text-gray-600 hover:bg-white"
                }`}
                title="Upvote"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{topic.upvotes}</span>
              </button>
              <button
                onClick={() => handleVoteTopic("down")}
                className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-bold transition-all ${
                  isDownvoted ? "bg-rose-600 text-white shadow-sm" : "text-gray-400 hover:bg-white"
                }`}
                title="Downvote"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Topic Title & Body */}
          <div className="space-y-3">
            <h2 className="text-lg font-extrabold text-gray-900 leading-snug">{topic.title}</h2>
            <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{topic.content}</div>

            {/* Code Snippet Box if present */}
            {topic.codeSnippet && (
              <div className="p-4 bg-stone-950 rounded-xl space-y-2 border border-stone-800">
                <div className="flex items-center justify-between text-stone-400 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <Code className="w-3 h-3" /> Code Snippet ({topic.codeLanguage || "TS"})
                  </span>
                </div>
                <pre className="font-mono text-[11px] text-emerald-300 overflow-x-auto p-2 bg-black/40 rounded-lg">
                  <code>{topic.codeSnippet}</code>
                </pre>
              </div>
            )}

            {/* Tags */}
            {topic.tags && topic.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {topic.tags.map((tag, idx) => (
                  <span key={idx} className="px-2.5 py-0.5 bg-stone-100 text-stone-600 rounded-md text-[10px] font-semibold">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="pt-6 border-t border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                Community Discussion ({comments.length})
              </h3>
            </div>

            {/* Comment Post Form */}
            <form onSubmit={handlePostComment} className="p-4 bg-stone-50 border border-stone-200/70 rounded-xl space-y-3">
              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-800 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {!user && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Your Name (e.g. Sbusiso)"
                    className="px-3 py-2 border border-gray-200 rounded-lg bg-white"
                  />
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="Your Email Address"
                    className="px-3 py-2 border border-gray-200 rounded-lg bg-white"
                  />
                </div>
              )}

              <textarea
                rows={3}
                required
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Share your thoughts or answer questions on this topic..."
                className="w-full p-3 border border-gray-200 rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500/20"
              />

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIncludeCode(!includeCode)}
                  className="text-[11px] font-bold text-stone-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <Code className="w-3.5 h-3.5 text-emerald-600" />
                  {includeCode ? "Remove Code Snippet" : "Attach Code Snippet"}
                </button>

                <button
                  type="submit"
                  disabled={postingComment}
                  className="px-4 py-2 bg-emerald-800 text-white font-bold rounded-lg hover:bg-emerald-900 transition-all text-xs flex items-center gap-1.5 shadow-sm"
                >
                  {postingComment ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Post Comment
                    </>
                  )}
                </button>
              </div>

              {includeCode && (
                <textarea
                  rows={3}
                  value={commentCode}
                  onChange={(e) => setCommentCode(e.target.value)}
                  placeholder="// Paste your code or config snippet..."
                  className="w-full p-2.5 bg-stone-900 text-emerald-400 font-mono text-[11px] rounded-lg border border-stone-800"
                />
              )}
            </form>

            {/* List of Comments */}
            {loadingComments ? (
              <div className="py-6 text-center text-gray-400 font-medium">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="py-6 text-center text-gray-400 font-medium bg-gray-50 rounded-xl">
                No comments yet. Be the first registered member to join the debate!
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-3.5 bg-white border border-gray-150 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={comment.authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(comment.authorEmail)}`}
                          alt={comment.authorName}
                          className="w-7 h-7 rounded-full border border-gray-200"
                        />
                        <div>
                          <span className="font-bold text-gray-900 text-xs">{comment.authorName}</span>
                          <span className="text-[10px] text-gray-400 ml-2">
                            {new Date(comment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleVoteComment(comment.id)}
                        className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 border transition-all ${
                          comment.upvotedBy?.includes(currentEmail)
                            ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3 text-emerald-600" />
                        <span>{comment.upvotes || 0}</span>
                      </button>
                    </div>

                    <p className="text-gray-700 text-xs leading-relaxed pl-9">{comment.content}</p>

                    {comment.codeSnippet && (
                      <div className="ml-9 p-2.5 bg-stone-900 rounded-lg text-emerald-400 font-mono text-[10px] overflow-x-auto border border-stone-800">
                        <code>{comment.codeSnippet}</code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
