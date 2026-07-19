import React, { useState, useEffect } from "react";
import { PlusCircle, FileText, CheckCircle, LogOut, Trash2, Clock, LayoutDashboard } from "lucide-react";
import ArticleEditor from "./ArticleEditor";
import logo from "../../assets/images/logo.png";

interface Article {
  id: string;
  title: string;
  subtitle: string;
  founderName: string;
  startupName: string;
  location: string;
  foundedYear: string;
  tags: string[];
  coverImage: string;
  coverHeight?: number;
  coverPosition?: string;
  body: string;
  status: "draft" | "published";
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  token: string;
  onLogout: () => void;
}

export default function EditorDashboard({ token, onLogout }: Props) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  const headers = { "x-editor-token": token, "Content-Type": "application/json" };

  const fetchArticles = async () => {
    setLoading(true);
    try {
      // Sync local storage articles with backend first
      const cachedArticlesStr = localStorage.getItem("slyzah_custom_articles");
      if (cachedArticlesStr) {
        try {
          const cachedArticles = JSON.parse(cachedArticlesStr);
          if (Array.isArray(cachedArticles) && cachedArticles.length > 0) {
            await fetch("/api/articles/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ articles: cachedArticles }),
            }).catch(console.error);
          }
        } catch (e) {
          console.error("Failed to sync articles:", e);
        }
      }

      const res = await fetch("/api/editor/articles", { headers });
      if (res.ok) {
        let fetchedArticles: Article[] = await res.json();
        
        // Merge with local drafts/published to make sure everything is visible even if server recycled
        if (cachedArticlesStr) {
          try {
            const cachedArticles = JSON.parse(cachedArticlesStr) as Article[];
            const apiIds = new Set(fetchedArticles.map((a) => a.id));
            const uniqueCached = cachedArticles.filter((a) => !apiIds.has(a.id));
            if (uniqueCached.length > 0) {
              fetchedArticles = [...uniqueCached, ...fetchedArticles];
              fetchedArticles.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            }
          } catch (e) {
            console.error(e);
          }
        }
        setArticles(fetchedArticles);
      } else if (res.status === 401) {
        // Token is invalid or expired
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArticles(); }, []);

  const handleNewArticle = () => {
    const blank: Article = {
      id: "", title: "Untitled Article", subtitle: "", founderName: "",
      startupName: "", location: "", foundedYear: "", tags: [],
      coverImage: "", coverHeight: 288, coverPosition: "center", body: "", status: "draft", wordCount: 0,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setActiveArticle(blank);
  };

  const handleSave = async (article: Article) => {
    const res = await fetch("/api/editor/articles", {
      method: "POST",
      headers,
      body: JSON.stringify(article),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${res.status}`);
    }
    const data = await res.json();
    if (data.success) {
      const savedArticle = data.article;
      if (savedArticle) {
        try {
          const cachedStr = localStorage.getItem("slyzah_custom_articles");
          let cached: any[] = cachedStr ? JSON.parse(cachedStr) : [];
          cached = cached.filter((a) => a.id !== savedArticle.id);
          cached.unshift(savedArticle);
          localStorage.setItem("slyzah_custom_articles", JSON.stringify(cached));
        } catch (e) {
          console.error("Error caching custom article locally:", e);
        }
      }
      await fetchArticles();
      setActiveArticle(savedArticle);
      return data;
    } else {
      throw new Error(data.error || "Failed to save article");
    }
  };

  const handleDelete = async (id: string) => {
    if (!id || !confirm("Delete this article?")) return;
    await fetch(`/api/editor/articles/${id}`, { method: "DELETE", headers });
    
    try {
      const cachedStr = localStorage.getItem("slyzah_custom_articles");
      if (cachedStr) {
        let cached: any[] = JSON.parse(cachedStr);
        cached = cached.filter((a) => a.id !== id);
        localStorage.setItem("slyzah_custom_articles", JSON.stringify(cached));
      }
    } catch (e) {
      console.error("Error removing deleted article from cache:", e);
    }

    if (activeArticle?.id === id) setActiveArticle(null);
    await fetchArticles();
  };

  const handleLogout = async () => {
    await fetch("/api/editor/logout", { method: "POST", headers });
    onLogout();
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="h-screen flex bg-[#0e1310]" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* ── Sidebar ── */}
      <aside className="w-72 flex-shrink-0 flex flex-col bg-[#0a0f0d] border-r border-white/8">
        {/* Brand */}
        <div className="px-5 pt-6 pb-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-9 h-9 object-contain" />
            <div>
              <p className="text-white text-sm font-bold tracking-wide">Startup Afrika</p>
              <p className="text-emerald-400/60 text-xs">Editorial Workspace</p>
            </div>
          </div>
        </div>

        {/* New Article Button */}
        <div className="px-4 py-4">
          <button
            onClick={handleNewArticle}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold py-2.5 px-4 rounded-xl transition-all duration-200 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            New Article
          </button>
        </div>

        {/* Nav label */}
        <div className="px-5 py-2 flex items-center gap-2">
          <LayoutDashboard className="w-3.5 h-3.5 text-white/30" />
          <span className="text-white/30 text-xs font-semibold uppercase tracking-widest">Drafts</span>
        </div>

        {/* Articles List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {loading ? (
            <div className="text-white/30 text-xs text-center py-8">Loading…</div>
          ) : articles.length === 0 ? (
            <div className="text-white/20 text-xs text-center py-8 px-4">
              No articles yet.<br />Click "New Article" to start drafting.
            </div>
          ) : (
            articles.map((a) => (
              <div
                key={a.id}
                onClick={() => setActiveArticle(a)}
                className={`group relative rounded-xl px-3 py-3 cursor-pointer transition-all duration-150 ${
                  activeArticle?.id === a.id
                    ? "bg-emerald-900/40 border border-emerald-700/40"
                    : "hover:bg-white/5 border border-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white/90 text-sm font-medium truncate">{a.title}</p>
                    <p className="text-white/30 text-xs mt-0.5 truncate">{a.startupName || "No startup"}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {a.status === "published" ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-semibold">
                          <CheckCircle className="w-2.5 h-2.5" /> Published
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-400/70 text-[10px] font-semibold">
                          <Clock className="w-2.5 h-2.5" /> Draft
                        </span>
                      )}
                      <span className="text-white/20 text-[10px]">{a.wordCount}w</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}
                    className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-white/15 text-[10px] mt-1">{formatDate(a.updatedAt)}</p>
              </div>
            ))
          )}
        </div>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-white/8">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-white/30 hover:text-red-400 text-xs font-medium py-2 rounded-lg transition-all hover:bg-red-500/10"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Panel ── */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {activeArticle ? (
          <ArticleEditor
            key={activeArticle.id || "new"}
            article={activeArticle}
            token={token}
            onSave={handleSave}
            onClose={() => setActiveArticle(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <FileText className="w-12 h-12 text-white/10 mb-4" />
            <h2 className="text-white/40 text-lg font-semibold">No Article Open</h2>
            <p className="text-white/20 text-sm mt-2 max-w-xs">
              Select a draft from the sidebar or create a new article to start writing.
            </p>
            <button
              onClick={handleNewArticle}
              className="mt-6 flex items-center gap-2 bg-emerald-700/40 hover:bg-emerald-700/60 text-emerald-300 text-sm font-semibold py-2.5 px-5 rounded-xl transition-all"
            >
              <PlusCircle className="w-4 h-4" /> Start New Article
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
