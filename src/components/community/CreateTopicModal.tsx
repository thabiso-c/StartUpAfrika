import React, { useState } from "react";
import { X, MessageSquare, Code, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { CommunityTopic } from "../../types";

interface Props {
  user: any | null;
  onClose: () => void;
  onTopicCreated: (topic: CommunityTopic) => void;
  onRequestLogin: () => void;
}

export default function CreateTopicModal({ user, onClose, onTopicCreated, onRequestLogin }: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CommunityTopic["category"]>("Founders & Pitch");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [includeCode, setIncludeCode] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("typescript");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const authorName = user?.displayName || user?.name || guestName;
    const authorEmail = user?.email || guestEmail;

    if (!authorName || !authorEmail) {
      setError("Please provide your name and email to post in the community.");
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError("Please fill in both title and discussion content.");
      return;
    }

    setSubmitting(true);

    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean);

      const res = await fetch("/api/community/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          category,
          tags: tags.length ? tags : [category],
          authorName,
          authorEmail,
          authorAvatar: user?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(authorEmail)}`,
          authorRole: "Tech Member",
          codeSnippet: includeCode ? codeSnippet : undefined,
          codeLanguage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish topic");

      onTopicCreated(data.topic);
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm" id="create-topic-modal">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-gray-100 shadow-2xl overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-900 to-stone-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide">Start a New Community Topic</h3>
              <p className="text-xs text-emerald-300/80">Share insights, ask questions, or pitch your tech stack to African builders</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!user && (
            <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-3">
              <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Posting as Guest Member
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Thabiso Letsoko"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Your Email</label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="e.g. thabiso@startupafrika.co.za"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-gray-700 mb-1">Topic Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white font-medium text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="Founders & Pitch">🚀 Founders & Pitch</option>
              <option value="Engineering & Dev">💻 Engineering & Dev</option>
              <option value="Featured Article Debates">📖 Featured Article Debates</option>
              <option value="Show & Tell">✨ Show & Tell</option>
              <option value="Coding Challenges">⚙️ Coding Challenges</option>
              <option value="General Discussion">💬 General Discussion</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Topic Headline / Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How we handled offline payments with USSD in rural Eastern Cape"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Discussion Content</label>
            <textarea
              required
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide background, questions, or breakdown for the community..."
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 leading-relaxed"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-gray-700 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-emerald-600" />
                Include Code Snippet / Technical Spec
              </label>
              <input
                type="checkbox"
                checked={includeCode}
                onChange={(e) => setIncludeCode(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
            </div>

            {includeCode && (
              <div className="p-3 bg-stone-900 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-stone-400 text-[11px]">
                  <span>Paste Code Below</span>
                  <select
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                    className="bg-stone-800 text-white rounded px-2 py-0.5 outline-none border border-stone-700"
                  >
                    <option value="typescript">TypeScript</option>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="rust">Rust</option>
                    <option value="go">Go</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
                <textarea
                  rows={4}
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  placeholder="// Paste your code snippet here..."
                  className="w-full p-2.5 bg-stone-950 font-mono text-[11px] text-emerald-400 rounded-lg outline-none border border-stone-800"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Tags (Comma separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. USSD, Node, Fintech, Startup"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-emerald-800 text-white font-bold rounded-xl hover:bg-emerald-900 transition-all flex items-center gap-2 shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Post Topic"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
